/* ============================================================
   NKM · NicMitah Consultant & Real Estate
   Combined stylesheet + application script.

   This single file holds BOTH the CSS and the JavaScript. The
   stylesheet is injected into <head> at runtime (as a <style>
   element) the moment this script loads, then the application
   logic runs. index.html references only this one file.
   ============================================================ */
(function injectStyles(){
  var css = "/* ============================================================\n   NKM · NicMitah Consultant & Real Estate\n   Emerald / Gold / Ivory — trusted premium estate. Single file.\n   ============================================================ */\n\n:root{\n  --bg-0:#122339;       /* deep navy — lifted a touch for vibrancy */\n  --bg-1:#1a2f48;\n  --bg-2:#264064;\n  /* gold accent — rich and lively again (balanced, not overwhelming) */\n  --sky:#d4a05a;        /* warm gold accent */\n  --sky-bright:#ecc079; /* bright gold highlight */\n  --blue:#5e7790;       /* cool steel-blue (secondary) */\n  --blue-deep:#3f5a73;  /* deep steel-blue */\n  --gold:#d9a85f;\n  --gold-deep:#b9863f;\n  --steel:#7e8da0;\n  --grey:#93a3b6;\n  --white:#f7f9fb;\n  --ink:#f2f6fa;        /* near-white text (on navy) */\n  --ink-soft:#aebccd;   /* muted blue-grey */\n  --glass:rgba(26,47,72,.62);\n  --glass-2:rgba(38,64,100,.72);\n  --glass-line:rgba(214,170,110,.26);  /* warm gold hairline (vibrant) */\n  --shadow:0 24px 60px -24px rgba(0,0,0,.7);\n  --serif:'Fraunces',Georgia,serif;\n  --sans:'Sora',system-ui,sans-serif;\n\n  /* 3D house tints */\n  --wall-front:#eef0f2;\n  --wall-top:#f8fafb;\n  --wall-side:#aeb8c0;\n  --wall-dark:#7a8088;\n  --roof:#2a3942;\n  --roof-edge:#1a2329;\n\n  /* surfaces — crisp white panels on the navy backdrop */\n  --surface:linear-gradient(160deg,#ffffff,#f3f6f9);\n  --surface-soft:linear-gradient(160deg,#ffffff,#edf1f5);\n  --on-surface:#1a2c40;       /* navy text for use ON white panels */\n  --on-surface-soft:#5d6e80;  /* muted navy-grey on white */\n  --hairline:rgba(214,170,110,.4);     /* warm gold hairline */\n  --hairline-soft:rgba(26,44,64,.1);\n  --gold-glow:0 0 0 1px rgba(217,168,95,.55),0 0 26px -8px rgba(217,168,95,.45);\n  --r:13px;\n  --r-lg:18px;\n  /* motion system — one cohesive easing + timing scale across the app */\n  --ease:cubic-bezier(.16,.84,.32,1);      /* smooth decelerate (primary) */\n  --ease-soft:cubic-bezier(.4,0,.2,1);      /* gentle in-out (reversible UI) */\n  --t-fast:.16s;     /* taps, small hovers */\n  --t-base:.24s;     /* standard transitions */\n  --t-slow:.4s;      /* larger reveals */\n}\n\n*{box-sizing:border-box;margin:0;padding:0}\nhtml,body{height:100%}\nbody{\n  font-family:var(--sans);color:var(--ink);background:var(--bg-0);\n  overflow:hidden;position:relative;\n}\n::selection{background:rgba(47,111,106,.22);color:var(--ink)}\n::-moz-selection{background:rgba(47,111,106,.22);color:var(--ink)}\n\n/* ---------- premium navy scene: soft aurora + drifting gold orbs ---------- */\n#scene{\n  position:fixed;inset:0;z-index:0;opacity:0;transition:opacity 1.2s ease;overflow:hidden;\n  background:\n    radial-gradient(140% 120% at 78% -12%, rgba(185,138,76,.14) 0%, rgba(185,138,76,.04) 30%, transparent 58%),\n    radial-gradient(120% 120% at 12% 110%, rgba(58,96,150,.18) 0%, transparent 52%),\n    linear-gradient(165deg, #16294c 0%, #102140 42%, #0a1730 78%, #081428 100%);\n}\n#scene.on{opacity:1}\n/* aurora: large soft colour fields that slowly drift (GPU-light, no blur filter) */\n.goldgrid{position:absolute;inset:-20%;z-index:0;pointer-events:none;\n  background:\n    radial-gradient(40% 50% at 28% 32%, rgba(96,140,200,.22) 0%, transparent 70%),\n    radial-gradient(44% 48% at 74% 60%, rgba(185,138,76,.18) 0%, transparent 72%),\n    radial-gradient(32% 42% at 56% 18%, rgba(120,90,170,.13) 0%, transparent 70%);\n  will-change:transform;transform:translateZ(0);\n  animation:auroraDrift 40s ease-in-out infinite alternate}\n@keyframes auroraDrift{\n  0%{transform:translate3d(0,0,0)}\n  100%{transform:translate3d(-3%,3%,0)}}\n/* drifting golden orbs — a few soft glowing points (no blur filter) */\n.orbs{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}\n.orb{position:absolute;border-radius:50%;\n  background:radial-gradient(circle at 38% 38%, rgba(247,221,165,.85), rgba(201,154,85,.4) 45%, transparent 72%);\n  will-change:transform,opacity;opacity:0;animation:orbFloat linear infinite}\n@keyframes orbFloat{\n  0%{opacity:0;transform:translate3d(0,18px,0) scale(.7)}\n  15%{opacity:.8}\n  50%{transform:translate3d(0,-10px,0) scale(1)}\n  85%{opacity:.6}\n  100%{opacity:0;transform:translate3d(0,-26px,0) scale(.85)}}\n.scene-overlay{position:absolute;inset:0;z-index:1;pointer-events:none;\n  background:\n    radial-gradient(120% 120% at 50% 40%, transparent 48%, rgba(8,16,32,.5) 82%, rgba(6,11,24,.9) 100%),\n    linear-gradient(180deg, rgba(10,20,40,.45) 0%, transparent 16%, transparent 78%, rgba(7,13,28,.85) 100%);\n}\n\n/* ============================================================\n   INTRO 0–4s\n   ============================================================ */\n#intro{position:fixed;inset:0;z-index:90;\n  background:\n    radial-gradient(140% 100% at 72% -20%, rgba(200,149,89,.16) 0%, rgba(164,118,60,.06) 26%, transparent 52%),\n    linear-gradient(165deg, #20344f 0%, #16273d 40%, #0f1c2e 100%);\n  display:grid;place-items:center;text-align:center;transition:opacity .55s var(--ease-soft)}\n#intro.fade{opacity:0;pointer-events:none}\n.intro-stack{display:flex;flex-direction:column;align-items:center;gap:30px}\n\n/* \"Welcome to\" fades up; only NKM letters drop in */\n.intro-welcome{font-family:var(--serif);font-weight:700;color:var(--ink);\n  font-size:clamp(30px,6.4vw,64px);line-height:1.1}\n.intro-welcome .lead{display:inline-block;opacity:0;animation:flowUp .85s var(--ease) .2s forwards}\n.nkm-drop{display:inline-flex;margin-left:.28em}\n.intro-tag{font-family:var(--serif);font-weight:600;color:var(--sky-bright);\n  font-size:clamp(17px,3.4vw,30px);line-height:1.2;opacity:0;animation:flowUp .85s var(--ease) forwards}\n.intro-by{font-family:var(--sans);font-weight:400;color:var(--ink-soft);\n  font-size:clamp(12px,2.1vw,18px);letter-spacing:3px;text-transform:uppercase;opacity:0;\n  animation:flowUp .85s var(--ease) forwards}\n.intro-by b{color:var(--gold);font-family:var(--serif);text-transform:none;letter-spacing:1px;margin-left:4px}\n@keyframes flowUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}\n\n/* per-letter reveal — gentle fade + scale-up with a soft gold shimmer sweep */\n.drop{display:inline-block;opacity:0;transform:scale(.78);color:var(--gold);\n  animation:letterRise .8s var(--ease) forwards;will-change:transform,opacity;\n  background:linear-gradient(100deg,#c89559 0%,#c89559 38%,#fff3d4 50%,#c89559 62%,#c89559 100%);\n  background-size:280% 100%;background-position:120% 0;\n  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}\n@keyframes letterRise{\n  0%{opacity:0;transform:scale(.78);background-position:120% 0}\n  55%{opacity:1}\n  100%{opacity:1;transform:scale(1);background-position:-40% 0}}\n\n/* ============================================================\n   APP SHELL\n   ============================================================ */\n#app{position:relative;z-index:5;height:100%;opacity:0;transition:opacity 1s ease;display:flex;flex-direction:column}\n#app.on{opacity:1}\n#app::before{content:\"\";position:fixed;top:0;left:0;right:0;height:120px;z-index:4;pointer-events:none;\n  background:linear-gradient(180deg,rgba(15,28,46,.5),rgba(15,28,46,0))}\n\n/* ---- logo (fixed, roomy, never cramped) ---- */\n.logo{position:fixed;top:18px;left:24px;z-index:60;display:flex;align-items:center;gap:13px}\n#headerScrim{position:fixed;top:0;left:0;right:0;height:92px;z-index:58;pointer-events:none;\n  background:linear-gradient(180deg,var(--bg-0) 0%,rgba(18,35,57,.92) 45%,rgba(18,35,57,0) 100%);\n  opacity:0;transition:opacity .4s}\n#headerScrim.show{opacity:1}\n.logo .mark{width:56px;height:56px;flex:0 0 auto;display:block;line-height:0}\n.logo .mark .nkm-img{width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 2px 8px rgba(0,0,0,.30))}\n.zero .ava .nkm-img{width:100%;height:100%;object-fit:contain;display:block}\n.logo .name{display:flex;flex-direction:column;line-height:1.05}\n.logo .name .big{font-family:var(--sans);font-weight:900;font-size:30px;color:var(--ink);letter-spacing:-.4px;\n  -webkit-text-stroke:1.1px var(--ink);text-shadow:0 2px 3px rgba(0,0,0,.3);line-height:1}\n.logo .name .sub{font-size:10px;color:var(--gold);font-weight:800;letter-spacing:3px;text-transform:uppercase;margin-top:4px}\n\n/* ---- compact search (hidden until results) ---- */\n#searchWrap{position:fixed;top:20px;right:24px;z-index:60;\n  opacity:0;transform:translateY(-8px);pointer-events:none;transition:.4s}\n#searchWrap.show{opacity:1;transform:none;pointer-events:auto}\n.search-pill{display:flex;align-items:center;gap:8px;height:44px;padding:0 6px 0 16px;\n  border-radius:999px;background:var(--surface-soft);border:1px solid var(--hairline);\n  box-shadow:0 6px 20px -10px rgba(0,0,0,.5);transition:border-color .2s,box-shadow .2s,width .2s}\n.search-pill:focus-within{border-color:var(--gold);box-shadow:var(--gold-glow)}\n.search-ico{width:17px;height:17px;color:var(--gold-deep);flex:0 0 auto}\n#searchBar{height:100%;width:200px;max-width:38vw;border:none;background:transparent;color:var(--on-surface);\n  padding:0;font-family:var(--sans);font-size:13.5px;outline:none}\n#searchBar::placeholder{color:var(--on-surface-soft)}\n.s-btn{height:34px;padding:0 16px;border-radius:999px;border:1.5px solid var(--gold);cursor:pointer;flex:0 0 auto;\n  background:transparent;color:var(--gold);\n  font-weight:700;font-size:13px;font-family:var(--sans);transition:box-shadow .25s,transform .15s,background .25s,color .3s,border-color .25s}\n.s-btn:hover{background:var(--gold);border-color:var(--gold);color:#fff;transform:translateY(-1px);box-shadow:0 6px 16px rgba(0,0,0,.3)}\n\n/* ---- class selector ---- */\n/* collapsible class selector — a small toggle that opens the panel only when tapped */\n#classWrap{position:fixed;bottom:58px;left:50%;transform:translateX(-50%) translateY(8px);z-index:55;\n  opacity:0;pointer-events:none;transition:opacity var(--t-slow) var(--ease),transform var(--t-slow) var(--ease)}\n#classWrap.show{opacity:1;transform:translateX(-50%);pointer-events:auto}\n#classToggle{display:flex;align-items:center;gap:8px;height:44px;padding:0 18px;border-radius:999px;\n  background:var(--surface);border:1px solid var(--hairline);box-shadow:0 10px 30px -8px rgba(0,0,0,.6);\n  cursor:pointer;font-family:var(--sans);transition:border-color var(--t-base) var(--ease),box-shadow var(--t-base) var(--ease),transform var(--t-fast) var(--ease)}\n#classToggle:hover{border-color:var(--gold);transform:translateY(-1px)}\n#classToggle .ct-lab{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--on-surface-soft);font-weight:700}\n#classToggle .ct-cur{font-family:var(--serif);font-weight:700;font-size:17px;color:var(--gold-deep)}\n#classToggle .ct-caret{font-size:11px;color:var(--gold-deep);transition:transform var(--t-base) var(--ease)}\n#classWrap.open #classToggle .ct-caret{transform:rotate(180deg)}\n#classes{position:absolute;bottom:54px;left:50%;transform:translateX(-50%) translateY(10px) scale(.97);\n  display:flex;flex-direction:column;gap:8px;\n  width:230px;padding:13px;border-radius:var(--r-lg);background:var(--surface);\n  border:1px solid var(--hairline);box-shadow:var(--shadow);transform-origin:bottom center;\n  opacity:0;pointer-events:none;\n  transition:opacity var(--t-base) var(--ease),transform var(--t-base) var(--ease)}\n#classWrap.open #classes{opacity:1;transform:translateX(-50%);pointer-events:auto}\n#classes h4{font-size:9px;letter-spacing:2.6px;text-transform:uppercase;color:var(--gold-deep);text-align:center;margin-bottom:2px}\n.cls{border:1px solid var(--hairline-soft);border-radius:11px;cursor:pointer;\n  background:#fbfcfd;padding:10px 13px;text-align:left;transition:transform var(--t-base) var(--ease),border-color var(--t-base) var(--ease),box-shadow var(--t-base) var(--ease);color:var(--on-surface);\n  display:flex;align-items:baseline;gap:8px}\n.cls .t{font-weight:700;font-size:15px;font-family:var(--serif)}\n.cls .d{font-size:9.5px;color:var(--on-surface-soft)}\n.cls:hover{transform:translateX(3px);border-color:var(--gold)}\n.cls.active{background:linear-gradient(150deg,rgba(218,176,98,.22),rgba(218,176,98,.1));\n  border-color:var(--gold);box-shadow:var(--gold-glow)}\n.cls.active .t{color:var(--gold-deep)}\n\n/* ---- Class B · bespoke \"warm welcome\" hover (family tier) ----\n   Distinct from the other classes' simple slide: a soft lift, a warm amber\n   wash that sweeps in, and a gentle welcoming pulse on the \"B\". */\n.cls[data-cls=\"B\"]{position:relative;overflow:hidden}\n.cls[data-cls=\"B\"]::before{content:\"\";position:absolute;inset:0;z-index:0;opacity:0;\n  background:radial-gradient(120% 140% at 0% 50%, rgba(212,141,84,.22), rgba(214,170,96,.10) 45%, transparent 72%);\n  transition:opacity .35s ease}\n.cls[data-cls=\"B\"]>*{position:relative;z-index:1}\n.cls[data-cls=\"B\"]:hover{transform:translateY(-3px) translateX(1px);\n  border-color:#d8a35a;box-shadow:0 12px 26px -12px rgba(176,110,52,.55),0 0 0 1px rgba(216,163,90,.5) inset}\n.cls[data-cls=\"B\"]:hover::before{opacity:1}\n.cls[data-cls=\"B\"]:hover .t{color:#b06e34;animation:clsBWelcome .9s cubic-bezier(.16,.84,.32,1)}\n.cls[data-cls=\"B\"]:hover .d{color:#9a7038}\n@keyframes clsBWelcome{0%{transform:scale(1)}35%{transform:scale(1.16) rotate(-3deg)}60%{transform:scale(1.04) rotate(1.5deg)}100%{transform:scale(1) rotate(0)}}\n\n/* ============================================================\n   PAGE SYSTEM — one question per page, animated swaps\n   ============================================================ */\n#deck{flex:1 1 auto;position:relative;overflow:hidden}\n.page{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;\n  justify-content:flex-start;gap:22px;padding:118px max(26px,calc(50% - 430px)) 150px;overflow-y:auto;overflow-x:hidden;\n  opacity:0;pointer-events:none;will-change:transform,opacity}\n.page>*:first-child{margin-top:auto}\n.page>*:last-child{margin-bottom:auto}\n/* on the results/listing page, content can be tall — don't vertically center it\n   (that pushes Zero's bubble up under the fixed header/search bar, and the card\n   down into the bottom class bar). Pin everything to the top and let it scroll. */\n.page.results-page{justify-content:flex-start;padding-bottom:140px}\n.page.results-page>*:first-child{margin-top:0}\n.page.results-page>*:last-child{margin-bottom:0}\n/* preferences page: tall content, pin to top and keep the \"See matching homes\"\n   button clear of the fixed footer (44px) with a comfortable gap */\n.page.prefs-page{justify-content:flex-start;padding-bottom:96px}\n.page.prefs-page>*:first-child{margin-top:0}\n.page.prefs-page>*:last-child{margin-bottom:0}\n.page.prefs-page #prefNext{margin-bottom:14px}\n.page::-webkit-scrollbar{width:8px}\n.page::-webkit-scrollbar-thumb{background:rgba(160,200,240,.25);border-radius:8px}\n.page.active{opacity:1;pointer-events:auto;animation:pageIn .2s var(--ease) both}\n.page.leaving{animation:pageOut .15s var(--ease-soft) both}\n@keyframes pageIn{\n  0%{opacity:0;transform:translateY(12px) scale(.992)}\n  100%{opacity:1;transform:translateY(0) scale(1)}}\n@keyframes pageOut{\n  0%{opacity:1;transform:translateY(0) scale(1)}\n  100%{opacity:0;transform:translateY(-8px) scale(.994)}}\n\n/* progress bar (under header) */\n#progress{position:fixed;top:0;left:0;transform:none;z-index:80;\n  width:100%;height:3px;border-radius:0;background:rgba(167,184,173,.12);\n  overflow:hidden;opacity:0;transition:opacity .5s}\n#progress.show{opacity:1}\n#progress .bar{height:100%;border-radius:0;width:0;\n  background:linear-gradient(90deg,var(--gold-deep),var(--gold));\n  box-shadow:0 0 10px rgba(217,189,118,.6);transition:width .6s cubic-bezier(.4,0,.2,1)}\n\n/* ---- Zero chat ---- */\n.zero{display:flex;gap:14px;max-width:660px;width:100%;align-items:flex-start}\n.zero .ava{animation:avaIn .5s var(--ease) both}\n.zero .bubble{animation:bubbleIn .55s var(--ease) .1s both}\n@keyframes avaIn{from{opacity:0;transform:scale(.72) translateY(8px)}to{opacity:1;transform:none}}\n@keyframes bubbleIn{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}\n.zero .ava{flex:0 0 auto;width:48px;height:48px;line-height:0;font-size:0}\n.bubble{background:var(--surface);border:1px solid var(--hairline);\n  border-radius:4px 16px 16px 16px;padding:16px 22px;font-size:15px;line-height:1.6;box-shadow:var(--shadow);color:var(--on-surface)}\n.bubble .who{font-size:9.5px;letter-spacing:3px;color:var(--gold-deep);text-transform:uppercase;font-weight:700;margin-bottom:6px}\n.bubble b{color:var(--gold-deep)}\n\n/* welcome page hero */\n.welcome{max-width:660px;text-align:center;display:flex;flex-direction:column;align-items:center}\n/* logo avatar with premium halo + champagne sparkle */\n.welcome-ava{position:relative;width:104px;height:104px;margin-bottom:22px;flex:0 0 auto;line-height:0;\n  opacity:0;transform:translateY(8px) scale(.94);animation:wRise .8s var(--ease) .05s forwards}\n.welcome-ava::before{content:\"\";position:absolute;inset:-30px;border-radius:50%;z-index:-1}\n.welcome-ava .nkm-img{width:100%;height:100%;display:block;object-fit:contain;\n  filter:drop-shadow(0 2px 8px rgba(0,0,0,.30))}\n.welcome-ava .sparkle{position:absolute;top:-4px;right:-4px;width:22px;height:22px;z-index:2;pointer-events:none;\n  animation:sparkleTwinkle 3.4s ease-in-out infinite;filter:drop-shadow(0 0 6px rgba(247,206,138,.7))}\n.welcome-ava .sparkle::before,.welcome-ava .sparkle::after{content:\"\";position:absolute;inset:0;margin:auto;\n  background:radial-gradient(circle,#fbe6c0 0%,#d8a35a 45%,transparent 72%)}\n.welcome-ava .sparkle::before{width:100%;height:2px}\n.welcome-ava .sparkle::after{width:2px;height:100%}\n@keyframes sparkleTwinkle{0%,100%{opacity:.5;transform:scale(.7) rotate(0deg)}50%{opacity:1;transform:scale(1) rotate(45deg)}}\n.welcome-eyebrow{color:var(--gold);letter-spacing:.34em;text-transform:uppercase;font-size:12px;font-weight:700;\n  font-family:var(--sans);margin-bottom:10px;opacity:0;animation:wFade .75s var(--ease) .18s forwards}\n.welcome-divider{display:flex;align-items:center;justify-content:center;gap:14px;width:260px;max-width:64%;margin:6px auto 14px;\n  opacity:0;animation:wFade .75s var(--ease) .24s forwards}\n.welcome-divider span{height:1px;flex:1;background:linear-gradient(90deg,transparent,rgba(201,154,85,.7))}\n.welcome-divider span:last-child{background:linear-gradient(90deg,rgba(201,154,85,.7),transparent)}\n.welcome-divider i{color:var(--gold);font-size:9px;font-style:normal;filter:drop-shadow(0 0 6px rgba(201,154,85,.7))}\n.welcome h1{font-family:var(--serif);font-size:clamp(34px,6vw,58px);font-weight:700;line-height:1.05;margin-bottom:16px;letter-spacing:-.5px;\n  opacity:0;animation:wRise .75s var(--ease) .3s forwards}\n.welcome h1 .accent{color:var(--gold);font-style:italic}\n.welcome p{color:var(--ink-soft);font-size:16.5px;line-height:1.7;max-width:520px;margin:0 auto 30px;\n  opacity:0;animation:wRise .75s var(--ease) .38s forwards}\n/* premium gold pill CTA — clean soft shadow to match the header logo */\n.welcome-cta{position:relative;overflow:hidden;padding:16px 42px;font-size:16px;font-weight:700;border:1.5px solid var(--gold);border-radius:999px;\n  letter-spacing:.2px;background:rgba(18,35,57,.35);color:var(--gold);cursor:pointer;font-family:var(--sans);\n  box-shadow:0 2px 8px rgba(0,0,0,.30);\n  opacity:0;animation:wRise .75s var(--ease) .46s forwards;display:inline-flex;align-items:center;gap:13px;\n  transition:transform .2s cubic-bezier(.16,.84,.32,1),box-shadow .25s ease,background .25s ease}\n.welcome-cta:hover{transform:translateY(-2px);background:var(--gold);border-color:var(--gold);color:#fff;box-shadow:0 6px 16px rgba(0,0,0,.34)}\n.welcome-cta:active{transform:translateY(0) scale(.97);box-shadow:0 2px 8px rgba(0,0,0,.30)}\n/* on click: stay fully filled gold with white text */\n.welcome-cta.filling{background:var(--gold);color:#fff;border-color:var(--gold);\n  transform:translateY(-1px);box-shadow:0 6px 16px rgba(0,0,0,.34);\n  transition:background .35s ease,color .3s ease,box-shadow .35s ease,border-color .35s ease}\n.welcome-cta.filling .cta-arrow{transform:translateX(4px)}\n.welcome-cta .cta-arrow{transition:transform .25s ease}\n.welcome-cta:hover .cta-arrow{transform:translateX(5px)}\n@keyframes wRise{to{opacity:1;transform:none}}\n@keyframes wFade{to{opacity:1}}\n/* listings coming-soon empty state */\n.coming-soon{width:100%;max-width:560px;margin:6px auto 0;background:var(--surface);\n  border:1px solid var(--hairline);border-radius:var(--r-lg,20px);padding:46px 34px;text-align:center;\n  display:flex;flex-direction:column;align-items:center;gap:13px;box-shadow:var(--shadow,0 18px 50px -20px rgba(0,0,0,.5));\n  opacity:0;transform:translateY(14px);animation:csRise .7s var(--ease) .15s forwards}\n.coming-soon .cs-ic{display:flex;gap:10px;align-items:center;justify-content:center;height:30px}\n.coming-soon .cs-dot{width:12px;height:12px;border-radius:50%;\n  background:radial-gradient(circle at 35% 30%,#f3d595,#c89b4d);\n  box-shadow:0 0 12px rgba(201,154,85,.5);animation:csPulse 1.6s var(--ease-soft) infinite}\n.coming-soon .cs-dot:nth-child(2){animation-delay:.22s}\n.coming-soon .cs-dot:nth-child(3){animation-delay:.44s}\n@keyframes csPulse{0%,100%{transform:scale(.82);opacity:.45}50%{transform:scale(1);opacity:1}}\n.coming-soon .cs-t{font-family:var(--serif);font-weight:700;font-size:24px;color:var(--ink);letter-spacing:-.4px}\n.coming-soon .cs-d{font-size:14px;color:var(--ink-soft);line-height:1.62;max-width:430px}\n.coming-soon .cs-meta{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:8px}\n.coming-soon .cs-chip{font-size:11.5px;font-weight:600;color:var(--gold);padding:6px 13px;border-radius:999px;\n  background:rgba(201,154,85,.1);border:1px solid rgba(201,154,85,.28)}\n@keyframes csRise{to{opacity:1;transform:none}}\n\n/* ---- login / sign-up page ---- */\n.auth-page{justify-content:center}\n.auth-card{width:100%;max-width:420px;background:var(--surface);border:1px solid var(--hairline);\n  border-radius:var(--r-lg);padding:32px 30px;box-shadow:var(--shadow);display:flex;flex-direction:column}\n.auth-brand{display:flex;align-items:center;gap:12px;margin-bottom:22px}\n.auth-mark{width:46px;height:46px;border-radius:12px;flex:0 0 auto;\n  background-image:url('data:image/png;base64,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');background-size:cover;background-position:center;\n  box-shadow:none}\n.auth-titles{display:flex;flex-direction:column;line-height:1.05}\n.auth-name{font-family:var(--serif);font-weight:700;font-size:20px;color:var(--on-surface)}\n.auth-sub{font-size:8.5px;color:var(--gold-deep);font-weight:600;letter-spacing:2.4px;text-transform:uppercase;margin-top:3px}\n.auth-h{font-family:var(--serif);font-weight:700;font-size:23px;color:var(--on-surface);margin-bottom:5px}\n.auth-p{font-size:13px;color:var(--on-surface-soft);line-height:1.5;margin-bottom:20px}\n.auth-fields{display:flex;flex-direction:column;gap:13px}\n.auth-field{display:flex;flex-direction:column;gap:6px}\n.auth-field label{font-size:11px;font-weight:600;letter-spacing:.4px;color:var(--on-surface-soft);text-transform:uppercase}\n.auth-field input{height:44px;border-radius:11px;border:1px solid var(--hairline);background:#fff;\n  padding:0 14px;font-family:var(--sans);font-size:14px;color:var(--on-surface);outline:none;transition:border-color .2s,box-shadow .2s}\n.auth-field input:focus{border-color:var(--gold);box-shadow:var(--gold-glow)}\n.auth-row-right{display:flex;justify-content:flex-end;margin-top:-4px}\n.auth-link{background:none;border:none;cursor:pointer;color:var(--gold-deep);font-weight:600;font-size:12.5px;font-family:var(--sans);padding:0}\n.auth-link:hover{text-decoration:underline}\n.auth-hint{font-size:12px;color:#d98a4c;min-height:16px;letter-spacing:.2px}\n.auth-submit{width:100%;margin-top:4px}\n.auth-switch{text-align:center;font-size:13px;color:var(--on-surface-soft);margin-top:16px}\n.auth-divider{display:flex;align-items:center;gap:10px;margin:18px 0 14px;color:var(--on-surface-soft);font-size:11px;letter-spacing:1px;text-transform:uppercase}\n.auth-divider::before,.auth-divider::after{content:'';flex:1;height:1px;background:var(--hairline)}\n.auth-google{width:100%;height:46px;border-radius:11px;border:1px solid #dadce0;cursor:pointer;\n  background:#fff;color:#3c4043;font-weight:600;font-size:14px;font-family:var(--sans);\n  display:flex;align-items:center;justify-content:center;gap:11px;margin-bottom:10px;\n  transition:box-shadow .2s,background-color .2s}\n.auth-google:hover{background:#f8f9fa;box-shadow:0 2px 8px -2px rgba(0,0,0,.2)}\n.auth-google svg{flex:0 0 auto}\n.auth-guest{width:100%;height:44px;border-radius:11px;border:1px solid var(--hairline);cursor:pointer;\n  background:rgba(120,130,150,.07);color:var(--on-surface);font-weight:600;font-size:13.5px;font-family:var(--sans);transition:background-color .2s,border-color .2s}\n.auth-guest:hover{background:rgba(200,149,89,.12);border-color:var(--gold)}\n.auth-fineprint{text-align:center;font-size:10.5px;color:var(--on-surface-soft);margin-top:16px;letter-spacing:.2px}\n@media (max-width:720px){.auth-card{max-width:none;padding:26px 22px}}\n\n/* answer controls */\n.controls{width:100%;max-width:660px;display:flex;flex-direction:column;gap:14px;align-items:center}\n.opt-grid{display:grid;gap:12px;width:100%}\n.opt-grid.two{grid-template-columns:1fr 1fr}\n.opt-grid.city{grid-template-columns:repeat(2,1fr);max-width:460px}\n.opt{position:relative;padding:16px 20px 16px 22px;border-radius:var(--r);cursor:pointer;text-align:left;background:var(--surface-soft);\n  border:1px solid var(--hairline-soft);color:var(--on-surface);overflow:hidden;\n  font-size:15px;font-weight:600;transition:transform var(--t-base) var(--ease),border-color var(--t-base) var(--ease),box-shadow var(--t-base) var(--ease),background-color var(--t-base) var(--ease)}\n.opt::before{content:\"\";position:absolute;left:0;top:0;bottom:0;width:3px;\n  background:linear-gradient(180deg,var(--gold),var(--gold-deep));\n  transform:scaleY(0);transform-origin:center;transition:transform var(--t-base) var(--ease)}\n.opt::after{content:\"›\";position:absolute;right:18px;top:50%;transform:translateY(-50%);\n  color:var(--gold-deep);font-size:22px;font-weight:400;opacity:0;transition:opacity var(--t-base) var(--ease),right var(--t-base) var(--ease)}\n.opt:hover{transform:translateY(-3px);border-color:var(--gold);box-shadow:var(--gold-glow);background:var(--surface)}\n.opt:hover::before{transform:scaleY(1)}\n.opt:hover::after{opacity:1;right:15px}\n.opt:active{transform:translateY(-1px) scale(.99);transition-duration:var(--t-fast)}\n.opt .sm{display:block;font-weight:400;font-size:12px;color:var(--on-surface-soft);margin-top:3px}\n\n/* slider */\n.slider-card{width:100%;max-width:540px;background:var(--surface);border:1px solid var(--hairline);\n  border-radius:var(--r-lg);padding:24px;box-shadow:var(--shadow)}\n.slider-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:18px}\n.slider-top .val{font-family:var(--serif);font-weight:700;font-size:30px;color:var(--gold-deep);letter-spacing:-.8px}\n.slider-top .lab{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--on-surface-soft);font-weight:600}\ninput[type=range]{-webkit-appearance:none;width:100%;height:4px;border-radius:999px;outline:none;\n  background:linear-gradient(90deg,var(--gold-deep),var(--gold))}\ninput[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;\n  cursor:pointer;background:var(--gold);border:3px solid #fff;\n  box-shadow:0 0 0 1px var(--gold),0 4px 14px rgba(0,0,0,.3);transition:transform .15s ease}\ninput[type=range]::-webkit-slider-thumb:hover{transform:scale(1.12)}\ninput[type=range]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;cursor:pointer;background:var(--gold);border:3px solid #fff;box-shadow:0 0 0 1px var(--gold)}\n.slider-tiers{display:flex;justify-content:space-between;margin-top:13px;font-size:9.5px;letter-spacing:.5px;color:var(--on-surface-soft)}\n\n/* ---- budget direct-entry (replaces slider) ---- */\n.budget-card{width:100%;max-width:540px;background:var(--surface);border:1px solid var(--hairline);\n  border-radius:var(--r-lg);padding:24px 22px;box-shadow:var(--shadow);text-align:center}\n.budget-tierlab{font-size:10px;letter-spacing:2.4px;text-transform:uppercase;color:var(--gold-deep);font-weight:700;margin-bottom:14px}\n.budget-amount{display:flex;align-items:center;justify-content:center;gap:12px}\n.bstep{width:46px;height:46px;flex:0 0 auto;border-radius:14px;border:1px solid var(--hairline);\n  background:#fbfcfd;color:var(--gold-deep);font-size:24px;font-weight:700;cursor:pointer;line-height:1;\n  display:flex;align-items:center;justify-content:center;transition:transform .15s,border-color .15s,background .15s}\n.bstep:hover{border-color:var(--gold);background:rgba(217,168,95,.1);transform:translateY(-1px)}\n.bstep:active{transform:translateY(0) scale(.96)}\n.budget-input-wrap{display:flex;align-items:baseline;gap:7px;flex:1 1 auto;justify-content:center;\n  background:#fbfcfd;border:1px solid var(--hairline);border-radius:14px;padding:10px 14px;min-width:0}\n.budget-input-wrap:focus-within{border-color:var(--gold);box-shadow:var(--gold-glow)}\n.bcur{font-size:14px;font-weight:700;color:var(--on-surface-soft);flex:0 0 auto}\n#bAmount{border:none;outline:none;background:transparent;width:100%;min-width:0;text-align:center;\n  font-family:var(--serif);font-weight:700;font-size:30px;color:var(--gold-deep);letter-spacing:-.5px}\n.bper{font-size:13px;font-weight:600;color:var(--on-surface-soft);flex:0 0 auto}\n.budget-bands{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:18px}\n.band{border:1px solid var(--hairline-soft);border-radius:12px;background:#fbfcfd;cursor:pointer;\n  padding:10px 6px;display:flex;flex-direction:column;gap:3px;align-items:center;\n  transition:transform .15s,border-color .15s,background .15s}\n.band:hover{border-color:var(--gold);transform:translateY(-2px)}\n.band.on{border-color:var(--gold);background:linear-gradient(160deg,rgba(217,168,95,.2),rgba(217,168,95,.08));box-shadow:var(--gold-glow)}\n.band-l{font-size:10px;letter-spacing:.4px;text-transform:uppercase;color:var(--on-surface-soft);font-weight:600}\n.band-a{font-family:var(--serif);font-weight:700;font-size:16px;color:var(--on-surface)}\n.band.on .band-a{color:var(--gold-deep)}\n.budget-note{margin-top:16px;font-size:11px;color:var(--on-surface-soft);letter-spacing:.2px}\n@media (max-width:480px){\n  #bAmount{font-size:25px}\n  .budget-bands{grid-template-columns:repeat(2,1fr)}\n}\n\n.next{margin-top:6px;padding:14px 32px;border-radius:999px;border:1.5px solid var(--gold);cursor:pointer;\n  background:rgba(18,35,57,.35);color:var(--gold);\n  font-weight:700;font-size:14px;font-family:var(--sans);letter-spacing:.3px;transition:transform .2s ease,box-shadow .25s ease,background .25s ease,color .3s ease,border-color .25s ease,opacity .2s ease}\n.next:hover:not(:disabled){transform:translateY(-2px);background:var(--gold);border-color:var(--gold);color:#fff;box-shadow:0 6px 16px rgba(0,0,0,.34)}\n.next:active:not(:disabled){transform:translateY(0) scale(.98)}\n.next:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}\n/* back button — fixed at the bottom-left, same level as Class pill; styled like Begin consultation */\n.back-btn{position:fixed;left:24px;bottom:58px;z-index:55;padding:0 20px;height:44px;border-radius:999px;cursor:pointer;\n  display:inline-flex;align-items:center;gap:7px;\n  border:1.5px solid var(--gold);background:rgba(16,30,52,.82);color:var(--gold);\n  font-weight:700;font-size:13px;font-family:var(--sans);letter-spacing:.3px;\n  transition:transform .2s cubic-bezier(.16,.84,.32,1),box-shadow .25s ease,background .25s ease,color .3s ease,border-color .25s ease;\n  box-shadow:0 2px 8px rgba(0,0,0,.30)}\n.back-btn:hover{transform:translateY(-2px);background:var(--gold);border-color:var(--gold);color:#fff;box-shadow:0 6px 16px rgba(0,0,0,.34)}\n.back-btn:active{transform:translateY(0) scale(.97);box-shadow:0 2px 8px rgba(0,0,0,.30)}\n/* click fill: solid gold + white text (same as Begin consultation) */\n.next.filling{background:var(--gold);border-color:var(--gold);color:#fff;\n  transform:translateY(-1px);box-shadow:0 6px 16px rgba(0,0,0,.34)}\n.field-hint{font-size:11.5px;color:#e0a96a;margin-top:7px;min-height:14px;letter-spacing:.2px}\n/* ---- name entry card ---- */\n.name-card{width:100%;max-width:460px;background:var(--surface);border:1px solid var(--hairline);\n  border-radius:var(--r-lg);padding:22px 22px 18px;box-shadow:var(--shadow)}\n.name-label{display:block;font-size:10px;letter-spacing:2.2px;text-transform:uppercase;\n  color:var(--gold-deep);font-weight:700;margin-bottom:11px}\n\n/* detailed preferences step */\n.pref-card{width:100%;max-width:560px;background:var(--surface);border:1px solid var(--hairline);\n  border-radius:var(--r-lg);padding:20px 20px 8px;box-shadow:var(--shadow);text-align:left}\n.pref-q{margin-bottom:16px}\n.pref-label{font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:var(--gold-deep);font-weight:700;margin-bottom:9px}\n.pref-multi{color:var(--on-surface-soft);font-weight:500;letter-spacing:.5px;text-transform:none}\n.pref-chips{display:flex;flex-wrap:wrap;gap:7px}\n.pchip{padding:8px 13px;border-radius:999px;border:1px solid var(--hairline);background:#fbfcfd;\n  color:var(--on-surface);font-size:12.5px;font-family:var(--sans);cursor:pointer;\n  transition:transform .15s,border-color .2s,background .2s}\n.pchip:hover{border-color:var(--gold);transform:translateY(-1px)}\n.pchip.on{border-color:var(--gold);background:linear-gradient(150deg,rgba(217,168,95,.22),rgba(217,168,95,.1));\n  color:var(--gold-deep);font-weight:600;box-shadow:var(--gold-glow)}\n#nameInput{width:100%;height:52px;border-radius:13px;border:1px solid var(--hairline);\n  background:#fbfcfd;color:var(--on-surface);padding:0 17px;outline:none;\n  font-family:var(--serif);font-weight:600;font-size:20px;letter-spacing:.2px;\n  transition:border-color .2s,box-shadow .2s}\n#nameInput::placeholder{font-family:var(--sans);font-weight:400;font-size:15px;color:var(--on-surface-soft)}\n#nameInput:focus{border-color:var(--gold);box-shadow:var(--gold-glow)}\n.ban-reset{margin-top:14px;background:none;border:none;color:var(--on-surface-soft);font-size:11px;\n  letter-spacing:.4px;cursor:pointer;text-decoration:underline;opacity:.6;font-family:var(--sans)}\n.ban-reset:hover{opacity:1;color:var(--gold-deep)}\n.ban-lock{display:inline-flex;align-items:center;gap:8px;padding:14px 22px;border-radius:14px;\n  background:rgba(192,57,43,.12);border:1px solid rgba(192,57,43,.4);color:#e98b7f;\n  font-weight:600;font-size:14px;letter-spacing:.3px}\n\n/* premium gate (S / A private entry) */\n.gate-card{width:100%;max-width:540px;text-align:center;padding:30px 30px;border-radius:var(--r-lg);\n  background:linear-gradient(160deg,#16273d,#0f1c2e);\n  border:1px solid var(--gold);box-shadow:var(--shadow),inset 0 1px 0 rgba(200,149,89,.25),0 0 40px -12px rgba(200,149,89,.4);\n  position:relative;overflow:hidden}\n.gate-card::before{content:\"\";position:absolute;inset:0;pointer-events:none;\n  background:radial-gradient(120% 80% at 50% -10%,rgba(200,149,89,.18),transparent 60%)}\n/* sweeping gold shimmer */\n.gate-card::after{content:\"\";position:absolute;top:0;left:-60%;width:50%;height:100%;pointer-events:none;\n  background:linear-gradient(105deg,transparent,rgba(219,169,104,.22),transparent);\n  transform:skewX(-18deg);animation:gateShimmer 4.5s ease-in-out infinite}\n@keyframes gateShimmer{0%{left:-60%}55%{left:130%}100%{left:130%}}\n.gate-crest{font-size:30px;color:var(--gold);margin-bottom:10px;line-height:1;\n  text-shadow:0 0 18px rgba(219,169,104,.6);animation:crestPulse 3s ease-in-out infinite;position:relative}\n@keyframes crestPulse{0%,100%{transform:scale(1);opacity:.92}50%{transform:scale(1.12);opacity:1}}\n.gate-tier{font-family:var(--serif);font-weight:700;font-size:23px;color:var(--gold);letter-spacing:.2px;position:relative}\n.gate-range{font-size:14px;color:var(--ink);margin-top:6px;font-weight:600;position:relative}\n.gate-note{font-size:10.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink-soft);margin-top:14px;position:relative}\n.gate-btn{margin-top:20px;width:100%;padding:15px;border-radius:12px;cursor:pointer;position:relative;\n  border:1.5px solid var(--gold);background:rgba(18,35,57,.35);\n  color:var(--gold);font-weight:700;font-size:15px;font-family:var(--sans);letter-spacing:.3px;\n  transition:transform .2s ease,box-shadow .25s ease,background .25s ease,color .3s ease,border-color .25s ease}\n.gate-btn:hover{transform:translateY(-2px);background:var(--gold);border-color:var(--gold);color:#fff;box-shadow:0 6px 16px rgba(0,0,0,.34)}\n/* express acquisition — fast track */\n.gate-express{margin-top:10px;width:100%;padding:13px;border-radius:12px;cursor:pointer;position:relative;\n  border:1px solid var(--hairline);background:rgba(200,149,89,.08);\n  color:var(--gold);font-weight:600;font-size:13px;font-family:var(--sans);letter-spacing:.2px;\n  transition:background-color .2s ease,border-color .2s ease}\n.gate-express:hover{background:rgba(200,149,89,.16);border-color:var(--gold)}\n.gate-express b{color:var(--ink);font-weight:700}\n.gate-kicker{font-size:9.5px;letter-spacing:3px;text-transform:uppercase;color:var(--gold);font-weight:700;margin-bottom:14px;position:relative}\n\n/* detailed gate content */\n.gate-tagline{font-size:13px;color:var(--ink-soft);margin-top:7px;position:relative;font-style:italic}\n.gate-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0 6px;position:relative}\n.gstat{padding:11px 6px;border-radius:10px;background:rgba(200,149,89,.08);border:1px solid var(--hairline-soft)}\n.gstat-n{font-family:var(--serif);font-weight:700;font-size:18px;color:var(--gold)}\n.gstat-l{font-size:9px;letter-spacing:.6px;text-transform:uppercase;color:var(--ink-soft);margin-top:3px}\n.gate-section{font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-weight:700;text-align:left;margin:20px 0 11px;position:relative;\n  padding-bottom:7px;border-bottom:1px solid var(--hairline-soft)}\n.gate-perks{display:flex;flex-direction:column;gap:13px;text-align:left;position:relative}\n.gperk{display:flex;gap:11px;align-items:flex-start}\n.gperk-i{flex:0 0 auto;color:var(--gold);font-size:13px;margin-top:1px}\n.gperk-t{font-size:13.5px;font-weight:700;color:var(--ink)}\n.gperk-d{font-size:11.5px;color:var(--ink-soft);margin-top:2px;line-height:1.45}\n.gate-homes{display:flex;flex-wrap:wrap;gap:7px;text-align:left;position:relative}\n.ghome{font-size:11.5px;padding:6px 12px;border-radius:999px;background:rgba(200,149,89,.1);\n  border:1px solid var(--hairline);color:var(--ink);font-weight:600}\n\n/* ---- S CLASS · ultra-exclusive dark crest (uses the luxe base above) ---- */\n.gate-s{} /* inherits the dark shimmering luxury base */\n\n/* ---- A CLASS · refined ivory, calmer and elegant ---- */\n.gate-a{background:linear-gradient(160deg,#ffffff,#f1f5f9);\n  box-shadow:var(--shadow),0 0 36px -16px rgba(200,149,89,.3)}\n.gate-a::before{background:radial-gradient(120% 80% at 50% -10%,rgba(200,149,89,.1),transparent 60%)}\n.gate-a::after{animation-duration:6s;background:linear-gradient(105deg,transparent,rgba(200,149,89,.12),transparent)}\n.gate-a .gate-kicker{color:var(--gold-deep)}\n.gate-a .gate-crest{color:var(--gold-deep);text-shadow:none;animation:crestPulse 4s ease-in-out infinite}\n.gate-a .gate-tier{color:var(--on-surface)}\n.gate-a .gate-range{color:var(--gold-deep)}\n.gate-a .gate-note{color:var(--on-surface-soft)}\n.gate-a .gate-express{color:var(--gold-deep);background:rgba(200,149,89,.07);border-color:var(--hairline-soft)}\n.gate-a .gate-express:hover{background:rgba(200,149,89,.14)}\n.gate-a .gate-tagline{color:var(--on-surface-soft)}\n.gate-a .gstat-n{color:var(--gold-deep)}\n.gate-a .gstat-l,.gate-a .gperk-d{color:var(--on-surface-soft)}\n.gate-a .gate-section{color:var(--gold-deep)}\n.gate-a .gperk-i{color:var(--gold-deep)}\n.gate-a .gperk-t{color:var(--on-surface)}\n.gate-a .ghome{color:var(--on-surface)}\n\n/* ---- B CLASS · warm, welcoming, family ---- */\n.gate-b{background:linear-gradient(160deg,#ffffff,#f5f1ea);\n  border-color:rgba(200,149,89,.4);box-shadow:var(--shadow),0 0 30px -16px rgba(200,149,89,.25)}\n.gate-b::before{background:radial-gradient(130% 90% at 50% -10%,rgba(200,149,89,.12),transparent 62%)}\n.gate-b::after{display:none} /* calmer — no shimmer for the family tier */\n.gate-b .gate-kicker{color:var(--gold-deep)}\n.gate-b .gate-crest{color:var(--gold-deep);font-size:34px;text-shadow:none;animation:none}\n.gate-b .gate-tier{color:var(--on-surface)}\n.gate-b .gate-range{color:var(--gold-deep)}\n.gate-b .gate-note{color:var(--on-surface-soft);text-transform:none;letter-spacing:.3px;font-size:11.5px}\n.gate-b .gate-express{color:var(--gold-deep);background:rgba(200,149,89,.07);border-color:var(--hairline-soft)}\n.gate-b .gate-express:hover{background:rgba(200,149,89,.14)}\n.gate-b .gate-tagline{color:var(--on-surface-soft)}\n.gate-b .gstat-n{color:var(--gold-deep)}\n.gate-b .gstat-l,.gate-b .gperk-d{color:var(--on-surface-soft)}\n.gate-b .gate-section{color:var(--gold-deep)}\n.gate-b .gperk-i{color:var(--gold-deep)}\n.gate-b .gperk-t{color:var(--on-surface)}\n.gate-b .ghome{color:var(--on-surface)}\n\n/* admin panel */\n/* ============================================================\n   EMPLOYEE PANEL\n   ============================================================ */\n.emp-wrap{width:100%;max-width:660px;display:flex;flex-direction:column;gap:14px}\n.emp-card{background:var(--surface);border:1px solid var(--hairline);border-radius:var(--r);padding:16px 18px}\n.emp-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px}\n.emp-h-t{font-family:var(--serif);font-weight:700;font-size:16px;color:var(--on-surface)}\n.emp-badge{font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:var(--gold-deep);\n  background:rgba(185,138,76,.12);border:1px solid rgba(185,138,76,.3);border-radius:999px;padding:3px 10px}\n.emp-badge.soft{color:var(--on-surface-soft);background:rgba(26,44,64,.06);border-color:var(--hairline)}\n.emp-count{font-size:11px;color:var(--on-surface-soft);font-weight:600}\n.emp-sub{font-size:12.5px;color:var(--on-surface-soft);line-height:1.5;margin:2px 0 12px}\n.emp-brief{font-size:13.5px;color:var(--on-surface);line-height:1.6;margin:6px 0 12px}\n.emp-news{display:inline-flex;align-items:center;gap:9px;text-decoration:none;font-weight:700;font-size:13.5px;\n  color:var(--gold-deep);background:transparent;border:1.5px solid var(--gold);border-radius:999px;padding:10px 18px;\n  transition:transform .18s ease,box-shadow .25s ease,background .25s ease,color .3s ease,border-color .25s ease}\n.emp-news svg{stroke:var(--gold-deep);transition:stroke .3s ease}\n.emp-news:hover{transform:translateY(-2px);background:var(--gold);border-color:var(--gold);color:#fff;box-shadow:0 6px 16px rgba(0,0,0,.28)}\n.emp-news:hover svg{stroke:#fff}\n.emp-news:active{transform:translateY(0) scale(.97)}\n.emp-note{font-size:11px;color:var(--on-surface-soft);margin-top:9px;line-height:1.5}\n.emp-note code{font-family:ui-monospace,Menlo,monospace;font-size:10.5px;background:rgba(26,44,64,.07);padding:1px 6px;border-radius:5px}\n/* question list */\n.qlist{display:flex;flex-direction:column;gap:10px}\n.qrow{border:1px solid var(--hairline);border-radius:12px;padding:11px 12px;background:rgba(255,255,255,.55)}\n.qrow.dragging{opacity:.6;border-color:var(--gold)}\n.qrow-top{display:flex;align-items:center;gap:8px}\n.qdrag{cursor:grab;color:var(--on-surface-soft);font-size:13px;letter-spacing:-2px;user-select:none;padding:0 2px}\n.qlabel{flex:1;min-width:0;font-family:var(--serif);font-weight:600;font-size:14.5px;color:var(--on-surface);\n  border:none;border-bottom:1px solid var(--hairline-soft);background:transparent;padding:4px 2px}\n.qlabel:focus{outline:none;border-bottom-color:var(--gold)}\n.qmulti{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;color:var(--on-surface-soft);text-transform:uppercase;letter-spacing:.5px;white-space:nowrap}\n.qmulti input{accent-color:var(--gold-deep)}\n.qdel{border:none;background:transparent;color:var(--on-surface-soft);font-size:14px;cursor:pointer;padding:2px 6px;border-radius:6px;line-height:1}\n.qdel:hover{color:#b3261e;background:rgba(179,38,30,.08)}\n.qchips{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}\n.qchip{display:inline-flex;align-items:center;gap:2px;background:rgba(26,44,64,.05);border:1px solid var(--hairline);border-radius:999px;padding:2px 4px 2px 10px}\n.qopt{border:none;background:transparent;font-size:12.5px;color:var(--on-surface);width:auto;min-width:48px;max-width:150px;padding:3px 0}\n.qopt:focus{outline:none}\n.qoptdel{border:none;background:transparent;color:var(--on-surface-soft);cursor:pointer;font-size:14px;line-height:1;padding:0 5px;border-radius:50%}\n.qoptdel:hover{color:#b3261e}\n.qoptadd{border:1px dashed var(--hairline);background:transparent;color:var(--gold-deep);font-size:11.5px;font-weight:700;border-radius:999px;padding:4px 11px;cursor:pointer}\n.qoptadd:hover{border-color:var(--gold);background:rgba(185,138,76,.07)}\n.qup-dn{display:flex;gap:8px;margin-top:9px}\n.qmv{border:none;background:transparent;color:var(--on-surface-soft);font-size:11px;font-weight:600;cursor:pointer;padding:2px 4px}\n.qmv:disabled{opacity:.35;cursor:default}\n.qmv:not(:disabled):hover{color:var(--gold-deep)}\n.emp-add{margin-top:12px;width:100%;border:1px dashed var(--gold);background:rgba(185,138,76,.06);color:var(--gold-deep);\n  font-weight:700;font-size:13px;border-radius:10px;padding:10px;cursor:pointer}\n.emp-add:hover{background:rgba(185,138,76,.12)}\n.emp-save{font-size:11px;color:var(--on-surface-soft);margin-top:9px;height:14px;transition:opacity .2s}\n.emp-save.on{color:var(--gold-deep)}\n.emp-save.done{color:var(--on-surface-soft)}\n.emp-fields{display:flex;flex-direction:column;gap:7px;margin-bottom:4px}\n.emp-field{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:13px;color:var(--on-surface);\n  padding:9px 12px;border:1px solid var(--hairline);border-radius:9px;background:rgba(255,255,255,.5)}\n.emp-field em{font-style:normal;font-size:10.5px;letter-spacing:.5px;text-transform:uppercase;color:var(--on-surface-soft)}\n.pref-empty{font-size:13px;color:var(--on-surface-soft);text-align:center;padding:18px 8px}\n\n/* ============================================================\n   LISTINGS — full-bleed carousel of large cards\n   ============================================================ */\n#carousel{position:relative;width:100%;max-width:560px;margin:0 auto}\n\n/* ---- grid listing: see multiple homes at once ---- */\n.lgrid{width:100%;max-width:920px;display:grid;grid-template-columns:repeat(2,1fr);gap:22px;margin:0 auto}\n.gcard{background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(247,244,237,.98));\n  border:1px solid var(--glass-line);border-radius:20px;overflow:hidden;box-shadow:0 18px 42px -20px rgba(0,0,0,.55);\n  display:flex;flex-direction:column;opacity:0;transform:translateY(14px);\n  animation:gcardIn .5s var(--ease) forwards;transition:transform var(--t-base) var(--ease),box-shadow var(--t-base) var(--ease)}\n.gcard:nth-child(1){animation-delay:.04s}.gcard:nth-child(2){animation-delay:.09s}\n.gcard:nth-child(3){animation-delay:.14s}.gcard:nth-child(4){animation-delay:.19s}\n.gcard:nth-child(5){animation-delay:.24s}.gcard:nth-child(6){animation-delay:.29s}\n@keyframes gcardIn{to{opacity:1;transform:none}}\n.gcard:not(.locked):hover{transform:translateY(-5px);box-shadow:0 28px 56px -22px rgba(0,0,0,.62)}\n.gcard-img{position:relative;height:230px;cursor:pointer;overflow:hidden;background:#0f1c2e}\n.gcard-photo{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s ease}\n.gcard:not(.locked) .gcard-img:hover .gcard-photo{transform:scale(1.05)}\n.gcard-photo.locked-img{filter:brightness(.45) saturate(.7)}\n.gcard .img-hint{position:absolute;bottom:11px;right:12px;font-size:11.5px;font-weight:600;color:#fff;\n  background:rgba(15,28,46,.6);padding:5px 11px;border-radius:999px;border:1px solid rgba(255,255,255,.18);\n  opacity:0;transition:opacity .25s;pointer-events:none}\n.gcard-img:hover .img-hint{opacity:1}\n.tag.floaty{position:absolute;top:12px;left:12px;font-size:10.5px;background:rgba(63,157,107,.95);\n  border:none;color:#fff;font-weight:700;padding:5px 12px;box-shadow:0 4px 12px -3px rgba(0,0,0,.5)}\n.gcard-price-float{position:absolute;bottom:11px;left:12px;font-family:var(--serif);font-weight:700;font-size:20px;\n  color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.7)}\n.gcard-price-float .pre{display:block;font-family:var(--sans);font-weight:600;font-size:8.5px;letter-spacing:1.4px;\n  text-transform:uppercase;color:rgba(255,255,255,.8);margin-bottom:1px}\n.ginfo{padding:16px 18px 18px;display:flex;flex-direction:column;gap:5px;flex:1}\n.ginfo .ptype{font-family:var(--serif);font-weight:700;font-size:20px;color:var(--on-surface);line-height:1.15}\n.ginfo .pcity{font-size:13px;color:var(--on-surface-soft)}\n.ginfo .gspecs{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px;padding:9px 0;\n  border-top:1px solid var(--hairline-soft);border-bottom:1px solid var(--hairline-soft)}\n.ginfo .gspec{display:flex;flex-direction:column;gap:1px}\n.ginfo .gspec .sv{font-family:var(--serif);font-weight:700;font-size:15px;color:var(--on-surface)}\n.ginfo .gspec .sl{font-size:8.5px;letter-spacing:1px;text-transform:uppercase;color:var(--on-surface-soft)}\n.ginfo .meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}\n.ginfo .tag{font-size:10.5px;padding:4px 10px;border-radius:999px;border:1px solid var(--hairline-soft);\n  background:#fbfcfd;color:var(--on-surface-soft)}\n.gcard-actions{display:flex;flex-direction:column;gap:9px;margin-top:auto;padding-top:14px}\n.gcard-actions .buy{width:100%;padding:13px 14px;border-radius:13px;border:none;cursor:pointer;\n  background:linear-gradient(135deg,var(--sky-bright),var(--gold),var(--gold-deep));\n  background-size:160% 160%;background-position:0% 50%;\n  color:#13161d;font-weight:700;font-size:14.5px;letter-spacing:.3px;\n  box-shadow:0 8px 22px -8px rgba(217,168,95,.6);\n  transition:background-position .4s ease,box-shadow .25s,transform .15s}\n.gcard-actions .buy:hover{background-position:100% 50%;box-shadow:0 12px 30px -8px rgba(217,168,95,.75);transform:translateY(-2px)}\n.gcard-actions .view-d{width:100%;padding:12px 14px;border-radius:13px;cursor:pointer;\n  border:1.5px solid var(--gold);background:rgba(217,168,95,.08);color:var(--gold-deep);\n  font-weight:700;font-size:13.5px;letter-spacing:.3px;\n  transition:background .25s,transform .15s,box-shadow .25s}\n.gcard-actions .view-d:hover{background:rgba(217,168,95,.18);transform:translateY(-2px);box-shadow:0 8px 20px -8px rgba(217,168,95,.5)}\n.gcard.locked{opacity:.92}\n.gcard.locked .ginfo .ptype{color:var(--on-surface-soft)}\n@media (max-width:760px){.lgrid{grid-template-columns:1fr;max-width:440px}}\n.track{position:relative;height:480px}\n.lcard{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(247,244,237,.98));\n  border:1px solid var(--glass-line);border-radius:24px;overflow:hidden;box-shadow:var(--shadow);\n  opacity:0;transform:scale(.9) translateX(40px);transition:.5s cubic-bezier(.16,.84,.3,1);pointer-events:none}\n.lcard.show{opacity:1;transform:none;pointer-events:auto}\n\n/* 3D scene inside card */\n.stage3d{height:230px;position:relative;perspective:900px;display:grid;place-items:center;overflow:hidden;\n  background:radial-gradient(125% 105% at 60% 0%, #7fa98a 0%, #3f6b52 48%, #1d3a2c 100%)}\n/* ---- villa illustration stage (SVG card preview) ---- */\n.lcard-img{position:relative;cursor:pointer}\n.img-hint{position:absolute;bottom:10px;right:12px;font-size:11px;font-weight:600;color:#fff;\n  background:rgba(15,28,46,.6);backdrop-filter:blur(6px);padding:5px 10px;border-radius:999px;\n  border:1px solid rgba(255,255,255,.18);opacity:0;transition:opacity .25s;pointer-events:none}\n.lcard-img:hover .img-hint{opacity:1}\n.villa-stage{height:184px;position:relative;overflow:hidden;display:flex;align-items:flex-end;justify-content:center;\n  background:\n    radial-gradient(115% 90% at 60% -10%, rgba(245,225,170,.28) 0%, transparent 50%),\n    linear-gradient(180deg,#1a2c44 0%,#22405f 55%,#2c5170 100%)}\n.villa-svg{width:80%;max-width:380px;height:auto;display:block;filter:drop-shadow(0 12px 18px rgba(0,0,0,.4))}\n.villa-stage.photo{display:block;background:#0f1c2e}\n.card-photo{width:100%;height:184px;object-fit:cover;display:block}\n.card-photo.locked-img{filter:brightness(.5) saturate(.7)}\n.lock-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;\n  background:linear-gradient(180deg,rgba(15,28,46,.35),rgba(15,28,46,.6));color:#fff;text-align:center}\n.lock-overlay .lock-ic{font-size:26px}\n.lock-overlay .lock-tx{font-weight:800;font-size:15px;letter-spacing:1.5px;text-transform:uppercase}\n.lock-overlay .lock-sub{font-size:11px;color:rgba(255,255,255,.75);letter-spacing:.5px}\n.lcard.locked{opacity:.96}\n.tag-av{background:rgba(63,157,107,.16);border-color:rgba(63,157,107,.4);color:#3f9d6b}\n.tag-un{background:rgba(192,138,62,.16);border-color:rgba(192,138,62,.45);color:#c08a3e}\n.buy:disabled{background:#3a3f4a;border-color:#3a3f4a;color:#9098a6;cursor:not-allowed;transform:none;box-shadow:none}\n@media (max-width:720px){.card-photo{height:160px}}\n.lcard-img:hover .villa-svg{transform:translateY(-2px);transition:transform .4s cubic-bezier(.16,.84,.32,1)}\n.lcard-actions{display:flex;gap:9px;margin-top:14px}\n.lcard-actions .view-d{flex:0 0 auto;margin-top:0}\n.lcard-actions .buy{flex:1;margin-top:0}\n@media (max-width:720px){.villa-stage{height:160px}}\n\n/* ============================================================\n   3D ARCHITECTURAL MINIATURE\n   light source: upper-front. front/top = bright, sides = shadowed\n   ============================================================ */\n.stage3d{height:236px;position:relative;perspective:1000px;display:grid;place-items:center;overflow:hidden;\n  background:\n    radial-gradient(115% 85% at 58% -8%, rgba(245,225,170,.35) 0%, transparent 48%),\n    radial-gradient(125% 105% at 60% 0%, #7fa98a 0%, #3f6b52 48%, #1d3a2c 100%)}\n.scene3d{transform-style:preserve-3d;transform:rotateX(60deg) rotateZ(-45deg);\n  transition:transform .7s cubic-bezier(.45,0,.2,1)}\n.lcard.show .scene3d{animation:floaty 6s ease-in-out infinite}\n@keyframes floaty{0%,100%{transform:rotateX(60deg) rotateZ(-45deg) translateZ(0)}\n  50%{transform:rotateX(60deg) rotateZ(-45deg) translateZ(12px)}}\n\n/* ambient occlusion shadow on the backdrop plate */\n.ao{position:absolute;width:188px;height:120px;border-radius:50%;\n  background:radial-gradient(closest-side,rgba(0,0,0,.55),rgba(0,0,0,.2) 55%,transparent 78%);\n  filter:blur(7px);bottom:18px;left:50%;margin-left:-94px;z-index:0}\n\n/* ---- GROUND SLAB: concrete top + dark soil side walls (z 0, depth 24 below) ---- */\n.slab{position:absolute;left:0;top:0;width:0;height:0;transform-style:preserve-3d}\n.slab>div{position:absolute;backface-visibility:hidden}\n.slab .s-top{width:164px;height:164px;left:-82px;top:-82px;border-radius:5px;transform:translateZ(0);\n  background:linear-gradient(135deg,#f1f5f9 0%,#dfe7ef 55%,#cdd8e3 100%);\n  box-shadow:inset 0 0 0 3px rgba(255,255,255,.5),inset 0 0 24px rgba(80,110,140,.25)}\n.slab .s-front{width:164px;height:24px;left:-82px;top:82px;transform-origin:top center;transform:translateZ(0) rotateX(-90deg);\n  background:linear-gradient(180deg,#5a4a38,#2c2113)}\n.slab .s-right{width:24px;height:164px;left:82px;top:-82px;transform-origin:center left;transform:translateZ(0) rotateY(90deg);\n  background:linear-gradient(160deg,#4a3a2a,#241a0f)}\n\n/* lawn patch on the slab top */\n.lawn{position:absolute;width:150px;height:150px;left:-75px;top:-75px;border-radius:4px;\n  background:radial-gradient(60% 60% at 35% 30%,#7fae6a 0%,#5e9050 55%,#4a7a40 100%);\n  box-shadow:inset 0 0 16px rgba(30,60,20,.4);transform:translateZ(.5px)}\n\n/* ---- MAIN STRUCTURE ----\n   Each storey is a wrapper translated into place; its 5 faces are\n   built around the wrapper's local center. */\n.building{position:absolute;transform-style:preserve-3d;transform:translateZ(1px)}\n.storey{position:absolute;transform-style:preserve-3d}\n.face{position:absolute;backface-visibility:hidden}\n\n/* ---- MAIN STRUCTURE (proven hinge-from-edge geometry) ----\n   Material colours come from per-tier variables (see .house-S … .house-D).\n   Light source: upper-front-left → front/top bright, right/back shadowed. */\n.building{position:absolute;transform-style:preserve-3d;transform:translateZ(1px);\n  /* default (S CLASS) material tokens — overridden per tier */\n  --wall-lit:linear-gradient(135deg,#fbfdff,#eef1ee);\n  --wall-front:linear-gradient(180deg,#f9f9f4,#e9e8df);\n  --wall-shadow:linear-gradient(160deg,#b9b2a2,#968d7b);\n  --wall-side:linear-gradient(160deg,#d8d2c4,#bcb4a3);\n  --wall-back:linear-gradient(180deg,#c4bdac,#a59c89);\n  --accent-lit:linear-gradient(135deg,#c99a5b,#a9783c);\n  --accent-front:linear-gradient(180deg,#bb8848,#8f5f2c);\n  --roof-edge:linear-gradient(135deg,#5a606a,#3e434c);\n  --roof-tex:repeating-linear-gradient(45deg,#3b3f47 0 3px,#2f333a 3px 6px);\n  --frame:#2e3e50;\n}\n.storey{position:absolute;transform-style:preserve-3d}\n.face{position:absolute;backface-visibility:hidden}\n\n/* LOWER storey: 84x84 footprint, 44 tall. top at z=44 (main concrete volume) */\n.lower{transform:translateZ(0)}\n.lower .f-top  {width:84px;height:84px;left:-42px;top:-42px;transform:translateZ(44px);background:var(--wall-lit)}\n.lower .f-front{width:84px;height:44px;left:-42px;top:42px;transform-origin:top center;transform:translateZ(44px) rotateX(-90deg);background:var(--wall-front)}\n.lower .f-back {width:84px;height:44px;left:-42px;top:-86px;transform-origin:bottom center;transform:translateZ(44px) rotateX(90deg);background:var(--wall-back)}\n.lower .f-right{width:44px;height:84px;left:42px;top:-42px;transform-origin:center left;transform:translateZ(44px) rotateY(90deg);background:var(--wall-shadow)}\n.lower .f-left {width:44px;height:84px;left:-86px;top:-42px;transform-origin:center right;transform:translateZ(44px) rotateY(-90deg);background:var(--wall-side)}\n\n/* UPPER storey: 56x56, set back-left, 38 tall (accent material volume) */\n.upper{transform:translate3d(-5px,-5px,44px)}\n.upper .f-top  {width:56px;height:56px;left:-28px;top:-28px;transform:translateZ(38px);background:var(--accent-lit)}\n.upper .f-front{width:56px;height:38px;left:-28px;top:28px;transform-origin:top center;transform:translateZ(38px) rotateX(-90deg);background:var(--accent-front)}\n.upper .f-back {width:56px;height:38px;left:-28px;top:-66px;transform-origin:bottom center;transform:translateZ(38px) rotateX(90deg);background:var(--wall-back)}\n.upper .f-right{width:38px;height:56px;left:28px;top:-28px;transform-origin:center left;transform:translateZ(38px) rotateY(90deg);background:var(--wall-shadow)}\n.upper .f-left {width:38px;height:56px;left:-66px;top:-28px;transform-origin:center right;transform:translateZ(38px) rotateY(-90deg);background:var(--accent-front)}\n\n/* ---- tiered roof on upper storey ---- */\n.roof-base{width:64px;height:64px;left:-32px;top:-32px;border-radius:3px;transform:translateZ(39px);\n  background:var(--roof-edge);box-shadow:0 4px 10px rgba(0,0,0,.4)}\n.roof-grav{width:52px;height:52px;left:-26px;top:-26px;border-radius:2px;transform:translateZ(41px);\n  background:var(--roof-tex);box-shadow:inset 0 0 12px rgba(0,0,0,.65)}\n\n/* ---- recessed windows w/ warm interior glow ---- */\n.win{position:absolute;border-radius:2px;overflow:hidden;\n  box-shadow:inset 0 0 0 2px var(--frame), inset 0 0 6px rgba(0,0,0,.4)}\n.win::before{content:\"\";position:absolute;inset:1px;border-radius:1px;\n  background:linear-gradient(180deg,#fff1cc,#ffb863);\n  animation:glow 3.5s ease-in-out infinite}\n@keyframes glow{0%,100%{opacity:.7;filter:brightness(.92)}50%{opacity:1;filter:brightness(1.18)}}\n.lw1{width:13px;height:16px;left:9px;top:14px}\n.lw2{width:13px;height:16px;left:56px;top:14px}\n.uw1{width:12px;height:14px;left:8px;top:10px}\n.uw2{width:12px;height:14px;left:36px;top:10px}\n.door{position:absolute;width:14px;height:24px;left:32px;top:16px;border-radius:2px 2px 0 0;\n  background:linear-gradient(180deg,#5a4632,#3a2d1f);box-shadow:inset 0 0 0 2px rgba(0,0,0,.3)}\n\n/* ============================================================\n   PER-TIER MATERIAL PROFILES\n   ============================================================ */\n/* S CLASS — premium off-white concrete + warm cedar/teak accents + charcoal slate roof */\n.house-S{\n  --wall-lit:linear-gradient(135deg,#fdfdfa,#eeefe9);\n  --wall-front:linear-gradient(180deg,#f8f8f2,#e7e7dd);\n  --wall-shadow:linear-gradient(160deg,#b6b0a0,#938b79);\n  --wall-side:linear-gradient(160deg,#d9d4c6,#bdb6a4);\n  --wall-back:linear-gradient(180deg,#c2bbaa,#a39a87);\n  --accent-lit:linear-gradient(135deg,#cb9a59,#a8763a);\n  --accent-front:repeating-linear-gradient(90deg,#b07f42 0 5px,#9a6c34 5px 10px);\n  --roof-edge:linear-gradient(135deg,#4a4e56,#2e3138);\n  --roof-tex:repeating-linear-gradient(45deg,#33363d 0 3px,#26282e 3px 6px);\n  --frame:#3a3026;\n}\n/* A CLASS — sandstone-beige volumes + slate-grey features + tinted glass */\n.house-A{\n  --wall-lit:linear-gradient(135deg,#f3ead8,#e4d8c0);\n  --wall-front:linear-gradient(180deg,#eee2cc,#dcccb0);\n  --wall-shadow:linear-gradient(160deg,#a99e89,#857b69);\n  --wall-side:linear-gradient(160deg,#cabfa8,#a89e88);\n  --wall-back:linear-gradient(180deg,#b4a98f,#90876f);\n  --accent-lit:linear-gradient(135deg,#7d8794,#5c6470);\n  --accent-front:linear-gradient(180deg,#6d7884,#4d5560);\n  --roof-edge:linear-gradient(135deg,#565d66,#383d44);\n  --roof-tex:repeating-linear-gradient(45deg,#444b54 0 4px,#373d45 4px 8px);\n  --frame:#3d4853;\n}\n/* B CLASS — terracotta brick + cream trim + deep navy tiled roof */\n.house-B{\n  --wall-lit:linear-gradient(135deg,#f4ede0,#e7dcc7);  /* cream top trim */\n  --wall-front:repeating-linear-gradient(0deg,#c66a45 0 6px,#b85e3b 6px 7px),linear-gradient(180deg,#c66a45,#a9512f);\n  --wall-shadow:linear-gradient(160deg,#8c4a31,#6e3825);\n  --wall-side:repeating-linear-gradient(0deg,#b85f3c 0 6px,#a8542f 6px 7px),linear-gradient(160deg,#b85f3c,#964627);\n  --wall-back:linear-gradient(180deg,#9a4e34,#793c27);\n  --accent-lit:linear-gradient(135deg,#f2ead9,#e3d6bd);\n  --accent-front:linear-gradient(180deg,#ece0c8,#d8c6a6);\n  --roof-edge:linear-gradient(135deg,#26345a,#172041);\n  --roof-tex:repeating-linear-gradient(45deg,#243057 0 4px,#1b2748 4px 8px);\n  --frame:#3a2c20;\n}\n/* C CLASS — ochre/olive stucco + white frames + clay-red roof */\n.house-C{\n  --wall-lit:linear-gradient(135deg,#d8c98e,#c6b673);\n  --wall-front:linear-gradient(180deg,#c9bb78,#b3a35d);\n  --wall-shadow:linear-gradient(160deg,#8c8049,#6c6237);\n  --wall-side:linear-gradient(160deg,#b6a967,#988a4f);\n  --wall-back:linear-gradient(180deg,#9c9052,#766b3b);\n  --accent-lit:linear-gradient(135deg,#dccf96,#cabd79);\n  --accent-front:linear-gradient(180deg,#cfc183,#b7a861);\n  --roof-edge:linear-gradient(135deg,#b6502f,#8c3a20);\n  --roof-tex:repeating-linear-gradient(45deg,#bd5733 0 4px,#a4472a 4px 8px);\n  --frame:#6c6237;\n}\n/* D CLASS — bright modern high-rise: pure white + emerald/sky accents */\n.house-D{\n  --wall-lit:linear-gradient(135deg,#ffffff,#f1f5f8);\n  --wall-front:linear-gradient(180deg,#ffffff,#eef3f7);\n  --wall-shadow:linear-gradient(160deg,#bcc6cf,#98a3ad);\n  --wall-side:linear-gradient(160deg,#e2e9ee,#c7d1d9);\n  --wall-back:linear-gradient(180deg,#c8d2da,#a6b2bb);\n  --accent-lit:linear-gradient(135deg,#34d399,#10b981);\n  --accent-front:linear-gradient(180deg,#22c3e6,#0e9fc4);\n  --roof-edge:linear-gradient(135deg,#3aa8c9,#1f7fa0);\n  --roof-tex:repeating-linear-gradient(45deg,#2bb673 0 4px,#1f9c61 4px 8px);\n  --frame:#2c3e50;\n}\n\n/* hover dynamics */\n.lcard:hover .scene3d{animation:none;transform:rotateX(58deg) rotateZ(-41deg) translateZ(20px)}\n\n/* card info */\n.linfo{padding:15px 20px 18px}\n.linfo .ptype{font-family:var(--serif);font-weight:700;font-size:21px;line-height:1.12;letter-spacing:-.2px;color:var(--on-surface,#1a2538)}\n.linfo .pcity{font-size:12.5px;color:var(--ink-soft);margin-top:4px;display:flex;align-items:center;gap:5px}\n.linfo .price{margin-top:10px;font-weight:800;font-size:23px;color:var(--gold);letter-spacing:-.5px;line-height:1}\n.linfo .price .pre{display:block;font-size:9.5px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--ink-soft);margin-bottom:3px}\n.linfo .meta{display:flex;gap:7px;margin-top:11px;flex-wrap:wrap}\n.tag{font-size:10.5px;font-weight:600;padding:5px 11px;border-radius:999px;\n  background:rgba(120,130,150,.1);border:1px solid var(--hairline-soft);color:var(--on-surface-soft,#5a6679);letter-spacing:.3px}\n.buy{width:100%;padding:13px;border-radius:12px;border:1.5px solid var(--gold);cursor:pointer;\n  background:transparent;color:var(--gold-deep);\n  font-weight:700;font-size:14px;font-family:var(--sans);letter-spacing:.2px;transition:transform .2s ease,box-shadow .25s ease,background .25s ease,color .3s ease,border-color .25s ease}\n.buy:hover{transform:translateY(-2px);background:var(--gold);border-color:var(--gold);color:#fff;box-shadow:0 6px 16px rgba(0,0,0,.28)}\n.lcard.sold .buy{background:#3a3f4a;border-color:#3a3f4a;color:#9098a6;cursor:default;transform:none;box-shadow:none}\n.sold-badge{position:absolute;top:16px;left:-40px;transform:rotate(-40deg);background:#c0392b;color:#fff;\n  font-weight:800;font-size:12px;letter-spacing:2px;padding:6px 46px;z-index:4;box-shadow:0 3px 8px rgba(0,0,0,.4)}\n\n/* carousel nav */\n.caro-nav{display:flex;align-items:center;justify-content:center;gap:18px;margin-top:14px;margin-bottom:8px}\n.arrow{width:46px;height:46px;border-radius:50%;border:1px solid var(--glass-line);cursor:pointer;\n  background:var(--glass);backdrop-filter:blur(12px);color:var(--ink);font-size:20px;transition:.2s}\n.arrow:hover{border-color:var(--sky);color:var(--sky-bright)}\n.caro-count{font-size:13px;color:var(--ink-soft);min-width:48px;text-align:center}\n\n/* ============================================================\n   PROPERTY DETAIL VIEW — full gallery, bedrooms, pros & cons\n   Opens with an expand-from-card reveal. Photos come from the\n   backend (house.images / house.bedrooms); until then the slots\n   show an honest \"image loads from server\" placeholder.\n   ============================================================ */\n.detail{width:100%;max-width:880px;margin:0 auto;display:flex;flex-direction:column;gap:14px;\n  opacity:0;transform:translateY(26px) scale(.965);transform-origin:center top;\n  animation:detailRise .85s var(--ease) forwards}\n@keyframes detailRise{\n  0%{opacity:0;transform:translateY(34px) scale(.95);filter:blur(7px)}\n  55%{opacity:1}\n  100%{opacity:1;transform:none;filter:blur(0)}}\n.detail-back{align-self:flex-start;background:none;border:none;color:var(--gold-deep);cursor:pointer;\n  font-size:13px;font-family:var(--sans);font-weight:600;padding:0;display:flex;align-items:center;gap:6px}\n.detail-back:hover{text-decoration:underline}\n\n/* hero gallery */\n.dgal{position:relative;width:100%;border-radius:18px;overflow:hidden;border:1px solid var(--hairline);\n  box-shadow:var(--shadow);background:linear-gradient(160deg,#16273d,#0f1c2e)}\n.dgal-stage{position:relative;width:100%;height:420px;overflow:hidden}\n.dgal-slide{position:absolute;inset:0;opacity:0;transform:scale(1.04);transition:opacity .45s ease,transform .6s cubic-bezier(.16,.84,.32,1);display:grid;place-items:center}\n.dgal-slide.on{opacity:1;transform:scale(1)}\n.dgal-slide img{width:100%;height:100%;object-fit:cover;display:block}\n/* honest placeholder while no real photo exists */\n.dgal-ph{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;\n  background:\n    repeating-linear-gradient(135deg,rgba(200,149,89,.05) 0 12px,rgba(200,149,89,.09) 12px 24px),\n    linear-gradient(160deg,#1b2c44,#13233a);color:var(--ink-soft)}\n.dgal-ph svg{width:42px;height:42px;opacity:.5}\n.dgal-ph .pht{font-size:12px;letter-spacing:.4px}\n.dgal-ph .phs{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--gold);opacity:.8}\n.dgal-cap{position:absolute;left:0;right:0;bottom:0;padding:26px 16px 12px;font-size:12.5px;color:#fff;\n  background:linear-gradient(0deg,rgba(8,16,28,.85),transparent);pointer-events:none}\n.dgal-arrow{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;\n  border:1px solid rgba(255,255,255,.25);background:rgba(15,28,46,.55);backdrop-filter:blur(8px);color:#fff;\n  cursor:pointer;font-size:20px;z-index:3;display:flex;align-items:center;justify-content:center;\n  box-shadow:0 6px 18px -6px rgba(0,0,0,.5);transition:transform .18s,background .2s,border-color .2s}\n.dgal-arrow:hover{border-color:var(--gold);background:rgba(217,168,95,.92);color:#13161d;transform:translateY(-50%) scale(1.08)}\n.dgal-arrow:active{transform:translateY(-50%) scale(.94)}\n.dgal-arrow.l{left:14px}.dgal-arrow.r{right:14px}\n/* thumbnail strip — scrollable but NO visible scrollbar */\n.dthumbs{display:flex;gap:9px;padding:13px;overflow-x:auto;background:rgba(8,16,28,.45);\n  scrollbar-width:none;-ms-overflow-style:none;scroll-behavior:smooth}\n.dthumbs::-webkit-scrollbar{display:none;height:0;width:0}\n.dthumb{flex:0 0 auto;width:82px;height:62px;border-radius:11px;overflow:hidden;cursor:pointer;\n  border:2px solid transparent;opacity:.6;transition:opacity .2s,border-color .2s,transform .18s;\n  background:linear-gradient(160deg,#22344e,#16273d);position:relative;\n  display:grid;place-items:center;color:var(--ink-soft)}\n.dthumb:hover{opacity:.9;transform:translateY(-2px)}\n.dthumb img{width:100%;height:100%;object-fit:cover}\n.dthumb svg{width:20px;height:20px;opacity:.6}\n.dthumb.on{opacity:1;border-color:var(--gold);box-shadow:0 0 0 1px var(--gold)}\n.dthumb .tlab{font-size:8px;letter-spacing:.5px;text-transform:uppercase;margin-top:2px}\n\n/* detail body: title + specs + pros/cons */\n.dhead{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;flex-wrap:wrap}\n.dhead .dt{font-family:var(--serif);font-weight:700;font-size:26px;color:var(--ink);letter-spacing:-.3px;line-height:1.1}\n.dhead .dc{font-size:13px;color:var(--ink-soft);margin-top:5px;display:flex;align-items:center;gap:5px}\n.dhead .dp{font-family:var(--serif);font-weight:700;font-size:25px;color:var(--gold);letter-spacing:-.5px;white-space:nowrap}\n.dhead .dp .pre{display:block;font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--ink-soft);margin-bottom:2px;text-align:right}\n.dspecs{display:flex;gap:8px;flex-wrap:wrap}\n.dspec{font-size:11.5px;font-weight:600;padding:6px 13px;border-radius:999px;background:var(--surface-soft);\n  border:1px solid var(--hairline-soft);color:var(--on-surface)}\n.dpc{display:grid;grid-template-columns:1fr 1fr;gap:12px}\n.dpc-col{background:var(--surface);border:1px solid var(--hairline);border-radius:14px;padding:14px 16px}\n.dpc-col h4{font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-bottom:9px;font-weight:700;\n  display:flex;align-items:center;gap:6px}\n.dpc-pros h4{color:#3f9d6b}.dpc-cons h4{color:#c08a3e}\n.dpc-col ul{list-style:none;display:flex;flex-direction:column;gap:7px}\n.dpc-col li{font-size:12.5px;color:var(--on-surface);line-height:1.4;display:flex;gap:8px;align-items:flex-start}\n.dpc-col li .mk{flex:0 0 auto;font-weight:700;margin-top:0}\n.dpc-pros li .mk{color:#3f9d6b}.dpc-cons li .mk{color:#c08a3e}\n.dpc-empty{font-size:12px;color:var(--on-surface-soft);font-style:italic}\n.dbuy{width:100%;padding:15px;border-radius:13px;border:1.5px solid var(--gold);cursor:pointer;\n  background:transparent;color:var(--gold-deep);\n  font-weight:700;font-size:15px;font-family:var(--sans);transition:transform .2s,box-shadow .25s,background .25s,color .3s,border-color .25s}\n.dbuy:hover{transform:translateY(-2px);background:var(--gold);border-color:var(--gold);color:#fff;box-shadow:0 6px 16px rgba(0,0,0,.28)}\n\n/* \"View details\" button on the card (compact, secondary, sits in the action row) */\n.view-d{padding:13px 16px;border-radius:12px;cursor:pointer;white-space:nowrap;\n  border:1px solid var(--hairline);background:rgba(120,130,150,.1);color:var(--on-surface,#1a2538);\n  font-weight:600;font-size:13px;font-family:var(--sans);transition:background-color .2s,border-color .2s}\n.view-d:hover{background:rgba(200,149,89,.16);border-color:var(--gold);color:var(--gold-deep)}\n\n@media (max-width:720px){\n  .dgal-stage{height:280px}\n  .dpc{grid-template-columns:1fr}\n  .dhead .dt{font-size:21px}\n  .dhead .dp{font-size:21px}\n}\n\n/* ============================================================\n   CHECKOUT\n   ============================================================ */\n.checkout{width:100%;max-width:840px;display:grid;grid-template-columns:1fr 1fr;gap:18px}\n.panel{background:#172a42;border:1px solid var(--glass-line);\n  border-radius:16px;padding:15px 16px;box-shadow:var(--shadow)}\n.panel h3{font-family:var(--serif);font-size:16px;margin-bottom:9px;color:var(--sky-bright)}\n.contract-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed rgba(255,255,255,.1);font-size:12.5px}\n.contract-row span:last-child{color:var(--ink-soft)}\n.contract-total{display:flex;justify-content:space-between;padding-top:9px;font-weight:800;font-size:16px;color:var(--sky-bright)}\n.pay-tabs{display:flex;gap:6px;margin-bottom:10px}\n.change-method{display:inline-flex;align-items:center;gap:5px;background:none;border:none;cursor:pointer;\n  color:var(--sky-bright);font-size:12px;font-weight:600;font-family:var(--sans);margin-bottom:10px;padding:2px 0}\n.change-method:hover{text-decoration:underline}\n.pay-tab{flex:1;padding:7px;border-radius:9px;border:1px solid var(--glass-line);background:rgba(255,255,255,.03);\n  cursor:pointer;font-size:12px;font-weight:600;color:var(--ink-soft);transition:background-color .2s ease,border-color .2s ease,color .2s ease;text-align:center;white-space:nowrap}\n.pay-tab.active{background:linear-gradient(150deg,rgba(169,214,245,.22),rgba(31,94,158,.18));color:var(--sky-bright);border-color:var(--sky)}\n.pay-fields{display:none}.pay-fields.active{display:block}\n.pay-method{margin-bottom:8px}\n.pay-method label{font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--on-surface-soft);display:block;margin-bottom:4px}\n.pay-method input{width:100%;height:38px;border-radius:11px;border:1px solid var(--hairline-soft);\n  background:#fbfcfd;color:var(--on-surface);padding:0 13px;font-family:var(--sans);font-size:14px;outline:none}\n.pay-method input:focus{border-color:var(--gold)}\n.bank-line{font-size:13.5px;padding:6px 0;color:var(--on-surface-soft)}.bank-line b{color:var(--on-surface)}\n\n/* premium payment method chooser (S/A class) */\n.pay-chooser{display:flex;flex-direction:column;gap:12px}\n.chooser-q{font-size:15px;color:var(--ink);font-weight:600;margin-bottom:2px}\n.chooser-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n.chooser-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;\n  padding:16px 12px;border-radius:13px;cursor:pointer;border:1px solid var(--glass-line);\n  background:rgba(255,255,255,.04);color:var(--ink);font-size:13px;font-weight:600;font-family:var(--sans);\n  transition:background-color .2s,border-color .2s,transform .15s}\n.chooser-btn:hover{border-color:var(--sky);transform:translateY(-2px);background:rgba(169,214,245,.1)}\n.chooser-btn .ci{display:inline-flex;color:var(--sky-bright)}\n.chooser-btn .brand-svg{height:18px}\n.chooser-note{font-size:11.5px;color:var(--ink-soft);text-align:center}\n.back-methods{align-self:flex-start;background:none;border:none;color:var(--sky-bright);cursor:pointer;\n  font-size:12.5px;font-family:var(--sans);padding:0 0 10px;font-weight:600}\n.back-methods:hover{text-decoration:underline}\n\n/* finance options (premium tiers) */\n.finance-opts{display:flex;flex-direction:column;gap:8px;margin-bottom:10px}\n.fin-opt{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:11px;cursor:pointer;\n  border:1px solid var(--glass-line);background:rgba(255,255,255,.03);transition:background-color .2s,border-color .2s}\n.fin-opt:hover{border-color:var(--sky)}\n.fin-opt.sel{border-color:var(--sky);background:linear-gradient(150deg,rgba(169,214,245,.16),rgba(31,94,158,.12))}\n.fin-opt input{margin-top:3px;accent-color:var(--sky);width:16px;height:16px;flex:0 0 auto}\n.fin-opt .fin-t{font-size:13.5px;font-weight:600;color:var(--ink)}\n.fin-opt .fin-d{font-size:11px;color:var(--ink-soft);margin-top:1px}\n\n/* ---- Lipa Pole Pole — friendly installment plan for B/C/D buyers ---- */\n.llp-intro{font-size:13px;color:var(--ink);line-height:1.5;margin-bottom:10px}\n.llp-intro b{color:var(--sky-bright)}\n.llp-plans{display:flex;gap:8px;margin-bottom:10px}\n.llp-plan{flex:1;text-align:center;padding:11px 8px;border-radius:11px;cursor:pointer;\n  border:1px solid var(--glass-line);background:rgba(255,255,255,.03);\n  transition:background-color .2s,border-color .2s,transform .15s}\n.llp-plan:hover{border-color:var(--sky);transform:translateY(-2px)}\n.llp-plan.sel{border-color:var(--sky);background:linear-gradient(150deg,rgba(169,214,245,.18),rgba(31,94,158,.13));\n  box-shadow:0 0 0 1px var(--sky)}\n.llp-plan .lp-k{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--ink-soft);font-weight:700}\n.llp-plan .lp-amt{font-family:var(--serif);font-weight:700;font-size:18px;color:var(--sky-bright);margin-top:5px;line-height:1}\n.llp-plan .lp-per{font-size:10px;color:var(--ink-soft);margin-top:3px}\n.llp-plan.sel .lp-amt{color:var(--sky-bright)}\n.llp-break{border:1px solid var(--glass-line);border-radius:11px;padding:10px 12px;background:rgba(95,180,120,.06);margin-bottom:9px}\n.llp-break .lb-row{display:flex;justify-content:space-between;font-size:12.5px;padding:3px 0;color:var(--ink-soft)}\n.llp-break .lb-row b{color:var(--ink);font-weight:600}\n.llp-break .lb-row.lb-now{border-top:1px dashed rgba(255,255,255,.12);margin-top:4px;padding-top:7px}\n.llp-break .lb-row.lb-now b{color:var(--sky-bright);font-size:14px}\n.llp-reassure{font-size:11px;color:var(--ink-soft);line-height:1.45;margin-bottom:4px}\n\n/* ---- payment brand logos ---- */\n.brand-svg{height:22px;width:auto;display:block;transform:translateZ(0);backface-visibility:hidden}\n.pay-tab{display:flex;align-items:center;justify-content:center;gap:6px}\n.pay-tab .brand-svg{height:15px}\n\n/* bank chooser */\n.bank-pick{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}\n.bank-opt{display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:11px;cursor:pointer;\n  border:1px solid var(--glass-line);background:rgba(255,255,255,.03);transition:.2s}\n.bank-opt:hover{border-color:var(--sky)}\n.bank-opt.sel{border-color:var(--sky);background:linear-gradient(150deg,rgba(169,214,245,.18),rgba(31,94,158,.14));\n  box-shadow:0 0 0 1px var(--sky)}\n.bank-opt .blogo{width:44px;height:26px;flex:0 0 auto;border-radius:6px;display:grid;place-items:center;background:#fff;overflow:hidden}\n.bank-opt .bname{font-size:13.5px;font-weight:600;color:var(--ink)}\n.bank-opt .bmeta{font-size:10.5px;color:var(--ink-soft)}\n.tab-ico{display:inline-flex;align-items:center;color:var(--ink-soft);margin-right:2px}\n.pay-tab.active .tab-ico{color:var(--sky-bright)}\n\n/* compact bank chip row */\n.bank-chips{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}\n.bank-chip{flex:1 1 0;min-width:64px;height:34px;border-radius:9px;cursor:pointer;display:grid;place-items:center;\n  background:#fff;border:2px solid transparent;transition:.18s;overflow:hidden;padding:4px 6px}\n.bank-chip:hover{transform:translateY(-2px)}\n.bank-chip.sel{border-color:var(--sky);box-shadow:0 0 0 2px var(--sky),0 0 16px -3px rgba(111,180,232,.6)}\n.bank-chip .brand-svg{max-height:22px;max-width:100%}\n\n/* secure bank details box */\n.secure-box{border:1px solid var(--glass-line);border-radius:11px;padding:9px 11px;background:rgba(255,255,255,.03);margin-bottom:9px}\n.secure-box .srow{display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:12.5px;color:var(--ink-soft)}\n.secure-box .srow b{color:var(--ink);font-weight:600}\n.copy-btn{font-size:10.5px;padding:3px 9px;border-radius:7px;border:1px solid var(--glass-line);\n  background:rgba(255,255,255,.05);color:var(--sky-bright);cursor:pointer;transition:.2s}\n.copy-btn:hover{border-color:var(--sky)}\n.secure-note{display:flex;gap:8px;align-items:flex-start;font-size:11.5px;color:var(--ink-soft);\n  background:rgba(95,180,120,.08);border:1px solid rgba(120,200,150,.25);border-radius:10px;padding:9px 11px;margin-bottom:10px}\n.secure-note .lock{flex:0 0 auto;color:#7fd6a0;font-size:14px;margin-top:1px}\n.ssl-row{display:flex;align-items:center;gap:8px;justify-content:center;margin-top:8px;font-size:10px;color:var(--ink-soft);letter-spacing:.4px}\n.ssl-row .lock{color:#7fd6a0}\n\n/* card brand strip */\n.card-brands{display:flex;gap:6px;align-items:center;margin:3px 0 8px;flex-wrap:wrap}\n.brand-label{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink-soft);margin-top:2px;margin-bottom:1px}\n.card-brands .cb{height:24px;width:38px;border-radius:6px;background:#fff;display:grid;place-items:center;overflow:hidden;opacity:.55;transition:.2s;border:1px solid rgba(0,0,0,.06)}\n.card-brands .cb.on{opacity:1;box-shadow:0 0 0 2px var(--sky-bright)}\n\n/* checkbox confirm */\n.confirm-row{display:flex;align-items:flex-start;gap:9px;font-size:11.5px;color:var(--ink-soft);margin:4px 0 9px;cursor:pointer;line-height:1.35}\n.confirm-row input{width:17px;height:17px;flex:0 0 auto;margin-top:1px;accent-color:var(--sky)}\n.place:disabled{opacity:.45;cursor:not-allowed;filter:grayscale(.3)}\n.co-actions{display:flex;gap:10px;margin-top:8px}\n.place{flex:1;padding:11px;border-radius:12px;border:none;cursor:pointer;\n  background:linear-gradient(150deg,var(--sky-bright),var(--blue-deep));color:#0a1c12;font-weight:800;font-size:14px;font-family:var(--sans)}\n.cancel{padding:11px 18px;border-radius:12px;border:1px solid rgba(255,140,140,.4);cursor:pointer;\n  background:rgba(255,90,90,.08);color:#ff9b9b;font-weight:700;font-size:14px}\n\n#wipe{position:fixed;inset:0;background:#0f1c2e;z-index:85;opacity:0;pointer-events:none;transition:opacity 1s ease}\n#wipe.on{opacity:1;pointer-events:auto}\n\n/* ---- per-class payment theming (accent pulled from each tier's house colour) ---- */\n.pay-themed .pay-kicker{font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;\n  color:var(--pay-accent);margin-bottom:5px;opacity:.9}\n.pay-themed .pay-badge{display:inline-block;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;  padding:5px 11px;border-radius:999px;margin-bottom:10px;\n  background:linear-gradient(135deg,var(--pay-accent),var(--pay-accent2));color:var(--pay-ink);\n  box-shadow:0 4px 14px -6px var(--pay-accent)}\n.pay-themed .pay-promise{margin-top:12px;font-size:11px;letter-spacing:.3px;color:var(--ink-soft);\n  padding-top:10px;border-top:1px dashed rgba(255,255,255,.12)}\n.pay-themed .pay-welcome{margin:0 0 16px;padding:13px 15px;border-radius:12px;font-size:13px;line-height:1.5;\n  color:var(--on-surface);background:color-mix(in srgb,var(--pay-accent) 8%,#fff 92%);\n  border:1px solid color-mix(in srgb,var(--pay-accent) 35%,transparent)}\n.pay-themed .pay-tab.active{background:linear-gradient(150deg,color-mix(in srgb,var(--pay-accent) 26%,transparent),color-mix(in srgb,var(--pay-accent) 12%,transparent));\n  color:var(--pay-accent);border-color:var(--pay-accent)}\n.pay-themed .pay-tab.active .tab-ico{color:var(--pay-accent)}\n.pay-themed .chooser-btn:hover{border-color:var(--pay-accent);background:color-mix(in srgb,var(--pay-accent) 10%,transparent)}\n.pay-themed .chooser-btn .ci{color:var(--pay-accent)}\n.pay-themed .place{background:linear-gradient(150deg,var(--pay-accent),var(--pay-accent2));color:var(--pay-ink)}\n.pay-themed .llp-plan.sel{border-color:var(--pay-accent);box-shadow:0 0 0 1px var(--pay-accent);\n  background:color-mix(in srgb,var(--pay-accent) 14%,transparent)}\n.pay-themed .llp-plan .lp-amt{color:var(--pay-accent)}\n.pay-themed .bank-chip.sel{border-color:var(--pay-accent);box-shadow:0 0 0 1px var(--pay-accent)}\n.pay-themed .fin-opt.sel{border-color:var(--pay-accent);background:color-mix(in srgb,var(--pay-accent) 10%,transparent)}\n.pay-themed .copy-btn{color:var(--pay-accent)}\n\n/* footer */\nfooter#foot{position:fixed;left:0;right:0;bottom:0;z-index:40;height:44px;display:flex;align-items:center;\n  justify-content:center;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--ink-soft);\n  background:linear-gradient(180deg,rgba(15,28,46,.6),rgba(11,22,38,.98));\n  border-top:1px solid rgba(255,255,255,.06);pointer-events:none}\nfooter#foot b{color:var(--sky);font-weight:700;margin-left:6px;letter-spacing:1px;text-transform:none;font-family:var(--serif)}\n\n/* ---------- responsive ---------- */\n/* narrow / multitask windows: class panel becomes a horizontal bar, content recenters */\n@media (max-width:1080px){\n  .page{padding:104px 24px 140px}\n  .page.results-page{padding-bottom:140px}\n  .results-page #carousel{margin-bottom:10px}\n  /* shorter card so the whole listing sits above the bottom class bar */\n  .track{height:430px}\n  .villa-stage{height:170px}\n  .card-photo{height:170px}\n  #classWrap{bottom:52px;left:auto;right:10px;transform:translateY(8px)}\n  .back-btn{bottom:52px;left:10px}\n  #classWrap.show{transform:none}\n  #classToggle{height:38px;padding:0 13px;gap:5px}\n  #classToggle .ct-lab{font-size:8.5px;letter-spacing:1.4px}\n  #classToggle .ct-cur{font-size:15px}\n  #classes{left:auto;right:0;transform:translateY(10px) scale(.97);transform-origin:bottom right}\n  #classWrap.open #classes{transform:none}\n  .caro-nav{margin-bottom:18px}\n}\n/* phones */\n@media (max-width:720px){\n  .page{padding:100px 16px 150px}\n  .page.results-page{padding-bottom:200px}\n  .checkout{grid-template-columns:1fr}\n  .opt-grid.two{grid-template-columns:1fr}\n  .opt-grid.city{grid-template-columns:1fr 1fr}\n  .logo{top:14px;left:16px}\n  .logo .mark{width:36px;height:36px}\n  .logo .name .big{font-size:16px}\n  .logo .name .sub{font-size:7.5px;letter-spacing:1.4px}\n  #searchWrap{top:16px;right:14px}\n  .search-pill{height:38px;padding:0 5px 0 12px;gap:6px}\n  .search-ico{width:15px;height:15px}\n  #searchBar{width:96px;font-size:12.5px}\n  .s-btn{height:30px;padding:0 12px;font-size:12px}\n  #carousel{max-width:100%}\n  .zero{gap:12px}\n  .zero .ava{width:40px;height:40px}\n  .bubble{font-size:14px;padding:13px 15px;line-height:1.55}\n  .intro-welcome{font-size:clamp(26px,8vw,44px)}\n  .intro-tag{font-size:clamp(15px,4.6vw,24px)}\n  .lcard-actions{flex-direction:column}\n  .lcard-actions .view-d{width:100%}\n  .controls{gap:16px}\n}\n/* very small / split-screen */\n@media (max-width:480px){\n  #searchBar{width:78px}\n  .logo .name .sub{font-size:7px;letter-spacing:1.2px}\n}\n@media (max-width:420px){\n  #searchWrap{display:none!important}\n  .logo .name .sub{display:none}\n  #classWrap{bottom:48px;left:auto;right:12px}\n  .back-btn{bottom:48px;left:12px;padding:0 14px;font-size:12px}\n}\n/* short viewports (laptops in split-screen, landscape phones): compress the\n   listing card so the whole thing — Zero + card + buy button — sits cleanly\n   above the floating class bar with nothing overlapping at rest */\n@media (max-height:820px) and (max-width:1080px){\n  .track{height:332px}\n  .villa-stage{height:128px}\n  .card-photo{height:128px}\n  .stage3d{height:140px}\n  .zero .ava{width:38px;height:38px}\n  .bubble{font-size:13.5px;padding:11px 14px;line-height:1.5}\n  .controls{gap:10px}\n  .caro-nav{margin-bottom:6px}\n  .page{padding-bottom:120px}\n  .page.results-page{padding-bottom:130px}\n  #classWrap{bottom:16px}\n  .back-btn{bottom:16px}\n}\n@media (max-height:620px){\n  /* very short (landscape phones / split screen): keep the pill out of the way */\n  #classWrap{bottom:10px}\n  .back-btn{bottom:10px}\n  .page{padding-bottom:96px}\n  .page.results-page{padding-bottom:108px}\n}\n\n/* respect users who prefer less motion — calm, instant reveals, no looping */\n@media (prefers-reduced-motion:reduce){\n  *,*::before,*::after{\n    animation-duration:.01ms!important;\n    animation-iteration-count:1!important;\n    transition-duration:.01ms!important;\n    scroll-behavior:auto!important}\n  .drop{-webkit-text-fill-color:var(--gold);background:none}\n  .welcome-ava .sparkle,.coming-soon .cs-dot{animation:none}\n}\n\n/* ============================================================\n   PREMIUM BACKGROUND FX  —  twinkling starfield, light-beam\n   sweep, film-grain texture, cursor spotlight + CTA sheen.\n   All layers live inside #scene (behind the app) and are\n   purely decorative (aria-hidden). GPU-light: transforms &\n   opacity only, no blur filters on animated layers.\n   ============================================================ */\n\n/* — twinkling gold starfield (dots injected by app.js) — */\n.stars{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}\n.star{position:absolute;border-radius:50%;background:#fff;\n  box-shadow:0 0 6px 1px rgba(247,221,165,.55);opacity:0;\n  will-change:opacity,transform;\n  animation:twinkle var(--tw,6s) ease-in-out var(--td,0s) infinite}\n@keyframes twinkle{\n  0%,100%{opacity:0;transform:scale(.55)}\n  50%{opacity:var(--peak,.9);transform:scale(1)}}\n\n/* — slow diagonal sheen drifting across the scene — */\n.beam{position:absolute;inset:-30% -25%;z-index:0;pointer-events:none;\n  background:linear-gradient(108deg,\n    transparent 40%,rgba(236,192,121,.07) 47%,\n    rgba(247,221,165,.16) 50%,rgba(236,192,121,.07) 53%,transparent 60%);\n  mix-blend-mode:screen;opacity:0;transform:translateX(-45%);\n  will-change:transform,opacity;animation:beamSweep 18s ease-in-out infinite}\n@keyframes beamSweep{\n  0%{transform:translateX(-45%);opacity:0}\n  18%{opacity:1}\n  82%{opacity:1}\n  100%{transform:translateX(45%);opacity:0}}\n\n/* — fine film-grain texture for a tactile, premium surface — */\n.scene-grain{position:absolute;inset:0;z-index:2;pointer-events:none;opacity:.045;\n  mix-blend-mode:overlay;\n  background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\");\n  background-size:160px 160px;will-change:transform;\n  animation:grainShift 1.1s steps(4) infinite}\n@keyframes grainShift{\n  0%{transform:translate(0,0)}25%{transform:translate(-4%,2%)}\n  50%{transform:translate(3%,-3%)}75%{transform:translate(-2%,3%)}\n  100%{transform:translate(0,0)}}\n\n/* — soft cursor spotlight (desktop pointer only) — */\n#spotlight{position:fixed;inset:0;z-index:3;pointer-events:none;opacity:0;\n  transition:opacity .8s var(--ease);\n  background:radial-gradient(280px 280px at var(--mx,50%) var(--my,38%),\n    rgba(236,192,121,.12),rgba(214,170,110,.05) 42%,transparent 70%)}\n#spotlight.lit{opacity:1}\n\n/* — CTA sheen: a gentle light sweep across primary buttons on hover — */\n.next,.s-btn,.back-btn,.welcome-cta{position:relative;overflow:hidden;isolation:isolate}\n.next::after,.s-btn::after,.back-btn::after,.welcome-cta::after{content:\"\";position:absolute;inset:0;z-index:-1;\n  pointer-events:none;border-radius:inherit;\n  background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);\n  transform:translateX(-120%);transition:transform .6s var(--ease)}\n.next:hover:not(:disabled)::after,.s-btn:hover::after,.back-btn:hover::after,.welcome-cta:hover::after{transform:translateX(120%)}\n\n/* keep the new decorative layers calm for reduced-motion users */\n@media (prefers-reduced-motion:reduce){\n  .star,.beam,.scene-grain{animation:none}\n  .beam,.scene-grain{opacity:0}\n  .star{opacity:var(--peak,.7)}\n  #spotlight{display:none}\n  .next::after,.s-btn::after,.back-btn::after{display:none}\n}\n/* a coarse pointer (touch) has no hover cursor — hide the spotlight there */\n@media (hover:none){#spotlight{display:none}}\n\n/* ============================================================\n   UI POLISH PASS  —  crisper type, keyboard accessibility,\n   lit panel edges, calmer mobile taps. Additive refinements\n   that build on the existing gold / navy / ivory system.\n   ============================================================ */\n\n/* crisper text rendering across the app */\nbody{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;\n  text-rendering:optimizeLegibility}\n/* native controls (checkboxes/radios/range) pick up the brand gold by default */\n:root{accent-color:var(--gold-deep)}\n/* no grey flash when tapping controls on mobile */\na,button,input,select,textarea,.cls,.qopt,.qlabel,label{-webkit-tap-highlight-color:transparent}\n\n/* — keyboard focus rings —\n   Many controls set outline:none, which leaves keyboard users with no\n   visible focus. :focus-visible restores a clean gold ring for keyboard /\n   assistive navigation ONLY — mouse clicks never trigger it, so the polished\n   pointer experience is unchanged. */\na:focus-visible,button:focus-visible,\n.cls:focus-visible,.qopt:focus-visible,.qlabel:focus-visible,\n.cls.focus-visible,#classToggle:focus-visible,.next:focus-visible,\n.welcome-cta:focus-visible,.s-btn:focus-visible,.back-btn:focus-visible,\n.auth-link:focus-visible,.view-d:focus-visible,.buy:focus-visible{\n  outline:2px solid var(--gold);\n  outline-offset:3px;\n}\n/* inputs already show a gold glow on focus — strengthen it for keyboard users */\ninput:focus-visible,textarea:focus-visible,select:focus-visible{\n  outline:2px solid var(--gold);outline-offset:1px}\n\n/* — lit panel edges —\n   A hairline highlight along the top of the white surfaces catches the light\n   like a real card edge, adding depth against the navy backdrop. */\n.bubble,.auth-card,.name-card,.coming-soon{\n  box-shadow:var(--shadow),inset 0 1px 0 rgba(255,255,255,.65)}\n\n/* — chat bubble refinement — a touch more breathing room + smoother corner */\n.bubble{border-radius:6px 18px 18px 18px}\n\n/* — warmer depth on the listing card when hovered (no positional shift; the\n   card is full-bleed absolute, so only the shadow deepens) — */\n.lcard{transition:opacity .5s var(--ease),box-shadow .35s var(--ease)}\n.lcard.show:hover{box-shadow:0 30px 64px -26px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.65)}\n\n/* ============================================================\n   SIGNATURE MOTION  —  kinetic typography + couture accents.\n   Display text reveals word-by-word (app.js wraps each word in\n   .kw > .kw-i); words rise out of a soft blur in sequence, so\n   every screen shares one elegant, futuristic cadence.\n   ============================================================ */\n.kw{display:inline-block}\n.kw-i{display:inline-block;will-change:transform,opacity,filter;\n  opacity:0;transform:translateY(.5em) scale(.985);filter:blur(6px);\n  animation:kwRise .62s var(--ease) both}\n@keyframes kwRise{\n  0%{opacity:0;transform:translateY(.5em) scale(.985);filter:blur(6px)}\n  55%{opacity:1;filter:blur(0)}\n  100%{opacity:1;transform:none;filter:blur(0)}}\n\n/* couture accent — a slow champagne sheen drifts across key words */\n.welcome h1 .accent{\n  background:linear-gradient(100deg,#b9863f 0%,#cf9b50 30%,#fff3d4 50%,#cf9b50 70%,#b9863f 100%);\n  background-size:240% 100%;background-position:120% 0;\n  -webkit-background-clip:text;background-clip:text;\n  -webkit-text-fill-color:transparent;color:transparent;\n  animation:accentSheen 5.5s ease-in-out 1.6s infinite}\n@keyframes accentSheen{0%,100%{background-position:120% 0}50%{background-position:-30% 0}}\n\n/* the CTA arrow breathes gently to invite the click, then locks forward on hover */\n.welcome-cta .cta-arrow{animation:arrowIdle 2.6s ease-in-out 2.2s infinite}\n.welcome-cta:hover .cta-arrow{animation:none;transform:translateX(5px)}\n@keyframes arrowIdle{0%,100%{transform:translateX(0)}50%{transform:translateX(5px)}}\n\n@media (prefers-reduced-motion:reduce){\n  .kw-i{opacity:1!important;transform:none!important;filter:none!important;animation:none!important}\n  .welcome h1 .accent{-webkit-text-fill-color:var(--gold);color:var(--gold);background:none;animation:none}\n  .welcome-cta .cta-arrow{animation:none}\n}";
  var el = document.createElement('style');
  el.setAttribute('data-nkm','styles');
  el.textContent = css;
  (document.head || document.documentElement).appendChild(el);
})();

/* ============================ DATA ============================ */
const TIERS={
  S:{name:"S Class · Luxury",min:55000000,max:80000000},
  A:{name:"A Class · Premium",min:30000000,max:50000000},
  B:{name:"B Class · Family",min:12000000,max:28000000},
  C:{name:"C Class · Affordable",min:3500000,max:10000000},
  D:{name:"D Class · Starter",min:800000,max:3400000,rentMin:8000,rentMax:60000},
};
const TIER_ORDER=["S","A","B","C","D"];
/* Are we in the rental flow? D class is the only rental tier, and it has a
   monthly range (rentMin/rentMax) for renters and a purchase range (min/max)
   for buyers — so price units depend on the user's INTENT, not a fixed flag. */
function isRenting(){return state.intent==='rent';}
/* the active [min,max] for a tier given the current intent */
function tierRange(k){
  const t=TIERS[k];
  if(k==='D'&&isRenting())return [t.rentMin,t.rentMax];
  return [t.min,t.max];
}
/* ---- LIVE DATA SWITCH ----
   No fabricated houses are shown while this is false. Real listings (with real
   photos, prices and availability) come from the backend / worker panel once it
   is built and connected — N.zero will be wired to that same data. Until then the
   listings page shows an honest "coming soon" state. */
const LIVE_DATA=false;
const CITIES=["Nairobi","Mombasa","Kisumu","Nakuru","Diani","Eldoret","Thika","Machakos"];
/* Cities currently open to consultation (Nairobi only for now). */
const OPEN_CITIES=["Nairobi"];
const GMIN=25000,GMAX=80000000;

let state={};
function freshState(){state={name:null,tier:null,budget:null,city:null,type:null,beds:null,intent:null,prefs:{}};}

/* ============================ ELEMENTS ============================ */
const deck=document.getElementById('deck');
const searchWrap=document.getElementById('searchWrap');
const classesBox=document.getElementById('classWrap');
(function(){
  const tog=document.getElementById('classToggle');
  if(tog)tog.onclick=(e)=>{e.stopPropagation();classesBox.classList.toggle('open');};
  document.addEventListener('click',e=>{
    if(classesBox.classList.contains('open') && !classesBox.contains(e.target))classesBox.classList.remove('open');
  });
})();
const wipe=document.getElementById('wipe');
const progress=document.getElementById('progress');

/* ============================ HELPERS ============================ */
const ksh=n=>(n==null||isNaN(n))?"KSh —":"KSh "+Number(n).toLocaleString('en-KE');
const fmtBudget=()=>isRenting()?ksh(state.budget)+" /mo":ksh(state.budget);
function tierFromValue(v){for(const k of TIER_ORDER){const [lo,hi]=tierRange(k);if(v>=lo&&v<=hi)return k;}
  let best="S",bd=Infinity;for(const k of TIER_ORDER){const [lo,hi]=tierRange(k);const d=Math.min(Math.abs(v-lo),Math.abs(v-hi));if(d<bd){bd=d;best=k;}}return best;}
const midpoint=k=>{const [lo,hi]=tierRange(k);return Math.round((lo+hi)/2);};

/* page transition engine */
let stepIndex=0,totalSteps=5;
function showPage(buildFn){
  const old=deck.querySelector('.page.active');
  const np=document.createElement('div');np.className='page';
  buildFn(np);
  deck.appendChild(np);
  if(old){old.classList.remove('active');old.classList.add('leaving');
    setTimeout(()=>old.remove(),160);}
  requestAnimationFrame(()=>{np.classList.add('active');kineticize(np);});
}

/* ============================ SIGNATURE MOTION ============================
   Kinetic typography — display text reveals word-by-word with a soft de-blur
   and rise, giving every screen the same quietly futuristic, couture cadence.
   Plain text reveals per word; inline-styled bits (.accent, <b>, links) reveal
   as a single unit so gradient-clip / emphasis stays intact. Interactive and
   decorative nodes are left untouched. Honoured only when motion is welcome. */
function prefersReducedMotion(){
  return window.matchMedia('(prefers-reduced-motion:reduce)').matches;
}
const KW_SEL='.bubble, .welcome-eyebrow, .welcome h1, .welcome p, .auth-h, .auth-p, .cs-t, .cs-d, .llp-intro';
function revealWords(root,opts){
  if(!root||root.dataset.kw==='1')return;
  root.dataset.kw='1';
  const base=(opts&&opts.delay)||0, step=(opts&&opts.step)||30;
  let i=0;
  const SKIP=el=>el.matches&&el.matches('.who,button,input,textarea,select,svg,img,.nkm-img,.sparkle,.cta-arrow,br');
  const WHOLE=el=>el.matches&&el.matches('.accent,b,strong,i,em,code,a,.tag');
  const wrapUnit=node=>{
    const w=document.createElement('span');w.className='kw';
    const inner=document.createElement('span');inner.className='kw-i';
    inner.style.animationDelay=(base+i*step)+'ms';i++;
    w.appendChild(inner);return {w,inner};
  };
  const walk=node=>{
    [...node.childNodes].forEach(n=>{
      if(n.nodeType===3){                       // text → split into words
        const parts=n.nodeValue.split(/(\s+)/);
        const frag=document.createDocumentFragment();
        parts.forEach(part=>{
          if(part===''){return;}
          if(/^\s+$/.test(part)){frag.appendChild(document.createTextNode(part));return;}
          const {w,inner}=wrapUnit();inner.textContent=part;frag.appendChild(w);
        });
        node.replaceChild(frag,n);
      } else if(n.nodeType===1){
        if(SKIP(n))return;                       // leave control/decorative nodes alone
        if(WHOLE(n)){                            // wrap inline-styled element as one unit
          const {w,inner}=wrapUnit();
          n.parentNode.replaceChild(w,n);inner.appendChild(n);
        } else { walk(n); }                      // recurse into plain containers
      }
    });
  };
  // neutralise any container-level entrance so the word cadence leads
  root.style.animation='none';root.style.opacity='1';root.style.transform='none';root.style.filter='none';
  walk(root);
}
function kineticize(page){
  if(prefersReducedMotion())return;
  const targets=page.querySelectorAll(KW_SEL);
  targets.forEach((el,idx)=>revealWords(el,{delay:60+idx*120,step:30}));
}

/* ---------- back navigation ----------
   We track the sequence of step-pages the user has moved through. Each step
   page calls navTo(fn) instead of being called directly, which records history
   so a Back button can return to the previous step. */
let NAV_HISTORY=[];
function navTo(fn){
  // push the page we're leaving (if any) so Back can return to it
  if(NAV_CURRENT && NAV_CURRENT!==fn) NAV_HISTORY.push(NAV_CURRENT);
  NAV_CURRENT=fn;
  fn();
}
let NAV_CURRENT=null;
function navReset(){NAV_HISTORY=[];NAV_CURRENT=null;}
function navBack(){
  const prev=NAV_HISTORY.pop();
  if(!prev)return;
  NAV_CURRENT=prev;
  prev();
}
/* renders a small "← Back" button into a page's controls; only shows if there's
   somewhere to go back to */
function backBtnHTML(){
  return NAV_HISTORY.length? `<button class="back-btn" id="backBtn" type="button">← Back</button>` : '';
}
function wireBack(p){
  const b=p.querySelector('#backBtn');
  if(b)b.onclick=navBack;
}
function setProgress(i){
  progress.classList.add('show');
  if(!progress.querySelector('.bar'))progress.innerHTML='<div class="bar"></div>';
  const pct=Math.round(((i+1)/totalSteps)*100);
  progress.querySelector('.bar').style.width=pct+'%';
}

/* NKM logo — real brand mark embedded as an image */
const NKM_LOGO_SRC="data:image/png;base64,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";
function nkmBadge(){return `<img class="nkm-img" src="${NKM_LOGO_SRC}" alt="NKM" draggable="false">`;}
(function(){const m=document.getElementById("logoMark"); if(m)m.innerHTML=nkmBadge();})();

function zeroBlock(text){
  return `<div class="zero"><div class="ava">${nkmBadge()}</div><div class="bubble"><div class="who">N.zero</div>${text}</div></div>`;
}

/* ============================ PAYMENT BRAND BADGES
   Original stylised representations (not the trademarked logos). ============================ */
const LOGOS={
  mpesa:`<svg class="brand-svg" viewBox="0 0 132 34" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="mpg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#54c038"/><stop offset="1" stop-color="#3a9e24"/></linearGradient></defs><rect width="132" height="34" rx="7" fill="url(#mpg)"/><circle cx="19" cy="17" r="11" fill="#fff"/><text x="19" y="22.5" font-family="Sora,Arial" font-weight="800" font-size="15" fill="#3a9e24" text-anchor="middle">M</text><text x="40" y="22.5" font-family="Sora,Arial" font-weight="800" font-size="15" fill="#fff" letter-spacing="1.5">PESA</text></svg>`,
  equity:`<svg class="brand-svg" viewBox="0 0 88 26"><rect width="88" height="26" rx="3" fill="#e2231a"/><text x="44" y="18" font-family="Sora,Arial" font-weight="800" font-size="13" fill="#fff" text-anchor="middle">EQUITY</text></svg>`,
  kcb:`<svg class="brand-svg" viewBox="0 0 60 26"><rect width="60" height="26" rx="3" fill="#0a7d3e"/><text x="30" y="18" font-family="Sora,Arial" font-weight="800" font-size="13" fill="#fff" text-anchor="middle">KCB</text></svg>`,
  coop:`<svg class="brand-svg" viewBox="0 0 96 26"><rect width="96" height="26" rx="3" fill="#00529c"/><text x="48" y="18" font-family="Sora,Arial" font-weight="800" font-size="12" fill="#fff" text-anchor="middle">CO-OP</text></svg>`,
  absa:`<svg class="brand-svg" viewBox="0 0 72 26"><rect width="72" height="26" rx="3" fill="#cc0000"/><text x="36" y="18" font-family="Sora,Arial" font-weight="800" font-size="13" fill="#fff" text-anchor="middle">ABSA</text></svg>`,
  visa:`<svg class="brand-svg" viewBox="0 0 64 22"><rect width="64" height="22" rx="3" fill="#1a1f71"/><text x="32" y="16" font-family="Georgia,serif" font-style="italic" font-weight="700" font-size="13" fill="#fff" text-anchor="middle">VISA</text></svg>`,
  mc:`<svg class="brand-svg" viewBox="0 0 52 32"><circle cx="20" cy="16" r="11" fill="#eb001b"/><circle cx="32" cy="16" r="11" fill="#f79e1b" opacity="0.9"/></svg>`,
  amex:`<svg class="brand-svg" viewBox="0 0 64 22"><rect width="64" height="22" rx="3" fill="#2e77bb"/><text x="32" y="15" font-family="Sora,Arial" font-weight="800" font-size="9" fill="#fff" text-anchor="middle">AMEX</text></svg>`,
  unionpay:`<svg class="brand-svg" viewBox="0 0 64 22"><rect width="32" height="22" rx="3" fill="#e21836"/><rect x="16" width="32" height="22" rx="3" fill="#00447c" opacity="0.92"/><rect x="32" width="32" height="22" rx="3" fill="#007b84" opacity="0.85"/></svg>`,
  pesalink:`<svg class="brand-svg" viewBox="0 0 84 22"><rect width="84" height="22" rx="3" fill="#0b6e4f"/><circle cx="13" cy="11" r="5" fill="#7fd6a0"/><text x="50" y="15" font-family="Sora,Arial" font-weight="800" font-size="9" fill="#fff" text-anchor="middle">PesaLink</text></svg>`,
  pesapal:`<svg class="brand-svg" viewBox="0 0 76 22"><rect width="76" height="22" rx="3" fill="#f47b20"/><text x="38" y="15" font-family="Sora,Arial" font-weight="800" font-size="9" fill="#fff" text-anchor="middle">Pesapal</text></svg>`,
  airtel:`<svg class="brand-svg" viewBox="0 0 76 22"><rect width="76" height="22" rx="3" fill="#e40000"/><text x="38" y="15" font-family="Sora,Arial" font-weight="800" font-size="8.5" fill="#fff" text-anchor="middle">Airtel Money</text></svg>`,
  saccolink:`<svg class="brand-svg" viewBox="0 0 84 22"><rect width="84" height="22" rx="3" fill="#1d4e89"/><text x="42" y="15" font-family="Sora,Arial" font-weight="800" font-size="8.5" fill="#fff" text-anchor="middle">Sacco Link</text></svg>`,
  bankIcon:`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9 L12 4 L21 9 Z"/><path d="M4 9 v9 M9 9 v9 M15 9 v9 M20 9 v9"/><path d="M3 18 h18"/><path d="M2 21 h20"/></svg>`,
  cardIcon:`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 9.5 h20"/><path d="M6 15 h4"/></svg>`,
  financeIcon:`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21 h18"/><path d="M5 21 V9 M19 21 V9 M9 21 V9 M15 21 V9"/><path d="M12 3 L21 8 H3 Z"/></svg>`,
  poleIcon:`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12 h3 M10.5 12 h3 M18 12 h3"/><circle cx="7.5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none"/><path d="M5 6 q7 -3 14 0 M5 18 q7 3 14 0" opacity=".55"/></svg>`
};
const BANKS=[
  {id:"equity",name:"Equity Bank Kenya",acct:"—",swift:"—",paybill:"—"},
  {id:"kcb",name:"KCB Bank Kenya",acct:"—",swift:"—",paybill:"—"},
  {id:"coop",name:"Co-operative Bank",acct:"—",swift:"—",paybill:"—"},
  {id:"absa",name:"Absa Bank Kenya",acct:"—",swift:"—",paybill:"—"},
];
function randRef(){return 'NKM-'+Math.random().toString(36).slice(2,7).toUpperCase()+'-'+Math.floor(1000+Math.random()*9000);}

/* ---- Lipa Pole Pole plan maths (B/C/D buyers) ----
   A small, honest installment plan. A 10% booking deposit secures the home now,
   the remaining balance is spread over the chosen term with NO interest — the
   amounts shown are exactly what the buyer pays. Returns rounded per-payment
   figures the UI displays. Real scheduling/collection lives on the backend. */
const LLP_PLANS={
  weekly  :{label:'Weekly',    n:52,  per:'/week',  note:'over 12 months'},
  monthly :{label:'Monthly',   n:12,  per:'/month', note:'over 12 months'},
  m60     :{label:'5 years',   n:60,  per:'/month', note:'over 5 years'},
  m120    :{label:'10 years',  n:120, per:'/month', note:'over 10 years'},
};
function llpFigures(price,planKey){
  const deposit=Math.round(price*0.1);
  const balance=price-deposit;
  const n=LLP_PLANS[planKey].n;
  const per=Math.round(balance/n/100)*100;   // round to nearest 100 KSh, friendly
  return {deposit,balance,n,per,per_label:LLP_PLANS[planKey].per,note:LLP_PLANS[planKey].note};
}
/* compact KSh for the small plan cards (e.g. "KSh 18,500") */

/* ============================ 3D HOUSE ============================ */
/* ---- VILLA ILLUSTRATION (flat SVG) ----
   A clean stylised rendering of NKM's signature stepped modern villa: three
   terraced storeys, flat parapet roofs, a tall glazed stairwell strip with dark
   pillars, glass-rail terraces, a rooftop pergola and warm-lit windows. Each tier
   recolours via MAT[tier]. Tomorrow the backend supplies real per-house photos in
   the detail view; this is the card preview. */
const MAT={
  S:{wall:'#f4f4ee',wallD:'#dcdcd2',pillar:'#42372e',accent:'#b98a4c',trim:'#cdb892'},
  A:{wall:'#efe6d4',wallD:'#d6c9af',pillar:'#5c6470',accent:'#7d8794',trim:'#cabfa8'},
  B:{wall:'#f3ece0',wallD:'#c98f72',pillar:'#8c4a31',accent:'#c66a45',trim:'#e3d6bd'},
  C:{wall:'#d8c98e',wallD:'#b6a967',pillar:'#8c8049',accent:'#bd5733',trim:'#e6dcae'},
  D:{wall:'#ffffff',wallD:'#cdd8e0',pillar:'#2c3e50',accent:'#10b981',trim:'#bcc6cf'},
};
function houseHTML(tier){
  const m=MAT[tier]||MAT.B;
  const gid='g'+(tier||'B');
  return `
  <div class="villa-stage">
  <svg class="villa-svg" viewBox="0 0 420 210" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
    <defs>
      <linearGradient id="glass-${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe6f3"/><stop offset="1" stop-color="#5d86a3"/></linearGradient>
      <linearGradient id="win-${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2cf"/><stop offset="1" stop-color="#f4b85f"/></linearGradient>
    </defs>
    <rect x="40" y="120" width="300" height="78" fill="${m.wall}"/>
    <polygon points="340,120 366,132 366,198 340,198" fill="${m.wallD}"/>
    <rect x="70" y="138" width="34" height="44" fill="url(#win-${gid})" stroke="${m.pillar}" stroke-width="2"/>
    <rect x="250" y="138" width="60" height="50" fill="url(#win-${gid})" stroke="${m.pillar}" stroke-width="2"/>
    <rect x="150" y="150" width="26" height="48" fill="${m.pillar}"/>
    <rect x="40" y="66" width="240" height="56" fill="${m.wall}"/>
    <polygon points="280,66 306,78 306,122 280,122" fill="${m.wallD}"/>
    <rect x="280" y="116" width="86" height="6" fill="${m.trim}"/>
    <rect x="282" y="105" width="84" height="11" fill="url(#glass-${gid})" opacity=".5"/>
    <g stroke="${m.trim}" stroke-width="1.5"><line x1="282" y1="105" x2="282" y2="116"/><line x1="324" y1="105" x2="324" y2="116"/><line x1="366" y1="105" x2="366" y2="116"/></g>
    <rect x="70" y="80" width="40" height="34" fill="url(#win-${gid})" stroke="${m.pillar}" stroke-width="2"/>
    <rect x="210" y="80" width="40" height="34" fill="url(#win-${gid})" stroke="${m.pillar}" stroke-width="2"/>
    <rect x="40" y="22" width="150" height="44" fill="${m.wall}"/>
    <polygon points="190,22 214,33 214,66 190,66" fill="${m.wallD}"/>
    <rect x="214" y="60" width="66" height="6" fill="${m.trim}"/>
    <rect x="216" y="49" width="64" height="11" fill="url(#glass-${gid})" opacity=".5"/>
    <g stroke="${m.trim}" stroke-width="1.5"><line x1="216" y1="49" x2="216" y2="60"/><line x1="248" y1="49" x2="248" y2="60"/><line x1="280" y1="49" x2="280" y2="60"/></g>
    <rect x="64" y="34" width="38" height="26" fill="url(#win-${gid})" stroke="${m.pillar}" stroke-width="2"/>
    <rect x="118" y="22" width="26" height="176" fill="url(#glass-${gid})" stroke="${m.pillar}" stroke-width="2"/>
    <g stroke="#fff" stroke-opacity=".35"><line x1="118" y1="60" x2="144" y2="60"/><line x1="118" y1="100" x2="144" y2="100"/><line x1="118" y1="140" x2="144" y2="140"/></g>
    <rect x="108" y="22" width="10" height="176" fill="${m.pillar}"/>
    <rect x="144" y="22" width="10" height="176" fill="${m.pillar}"/>
    <g stroke="${m.accent}" stroke-width="3" stroke-linecap="round"><line x1="52" y1="18" x2="100" y2="18"/><line x1="58" y1="13" x2="106" y2="13"/><line x1="64" y1="8" x2="112" y2="8"/></g>
    <rect x="50" y="8" width="4" height="14" fill="${m.accent}"/>
    <rect x="108" y="8" width="4" height="14" fill="${m.accent}"/>
    <rect x="40" y="20" width="150" height="3" fill="${m.trim}"/>
    <rect x="40" y="64" width="240" height="3" fill="${m.trim}"/>
    <rect x="40" y="118" width="300" height="3" fill="${m.trim}"/>
  </svg>
  </div>`;}

/* ============================ FLOW ============================ */
function startFlow(){
  freshStateIfNeeded();
  navReset();
  classesBox.classList.remove('show');
  searchWrap.classList.remove('show');
  progress.classList.remove('show');
  stepIndex=0;
  pageWelcome();   // login removed — straight into Zero's consultation
}
function freshStateIfNeeded(){if(!state.tier)freshState();}

/* ---- AUTH (login / sign-up) ----
   This is the front-end UI only. Real authentication — verifying credentials
   against a database, hashing passwords, issuing a secure session — MUST happen
   on the backend. authSubmit() is the single hook the backend replaces with a
   real API call. For now it validates the form shape and proceeds; it never
   stores or checks a real password client-side. Users can also continue as a
   guest. */
async function authSubmit(mode, data){
  // BACKEND: POST to /api/login or /api/signup, verify server-side, set session.
  // Returns {ok:true} on success. For now, accept any well-formed input.
  return {ok:true};
}
function validEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e||'');}

function pageLogin(mode){
  mode=mode||'signin';
  showPage(p=>{
    const isSignup=mode==='signup';
    p.classList.add('auth-page');
    p.innerHTML=`
      <div class="auth-card">
        <div class="auth-brand">
          <div class="auth-mark">${nkmBadge()}</div>
          <div class="auth-titles">
            <div class="auth-name">NicMitah</div>
            <div class="auth-sub">Consultant &amp; Real Estate</div>
          </div>
        </div>
        <h2 class="auth-h">${isSignup?'Create your account':'Welcome back'}</h2>
        <p class="auth-p">${isSignup?'Join NKM to save homes, track viewings and manage your purchase.':'Sign in to continue to your NKM property consultation.'}</p>

        <div class="auth-fields">
          ${isSignup?`
          <div class="auth-field">
            <label>Full name</label>
            <input id="auName" placeholder="e.g. Ethan Rich" autocomplete="name">
          </div>`:''}
          <div class="auth-field">
            <label>Email</label>
            <input id="auEmail" type="email" placeholder="you@email.com" autocomplete="email" inputmode="email">
          </div>
          <div class="auth-field">
            <label>Password</label>
            <input id="auPass" type="password" placeholder="${isSignup?'Create a password':'Your password'}" autocomplete="${isSignup?'new-password':'current-password'}">
          </div>
          ${isSignup?`
          <div class="auth-field">
            <label>Confirm password</label>
            <input id="auPass2" type="password" placeholder="Re-enter password" autocomplete="new-password">
          </div>`:`
          <div class="auth-row-right"><button class="auth-link" id="auForgot">Forgot password?</button></div>`}
          <div class="auth-hint" id="auHint"></div>
        </div>

        <button class="next auth-submit" id="auSubmit">${isSignup?'Create account →':'Sign in →'}</button>

        <div class="auth-switch">
          ${isSignup
            ? `Already have an account? <button class="auth-link" id="auToSignin">Sign in</button>`
            : `New to NKM? <button class="auth-link" id="auToSignup">Create an account</button>`}
        </div>
        <div class="auth-divider"><span>or</span></div>
        <button class="auth-google" id="auGoogle">
          <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span>Continue with Google</span>
        </button>
        <button class="auth-guest" id="auGuest">Continue as guest</button>
        <p class="auth-fineprint">🔒 Your details are kept private. Authentication is processed securely.</p>
      </div>`;

    const hint=p.querySelector('#auHint');
    const proceed=()=>{ pageWelcome(); };

    p.querySelector('#auSubmit').onclick=async ()=>{
      const email=p.querySelector('#auEmail').value.trim();
      const pass=p.querySelector('#auPass').value;
      if(isSignup){
        const nm=p.querySelector('#auName').value.trim();
        const p2=p.querySelector('#auPass2').value;
        if(!nm || nm.split(' ').filter(Boolean).length<2){hint.textContent='Please enter your first and last name.';return;}
        if(!validEmail(email)){hint.textContent='Please enter a valid email address.';return;}
        if(pass.length<6){hint.textContent='Password should be at least 6 characters.';return;}
        if(pass!==p2){hint.textContent='Passwords do not match.';return;}
        // capture name so Zero can greet them and skip re-asking
        state.name=parseName(nm)||'';
        const r=await authSubmit('signup',{name:nm,email,pass});
        if(r.ok)proceed(); else hint.textContent=r.message||'Could not create account. Please try again.';
      }else{
        if(!validEmail(email)){hint.textContent='Please enter a valid email address.';return;}
        if(!pass){hint.textContent='Please enter your password.';return;}
        const r=await authSubmit('signin',{email,pass});
        if(r.ok)proceed(); else hint.textContent=r.message||'Incorrect email or password.';
      }
    };

    const sw=p.querySelector('#auToSignup'); if(sw)sw.onclick=()=>pageLogin('signup');
    const si=p.querySelector('#auToSignin'); if(si)si.onclick=()=>pageLogin('signin');
    const fg=p.querySelector('#auForgot'); if(fg)fg.onclick=()=>{hint.textContent='Password reset will be available once accounts are live.';};
    p.querySelector('#auGuest').onclick=()=>proceed();
    const gg=p.querySelector('#auGoogle'); if(gg)gg.onclick=async ()=>{
      // BACKEND: launch Google OAuth (redirect / popup) and verify server-side.
      const r=await authSubmit('google',{}); if(r.ok)proceed(); else hint.textContent=r.message||'Google sign-in unavailable right now.';
    };

    // Enter key submits
    p.querySelectorAll('input').forEach(inp=>inp.addEventListener('keydown',e=>{if(e.key==='Enter')p.querySelector('#auSubmit').click();}));
    setTimeout(()=>{const f=p.querySelector(isSignup?'#auName':'#auEmail');if(f)f.focus();},120);
  });
}

/* PAGE 0 — welcome */
function pageWelcome(){window.__parallaxOff=false;
  showPage(p=>{
    p.innerHTML=`
      <div class="welcome">
        <div class="welcome-ava" aria-hidden="true">${nkmBadge()}<span class="sparkle"></span></div>
        <div class="welcome-eyebrow">NKM Property Consultation</div>
        <div class="welcome-divider" aria-hidden="true"><span></span><i>◆</i><span></span></div>
        <h1>Hi, I'm <span class="accent">N.zero</span>.</h1>
        <p>Your property consultant. A few details,<br>and I'll match you with homes that fit.</p>
        <button class="welcome-cta" id="begin">Begin consultation <span class="cta-arrow">→</span></button>
      </div>`;
    p.querySelector('#begin').onclick=(e)=>{
      const btn=e.currentTarget;
      if(btn.classList.contains('filling'))return;   // guard against double-click
      btn.classList.add('filling');                  // fill gold + white text
      setTimeout(()=>{
        navReset();   // fresh flow → clear back history
        // if sign-up already captured a full (two-part) name, skip the name step
        if(state.name && state.name.split(' ').filter(Boolean).length>=2){
          searchWrap.classList.add('show');
          navTo(pageIntent);
        } else {
          navTo(pageName);
        }
      },90);
    };
  });
}

/* PAGE 0.5 — name */
/* ---- smart name parsing (frontend heuristic; swapped for real AI on backend) ----
   Handles messy input like "hi zero my name is amani", strips lead-ins,
   rejects empty/placeholder/gibberish, and returns a clean name or null. */
function parseName(raw){
  let s=(raw||'').trim();
  if(!s) return null;
  // strip common conversational lead-ins
  s=s.replace(/^(hi|hey|hello|yo|hola|sup)\b[\s,!.]*/i,'');
  s=s.replace(/\b(nzero|zero|nkm)\b[\s,!.]*/ig,'');
  s=s.replace(/^(my|the)?\s*name('?s| is)?\s*[:\-]?\s*/i,'');
  s=s.replace(/^(i am|i'm|it'?s|this is|call me|they call me)\s+/i,'');
  s=s.replace(/[^\p{L}\p{M}\s'.\-]/gu,' ').replace(/\s+/g,' ').trim();
  if(!s) return null;
  // keep at most the first two words (first + last), title-case them
  const words=s.split(' ').filter(Boolean).slice(0,2);
  let name=words.join(' ').toLowerCase().replace(/\b[\p{L}]/gu,c=>c.toUpperCase());
  // reject obvious non-names
  const lower=name.toLowerCase();
  const junk=['name','test','asdf','qwerty','none','na','null','undefined','xxx','abc','idk','nobody','anonymous'];
  if(name.replace(/[^\p{L}]/gu,'').length<2) return null;     // needs real letters
  if(junk.includes(lower)) return null;
  if(/^(.)\1+$/.test(name.replace(/\s/g,''))) return null;     // repeated single char
  if(!/[aeiou]/i.test(name)&&name.length>3) return null;       // no vowels = likely gibberish
  return name;
}

/* ---- reserved admin identities ----
   These names are protected. The frontend warns + locks the form; the real
   account ban, the 1-week lock (and +1 week on retry), and the Gmail
   notification are enforced on the BACKEND when accounts ship. parseName /
   isReservedName is the single hook the backend will call. */
const RESERVED_NAMES=['ckm','nkm','nicmitah'];
function isReservedName(raw){
  const cleaned=(raw||'').toLowerCase().replace(/[^a-z]/g,'');
  return RESERVED_NAMES.includes(cleaned);
}

/* ---- inappropriate-name guard ----
   Detects offensive/inappropriate entries. The user is warned; a second
   inappropriate attempt triggers a 1-week ban. NOTE: the ban is stored in the
   browser (window.storage) so it persists across sessions, but a determined
   user could still clear storage or switch device — a REAL, enforceable ban
   tied to an account lives on the BACKEND. checkInappropriate() and the ban
   helpers are the single hooks the backend will replace. */
const BLOCKED_WORDS=[
  // profanity
  'fuck','shit','bitch','cunt','dick','pussy','asshole','arsehole','bastard','slut','whore','hoe',
  'penis','vagina','cock','wank','jizz','cum','sex','porn','boob','tit','tits','dildo','nutsack',
  'ballsack','testicle','scrotum','semen','horny','milf','bdsm','anal','blowjob','handjob','rimjob',
  // slurs / hate
  'nigger','nigga','niga','faggot','fagot','fag','retard','retarded','tranny','chink','spic','kike',
  'coon','wetback','beaner','dyke','nazi','hitler','kkk','isis','jihad','terrorist',
  // violence
  'rape','rapist','molest','pedo','pedophile','kill','murder','suicide','genocide',
  // brainrot / meme bait names & euphemisms
  'deeznuts','deeznut','deeznutz','deeznuts','sugma','sugondese','sugondeez','ligma','candice',
  'updog','joemama','yourmom','urmom','ihardlyknowher','ben dover','bendover','seymour','heywood',
  'hugh jass','hughjass','mike hunt','mikehunt','phil mccracken','philmccracken','dixie normous',
  'gyatt','rizzler','skibidi','fortnite','sigma','goon','gooner','edging','coomer','simp',
  'brainrot','brain rot','ohio','fanumtax','baby gronk','livvy','sussy','amogus','sus',
  // toilet / gross-out bait
  'poop','poopoo','peepee','fart','turd','dookie'
];
/* normalize obfuscation: lowercase, map leetspeak, strip non-letters, collapse
   repeated letters, so "D33z N&ts", "deeeeznutz", "f u c k" all reduce to a
   comparable core string. Detection then checks both the spaced and collapsed forms. */
function normalizeName(raw){
  let s=(raw||'').toLowerCase();
  const leet={'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b','9':'g','@':'a','$':'s','!':'i','|':'l','+':'t','(':'c','€':'e','¢':'c','µ':'u','&':'a'};
  s=s.replace(/[01345789@$!|+(€¢µ&]/g,c=>leet[c]||c);
  return s;
}
/* Recognised African names (Kenyan + broader African first names & surnames).
   If a word in the entry matches one of these, it's treated as a legitimate name
   and skipped by the substring blocklist — prevents real names from being flagged.
   The backend's LLM will later handle name understanding far more broadly; this is
   a solid frontend starter set so realistic African names always pass cleanly. */
const AFRICAN_NAMES=new Set([
  // Kenyan / Swahili & common given names
  'amani','asha','aisha','baraka','bahati','dalila','furaha','hadiya','imani','jabari','jamila','johari',
  'kamau','kanini','kioni','maina','wanjiru','wanjiku','njeri','nyokabi','wairimu','wambui','muthoni','nyambura',
  'kamotho','kariuki','kimani','mwangi','githinji','ndungu','wachira','gitau','macharia','kinuthia','githii',
  'otieno','okoth','onyango','achieng','akinyi','adhiambo','atieno','awino','anyango','ochieng','omondi','odhiambo',
  'auma','apiyo','aoko','nyong','opiyo','owino','okello','oluoch','ouma','owuor','agutu',
  'kiprop','kipchoge','kiplagat','cheruiyot','chebet','jeptoo','jelagat','kosgei','rotich','korir','langat','kemboi',
  'mutua','mwende','mueni','kalonzo','musyoka','nzioka','wambua','mutiso','syokau','kavata','ndinda','muthama',
  'wekesa','wafula','simiyu','barasa','nekesa','nasimiyu','wanyonyi','masinde','khisa','nabwire',
  'hassan','ali','omar','said','salim','fatuma','halima','zainab','rehema','mariam','mwajuma','mwanaisha',
  'wanjala','were','ouko','nyongo','makori','nyaboke','kerubo','moraa','bosibori','kemunto','nyamweya','ongeri',
  'faith','grace','mercy','joy','blessing','gift','precious','peace','charity','patience','comfort','prosper',
  // broader African (West/Central/Southern) given names & surnames
  'kwame','kofi','kwesi','yaw','ama','akua','abena','adwoa','afua','esi','nana','mensah','osei','boateng','asante','owusu','adjei','agyeman',
  'chukwu','chinedu','chidi','emeka','obi','ngozi','adaeze','amara','chioma','ifeoma','nneka','uche','ada','okeke','okafor','okonkwo','eze','nwosu','adeyemi','adebayo','adewale','adeola','folake','bola','tunde','segun','wale','yemi','femi','kunle','ade','ayodele','oluwaseun','oluwatobi','temidayo','damilola','ifeoluwa',
  'thabo','sipho','lerato','nomvula','nkosana','bongani','mandla','themba','zanele','lindiwe','nobuhle','mbeki','dlamini','nkosi','ndlovu','khumalo','mokoena','sithole','zuma','mahlangu',
  'kagiso','tshepo','katlego','lebohang','mpho','refilwe','tumelo','keabetswe',
  'amara','zola','ayanda','sanele','simphiwe',
  'abebe','tariku','getachew','alemu','bekele','dawit','kebede','mulu','tigist','hanna','selam','meron','rahel','yonas','dawi',
  'mohammed','ibrahim','abdi','farah','ahmed','yusuf','abdullahi','khadija','amina','sumaya'
]);
function hasRecognizedAfricanName(words){
  return words.some(w=>AFRICAN_NAMES.has(w.replace(/[^a-z]/g,'')));
}
function checkInappropriate(raw){
  const norm=normalizeName(raw);                          // leetspeak mapped, lowercased
  const words=norm.replace(/[^a-z]+/g,' ').trim().split(' ').filter(Boolean);
  // normalize each word: collapse repeated letters (fuuuck -> fuck)
  const normWords=words.map(w=>w.replace(/(.)\1+/g,'$1'));
  // also build a fully-joined form to catch spaced-out attempts ("d e e z n u t s")
  const joined=words.join('');
  const joinedCollapsed=joined.replace(/(.)\1+/g,'$1');

  // words that are ALSO legitimate names/surnames — don't flag these as a standalone
  // word (e.g. "Dick" Van Dyke, "Cocker", "Hancock"). They only matter if clearly
  // part of an obviously offensive joined phrase, which the phrase check handles.
  const ALSO_REAL_NAMES=new Set(['dick','cock','hoe','goon','simp','sigma','dyke','willy','johnson']);

  // multi-word / joined bad phrases (deeznuts, mikehunt) — checked against joined form
  const PHRASE_BLOCK=BLOCKED_WORDS.filter(w=>w.replace(/[^a-z]/g,'').length>=6);

  for(const bw of BLOCKED_WORDS){
    const b=bw.replace(/[^a-z]/g,'');
    if(ALSO_REAL_NAMES.has(b)) continue;   // skip standalone check for name-collision words
    // WHOLE-WORD match only — a name is bad if one of its WORDS *is* the bad word,
    // not if a word merely contains those letters (fixes Kante, Shittu, Dickson…).
    // Direct whole-word match against the original blocked word:
    if(normWords.includes(b) || words.includes(bw)) return true;
    // Stretched-obfuscation match (e.g. "fuuuck", "boooob"): only fires when the
    // USER actually stretched a letter — i.e. their original word contains a run
    // of 3+ identical letters AND collapses down to the blocked word. This avoids
    // flagging innocent names that merely *happen* to collapse to a banned word's
    // collapsed form (e.g. "Bob" vs "boob", "Carlos K" vs "kkk").
    if(/(.)\1\1/.test(norm) && words.some(w=>/(.)\1\1/.test(w) && w.replace(/(.)\1+/g,'$1')===b.replace(/(.)\1+/g,'$1'))) return true;
  }
  // catch spaced-out / glued obfuscation for longer phrases only
  for(const bw of PHRASE_BLOCK){
    const b=bw.replace(/[^a-z]/g,'');
    const bc=b.replace(/(.)\1+/g,'$1');
    if(joined.includes(b) || joinedCollapsed.includes(bc)) return true;
  }
  return false;
}
/* detect users claiming their name is "Zero" (the assistant's name), after
   stripping conversational lead-ins like "my name is zero" / "i'm zero" */
function claimsToBeZero(raw){
  let s=(raw||'').toLowerCase().trim();
  s=s.replace(/^(hi|hey|hello|yo|hola|sup)\b[\s,!.]*/i,'');
  s=s.replace(/^(my|the)?\s*name('?s| is)?\s*[:\-]?\s*/i,'');
  s=s.replace(/^(i am|i'm|it'?s|this is|call me|they call me)\s+/i,'');
  s=s.replace(/[^a-z\s]/g,'').trim();
  // matches "zero", "zero zero", "im zero", etc.
  return /\b(nzero|zero)\b/.test(s) && s.replace(/\s/g,'').replace(/nzero|zero/g,'').length===0;
}

/* ---- famous-name check ----
   If someone enters a well-known celebrity / public-figure / historical name,
   N.zero gently asks for their real name (NO ban, NO strike) — because real
   clients can share these names, we never lock anyone out for this. */
const FAMOUS_NAMES=[
  "elon musk","bill gates","jeff bezos","mark zuckerberg","steve jobs","warren buffett",
  "george washington","abraham lincoln","barack obama","donald trump","joe biden",
  "queen elizabeth","nelson mandela","martin luther king","albert einstein","isaac newton",
  "william ruto","uhuru kenyatta","raila odinga","jomo kenyatta","daniel moi",
  "cristiano ronaldo","lionel messi","michael jordan","lebron james","serena williams",
  "beyonce","taylor swift","drake","rihanna","kanye west","jay z","eminem","michael jackson",
  "tom cruise","brad pitt","leonardo dicaprio","will smith","dwayne johnson","the rock",
  "oprah winfrey","kim kardashian","cristiano","messi","ronaldo","jesus christ",
  "harry potter","james bond","john cena","kylian mbappe","neymar"
];
function isFamousName(raw){
  let s=(raw||'').toLowerCase().replace(/[^a-z\s]/g,'').replace(/\s+/g,' ').trim();
  if(!s)return false;
  return FAMOUS_NAMES.includes(s);
}
const BAN_KEY='nkm_name_ban';
const BAN_STRIKES_KEY='nkm_name_strikes';
const BAN_MS=7*24*60*60*1000; // 1 week
async function getBan(){
  if(!hasStorage())return 0;
  try{const r=await window.storage.get(BAN_KEY);if(r&&r.value){const until=parseInt(r.value,10);if(until>Date.now())return until;}}catch(e){}
  return 0;
}
async function setBan(){
  if(!hasStorage())return;
  try{await window.storage.set(BAN_KEY,String(Date.now()+BAN_MS));}catch(e){}
}
async function bumpStrike(){
  if(!hasStorage())return 1;
  let n=0; try{const r=await window.storage.get(BAN_STRIKES_KEY);if(r&&r.value)n=parseInt(r.value,10)||0;}catch(e){}
  n++; try{await window.storage.set(BAN_STRIKES_KEY,String(n));}catch(e){}
  return n;
}
async function clearStrikes(){ if(!hasStorage())return; try{await window.storage.set(BAN_STRIKES_KEY,'0');}catch(e){} }
async function clearBan(){ if(!hasStorage())return; try{await window.storage.delete(BAN_KEY);await window.storage.set(BAN_STRIKES_KEY,'0');}catch(e){} }
function banDaysLeft(until){return Math.max(1,Math.ceil((until-Date.now())/(24*60*60*1000)));}

/* ---- famous-name handling ----
   A frontend list catches obvious public figures (see isFamousName above) and
   gently asks for the user's real name — no ban. The backend LLM will later
   recognise public figures far more broadly. */
/* NOTE (backend): a richer name-understanding system is planned — the backend
   LLM will recognise African (and global) names far more broadly than the
   AFRICAN_NAMES starter set here, distinguishing real names from bad/fake ones
   intelligently. AFRICAN_NAMES above is the frontend placeholder until then. */

/* ---- Zero's "live intelligence" — DEFERRED TO BACKEND ----
   Requests for current world/Kenya news, market trends, or any real-time
   knowledge cannot be answered by this static file: there is no live data
   source or language model in the browser. The backend will implement
   askZero() as a server call to an LLM (with live news/web access) and return
   Zero's reply. Until then this returns a clear, honest message rather than
   fabricating facts. This is the single hook to replace server-side.
   Note: a static page also cannot "update itself" — any self-updating or
   live-refreshing behaviour is served by the backend, not this file. */
async function askZero(question){
  // BACKEND: POST {question, context} to /api/zero -> {reply}. Use an LLM with
  // live news/web tools. Never invent current facts in the frontend.
  return { reply: "I can help with your property search right now. For live news and up-to-the-minute information, that connects once NKM's online service is fully set up." };
}

/* ---- BACKEND-ONLY capabilities (hooks, not implemented in this static file) ----
   A single self-contained HTML file cannot fetch live news or rewrite itself.
   These require a server + LLM. They are defined here as the exact hooks the
   backend will implement, so the rest of the app can call them unchanged later.

   zeroLiveAnswer(question): backend calls an LLM + live news/web source
     (world + Kenya) and returns a current, sourced answer. Until then it
     honestly says it can't access live information yet.
   checkForUpdate(): backend reports if a newer build/config exists so Zero can
     refresh its data (listings, copy, knowledge). A static file can't update
     itself; this is a no-op stub for now. */
async function zeroLiveAnswer(question){
  // BACKEND: POST {question} -> LLM with live news/web (world & Kenya) -> {answer, sources}
  return {ok:false, answer:"I can't access live news yet — that goes live once I'm connected to the NKM server. For now I can help you find a home.", sources:[]};
}
async function checkForUpdate(){
  // BACKEND: GET /api/version -> {latest, notes}; client refreshes data if newer.
  return {ok:false, updated:false};
}

function pageName(){window.__parallaxOff=false;
  setProgress(0);
  // resolve any ban FIRST, then render the right screen once — this prevents a
  // late-resolving storage call from overwriting the form while the user types
  // (which looked like a freeze / "can't continue").
  Promise.resolve(getBan()).catch(()=>0).then(banUntil=>{
    if(banUntil){
      showPage(p=>{
        const days=banDaysLeft(banUntil);
        p.innerHTML=`
          ${zeroBlock(`Access to this service has been temporarily suspended due to repeated inappropriate entries. Please try again in <b>${days} day${days>1?'s':''}</b>.`)}
          <div class="controls"><div class="ban-lock">🔒 Temporarily suspended</div>
          <button class="ban-reset" id="banReset" type="button">Reset access</button></div>`;
        progress.classList.remove('show');
        classesBox.classList.remove('show');searchWrap.classList.remove('show');
        const br=p.querySelector('#banReset');
        if(br)br.onclick=async()=>{await clearBan();pageName();};
      });
      return;
    }
    renderNameForm();
  });
}
function renderNameForm(){
  showPage(p=>{
    p.innerHTML=`
      ${zeroBlock(`To get started, may I have your full name — first and last?`)}
      <div class="controls">
        <div class="name-card">
          <label class="name-label">Your full name</label>
          <input id="nameInput" placeholder="e.g. Ethan Rich" autocomplete="name" autocapitalize="words" spellcheck="false" value="${state.name||''}">
          <div class="field-hint" id="nameHint"></div>
        </div>
        <button class="next" id="nameNext" disabled>Continue →</button>
      </div>`;
    const inp=p.querySelector('#nameInput');
    const btn=p.querySelector('#nameNext');
    const hint=p.querySelector('#nameHint');
    const bubble=p.querySelector('.bubble');
    setTimeout(()=>inp.focus(),120);
    const sync=()=>{btn.disabled=inp.value.trim().length<1;if(inp.value.trim())hint.textContent='';};
    // auto-capitalise the first letter of each word as the user types (cursor-safe)
    const capitalize=()=>{
      const pos=inp.selectionStart;
      const before=inp.value;
      const after=before.replace(/\b([a-z])/g,(m,c)=>c.toUpperCase());
      if(after!==before){inp.value=after;try{inp.setSelectionRange(pos,pos);}catch(e){}}
    };
    inp.addEventListener('input',()=>{capitalize();sync();});  // capitalise as you type
    sync();
    const go=async ()=>{
      const rawVal=inp.value;
      // protected admin identities → admin access gate (backend will verify password)
      if(isReservedName(rawVal)){pageAdminGate();return;}
      // inappropriate-name guard: warn once, ban on the second offence
      if(checkInappropriate(rawVal)){
        const strikes=await bumpStrike();
        if(strikes>=2){
          await setBan();
          pageName();   // re-render → hits the ban lock above
          return;
        }
        inp.value='';
        bubble.innerHTML=`<div class="who">N.zero</div>I'm sorry, but that name isn't acceptable here. Please enter your real name. <b>Note:</b> continued use of inappropriate names will lead to a <b>permanent ban</b> from this service.`;
        inp.focus();
        return;
      }
      // users may not claim to be "Zero" (that's me). Warn, then ban on repeat.
      if(claimsToBeZero(rawVal)){
        const strikes=await bumpStrike();
        if(strikes>=2){
          await setBan();
          pageName();
          return;
        }
        inp.value='';
        bubble.innerHTML=`<div class="who">N.zero</div>That's my name! 😊 I'll need your <b>real</b> name to help you. <b>Warning:</b> entering "N.zero" again will lead to a <b>permanent ban</b> from this service.`;
        inp.focus();
        return;
      }
      const name=parseName(rawVal);
      // require TWO names (first + last)
      const wordCount=name?name.split(' ').filter(Boolean).length:0;
      if(!name){
        hint.textContent='';
        bubble.innerHTML=`<div class="who">N.zero</div>I didn't quite catch a name there — what should I call you? Please enter your first and last name.`;
        inp.value='';inp.focus();
        return;
      }
      if(wordCount<2){
        hint.textContent='';
        bubble.innerHTML=`<div class="who">N.zero</div>Thank you${name?', '+name.split(' ')[0]:''}. Could you give me your <b>full name</b> — both first and last? It helps us serve you properly.`;
        inp.focus();
        return;
      }
      // famous / public-figure name → gently ask for their real name (no ban, no strike)
      if(isFamousName(rawVal)){
        bubble.innerHTML=`<div class="who">N.zero</div>That's a famous name! 😊 I'll need your <b>own real name</b> so I can help you properly.`;
        inp.value='';inp.focus();
        return;
      }
      // valid name — advance immediately; clear strikes in the background so a
      // slow/absent storage layer can never block or lag the Continue action
      state.name=name;
      clearStrikes();                   // fire-and-forget (no await)
      btn.classList.add('filling');     // fill gold + white text like Begin consultation
      setTimeout(()=>{
        searchWrap.classList.add('show');
        navTo(pageIntent);
      },90);
    };
    inp.addEventListener('keydown',e=>{if(e.key==='Enter')go();});
    btn.onclick=go;
  });
}

/* PAGE 0.7 — rent or buy (asked right after the name) ----
   "Buy" keeps the for-sale tiers (S/A/B/C); "Rent" jumps straight to D-class
   rentals so the budget slider isn't used to hunt a 20k/month home across an
   80M range. state.intent is the single hook the backend/LLM can read later. */
function pageIntent(){
  setProgress(0);
  showPage(p=>{
    p.innerHTML=`
      ${zeroBlock(`Lovely to meet you${hi()}. Before we look at homes — are you hoping to <b>buy</b> a place, or <b>rent</b> one?`)}
      <div class="controls"><div class="opt-grid two">
        <button class="opt" data-intent="buy">I'd like to buy<span class="sm">Own your home — our S, A, B &amp; C residences</span></button>
        <button class="opt" data-intent="rent">I'd like to rent<span class="sm">Whole houses to rent monthly — bungalows &amp; maisonettes</span></button>
      </div>${backBtnHTML()}</div>`;
    wireBack(p);
    p.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
      state.intent=b.dataset.intent;
      if(state.intent==='rent'){
        // rentals live entirely in D class — set it and skip the budget hunt
        state.tier='D';state.budget=midpoint('D');highlightClass('D');
        classesBox.classList.add('show');
        navTo(pageCity);
      }else{
        // buying — start on the for-sale slider as before
        if(!state.budget||state.tier==='D'){state.budget=midpoint('B');state.tier='B';}
        navTo(pageBudget);
      }
    });
  });
}
function hi(){return state.name?`, ${state.name.split(' ')[0]}`:'';}

/* ---- single hard gate: NO route may reach the flow/checkout without a name ----
   Every entry point (class click, search, express acquire, future routes) funnels
   through this. If the name is missing we divert to pageName() and abort. The
   backend's real account/auth layer will sit behind this same single choke point. */
function requireName(){
  if(state.name) return true;
  classesBox.classList.remove('show');
  searchWrap.classList.remove('show');
  pageName();
  return false;
}

/* ---- ADMIN ACCESS GATE ----
   Reserved names route here. The frontend demo accepts any passcode and shows
   demo data; the BACKEND will verify the passcode server-side, and on failure
   apply the reserved-name ban (1 week, +1 week per retry) and email the user.
   Non-admins who merely guessed the name get blocked at the password step. */
let adminAttempts=0;
/* Admin passcode. NOTE: visible in source — gates casual access only; real
   verification happens server-side in the backend. */
const ADMIN_PASS="NandC";
function pageAdminGate(){
  // STAFF ACCESS GATE — reached by entering a reserved staff name, then a passcode.
  // Frontend gate only (visible in source); real auth is handled server-side later.
  setProgress(0);
  showPage(p=>{
    p.innerHTML=`
      ${zeroBlock(`Welcome back. This is the staff area — please enter your access passcode to continue.`)}
      <div class="controls">
        <div class="slider-card" style="padding:16px">
          <div class="pay-method" style="margin:0">
            <label>Staff passcode</label>
            <input id="admPass" type="password" placeholder="Enter passcode" autocomplete="off">
            <div class="field-hint" id="admHint"></div>
          </div>
        </div>
        <button class="next" id="admEnter">Open employee panel →</button>
      </div>`;
    const inp=p.querySelector('#admPass');
    const hint=p.querySelector('#admHint');
    setTimeout(()=>inp.focus(),120);
    const enter=()=>{
      const pass=inp.value.trim();
      if(!pass){hint.textContent='Please enter your passcode.';return;}
      if(pass===ADMIN_PASS){ adminAttempts=0; pageEmployee(); }
      else { adminAttempts++; inp.value=''; hint.textContent='Incorrect passcode. Please try again.'; inp.focus(); }
    };
    inp.addEventListener('keydown',e=>{if(e.key==='Enter')enter();});
    p.querySelector('#admEnter').onclick=enter;
  });
}

/* ===================== EMPLOYEE PANEL =====================
   Staff workspace. Frontend-only for now — data persists in the artifact's
   storage as the stand-in layer until the real backend is connected, at which
   point this same data flows into the consultation (one source of truth).

   Contains:
   - N.zero area briefing for the open market (Nairobi) with a live news link,
     so staff can research how the area might be affected.
   - Full question management: add / edit / remove / reorder questions and
     their options. Saved to storage (survives refresh).
   - A placeholder listings control panel (Storeys, DSQ, Furnished, Move-in,
     Near CBD & Must-haves, property type / house names) — fields the backend
     will later populate with real staff-entered listings.
*/
function newsUrlFor(area){
  return 'https://news.google.com/search?q='+encodeURIComponent((area||'Nairobi')+' real estate property market');
}
function pageEmployee(){
  progress.classList.remove('show');
  classesBox.classList.remove('show');searchWrap.classList.remove('show');
  const area=(OPEN_CITIES&&OPEN_CITIES[0])||'Nairobi';
  // re-hydrate questions before editing so we work from the latest saved set
  loadQuestions().finally(()=>{
  showPage(p=>{
    p.classList.add('emp-page');
    p.innerHTML=`
      ${zeroBlock(`Employee panel${hi()}. Manage the consultation questions and listing fields here. <b>${area}</b> is the only open market right now.`)}
      <div class="emp-wrap">

        <div class="emp-card">
          <div class="emp-h">
            <span class="emp-h-t">N.zero · area briefing</span>
            <span class="emp-badge">${area}</span>
          </div>
          <div class="emp-brief">
            Here's the area you're serving. Property activity in <b>${area}</b> is shaped by
            local demand, new developments, infrastructure works and wider economic news.
            Before advising a client, it helps to know what's happening on the ground.
          </div>
          <a class="emp-news" id="empNews" href="${newsUrlFor(area)}" target="_blank" rel="noopener">
            ${LOGOS.poleIcon||''}<span>Research ${area} in the news →</span>
          </a>
          <div class="emp-note">Opens current world &amp; local news for ${area} in a new tab.</div>
        </div>

        <div class="emp-card">
          <div class="emp-h">
            <span class="emp-h-t">Consultation questions</span>
            <span class="emp-count" id="qCount"></span>
          </div>
          <div class="emp-sub">Add, edit, reorder or remove the questions clients answer. Changes save automatically and feed the consultation.</div>
          <div class="qlist" id="qList"></div>
          <button class="emp-add" id="qAdd">+ Add question</button>
          <div class="emp-save" id="qSave"></div>
        </div>

        <button class="next" id="empExit" style="margin-top:2px">← Exit panel</button>
      </div>`;

    const qList=p.querySelector('#qList');
    const qCount=p.querySelector('#qCount');
    const qSave=p.querySelector('#qSave');
    let saveTimer=null;
    const flagSaving=()=>{qSave.textContent='Saving…';qSave.className='emp-save on';};
    const flagSaved=(ok)=>{qSave.textContent=ok?'All changes saved':'Saved in this session';qSave.className='emp-save done';};
    const persist=()=>{
      flagSaving();
      clearTimeout(saveTimer);
      saveTimer=setTimeout(async()=>{ const ok=await saveQuestions(); flagSaved(ok); },350);
    };
    const renderCount=()=>{qCount.textContent=QUESTIONS.length+(QUESTIONS.length===1?' question':' questions');};

    function renderList(){
      qList.innerHTML=QUESTIONS.map((q,qi)=>`
        <div class="qrow" data-qi="${qi}" draggable="true">
          <div class="qrow-top">
            <span class="qdrag" title="Drag to reorder">⋮⋮</span>
            <input class="qlabel" value="${escAttr(q.q)}" placeholder="Question text">
            <label class="qmulti"><input type="checkbox" class="qmultiCb" ${q.multi?'checked':''}> multi</label>
            <button class="qdel" title="Remove question">✕</button>
          </div>
          <div class="qchips">
            ${q.opts.map((o,oi)=>`
              <span class="qchip">
                <input class="qopt" data-oi="${oi}" value="${escAttr(o)}">
                <button class="qoptdel" data-oi="${oi}" title="Remove option">×</button>
              </span>`).join('')}
            <button class="qoptadd">+ option</button>
          </div>
          <div class="qup-dn">
            <button class="qmv up"  ${qi===0?'disabled':''}>↑ move up</button>
            <button class="qmv dn"  ${qi===QUESTIONS.length-1?'disabled':''}>↓ move down</button>
          </div>
        </div>`).join('');
      bindRows();
      renderCount();
    }

    function bindRows(){
      qList.querySelectorAll('.qrow').forEach(row=>{
        const qi=+row.dataset.qi;
        row.querySelector('.qlabel').oninput=e=>{QUESTIONS[qi].q=e.target.value;persist();};
        row.querySelector('.qmultiCb').onchange=e=>{QUESTIONS[qi].multi=e.target.checked;persist();};
        row.querySelector('.qdel').onclick=()=>{QUESTIONS.splice(qi,1);persist();renderList();};
        row.querySelector('.qoptadd').onclick=()=>{QUESTIONS[qi].opts.push('New option');persist();renderList();};
        row.querySelectorAll('.qopt').forEach(inp=>{
          const oi=+inp.dataset.oi;
          inp.oninput=e=>{QUESTIONS[qi].opts[oi]=e.target.value;persist();};
        });
        row.querySelectorAll('.qoptdel').forEach(btn=>{
          const oi=+btn.dataset.oi;
          btn.onclick=()=>{QUESTIONS[qi].opts.splice(oi,1);persist();renderList();};
        });
        const up=row.querySelector('.qmv.up'), dn=row.querySelector('.qmv.dn');
        if(up)up.onclick=()=>{if(qi>0){[QUESTIONS[qi-1],QUESTIONS[qi]]=[QUESTIONS[qi],QUESTIONS[qi-1]];persist();renderList();}};
        if(dn)dn.onclick=()=>{if(qi<QUESTIONS.length-1){[QUESTIONS[qi+1],QUESTIONS[qi]]=[QUESTIONS[qi],QUESTIONS[qi+1]];persist();renderList();}};
        // drag reorder
        row.addEventListener('dragstart',e=>{row.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(qi));});
        row.addEventListener('dragend',()=>row.classList.remove('dragging'));
      });
      qList.ondragover=e=>{e.preventDefault();
        const after=[...qList.querySelectorAll('.qrow:not(.dragging)')].find(r=>{
          const b=r.getBoundingClientRect();return e.clientY<b.top+b.height/2;});
        const dragging=qList.querySelector('.qrow.dragging');
        if(!dragging)return;
        if(after)qList.insertBefore(dragging,after);else qList.appendChild(dragging);
      };
      qList.ondrop=e=>{e.preventDefault();
        const order=[...qList.querySelectorAll('.qrow')].map(r=>+r.dataset.qi);
        QUESTIONS=order.map(i=>QUESTIONS[i]);
        persist();renderList();
      };
    }

    renderList();
    p.querySelector('#qAdd').onclick=()=>{
      QUESTIONS.push({k:uniqueKey('question'),q:'New question',multi:false,opts:['Option 1','Option 2']});
      persist();renderList();
    };
    p.querySelector('#empExit').onclick=()=>{freshState();startFlow();};
  });
  });
}

/* PAGE 1 — budget (direct entry, no slider) */
function pageBudget(){
  setProgress(1);
  classesBox.classList.add('show');   // class selector becomes available from the price step on
  showPage(p=>{
    const buying=state.intent!=='rent';
    const floor=buying?TIERS.D.min:GMIN;   // D (Starter) is buyable from 800K — the lowest buy tier
    let start=state.budget??midpoint("B");
    if(buying&&start<floor)start=midpoint("B");
    state.budget=start;state.tier=tierFromValue(start);
    // quick-pick bands per tier (label + representative amount)
    // Buying: cheapest is D (Starter, from 800K), then C, B, A, S.
    const bands=buying
      ? [['Starter','D',TIERS.D.min],['Affordable','C',midpoint('C')],['Mid','B',midpoint('B')],['Premium','A',midpoint('A')],['Luxury','S',midpoint('S')]]
      : [['Budget','D',12000],['Standard','D',25000],['Spacious','D',40000],['Premium','D',55000]];
    p.innerHTML=`
      ${zeroBlock(`Thank you${hi()}. What budget feels comfortable? Type it in, tap a range, or adjust with the buttons — whatever's easiest.`)}
      <div class="controls">
        <div class="budget-card">
          <div class="budget-tierlab" id="bTier">${TIERS[state.tier].name}</div>
          <div class="budget-amount">
            <button class="bstep" id="bMinus" aria-label="decrease">−</button>
            <div class="budget-input-wrap">
              <span class="bcur">KSh</span>
              <input id="bAmount" inputmode="numeric" value="${Number(start).toLocaleString('en-US')}">
              ${buying?'':'<span class="bper">/mo</span>'}
            </div>
            <button class="bstep" id="bPlus" aria-label="increase">+</button>
          </div>
          <div class="budget-bands">
            ${bands.map(([lab,tier,amt])=>`<button class="band" data-amt="${amt}" data-tier="${tier}"><span class="band-l">${lab}</span><span class="band-a">${shortK(amt)}</span></button>`).join('')}
          </div>
          <div class="budget-note">You can change this anytime — nothing is locked in.</div>
        </div>
        <button class="next" id="bNext">Continue →</button>
        ${backBtnHTML()}
      </div>`;
    wireBack(p);
    highlightClass(state.tier);
    const amtEl=p.querySelector('#bAmount');
    const tierEl=p.querySelector('#bTier');
    const step=buying?500000:5000;     // sensible step: 500K buy / 5K rent
    const minV=floor, maxV=buying?GMAX:GMAX;
    const clamp=v=>Math.max(minV,Math.min(maxV,v));
    const parse=()=>{const n=parseInt((amtEl.value||'').replace(/[^0-9]/g,''),10);return isNaN(n)?0:n;};
    const render=(v,reformat)=>{
      state.budget=v;state.tier=tierFromValue(v);
      tierEl.textContent=TIERS[state.tier].name;
      highlightClass(state.tier);
      markBands(v);
      if(reformat)amtEl.value=Number(v).toLocaleString('en-US');
    };
    const markBands=(v)=>{p.querySelectorAll('.band').forEach(btn=>{
      btn.classList.toggle('on', Math.abs(+btn.dataset.amt - v) < step/2);});};
    amtEl.addEventListener('input',()=>{ // live update while typing, don't reformat mid-type
      const v=parse(); state.budget=v; state.tier=tierFromValue(clamp(v));
      tierEl.textContent=TIERS[state.tier].name; highlightClass(state.tier); markBands(v);
    });
    amtEl.addEventListener('blur',()=>{render(clamp(parse()||midpoint('B')),true);});
    p.querySelector('#bMinus').onclick=()=>render(clamp((parse()||start)-step),true);
    p.querySelector('#bPlus').onclick=()=>render(clamp((parse()||start)+step),true);
    p.querySelectorAll('.band').forEach(btn=>btn.onclick=()=>render(clamp(+btn.dataset.amt),true));
    render(clamp(start),true);
    p.querySelector('#bNext').onclick=()=>{render(clamp(parse()||midpoint('B')),true);navTo(pageCity);};
  });
}
// compact KSh label e.g. 15,200,000 -> "15.2M", 40000 -> "40K"
function shortK(n){
  if(n>=1e6){const m=n/1e6;return (m%1===0?m.toFixed(0):m.toFixed(1))+'M';}
  if(n>=1e3)return Math.round(n/1e3)+'K';
  return ''+n;
}

/* PAGE 2 — city */
function pageCity(){
  setProgress(2);
  showPage(p=>{
    p.innerHTML=`
      ${zeroBlock(`<b>${TIERS[state.tier].name}</b> at <b>${fmtBudget()}</b> — a solid range to work with. We're currently serving <b>Nairobi</b>, with more areas opening soon.`)}
      <div class="controls"><div class="opt-grid city">
        ${OPEN_CITIES.map(c=>`<button class="opt" data-city="${c}">${c}</button>`).join('')}
      </div>${backBtnHTML()}</div>`;
    wireBack(p);
    p.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{state.city=b.dataset.city;navTo(pagePreferences);});
  });
}

/* (Property-type step removed — the real house types will be defined by staff
   in the listing panel later, so we no longer show a hardcoded type list.
   state.type is left unset; downstream labels fall back to the class name.) */

/* (Bedroom step removed — bedrooms are covered within the preferences questions.
   state.beds is left unset here; downstream demo fallbacks handle a null value.) */

/* ===================== DYNAMIC QUESTION STORE =====================
   The consultation questionnaire is staff-editable from the Employee panel.
   Questions + their options live in persistent storage so edits survive a
   refresh. This is the stand-in data layer until the real backend is wired —
   the same source of truth will later be served by the backend so the
   consultation and the staff panel always agree.

   Shape: [{ k, q, multi(bool), opts:[string] }]
   - k     : stable key used to store the client's answer in state.prefs
   - q     : the question label N.zero shows
   - multi : true => user can pick several options
   - opts  : the chip choices
*/
const QSTORE_KEY='nkm_questions_v1';
const DEFAULT_QUESTIONS=[
  {k:'purpose',   q:'Purpose of this home',     multi:false, opts:['To live in','Investment','Rental income','Holiday / second home']},
  {k:'parking',   q:'Parking spaces',           multi:false, opts:['None','1 space','2 spaces','3+ / garage']},
  {k:'bathrooms', q:'Bathrooms',                multi:false, opts:['1','2','3','4+']},
  {k:'balconies', q:'Balconies',                multi:false, opts:['0','1','2','3+']},
  {k:'dsq',       q:'Servant quarters (DSQ)',   multi:false, opts:['Not needed','1 DSQ','2 DSQ']},
  {k:'storeys',   q:'Storeys',                  multi:false, opts:['Single storey','Double storey','Apartment / flat','No preference']},
  {k:'plot',      q:'Plot / land size',         multi:false, opts:['Compact','1/8 acre','1/4 acre','1/2 acre +']},
  {k:'furnished', q:'Furnishing',               multi:false, opts:['Unfurnished','Semi-furnished','Fully furnished']},
  {k:'movein',    q:'Move-in timing',           multi:false, opts:['1–3 months','3–6 months','Just exploring']},
  {k:'amenities', q:'Must-haves',               multi:true,  opts:['Backup power','Borehole / water','Gated security','Near schools','Near CBD']},
];
/* in-memory working copy; hydrated from storage on boot */
let QUESTIONS=DEFAULT_QUESTIONS.map(q=>({...q,opts:q.opts.slice()}));
function cloneQuestions(arr){return arr.map(q=>({k:q.k,q:q.q,multi:!!q.multi,opts:(q.opts||[]).slice()}));}
/* escape a string for safe use inside an HTML attribute value */
function escAttr(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function hasStorage(){return typeof window!=='undefined' && window.storage && typeof window.storage.get==='function';}
async function loadQuestions(){
  if(!hasStorage())return;
  try{
    const r=await window.storage.get(QSTORE_KEY);
    if(r && r.value){
      const parsed=JSON.parse(r.value);
      if(Array.isArray(parsed)&&parsed.length)QUESTIONS=cloneQuestions(parsed);
    }
  }catch(e){/* first run / no key yet — keep defaults */}
}
async function saveQuestions(){
  if(!hasStorage())return false;
  try{ await window.storage.set(QSTORE_KEY, JSON.stringify(QUESTIONS)); return true; }
  catch(e){ return false; }
}
function uniqueKey(base){
  base=(base||'q').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')||'q';
  let k=base,n=2; const taken=new Set(QUESTIONS.map(q=>q.k));
  while(taken.has(k)){k=base+'_'+n;n++;}
  return k;
}
/* hydrate questions as soon as possible (before the user reaches the step) */
loadQuestions();

/* one-time amnesty: clear any existing ban/strikes once for this build, so
   anyone locked out from earlier testing starts fresh. Runs a single time
   (guarded by a flag) — the ban system stays fully active afterwards. */
(async function banAmnesty(){
  if(!hasStorage())return;
  try{
    const r=await window.storage.get('nkm_ban_amnesty_v1');
    if(r&&r.value)return;                 // already applied
  }catch(e){/* key missing → apply below */}
  try{
    await window.storage.delete('nkm_name_ban');
    await window.storage.set('nkm_name_strikes','0');
    await window.storage.set('nkm_ban_amnesty_v1','1');
  }catch(e){}
})();

/* PAGE 4 — detailed preferences (helps match the right home) */
function pagePreferences(){
  setProgress(3);
  classesBox.classList.remove('show');   // class not chosen here — hide to avoid overlap
  state.prefs=state.prefs||{};
  // render immediately from the in-memory question set (already hydrated on boot);
  // no storage round-trip here, so navigation stays instant
  const QS=QUESTIONS;
  showPage(p=>{
    p.classList.add('prefs-page');
    if(!QS.length){
      p.innerHTML=`
        ${zeroBlock(`A few quick details${hi()} so I can match you with the right home.`)}
        <div class="controls">
          <div class="pref-card"><div class="pref-empty">No preference questions are set up yet.</div></div>
          <button class="next" id="prefNext">See matching homes →</button>
          ${backBtnHTML()}
        </div>`;
      wireBack(p);
      p.querySelector('#prefNext').onclick=()=>navTo(pageResults);
      return;
    }
    p.innerHTML=`
      ${zeroBlock(`A few quick details${hi()} so I can match you with the right home — tap what matters to you. These help us shortlist the best fit.`)}
      <div class="controls">
        <div class="pref-card">
          ${QS.map(qq=>`
            <div class="pref-q" data-k="${qq.k}" data-multi="${qq.multi?1:0}">
              <div class="pref-label">${qq.q}${qq.multi?' <span class="pref-multi">(pick any)</span>':''}</div>
              <div class="pref-chips">
                ${qq.opts.map(o=>`<button class="pchip" data-v="${o}">${o}</button>`).join('')}
              </div>
            </div>`).join('')}
        </div>
        <button class="next" id="prefNext">See matching homes →</button>
        ${backBtnHTML()}
      </div>`;
    wireBack(p);
    p.querySelectorAll('.pref-q').forEach(qEl=>{
      const key=qEl.dataset.k, multi=qEl.dataset.multi==='1';
      qEl.querySelectorAll('.pchip').forEach(chip=>chip.onclick=()=>{
        if(multi){
          chip.classList.toggle('on');
          state.prefs[key]=[...qEl.querySelectorAll('.pchip.on')].map(c=>c.dataset.v);
        }else{
          qEl.querySelectorAll('.pchip').forEach(c=>c.classList.remove('on'));
          chip.classList.add('on');
          state.prefs[key]=chip.dataset.v;
        }
      });
    });
    p.querySelector('#prefNext').onclick=()=>navTo(pageResults);   // all optional — never blocks
  });
}

/* PAGE 5 — results carousel */
/* Prices never exceed the user's budget: spread cards from a sensible floor up
   to a ceiling that tops out exactly at their budget (or the tier max). */
function priceForCard(i){
  const [tmin,tmax]=tierRange(state.tier);
  const cap=Math.min(state.budget||tmax, tmax);
  const floor=Math.max(tmin, Math.round(cap*0.55));
  const span=Math.max(0, cap-floor);
  const frac=[0.0,0.22,0.44,0.62,0.8,1.0][i%6];
  const raw=floor+span*frac;
  const step=cap>=1000000?10000:1000;
  return Math.min(Math.round(raw/step)*step, cap);
}

/* ---- PER-LISTING DATA ----
   Real listings are entered by staff in the admin/listing panel (built later
   in Claude Code) and served from the backend. There is NO fabricated data:
   buildHouse() returns an empty shape with no fake prices, sizes, bedrooms,
   photos, pros or cons. Until the backend supplies a listing, the UI shows an
   honest empty state and "loads from server" placeholders. */
function buildHouse(i){
  return {
    type:listingLabel(),
    price:null,            // set by backend / staff listing
    cond:null,
    city:state.city, tier:state.tier,
    sizeSqm:null,
    bedCount:null,
    bathrooms:null,
    balconies:null,
    dsq:null,
    parking:null,
    storeys:null,
    plot:null,
    available:true,        // backend sets real availability
    images:[],             // [{url, caption}] — real exterior photos from backend
    bedrooms:[],           // [{url, caption}] — from backend
    rooms:[],              // [{roomType, url, caption}] — from backend
    pros:[],               // [string] — from backend
    cons:[],               // [string] — from backend
    specs:[]               // [string] — from backend
  };
}
const PH_IMG=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-5-5L7 20"/></svg>`;
/* Neutral listing label — we no longer show specific house names in the UI
   (those come later from the backend per property type). Fall back to the
   user's chosen property type, then the class name, then a generic word. */
function listingLabel(){
  return state.type || (state.tier&&TIERS[state.tier]?TIERS[state.tier].name:'') || 'Property';
}
/* Build ONE unified media list so every thumbnail has a matching slide.
   Order: exterior (real render) → living, kitchen, dining, backyard, bathroom,
   balcony, garden, garage → bedrooms. Backend fills item.images / item.rooms /
   item.bedrooms with real photos; until then each extra room is an honest
   labelled "loads from server" slot (same pattern as bedrooms). */
/* Gallery shows ONLY real photos supplied by the backend per listing.
   When a listing has no photos yet, a single honest "loads from server"
   placeholder is shown — no invented rooms, bedrooms or stock images. */
function galleryItems(item){
  const ext=(item.images&&item.images.length)?item.images:[{caption:'Photo'}];
  const rooms=(item.rooms&&item.rooms.length)?item.rooms:[];
  const beds=(item.bedrooms&&item.bedrooms.length)?item.bedrooms:[];
  return [...ext,...rooms,...beds];
}
function imgSlideHTML(item){
  const items=galleryItems(item);
  return items.map((im,i)=>{
    if(im.url){
      return `<div class="dgal-slide${i===0?' on':''}"><img src="${im.url}" alt=""><div class="dgal-cap">${im.caption||''}</div></div>`;
    }
    return `<div class="dgal-slide${i===0?' on':''}"><div class="dgal-ph">${PH_IMG}<div class="phs">${im.caption||''}</div><div class="pht">Photo loads from server</div></div></div>`;
  }).join('');
}
function thumbsHTML(item){
  const items=galleryItems(item);
  return items.map((im,i)=>`<div class="dthumb${i===0?' on':''}" data-i="${i}">${im.url?`<img src="${im.url}" alt="">`:`${PH_IMG}<span class="tlab">${(im.caption||'').split(' ')[0]}</span>`}</div>`).join('');
}

function pageResults(){window.__parallaxOff=true;
  setProgress(4);
  searchWrap.classList.add('show');
  classesBox.classList.add('show');
  showPage(p=>{
    p.classList.add('results-page');
    const t=TIERS[state.tier];

    // No fabricated homes: show an honest empty state until the backend serves real listings.
    if(!LIVE_DATA){
      p.innerHTML=`
      ${zeroBlock(`Here's where your homes will appear${hi()} — <b>${t.name}</b> in <b>${state.city}</b>, within your budget of <b>${fmtBudget()}</b>.<br><br>We're finalising our verified listings. Real homes — with genuine photos, owner-set prices and live availability — are coming very soon.`)}
      <div class="coming-soon">
        <div class="cs-ic"><span class="cs-dot"></span><span class="cs-dot"></span><span class="cs-dot"></span></div>
        <div class="cs-t">Listings coming soon</div>
        <div class="cs-d">NKM is connecting verified ${isRenting()?'rentals':'homes'} in ${state.city} to this page. Once live, you'll browse real properties here and reserve the one that fits — all within your budget.</div>
        <div class="cs-meta">
          <span class="cs-chip">${t.name}</span>
          <span class="cs-chip">${state.city}</span>
          <span class="cs-chip">Up to ${fmtBudget()}</span>
        </div>
      </div>
      ${backBtnHTML()}`;
      wireBack(p);
      return;
    }

    const cardsData=[0,1,2,3,4,5].map(i=>buildHouse(i));   // show several at once
    const availN=cardsData.filter(c=>c.available).length;
    const unavailN=cardsData.length-availN;
    const availLine = availN
      ? `<b>${availN}</b> available${unavailN?` · <b>${unavailN}</b> unavailable`:''}`
      : `<b>None available</b> right now`;
    // bedroom range across the shown homes — mentioned in the list, never asked
    const bedNums=cardsData.map(c=>c.bedCount).filter(n=>n!=null);
    const bedMin=Math.min(...bedNums), bedMax=Math.max(...bedNums);
    const bedLine=bedNums.length ? (bedMin===bedMax?`${bedMin} bedrooms`:`${bedMin}–${bedMax} bedrooms`) : '';
    p.innerHTML=`
      ${zeroBlock(`Here's what we have${hi()} — <b>${t.name}</b>${bedLine?`, <b>${bedLine}</b>`:''} in <b>${state.city}</b>. ${availLine}. Browse the homes below; tap an available one to see its photos, rooms and the full picture.`)}
      <div class="lgrid">
        ${cardsData.map((c,i)=>{
          if(!c.available){
            return `
          <div class="gcard locked" data-i="${i}">
            <div class="gcard-img">
              ${c.images&&c.images.length
                ? `<img class="gcard-photo locked-img" src="${c.images[0].url}" alt="${c.type}" decoding="async" loading="lazy">`
                : houseHTML(state.tier)}
              <div class="lock-overlay"><span class="lock-ic">🔒</span><span class="lock-tx">Unavailable</span><span class="lock-sub">Exterior view only</span></div>
            </div>
            <div class="ginfo">
              <div class="ptype">${listingLabel()}</div>
              <div class="pcity">◍ ${state.city}, Kenya</div>
              <div class="meta"><span class="tag">${TIERS[state.tier].name.split(' ')[0]} Class</span><span class="tag tag-un">Unavailable</span></div>
            </div>
          </div>`;
          }
          return `
          <div class="gcard" data-i="${i}">
            <div class="gcard-img">
              ${c.images&&c.images.length
                ? `<img class="gcard-photo" src="${c.images[0].url}" alt="${c.type}" decoding="async" loading="lazy">`
                : houseHTML(state.tier)}
              <div class="img-hint">⛶ View photos</div>
              <span class="tag tag-av floaty">Available</span>
              <div class="gcard-price-float"><span class="pre">${isRenting()?'Monthly from':'Guide price'}</span>${isRenting()?ksh(c.price)+" /mo":ksh(c.price)}</div>
            </div>
            <div class="ginfo">
              <div class="ptype">${listingLabel()}</div>
              <div class="pcity">◍ ${state.city}, Kenya</div>
              <div class="gspecs">
                <div class="gspec"><span class="sv">${c.bedCount!=null?c.bedCount:'—'}</span><span class="sl">Beds</span></div>
                <div class="gspec"><span class="sv">${c.bathrooms!=null?c.bathrooms:'—'}</span><span class="sl">Baths</span></div>
                <div class="gspec"><span class="sv">${c.sizeSqm!=null?c.sizeSqm:"—"}</span><span class="sl">m²</span></div>
              </div>
              <div class="meta">
                <span class="tag">${TIERS[state.tier].name.split(' ')[0]} Class</span>
                ${(state.prefs&&state.prefs.amenities&&state.prefs.amenities.length)?`<span class="tag">${state.prefs.amenities[0]}</span>`:''}
              </div>
              <div class="gcard-actions">
                <button class="view-d">⛶ View photos & rooms</button>
                <button class="buy">${isRenting()?'Rent this home →':'Buy this home →'}</button>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
      ${backBtnHTML()}`;
    wireBack(p);
    const cards=[...p.querySelectorAll('.gcard')];
    cards.forEach((card,i)=>{
      if(card.classList.contains('locked'))return;
      const openDetail=()=>pageDetail(cardsData[i]);
      const img=card.querySelector('.gcard-img'); if(img)img.onclick=openDetail;
      const vd=card.querySelector('.view-d'); if(vd)vd.onclick=(e)=>{e.stopPropagation();openDetail();};
      const buy=card.querySelector('.buy'); if(buy)buy.onclick=(e)=>{e.stopPropagation();pageCheckout(cardsData[i]);};
    });
  });
}

/* PAGE 5.5 — full property detail view (gallery + bedrooms + pros/cons) */
function pageDetail(item){window.__parallaxOff=true;
  searchWrap.classList.remove('show');
  showPage(p=>{
    p.classList.add('results-page');
    const t=TIERS[item.tier];
    const pros=(item.pros&&item.pros.length)?item.pros:null;
    const cons=(item.cons&&item.cons.length)?item.cons:null;
    const specs=(item.specs&&item.specs.length)?item.specs:[
      (item.bedCount!=null?item.bedCount+' Bedroom'+(item.bedCount>1?'s':''):null),
      (item.bathrooms!=null?item.bathrooms+' Bathroom'+(item.bathrooms>1?'s':''):null),
      (item.balconies!=null?item.balconies+' Balcon'+(item.balconies===1?'y':'ies'):null),
      (item.dsq?item.dsq+' DSQ':null),
      (item.parking!=null?item.parking+' Parking':null),
      item.storeys,
      (item.sizeSqm?item.sizeSqm+' m²':null),
      (item.plot?item.plot:null),
      isRenting()?'Rental':'For sale',
      item.cond
    ].filter(Boolean);
    p.innerHTML=`
      <div class="detail">
        <button class="detail-back" id="dBack">‹ Back to listings</button>
        <div class="dgal">
          <div class="dgal-stage" id="dStage">${imgSlideHTML(item)}</div>
          <button class="dgal-arrow l" id="dPrev">‹</button>
          <button class="dgal-arrow r" id="dNext">›</button>
          <div class="dthumbs" id="dThumbs">${thumbsHTML(item)}</div>
        </div>
        <div class="dhead">
          <div>
            <div class="dt">${listingLabel()}</div>
            <div class="dc">◍ ${item.city}, Kenya · ${t.name}</div>
          </div>
          <div class="dp"><span class="pre">${isRenting()?'Monthly from':'Guide price'}</span>${isRenting()?ksh(item.price)+" /mo":ksh(item.price)}</div>
        </div>
        <div class="dspecs">${specs.map(s=>`<span class="dspec">${s}</span>`).join('')}</div>
        <div class="dpc">
          <div class="dpc-col dpc-pros">
            <h4>✓ Highlights</h4>
            ${pros?`<ul>${pros.map(x=>`<li><span class="mk">✓</span><span>${x}</span></li>`).join('')}</ul>`
                  :`<p class="dpc-empty">The owner's highlights for this home will appear here once added.</p>`}
          </div>
          <div class="dpc-col dpc-cons">
            <h4>! Worth noting</h4>
            ${cons?`<ul>${cons.map(x=>`<li><span class="mk">!</span><span>${x}</span></li>`).join('')}</ul>`
                  :`<p class="dpc-empty">Any honest caveats for this home will be listed here.</p>`}
          </div>
        </div>
        <button class="dbuy" id="dBuy">${isRenting()?'Rent this home →':'Buy this home →'}</button>
      </div>`;
    // gallery: slides + thumbs synced
    const slides=[...p.querySelectorAll('.dgal-slide')];
    const thumbs=[...p.querySelectorAll('.dthumb')];
    // thumbs may exceed slides (bedrooms) — cap nav to available slides
    let g=0;const ng=slides.length;
    const show=k=>{g=(k+ng)%ng;slides.forEach((s,i)=>s.classList.toggle('on',i===g));
      thumbs.forEach((tb,i)=>tb.classList.toggle('on',i===g));
      // keep the active thumbnail visible as you navigate
      if(thumbs[g])thumbs[g].scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});};
    p.querySelector('#dPrev').onclick=()=>show(g-1);
    p.querySelector('#dNext').onclick=()=>show(g+1);
    thumbs.forEach((tb,i)=>tb.onclick=()=>{if(i<ng)show(i);});
    p.querySelector('#dBack').onclick=()=>pageResults();
    p.querySelector('#dBuy').onclick=()=>pageCheckout(item);
  });
}

/* PAGE 6 — checkout */
/* ============================================================
   PER-CLASS PAYMENT PROFILES
   Each tier gets its own payment identity, accent (pulled from the
   house-material palette MAT[tier]), method set and Zero copy — so the
   checkout you reach matches the home you just viewed.
     S — Private Concierge   (off-white/charcoal)
     A — Relationship Managed (sandstone/slate)
     B — Secure Your Family Home (terracotta)
     C — First Home, Made Simple (ochre/olive)
     D — Move In Fast (white/emerald)
   `methods` lists the tabs in order. `chooser:true` hides details behind a
   method picker (premium). Real processing/escrow is a backend concern. */
const PAY_PROFILES={
  S:{id:'S',badge:'Private Concierge',tier_kicker:'NKM Private Collection',accent:'#b98a4c',accent2:'#8a6a34',ink:'#2a2118',
     chooser:true, methods:['mpesa','bank','card','finance'],
     intro:n=>`A pleasure${n}. Your acquisition of this residence is handled privately — choose how you'd like to proceed and a dedicated consultant will see it through discreetly.`,
     promise:'Priority access · dedicated consultant · discreet handling',
     depositLabel:'Reservation deposit (10%)'},
  A:{id:'A',badge:'Relationship Managed',tier_kicker:'NKM Private Collection',accent:'#a8884f',accent2:'#7c6334',ink:'#241d12',
     chooser:true, methods:['mpesa','bank','card','finance'],
     intro:n=>`Excellent${n}. A relationship manager will personally reserve this home for you. Select your preferred arrangement below.`,
     promise:'Named relationship manager · premium handling · flexible terms',
     depositLabel:'Reservation deposit (10%)'},
  B:{id:'B',badge:'Secure Your Family Home',accent:'#c66a45',accent2:'#8c4a31',ink:'#fff',
     chooser:false, methods:['lipalp','mpesa','bank','card','finance'],
     intro:n=>`Wonderful${n} — let's get your family home secured. Many families spread the cost comfortably with <b>Lipa Polepole</b>, or pay directly. Whatever suits you.`,
     promise:'Family-friendly · structured installments · no hidden fees',
     depositLabel:'Booking deposit (10%)'},
  C:{id:'C',badge:'First Home, Made Simple',accent:'#bd5733',accent2:'#8c4a2a',ink:'#fff',
     chooser:false, methods:['mpesa','lipalp','bank','card','finance'],
     intro:n=>`You're in good hands${n}. Buying your first home is simpler than it looks — start with a small deposit today and we'll guide you through every step.`,
     promise:'Beginner-friendly · small deposit to start · guided all the way',
     depositLabel:'Booking deposit (10%)'},
  D:{id:'D',badge:'Your New Beginning',tier_kicker:'NKM Welcome Home',accent:'#10b981',accent2:'#0c8f66',ink:'#fff',
     chooser:false, methods:['mpesa','bank','card','finance'],
     welcomeNote:'🏡 Welcome to the NKM family. A home is a home — whether it’s your first or your fifth, you’ll be treated with the same care as every other client. We’re glad you’re here.',
     intro:n=>`This is a big moment${n} — your new home is waiting. 🌱 There's no deposit too small here; everyone deserves a place to call their own. Pay easily by M-Pesa and we'll have your keys ready in no time.`,
     promise:'A warm welcome · move in with ease · we’ve got you',
     depositLabel:'Move-in deposit (1 month)'},
};

function pageCheckout(item){window.__parallaxOff=true;
  searchWrap.classList.remove('show');
  classesBox.classList.remove('show');   // hide the class bar while paying — no distraction
  showPage(p=>{
    const t=TIERS[state.tier];const deposit=Math.round(item.price*0.1);
    const prof=PAY_PROFILES[state.tier]||PAY_PROFILES.B;
    // D class serves both renters and budget buyers. The D profile copy is written
    // for renters, so when a BUYER lands in D, swap to purchase-appropriate wording.
    const depositLabel=(state.tier==='D'&&!isRenting())?'Booking deposit (10%)':prof.depositLabel;
    const introText=(state.tier==='D'&&!isRenting())
      ? `This is a big moment${hi()} — your first home is within reach. 🌱 Start with a small booking deposit today and we'll guide you, step by step, all the way to your keys.`
      : prof.intro(hi());
    const useChooser=prof.chooser;
    // method renderers — only those in prof.methods are shown, in that order
    const methodTab=pm=>{
      const ic={mpesa:LOGOS.mpesa, bank:`<span class="tab-ico">${LOGOS.bankIcon}</span>Bank`,
        card:`<span class="tab-ico">${LOGOS.cardIcon}</span>Card`,
        finance:`<span class="tab-ico">${LOGOS.financeIcon}</span>Finance`,
        lipalp:`<span class="tab-ico">${LOGOS.poleIcon}</span>Polepole`}[pm];
      return `<div class="pay-tab" data-pm="${pm}">${ic}</div>`;
    };
    const fieldMpesa=`
          <div class="pay-fields" data-pf="mpesa">
            <div class="pay-method"><label>M-Pesa Number</label><input id="mpesaNo" placeholder="07XX XXX XXX" inputmode="numeric"></div>
            <p class="bank-line">An STK push for <b>${ksh(deposit)}</b> will be sent to your phone. Enter your PIN on the prompt to authorise.</p>
            <div class="ssl-row"><span class="lock">🔒</span> Secured by Safaricom Daraja · 256-bit encrypted</div>
          </div>`;
    const fieldBank=`
          <div class="pay-fields" data-pf="bank">
            <div class="bank-chips">
              ${BANKS.map((b,i)=>`<div class="bank-chip${i===0?' sel':''}" data-bank="${b.id}" title="${b.name}">${LOGOS[b.id]}</div>`).join('')}
            </div>
            <div class="secure-box" id="bankBox">
              <div class="srow"><span>Pay to</span><b id="bName">${BANKS[0].name}</b></div>
              <div class="srow"><span>Account</span><b id="bAcct">${BANKS[0].acct}</b><button class="copy-btn" data-copy="bAcct">Copy</button></div>
              <div class="srow"><span>Amount</span><b>${ksh(deposit)}</b></div>
              <div class="srow"><span>Ref</span><b id="bRef">${randRef()}</b><button class="copy-btn" data-copy="bRef">Copy</button></div>
            </div>
            <div class="ssl-row"><span class="lock">🔒</span> Regulated escrow · released on handover · never share your PIN/OTP</div>
          </div>`;
    const fieldCard=`
          <div class="pay-fields" data-pf="card">
            <div class="brand-label">International</div>
            <div class="card-brands">
              <div class="cb on">${LOGOS.visa}</div><div class="cb on">${LOGOS.mc}</div>
              <div class="cb on">${LOGOS.amex}</div><div class="cb on">${LOGOS.unionpay}</div>
            </div>
            <div class="brand-label">Kenyan &amp; local</div>
            <div class="card-brands">
              <div class="cb on" style="width:62px">${LOGOS.pesalink}</div><div class="cb on" style="width:58px">${LOGOS.saccolink}</div>
              <div class="cb on" style="width:56px">${LOGOS.pesapal}</div><div class="cb on" style="width:60px">${LOGOS.airtel}</div>
            </div>
            <div class="pay-method"><label>Cardholder Name</label><input placeholder="As shown on card"></div>
            <div class="pay-method"><label>Card Number</label><input placeholder="Card number" inputmode="numeric"></div>
            <div class="pay-method"><label>Expiry / CVC</label><input placeholder="MM/YY · 123" inputmode="numeric"></div>
            <div class="ssl-row"><span class="lock">🔒</span> 3-D Secure · Visa / Mastercard / PesaLink verified · PCI-DSS compliant</div>
          </div>`;
    const fieldFinance=`
          <div class="pay-fields" data-pf="finance">
            <p class="bank-line" style="margin-bottom:8px">For premium properties, flexible financing is available. Choose an option that suits you:</p>
            <div class="finance-opts">
              <label class="fin-opt sel"><input type="radio" name="fin" checked><div><div class="fin-t">Mortgage pre-approval</div><div class="fin-d">Partner banks · from 30% deposit · up to 25 years</div></div></label>
              <label class="fin-opt"><input type="radio" name="fin"><div><div class="fin-t">Installment plan</div><div class="fin-d">Pay over 12–36 months, interest-free first 6 months</div></div></label>
              <label class="fin-opt"><input type="radio" name="fin"><div><div class="fin-t">International wire transfer</div><div class="fin-d">SWIFT · for diaspora &amp; corporate buyers</div></div></label>
            </div>
            <div class="ssl-row"><span class="lock">🔒</span> A dedicated consultant will contact you to complete the arrangement</div>
          </div>`;
    const fieldLipa=(()=>{
      const planKeys = isRenting() ? ['weekly','monthly'] : ['m60','m120'];
      const f = llpFigures(item.price, planKeys[0]);
      const lead = state.tier==='C'
        ? `<b>Take it step by step.</b> Start with the booking deposit today, then small, steady payments — we'll guide you the whole way. <b>No interest.</b>`
        : `<b>Lipa polepole</b> — pay slowly, at your own pace. Secure this home today, then spread the rest in small amounts. <b>No interest, no hidden fees.</b>`;
      return `
          <div class="pay-fields" data-pf="lipalp">
            <p class="llp-intro">${lead}</p>
            <div class="llp-plans" id="llpPlans">
              ${planKeys.map((pk,i)=>{const ff=llpFigures(item.price,pk);return `<div class="llp-plan${i===0?' sel':''}" data-plan="${pk}"><div class="lp-k">${LLP_PLANS[pk].label}</div><div class="lp-amt">${ksh(ff.per)}</div><div class="lp-per">${ff.per_label}</div></div>`;}).join('')}
            </div>
            <div class="llp-break">
              <div class="lb-row"><span>Booking deposit (10%)</span><b id="llpDep">${ksh(f.deposit)}</b></div>
              <div class="lb-row"><span>Balance</span><b id="llpBal">${ksh(f.balance)}</b></div>
              <div class="lb-row"><span>Plan</span><b id="llpTerm">${f.n} payments ${f.note}</b></div>
              <div class="lb-row lb-now"><span>Pay now via M-Pesa</span><b>${ksh(f.deposit)}</b></div>
            </div>
            <div class="pay-method"><label>M-Pesa Number</label><input placeholder="07XX XXX XXX" inputmode="numeric"></div>
            <p class="llp-reassure">You'll get an STK push for the deposit now. Each installment is collected automatically on M-Pesa — pay ahead or clear early any time, free of charge.</p>
            <div class="ssl-row"><span class="lock">🔒</span> Flexible · interest-free · cancel-friendly · secured by M-Pesa</div>
          </div>`;})();
    const FIELDS={mpesa:fieldMpesa,bank:fieldBank,card:fieldCard,finance:fieldFinance,lipalp:fieldLipa};
    const chooserLabels={mpesa:['Mobile money',LOGOS.mpesa],bank:['Bank transfer',`<span class="ci">${LOGOS.bankIcon}</span>`],
      card:['Card payment',`<span class="ci">${LOGOS.cardIcon}</span>`],finance:['Financing',`<span class="ci">${LOGOS.financeIcon}</span>`],
      lipalp:['Lipa Polepole',`<span class="ci">${LOGOS.poleIcon}</span>`]};
    p.innerHTML=`
      ${zeroBlock(introText)}
      <div class="checkout pay-themed" style="--pay-accent:${prof.accent};--pay-accent2:${prof.accent2};--pay-ink:${prof.ink}">
        <div class="panel">
          ${prof.tier_kicker?`<div class="pay-kicker">${prof.tier_kicker}</div>`:''}
          <div class="pay-badge">${prof.badge}</div>
          <h3>Contract Notice</h3>
          <div class="contract-row"><span>Property</span><span>${listingLabel()}</span></div>
          <div class="contract-row"><span>Location</span><span>${state.city}, Kenya</span></div>
          <div class="contract-row"><span>Type</span><span>${TIERS[state.tier].name.split(' ')[0]} Class</span></div>
          <div class="contract-row"><span>Bedrooms</span><span>${item.bedCount!=null?item.bedCount:'—'}</span></div>
          <div class="contract-row"><span>Approx. size</span><span>${item.sizeSqm!=null?item.sizeSqm+" m²":"—"}</span></div>
          <div class="contract-row"><span>Tier</span><span>${t.name}</span></div>
          <div class="contract-row"><span>${isRenting()?"Monthly rent":"Sale price"}</span><span>${ksh(item.price)}</span></div>
          <div class="contract-row"><span>${depositLabel}</span><span>${ksh(deposit)}</span></div>
          <div class="contract-total"><span>Due now</span><span>${ksh(deposit)}</span></div>
          <div class="pay-promise">${prof.promise}</div>
        </div>
        <div class="panel">
          <h3>Payment</h3>
          ${prof.welcomeNote?`<div class="pay-welcome">${prof.welcomeNote}</div>`:''}
          ${useChooser?`
          <div id="payChooser" class="pay-chooser">
            <p class="chooser-q">${state.name?state.name+', how':'How'} would you like to pay?</p>
            <div class="chooser-grid">
              ${prof.methods.map(pm=>`<button class="chooser-btn" data-go="${pm}">${chooserLabels[pm][1]}<span>${chooserLabels[pm][0]}</span></button>`).join('')}
            </div>
            <p class="chooser-note">Select a method to view its details. You can switch at any time.</p>
          </div>`:''}
          <div class="pay-body"${useChooser?' style="display:none"':''}>
          ${useChooser?`<button class="back-methods" id="backMethods">← Payment methods</button>`:''}
          <div class="pay-tabs">
            ${prof.methods.map(methodTab).join('')}
          </div>
          <button class="change-method" id="changeMethod" style="display:none">‹ Change payment method</button>
          ${prof.methods.map(pm=>FIELDS[pm]).join('')}
          <label class="confirm-row"><input type="checkbox" id="confirmChk"><span>I confirm the property details and authorise the secure deposit of <b>${ksh(deposit)}</b>.</span></label>
          <div class="co-actions">
            <button class="place" id="placeBtn" disabled>${isRenting()?'RESERVE &amp; PAY':'PLACE ORDER'}</button>
            <button class="cancel" id="coBack">← Back</button>
          </div>
          </div>
        </div>
      </div>`;
    // activate the first method tab/field
    const firstM=prof.methods[0];
    const tabsRow=p.querySelector('.pay-tabs');
    const selectMethod=pm=>{
      p.querySelectorAll('.pay-tab').forEach(x=>x.classList.toggle('active',x.dataset.pm===pm));
      p.querySelectorAll('.pay-fields').forEach(x=>x.classList.toggle('active',x.dataset.pf===pm));
      // collapse the tab row so ONLY the chosen method shows — keeps focus on it
      if(tabsRow)tabsRow.style.display='none';
      const ch=p.querySelector('#changeMethod'); if(ch)ch.style.display='inline-flex';
    };
    const t0=p.querySelector(`.pay-tab[data-pm="${firstM}"]`); if(t0)t0.classList.add('active');
    const f0=p.querySelector(`.pay-fields[data-pf="${firstM}"]`); if(f0)f0.classList.add('active');
    p.querySelectorAll('.pay-tab').forEach(tab=>tab.onclick=()=>selectMethod(tab.dataset.pm));
    // "change method" link re-opens the tab row
    const changeM=p.querySelector('#changeMethod');
    if(changeM)changeM.onclick=()=>{if(tabsRow)tabsRow.style.display='flex';changeM.style.display='none';};
    // premium: method chooser gates the payment details until a method is picked
    const chooser=p.querySelector('#payChooser');
    const body=p.querySelector('.pay-body');
    if(chooser&&body){
      const openMethod=pm=>{
        chooser.style.display='none';
        body.style.display='block';
        p.querySelectorAll('.pay-tab').forEach(x=>x.classList.toggle('active',x.dataset.pm===pm));
        p.querySelectorAll('.pay-fields').forEach(x=>x.classList.toggle('active',x.dataset.pf===pm));
        if(tabsRow)tabsRow.style.display='none';   // show only the chosen method
        const ch=p.querySelector('#changeMethod'); if(ch)ch.style.display='none'; // chooser handles changing
      };
      p.querySelectorAll('.chooser-btn').forEach(btn=>btn.onclick=()=>openMethod(btn.dataset.go));
      const back=p.querySelector('#backMethods');
      if(back)back.onclick=()=>{body.style.display='none';chooser.style.display='block';};
    }
    // bank selection updates the secure box
    p.querySelectorAll('.bank-chip').forEach(opt=>opt.onclick=()=>{
      p.querySelectorAll('.bank-chip').forEach(x=>x.classList.remove('sel'));
      opt.classList.add('sel');
      const b=BANKS.find(x=>x.id===opt.dataset.bank);
      p.querySelector('#bAcct').textContent=b.acct;
      p.querySelector('#bName').textContent=b.name;
    });
    // finance option highlighting (premium tiers)
    p.querySelectorAll('.fin-opt').forEach(opt=>opt.onclick=()=>{
      p.querySelectorAll('.fin-opt').forEach(x=>x.classList.remove('sel'));
      opt.classList.add('sel');
    });
    // Lipa Pole Pole plan selection (B/C/D) — recompute the breakdown live
    p.querySelectorAll('.llp-plan').forEach(opt=>opt.onclick=()=>{
      p.querySelectorAll('.llp-plan').forEach(x=>x.classList.remove('sel'));
      opt.classList.add('sel');
      const f=llpFigures(item.price,opt.dataset.plan);
      const term=p.querySelector('#llpTerm');
      if(term)term.textContent=`${f.n} payments ${f.note}`;
    });
    // copy buttons
    p.querySelectorAll('.copy-btn').forEach(btn=>btn.onclick=()=>{
      const txt=p.querySelector('#'+btn.dataset.copy).textContent;
      navigator.clipboard&&navigator.clipboard.writeText(txt).catch(()=>{});
      const o=btn.textContent;btn.textContent='Copied ✓';setTimeout(()=>btn.textContent=o,1400);
    });
    // confirm checkbox gates the order
    const chk=p.querySelector('#confirmChk'),placeBtn=p.querySelector('#placeBtn');
    chk.onchange=()=>{placeBtn.disabled=!chk.checked;};
    placeBtn.onclick=()=>{if(!chk.checked)return;pageDone(true,item);};
    const coBack=p.querySelector('#coBack'); if(coBack)coBack.onclick=()=>pageDetail(item);
  });
}

/* PAGE 7 — done */
function pageDone(success,item){
  progress.classList.remove('show');
  showPage(p=>{
    const msg=success
      ? `Thank you for choosing <b>NKM NicMitah Consultant &amp; Real Estate</b>${hi()}. Your transaction has been completed successfully.<br><br>Your <b>${listingLabel()}</b> in <b>${state.city}</b> is now marked <b>Sold</b>. The session will restart shortly.`
      : `Your payment could not be completed. No charges were made to your account. The session will restart shortly.`;
    p.innerHTML=`<div class="welcome">${zeroBlock(msg)}</div>`;
  });
  setTimeout(restartCinema,3000);
}

/* ============================ CLASS SELECTOR ============================ */
function highlightClass(k){document.querySelectorAll('.cls').forEach(b=>b.classList.toggle('active',b.dataset.cls===k));
  const cur=document.getElementById('ctCur');if(cur&&k)cur.textContent=k;}
const CLASS_LINES={
  S:"Certainly — let's review our <b>S Class</b> luxury estates.",
  A:"Of course — adjusting to our <b>A Class</b> premium residences.",
  B:"Understood — showing our <b>B Class</b> executive homes.",
  C:"Very well — let's look at our <b>C Class</b> value properties.",
  D:"Certainly — here are our <b>D Class</b> rental options."};
document.querySelectorAll('.cls').forEach(btn=>btn.onclick=()=>{
  if(!requireName())return;   // hard gate: name is unskippable by any route
  const k=btn.dataset.cls;
  // a class click is an explicit tier override. D serves both buyers (starter
  // homes from 800K) and renters (25–90K/mo), so keep the user's existing intent
  // if they have one; otherwise default to buying.
  if(k!=='D') state.intent='buy';
  else if(!state.intent) state.intent='buy';
  state.tier=k;state.budget=midpoint(k);state.city=null;state.type=null;state.beds=null;
  highlightClass(k);classesBox.classList.add('show');classesBox.classList.remove('open');searchWrap.classList.remove('show');
  // S, A & B each get their own distinctive entry experience
  if(k==='S'||k==='A'||k==='B'){pagePremiumGate(k);return;}
  // re-branch: jump back to budget page with new context
  pageBudgetReset(k);
});

/* distinctive, detailed entry experience per tier */
function pagePremiumGate(k){
  setProgress(1);
  const tier=TIERS[k];
  const GATE={
    S:{cls:'gate-s',crest:'✦',kicker:'By Private Invitation',
       title:'S Class · Private Luxury',
       tagline:'The finest residences in Kenya — held for a discerning few.',
       blurb:`our most exclusive portfolio — a curated collection of the finest residences we represent, shown to a select few.`,
       perks:[
         ['◆','Dedicated private consultant','One point of contact, available around the clock for you alone.'],
         ['◆','Absolute discretion','Confidential, private viewings handled with full discretion.'],
         ['◆','White-glove acquisition','Legal, financing and handover managed end to end on your behalf.'],
         ['◆','Bespoke financing','Private banking introductions and tailored payment structures.'],
       ],
       cta:'Enter private viewing →',
       express:'⚡ Express acquisition — our signature S residence'},
    A:{cls:'gate-a',crest:'◆',kicker:'By Appointment',
       title:'A Class · Premium',
       tagline:'Premium homes with a personal touch, on your schedule.',
       blurb:`a refined selection of premium homes, offered with a personal touch and a consultant by your side.`,
       perks:[
         ['◆','Personal consultant','A named advisor guides every step of your search.'],
         ['◆','Flexible private viewings','Book around your calendar, including evenings and weekends.'],
         ['◆','Premium financing','Mortgage pre-approval and installment options arranged for you.'],
         ['◆','Priority handover','Streamlined paperwork and a smooth, quick move-in.'],
       ],
       cta:'Begin premium viewing →',
       express:'⚡ Fast-track to our featured A residence'},
    B:{cls:'gate-b',crest:'⌂',kicker:'For Every Family',
       title:'B Class · Family Homes',
       tagline:'Comfortable, well-built homes for the whole family.',
       blurb:`comfortable, well-built family homes in great neighbourhoods — quality you can trust, at a price that feels right.`,
       perks:[
         ['✓','Family-friendly neighbourhoods','Close to schools, markets, hospitals and transport.'],
         ['✓','Honest, upfront pricing','No hidden fees — the price you see is the price you pay.'],
         ['✓','Flexible payment plans','Spread the cost with plans built around your income.'],
         ['✓','Ready when listed','Each home is verified for secure water and power before we list it.'],
       ],
       cta:'View family homes →',
       express:'⚡ Show me a popular B home'},
  }[k];
  showPage(p=>{
    p.innerHTML=`
      ${zeroBlock(`${state.name?state.name+', ':''}${k==='B'?`let's find your family a home. This is `:`welcome to `}${GATE.blurb}`)}
      <div class="controls">
        <div class="gate-card ${GATE.cls}">
          <div class="gate-kicker">${GATE.kicker}</div>
          <div class="gate-crest">${GATE.crest}</div>
          <div class="gate-tier">${GATE.title}</div>
          <div class="gate-tagline">${GATE.tagline}</div>
          <div class="gate-range">${fmtRange(tier.min,tier.max)}</div>

          <div class="gate-section">What's included</div>
          <div class="gate-perks">
            ${GATE.perks.map(pk=>`<div class="gperk"><span class="gperk-i">${pk[0]}</span><div><div class="gperk-t">${pk[1]}</div><div class="gperk-d">${pk[2]}</div></div></div>`).join('')}
          </div>

          <button class="gate-btn" id="gateEnter">${GATE.cta}</button>
          <button class="gate-express" id="gateExpress">${GATE.express}</button>
        </div>
      </div>`;
    p.querySelector('#gateEnter').onclick=()=>pageBudgetReset(k);
    p.querySelector('#gateExpress').onclick=()=>expressAcquire(k);
  });
}
/* fast track for premium buyers — sets the class/budget then shows listings.
   No fabricated property is created; real listings come from the backend. */
function expressAcquire(k){
  if(!requireName())return;   // hard gate: even the express fast-track needs a name
  const tier=TIERS[k];
  state.tier=k;
  state.budget=tier.max;
  state.city='Nairobi';
  state.type=null;   // real types defined by staff later
  highlightClass(k);
  classesBox.classList.add('show');
  pageResults();
}
function fmtRange(a,b){return 'KSh '+ksh(a).replace('KSh ','')+' – '+ksh(b).replace('KSh ','');}
function pageBudgetReset(k){
  setProgress(1);
  showPage(p=>{
    window.__parallaxOff=false;
    const buying=state.intent!=='rent';
    const floor=buying?TIERS.D.min:GMIN;
    let start=state.budget??midpoint(k||'B');
    if(buying&&start<floor)start=midpoint(k||'B');
    state.budget=start;state.tier=tierFromValue(start);
    const bands=buying
      ? [['Starter','D',TIERS.D.min],['Affordable','C',midpoint('C')],['Mid','B',midpoint('B')],['Premium','A',midpoint('A')],['Luxury','S',midpoint('S')]]
      : [['Budget','D',12000],['Standard','D',25000],['Spacious','D',40000],['Premium','D',55000]];
    p.innerHTML=`
      ${zeroBlock(CLASS_LINES[k])}
      <div class="controls">
        <div class="budget-card">
          <div class="budget-tierlab" id="bTier">${TIERS[state.tier].name}</div>
          <div class="budget-amount">
            <button class="bstep" id="bMinus" aria-label="decrease">−</button>
            <div class="budget-input-wrap">
              <span class="bcur">KSh</span>
              <input id="bAmount" inputmode="numeric" value="${Number(start).toLocaleString('en-US')}">
              ${buying?'':'<span class="bper">/mo</span>'}
            </div>
            <button class="bstep" id="bPlus" aria-label="increase">+</button>
          </div>
          <div class="budget-bands">
            ${bands.map(([lab,tier,amt])=>`<button class="band" data-amt="${amt}" data-tier="${tier}"><span class="band-l">${lab}</span><span class="band-a">${shortK(amt)}</span></button>`).join('')}
          </div>
          <div class="budget-note">You can change this anytime — nothing is locked in.</div>
        </div>
        <button class="next" id="bNext">Continue →</button>
      </div>`;
    highlightClass(state.tier);
    const amtEl=p.querySelector('#bAmount');
    const tierEl=p.querySelector('#bTier');
    const step=buying?500000:5000;
    const minV=floor, maxV=GMAX;
    const clamp=v=>Math.max(minV,Math.min(maxV,v));
    const parse=()=>{const n=parseInt((amtEl.value||'').replace(/[^0-9]/g,''),10);return isNaN(n)?0:n;};
    const markBands=(v)=>{p.querySelectorAll('.band').forEach(btn=>btn.classList.toggle('on',Math.abs(+btn.dataset.amt-v)<step/2));};
    const render=(v,reformat)=>{state.budget=v;state.tier=tierFromValue(v);tierEl.textContent=TIERS[state.tier].name;highlightClass(state.tier);markBands(v);if(reformat)amtEl.value=Number(v).toLocaleString('en-US');};
    amtEl.addEventListener('input',()=>{const v=parse();state.budget=v;state.tier=tierFromValue(clamp(v));tierEl.textContent=TIERS[state.tier].name;highlightClass(state.tier);markBands(v);});
    amtEl.addEventListener('blur',()=>render(clamp(parse()||midpoint('B')),true));
    p.querySelector('#bMinus').onclick=()=>render(clamp((parse()||start)-step),true);
    p.querySelector('#bPlus').onclick=()=>render(clamp((parse()||start)+step),true);
    p.querySelectorAll('.band').forEach(btn=>btn.onclick=()=>render(clamp(+btn.dataset.amt),true));
    render(clamp(start),true);
    p.querySelector('#bNext').onclick=()=>{render(clamp(parse()||midpoint('B')),true);pageCity();};
  });
}

/* search — type a city OR a budget to jump into the flow */
function runSearch(){
  if(!requireName())return;   // hard gate: require name before any search-driven flow
  const raw=document.getElementById('searchBar').value.trim();
  if(!raw)return;
  const q=raw.toLowerCase();

  // 1) PRICE search: "18m", "45k", "18,000,000", "ksh 30000"
  const priceVal=parsePriceQuery(q);
  if(priceVal!=null){
    navReset();   // search is a fresh entry — clear any stale flow history
    state.tier=tierFromValue(Math.max(Math.min(priceVal,GMAX),GMIN));
    state.budget=priceVal;
    state.city="Nairobi";
    state.type=null;state.beds=null;
    document.getElementById('searchBar').value='';
    document.getElementById('searchBar').blur();
    searchWrap.classList.remove('show');
    classesBox.classList.add('show');
    pageResults();
    return;
  }

  // 2) CITY search (open cities only)
  let city=OPEN_CITIES.find(c=>c.toLowerCase()===q)
        || OPEN_CITIES.find(c=>q.includes(c.toLowerCase()))
        || OPEN_CITIES.find(c=>c.toLowerCase().includes(q.split(/\s+/)[0]));

  if(!city){
    const known=CITIES.find(c=>c.toLowerCase()===q || q.includes(c.toLowerCase()));
    classesBox.classList.add('show');
    showPage(p=>{
      p.innerHTML = known
        ? `${zeroBlock(`We haven't expanded to <b>${known}</b> just yet — NKM is currently serving <b>Nairobi</b>, with more areas opening soon. Search <b>Nairobi</b>, or type a budget like <b>18,000,000</b>.`)}`
        : `${zeroBlock(`I couldn't find a city or budget matching "<b>${raw}</b>". Try searching <b>Nairobi</b>, or type a budget like <b>18,000,000</b>.`)}`;
    });
    return;
  }

  // switch to the searched city, then ask for the budget BEFORE showing houses
  navReset();   // search is a fresh entry — clear stale flow history
  state.city=city;
  state.type=null;state.beds=null;
  if(!state.tier)state.tier="B";
  if(!state.budget)state.budget=midpoint(state.tier);
  document.getElementById('searchBar').value='';
  document.getElementById('searchBar').blur();
  classesBox.classList.add('show');
  searchWrap.classList.remove('show');
  pageBudgetForSearch(city);
}

/* parse a price from search text; returns a number or null */
function parsePriceQuery(q){
  if(q==null)return null;
  let s=String(q).toLowerCase().replace(/ksh|kes|\/mo|per month|month|,|\s/gi,'').trim();
  let mult=1;
  // word & suffix multipliers (case handled by the toLowerCase above)
  if(/(m|mil|million|mill)$/.test(s)){mult=1e6;s=s.replace(/(m|mil|million|mill)$/,'');}
  else if(/(k|thousand)$/.test(s)){mult=1e3;s=s.replace(/(k|thousand)$/,'');}
  else if(/(b|bil|billion)$/.test(s)){mult=1e9;s=s.replace(/(b|bil|billion)$/,'');}
  if(s===''||!/^\d+(\.\d+)?$/.test(s))return null;
  const n=parseFloat(s)*mult;
  if(!isFinite(n)||n<=0)return null;
  return Math.min(Math.max(Math.round(n),GMIN),GMAX);
}

/* budget question triggered by a city search — uses the same direct-entry UI */
function pageBudgetForSearch(city){
  setProgress(1);
  showPage(p=>{
    window.__parallaxOff=false;
    const buying=state.intent!=='rent';
    const floor=buying?TIERS.D.min:GMIN;
    let start=state.budget??midpoint("B");
    if(buying&&start<floor)start=midpoint("B");
    state.budget=start;state.tier=tierFromValue(start);
    const bands=buying
      ? [['Starter','D',TIERS.D.min],['Affordable','C',midpoint('C')],['Mid','B',midpoint('B')],['Premium','A',midpoint('A')],['Luxury','S',midpoint('S')]]
      : [['Budget','D',12000],['Standard','D',25000],['Spacious','D',40000],['Premium','D',55000]];
    p.innerHTML=`
      ${zeroBlock(`Switching to <b>${city}</b>${hi()}. What budget feels comfortable here? Type it in, tap a range, or adjust with the buttons.`)}
      <div class="controls">
        <div class="budget-card">
          <div class="budget-tierlab" id="bTier">${TIERS[state.tier].name}</div>
          <div class="budget-amount">
            <button class="bstep" id="bMinus" aria-label="decrease">−</button>
            <div class="budget-input-wrap">
              <span class="bcur">KSh</span>
              <input id="bAmount" inputmode="numeric" value="${Number(start).toLocaleString('en-US')}">
              ${buying?'':'<span class="bper">/mo</span>'}
            </div>
            <button class="bstep" id="bPlus" aria-label="increase">+</button>
          </div>
          <div class="budget-bands">
            ${bands.map(([lab,tier,amt])=>`<button class="band" data-amt="${amt}" data-tier="${tier}"><span class="band-l">${lab}</span><span class="band-a">${shortK(amt)}</span></button>`).join('')}
          </div>
          <div class="budget-note">You can change this anytime — nothing is locked in.</div>
        </div>
        <button class="next" id="bNext">Show ${city} homes →</button>
      </div>`;
    highlightClass(state.tier);
    const amtEl=p.querySelector('#bAmount');
    const tierEl=p.querySelector('#bTier');
    const step=buying?500000:5000;
    const minV=floor, maxV=GMAX;
    const clamp=v=>Math.max(minV,Math.min(maxV,v));
    const parse=()=>{const n=parseInt((amtEl.value||'').replace(/[^0-9]/g,''),10);return isNaN(n)?0:n;};
    const markBands=(v)=>{p.querySelectorAll('.band').forEach(btn=>btn.classList.toggle('on',Math.abs(+btn.dataset.amt-v)<step/2));};
    const render=(v,reformat)=>{state.budget=v;state.tier=tierFromValue(v);tierEl.textContent=TIERS[state.tier].name;highlightClass(state.tier);markBands(v);if(reformat)amtEl.value=Number(v).toLocaleString('en-US');};
    amtEl.addEventListener('input',()=>{const v=parse();state.budget=v;state.tier=tierFromValue(clamp(v));tierEl.textContent=TIERS[state.tier].name;highlightClass(state.tier);markBands(v);});
    amtEl.addEventListener('blur',()=>render(clamp(parse()||midpoint('B')),true));
    p.querySelector('#bMinus').onclick=()=>render(clamp((parse()||start)-step),true);
    p.querySelector('#bPlus').onclick=()=>render(clamp((parse()||start)+step),true);
    p.querySelectorAll('.band').forEach(btn=>btn.onclick=()=>render(clamp(+btn.dataset.amt),true));
    render(clamp(start),true);
    p.querySelector('#bNext').onclick=()=>{
      render(clamp(parse()||midpoint('B')),true);
      pageResults();
    };
  });
}
document.getElementById('searchBtn').onclick=runSearch;
document.getElementById('searchBar').addEventListener('keydown',e=>{if(e.key==='Enter')runSearch();});

/* ============================ INTRO / RESTART ============================ */
/* split a line into per-letter .drop spans with a clean stagger.
   `nkmHighlight` tints the trailing "NKM" sky-blue. startDelay in ms. */
function animateIntro(){
  const lead=document.querySelector('.intro-welcome .lead');
  const letters=[...document.querySelectorAll('.nkm-drop .drop')];
  const t=document.querySelector('.intro-tag');
  const by=document.querySelector('.intro-by');
  // reset
  [lead,t,by,...letters].forEach(el=>{el.style.animation='none';void el.offsetWidth;});
  // "Welcome to" fades up first
  lead.style.animation='flowUp .6s ease .15s forwards';
  // NKM letters fade + scale in with a gold shimmer, staggered ~150ms apart
  const dropStart=480;
  letters.forEach((s,i)=>{s.style.animation=`letterRise .8s cubic-bezier(.16,.84,.32,1) ${dropStart+i*150}ms forwards`;});
  const dropEnd=dropStart+letters.length*150+800; // letters fully settled
  // tagline + powered-by fade up, one after the other
  t.style.animation=`flowUp .7s ease ${dropEnd+150}ms forwards`;
  by.style.animation=`flowUp .7s ease ${dropEnd+450}ms forwards`;
  return dropEnd+450+700; // total intro duration until last element settled
}
function spawnOrbs(){
  const box=document.getElementById('orbs');
  if(!box||box.childElementCount)return;   // once only
  const N=6;
  let html='';
  for(let i=0;i<N;i++){
    const size=(Math.random()*4+2).toFixed(1);          // 2–6px core (glow makes them larger)
    const left=(Math.random()*100).toFixed(1);
    const top=(Math.random()*100).toFixed(1);
    const dur=(Math.random()*14+12).toFixed(1);         // 12–26s drift
    const delay=(-Math.random()*dur).toFixed(1);        // desync start
    const scale=(Math.random()*2.2+1).toFixed(2);       // halo spread
    html+=`<span class="orb" style="left:${left}%;top:${top}%;width:${size*scale*4}px;height:${size*scale*4}px;`+
          `animation-duration:${dur}s;animation-delay:${delay}s"></span>`;
  }
  box.innerHTML=html;
}
/* twinkling starfield — scatters tiny gold-white points across the scene.
   Each gets its own duration/delay/brightness so the field shimmers
   organically rather than pulsing in unison. Injected once. */
function spawnStars(){
  const box=document.getElementById('stars');
  if(!box||box.childElementCount)return;   // once only
  const N=window.matchMedia('(max-width:560px)').matches?26:46;
  let html='';
  for(let i=0;i<N;i++){
    const size=(Math.random()*1.6+0.6).toFixed(2);   // 0.6–2.2px
    const left=(Math.random()*100).toFixed(2);
    const top=(Math.random()*100).toFixed(2);
    const dur=(Math.random()*5+4).toFixed(2);         // 4–9s twinkle
    const delay=(-Math.random()*dur).toFixed(2);      // desync start
    const peak=(Math.random()*0.5+0.45).toFixed(2);   // 0.45–0.95 brightness
    html+=`<span class="star" style="left:${left}%;top:${top}%;width:${size}px;height:${size}px;`+
          `--tw:${dur}s;--td:${delay}s;--peak:${peak}"></span>`;
  }
  box.innerHTML=html;
}
function bootApp(){
  document.getElementById('intro').classList.add('fade');
  document.getElementById('scene').classList.add('on');
  spawnOrbs();
  spawnStars();
  document.getElementById('app').classList.add('on');
  document.getElementById('headerScrim').classList.add('show');
  freshState();startFlow();
}
function runIntro(){
  const intro=document.getElementById('intro');intro.classList.remove('fade');
  document.getElementById('scene').classList.remove('on');
  document.getElementById('app').classList.remove('on');
  const dur=animateIntro();
  setTimeout(bootApp,dur+250); // brief beat after everything lands, then straight in
}
function restartCinema(){
  wipe.classList.add('on');
  setTimeout(()=>{
    deck.innerHTML='';
    document.querySelectorAll('.cls').forEach(b=>b.classList.remove('active'));
    runIntro();wipe.classList.remove('on');
  },1000);
}

/* (Parallax removed — it targeted the old sky/mountain scene elements which no
   longer exist; the current aurora + orbs background animates on its own.) */

/* ---- cursor spotlight ----
   A soft champagne glow that trails the pointer, giving the navy backdrop a
   sense of depth and reactivity. rAF-throttled so pointer spam never thrashes
   layout. Skipped entirely for touch devices (no hover) and for users who ask
   for reduced motion. */
(function initSpotlight(){
  const el=document.getElementById('spotlight');
  if(!el)return;
  const fine=window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const calm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(!fine||calm)return;
  let tx=0,ty=0,raf=0;
  function apply(){raf=0;el.style.setProperty('--mx',tx+'px');el.style.setProperty('--my',ty+'px');}
  window.addEventListener('pointermove',e=>{
    tx=e.clientX;ty=e.clientY;el.classList.add('lit');
    if(!raf)raf=requestAnimationFrame(apply);
  },{passive:true});
  window.addEventListener('pointerleave',()=>el.classList.remove('lit'));
})();

/* first load: run the intro animation then boot */
(function(){const dur=animateIntro();setTimeout(bootApp,dur+250);})();