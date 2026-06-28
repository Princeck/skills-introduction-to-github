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
/* Cities NKM knows about. Kept to Nairobi only for now so no other city is ever
   shown or named anywhere in the UI. More cities will be added later via the
   admin panel. (Previous roster, for reference when expanding:
   "Nairobi","Mombasa","Kisumu","Nakuru","Diani","Eldoret","Thika","Machakos") */
const CITIES=["Nairobi"];
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
const NKM_LOGO_SRC="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiByb2xlPSJpbWciIGFyaWEtbGFiZWw9Ik4uemVybyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJuemJnIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjMWQzNTU2Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMGIxODJlIi8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9Im56ZyIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2YwZDQ5YSIvPjxzdG9wIG9mZnNldD0iLjUiIHN0b3AtY29sb3I9IiNkOWE4NWYiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNiOTg2M2YiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iOTQiIGhlaWdodD0iOTQiIHJ4PSIyNCIgZmlsbD0idXJsKCNuemJnKSIvPjxyZWN0IHg9IjMuNzUiIHk9IjMuNzUiIHdpZHRoPSI5Mi41IiBoZWlnaHQ9IjkyLjUiIHJ4PSIyMy4yNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZDlhODVmIiBzdHJva2Utb3BhY2l0eT0iLjQ1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxyZWN0IHg9IjkiIHk9IjYiIHdpZHRoPSI4MiIgaGVpZ2h0PSI0MCIgcng9IjIwIiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIuMDUiLz48cGF0aCBkPSJNMjkgNzMgTDI5IDMxIEw1MCA1OSBMNzEgMzEgTDcxIDczIiBmaWxsPSJub25lIiBzdHJva2U9InVybCgjbnpnKSIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjcxIiByPSIzLjYiIGZpbGw9InVybCgjbnpnKSIvPjwvc3ZnPg==";
function nkmBadge(){return `<img class="nkm-img" src="${NKM_LOGO_SRC}" alt="N.zero" draggable="false">`;}
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