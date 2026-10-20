// ============================================================
//  ZERO CORE — native reasoning kernel (C++)
//
//  The fast, offline half of Zero's brain. The browser (JS) and
//  the server (Python) hand it a query and a set of documents —
//  your own notes and memories — and it does the CPU-heavy work
//  in native code:
//
//    search    TF-IDF + cosine ranking of documents vs. a query
//    answer    extractive answer: the best sentences, stitched
//    keywords  the most salient terms in the corpus
//
//  No external libraries — just the C++ standard library, so it
//  compiles anywhere with g++ or clang++ and ships as one binary.
//
//  Protocol (stdin, line-based; robust and parser-free):
//    line 1        MODE          (search | answer | keywords)
//    line 2        QUERY         (may be empty for keywords)
//    lines 3..N    one document per line (tabs separate title\ttext)
//
//  Output: a single JSON object on stdout.
//
//  Build:  g++ -O2 -std=c++17 -o zero-core zero-core.cpp
// ============================================================

#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <cmath>
#include <algorithm>
#include <sstream>

using std::string;
using std::vector;

// ---- tokenisation ------------------------------------------------------
static const char* STOP[] = {
    "the","a","an","and","or","of","to","in","it","is","are","be","i","you",
    "we","my","me","for","on","with","that","this","what","how","why","can",
    "do","does","at","as","by","from","was","were","has","have","had","not",
    "but","so","if","then","than","into","out","up","down","about","over"
};
static bool is_stop(const string& w) {
    for (auto s : STOP) if (w == s) return true;
    return w.size() < 2;
}

static vector<string> tokenize(const string& text) {
    vector<string> out;
    string cur;
    for (char c : text) {
        if (std::isalnum((unsigned char)c)) cur += (char)std::tolower((unsigned char)c);
        else { if (!cur.empty()) { if (!is_stop(cur)) out.push_back(cur); cur.clear(); } }
    }
    if (!cur.empty() && !is_stop(cur)) out.push_back(cur);
    return out;
}

// ---- sentence split (for extractive answers) ---------------------------
static vector<string> sentences(const string& text) {
    vector<string> out; string cur;
    for (size_t i = 0; i < text.size(); ++i) {
        cur += text[i];
        char c = text[i];
        if (c == '.' || c == '!' || c == '?' || c == '\n') {
            string t = cur; // trim
            size_t a = t.find_first_not_of(" \t\r\n");
            size_t b = t.find_last_not_of(" \t\r\n");
            if (a != string::npos) out.push_back(t.substr(a, b - a + 1));
            cur.clear();
        }
    }
    size_t a = cur.find_first_not_of(" \t\r\n");
    if (a != string::npos) { size_t b = cur.find_last_not_of(" \t\r\n"); out.push_back(cur.substr(a, b - a + 1)); }
    return out;
}

// ---- JSON string escaping ---------------------------------------------
static string jesc(const string& s) {
    string o; o.reserve(s.size() + 8);
    for (char c : s) {
        switch (c) {
            case '"': o += "\\\""; break;
            case '\\': o += "\\\\"; break;
            case '\n': o += "\\n"; break;
            case '\r': o += "\\r"; break;
            case '\t': o += "\\t"; break;
            default:
                if ((unsigned char)c < 0x20) { char b[8]; snprintf(b, sizeof b, "\\u%04x", c); o += b; }
                else o += c;
        }
    }
    return o;
}

struct Doc { string title; string text; vector<string> toks; };

int main(int argc, char** argv) {
    (void)argc; (void)argv;
    // ---- read stdin ----
    std::stringstream ss; ss << std::cin.rdbuf();
    string all = ss.str();
    vector<string> lines; { string cur; for (char c : all) { if (c == '\n') { lines.push_back(cur); cur.clear(); } else if (c != '\r') cur += c; } if (!cur.empty()) lines.push_back(cur); }

    string mode = lines.size() > 0 ? lines[0] : "search";
    string query = lines.size() > 1 ? lines[1] : "";

    vector<Doc> docs;
    for (size_t i = 2; i < lines.size(); ++i) {
        if (lines[i].empty()) continue;
        Doc d;
        size_t tab = lines[i].find('\t');
        if (tab != string::npos) { d.title = lines[i].substr(0, tab); d.text = lines[i].substr(tab + 1); }
        else { d.title = ""; d.text = lines[i]; }
        d.toks = tokenize(d.title + " " + d.text);
        docs.push_back(d);
    }

    const size_t N = docs.size();

    // ---- document frequency for IDF ----
    std::unordered_map<string, int> df;
    for (auto& d : docs) {
        std::unordered_map<string, bool> seen;
        for (auto& t : d.toks) if (!seen[t]) { seen[t] = true; df[t]++; }
    }
    auto idf = [&](const string& term) -> double {
        int n = df.count(term) ? df[term] : 0;
        return std::log((1.0 + (double)N) / (1.0 + (double)n)) + 1.0;
    };

    // ---- tf-idf vector for a token list ----
    auto vec = [&](const vector<string>& toks) {
        std::unordered_map<string, double> tf;
        for (auto& t : toks) tf[t] += 1.0;
        std::unordered_map<string, double> v;
        for (auto& kv : tf) v[kv.first] = kv.second * idf(kv.first);
        return v;
    };
    auto cosine = [](std::unordered_map<string, double>& a, std::unordered_map<string, double>& b) {
        double dot = 0, na = 0, nb = 0;
        for (auto& kv : a) { na += kv.second * kv.second; auto it = b.find(kv.first); if (it != b.end()) dot += kv.second * it->second; }
        for (auto& kv : b) nb += kv.second * kv.second;
        if (na == 0 || nb == 0) return 0.0;
        return dot / (std::sqrt(na) * std::sqrt(nb));
    };

    std::ostringstream out;

    if (mode == "keywords") {
        // rank all terms by total tf-idf across corpus
        std::unordered_map<string, double> score;
        for (auto& d : docs) for (auto& t : d.toks) score[t] += idf(t);
        vector<std::pair<string, double>> v(score.begin(), score.end());
        std::sort(v.begin(), v.end(), [](auto& x, auto& y) { return x.second > y.second; });
        out << "{\"mode\":\"keywords\",\"engine\":\"zero-core/c++\",\"keywords\":[";
        for (size_t i = 0; i < v.size() && i < 15; ++i) { if (i) out << ","; out << "{\"term\":\"" << jesc(v[i].first) << "\",\"weight\":" << v[i].second << "}"; }
        out << "]}";
        std::cout << out.str() << std::endl; return 0;
    }

    // search / answer both need query ranking
    auto qtoks = tokenize(query);
    auto qv = vec(qtoks);
    vector<std::pair<int, double>> ranked;
    for (size_t i = 0; i < N; ++i) { auto dv = vec(docs[i].toks); ranked.push_back({(int)i, cosine(qv, dv)}); }
    std::sort(ranked.begin(), ranked.end(), [](auto& a, auto& b) { return a.second > b.second; });

    if (mode == "answer") {
        // extractive: pick the best sentences from the top documents
        vector<std::pair<string, double>> scored;
        for (size_t r = 0; r < ranked.size() && r < 5; ++r) {
            if (ranked[r].second <= 0) break;
            for (auto& s : sentences(docs[ranked[r].first].text)) {
                auto sv = vec(tokenize(s));
                double sc = cosine(qv, sv);
                if (sc > 0) scored.push_back({s, sc});
            }
        }
        std::sort(scored.begin(), scored.end(), [](auto& a, auto& b) { return a.second > b.second; });
        out << "{\"mode\":\"answer\",\"engine\":\"zero-core/c++\",\"answer\":\"";
        string ans; for (size_t i = 0; i < scored.size() && i < 3; ++i) { if (i) ans += " "; ans += scored[i].first; }
        out << jesc(ans) << "\",\"confidence\":" << (scored.empty() ? 0.0 : scored[0].second) << "}";
        std::cout << out.str() << std::endl; return 0;
    }

    // default: search
    out << "{\"mode\":\"search\",\"engine\":\"zero-core/c++\",\"count\":" << N << ",\"results\":[";
    int emitted = 0;
    for (auto& r : ranked) {
        if (r.second <= 0) continue;
        if (emitted) out << ",";
        out << "{\"i\":" << r.first << ",\"score\":" << r.second
            << ",\"title\":\"" << jesc(docs[r.first].title) << "\""
            << ",\"text\":\"" << jesc(docs[r.first].text.substr(0, 240)) << "\"}";
        if (++emitted >= 8) break;
    }
    out << "]}";
    std::cout << out.str() << std::endl;
    return 0;
}
