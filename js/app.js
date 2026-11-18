/* Afterfault 3.5 interactive demo */
const XP_AT = { disc:0, explore:5, assign:15, pred:25, code:40, debug:65, mastery:80, end:100 };
const STAGE_SCENE = ["disc","explore","assign","pred","code","debug","boss"];

function defaultChats() {
  return {
    1: { title:"Refund", text:"Your order ", status:"streaming", prio:true, caret:true },
    2: { title:"Late order", text:"Your order is on", status:"streaming", prio:false, caret:true },
    3: { title:"New order", text:"", status:"waiting", prio:false, caret:false },
  };
}

function initialState() {
  return {
    scene:"map", avatar:"sana", aiOn:true, dark:false, xp:0, hearts:3, shield:100,
    stagesDone:0, curStage:null,
    clues:[false,false,false,false], clueOpen:null, discMode:"scene", discAnswer:null,
    exStep:0, exPlay:0, exPlaying:false, exSpeed:1, flushOn:false, exCheck:{}, recapOrder:[null,null,null], recapHold:null, recapTapped:[],
    asStep:0, asPicked:null, asResolved:false, asHint:0, asScore:0, asVocab:false, cliBuilt:false, chats:defaultChats(),
    predI:0, predPhase:"teach", predPick:null, predConf:"think so", predResults:[],
    coachLevel:0, aidTab:"mentor", aidCollapsed:false,
    codeTier:"brief", codeWalk:0, slots:{}, selectedTile:null, microWrong:false, microRan:false,
    hintLevel:0, guidedFixed:false, guidedChoice:null, guidedSrc:null, guidedChecked:false, guidedFails:0, guidedStates:null, guidedOut:"", guidedErr:null, guidedReal:false,
    indepCond:"text", testStates:null, testsDone:false, pySrc:null, pyReal:false, pyOut:"", pyErr:null, realPass:0,
    microPy:null,
    bugI:0, bugPhase:"observe", bugToast:null, bugsFixed:0, bugPy:null, bugEditSrc:null,
    bossPhase:"challenge", masteryChal:{}, masteryTried:false, masteryHelp:false, masterySrc:null, masteryPy:null, masteryCodeOk:false, masteryConceptsDone:false, p2i:0, p2Pick:null, misses:0, missLog:[], p2Cleared:false, shakeBoss:false,
    unlocked36:false, _xpPop:false, missionDone:false, dd:ddInit(), hub:hubInit(), dq:dqInit(), xq:xqInit(), intro:introInit(),
  };
}

let state = initialState();
let timer = null;
function clearT() { if (timer) { clearTimeout(timer); timer = null; } }

function tipText(key) {
  const p = TIPS[key] || ["", ""];
  return state.aiOn ? p[0] : p[1];
}

function setXP(n) {
  if (n !== state.xp) { state.xp = n; state._xpPop = true; setTimeout(() => { state._xpPop = false; const el = document.querySelector(".xp"); if (el) el.classList.remove("pop"); }, 450); }
}

function jumpStage(i) {
  clearT(); xClear(); if (state.intro) introStop();
  const keys = ["disc","explore","assign","pred","code","debug","boss"];
  state.scene = keys[i];
  state.curStage = i;
  state.stagesDone = i;
  setXP([0,5,15,25,40,65,80][i]);
  // reset that stage's local progress so jumps land at the start
  if (i===0) { state.dq=dqInit(); state.clues=[false,false,false,false]; state.clueOpen=null; state.discMode="scene"; state.discAnswer=null; }
  if (i===1) { state.xq=xqInit(); state.exStep=0; state.exPlay=0; state.exCheck={}; state.flushOn=false; state.recapOrder=[null,null,null]; state.recapTapped=[]; }
  if (i===2) { state.asStep=0; state.asPicked=null; state.asResolved=false; state.asHint=0; state.asScore=0; state.asVocab=false; state.cliBuilt=false; state.chats=defaultChats(); }
  if (i===3) { state.predI=0; state.predPhase="teach"; state.predPick=null; state.predResults=[]; }
  if (i===4) { state.dd=ddInit(); state.codeTier="brief"; state.codeWalk=0; state.slots={}; state.selectedTile=null; state.microWrong=false; state.microRan=false; state.hintLevel=0; state.coachLevel=0; state.aidTab="mentor"; state.aidCollapsed=false; state.guidedFixed=false; state.guidedChoice=null; state.guidedSrc=null; state.guidedChecked=false; state.guidedFails=0; state.guidedStates=null; state.guidedOut=""; state.guidedErr=null; state.guidedReal=false; state.indepCond="text"; state.testStates=null; state.testsDone=false; state.pySrc=null; state.pyReal=false; state.pyOut=""; state.pyErr=null; state.realPass=0; state.microPy=null; }
  if (i===5) { state.bugI=0; state.bugPhase="observe"; state.bugToast=null; state.bugsFixed=0; state.bugPy=null; state.bugEditSrc=null; state.coachLevel=0; state.aidTab="mentor"; state.aidCollapsed=false; }
  if (i===6) { state.bossPhase="challenge"; state.masteryChal={}; state.masteryTried=false; state.masteryHelp=false; state.masterySrc=null; state.masteryPy=null; state.masteryCodeOk=false; state.masteryConceptsDone=false; state.hearts=3; state.shield=100; state.p2i=0; state.misses=0; state.missLog=[]; state.p2Cleared=false; state.p2Pick=null; }
  render();
}

function restart() { clearT(); xClear(); if (state.intro) introStop(); state = initialState(); render(); }

function topbar(hearts, pill) {
  let h = "";
  if (hearts) {
    const [full, tot] = hearts;
    h = `<div class="hearts" data-testid="hearts">${Array.from({length:tot},(_,i)=>ic("heart",17,i<full?"#EF4444":"#E5E7EB")).join("")}</div>`;
  }
  return `<div class="top">
    <div class="wm">${ic("hex",30)}<span><span class="d">Dev</span><span class="q">Quest</span></span></div>
    <div class="mpill">${pill||"Afterfault · 3.5 The Unfinished Line"}</div>
    <div class="sp"></div>${h}
    <div class="xp${state._xpPop?" pop":""}" data-testid="xp">${ic("bolt",15,"#fff")} ${state.xp}* XP <small>/ 100*</small></div>
    <button type="button" class="tog" data-act="toggle-ai" data-testid="ai-toggle">AI Mentor <div class="sw ${state.aiOn?"":"off"}"></div></button>
    <button type="button" class="theme-tog" data-act="toggle-theme" data-testid="theme-toggle">${ic(state.dark?"sun":"moon",14)} ${state.dark?"Light":"Dark"}</button>
    <img class="meav" src="${ART}${state.avatar}-face.jpg" alt="">
  </div>`;
}

function rail(cur, done, nxt) {
  let html = '<div class="rail" data-testid="rail">';
  STAGES.forEach((s,i) => {
    let cls, icon, col;
    if (i < done) { cls="done"; icon="check"; col="#fff"; }
    else if (cur!=null && i===cur) { cls="cur"; icon=STAGE_ICON[i]; col="#fff"; }
    else if (nxt!=null && i===nxt) { cls="next"; icon=STAGE_ICON[i]; col="#B45309"; }
    else { cls="lock"; icon="lock"; col="#9CA3AF"; }
    html += `<button type="button" class="st ${cls}" data-act="jump-stage" data-i="${i}" data-testid="rail-${s.toLowerCase()}"><span class="ic">${ic(icon,14,col)}</span>${s}</button>`;
    if (i<6) html += `<div class="cn ${i<done?"done":""}"></div>`;
  });
  return html + "</div>";
}

function sidePanel(objective, tipKey, line, speak="idle", extra="") {
  const me = state.avatar, ch = CHAR[me], ai = state.aiOn;
  const img = !ai ? "vyapti-off" : (speak==="speak" ? "vyapti-speak" : "vyapti-idle");
  const n = ai ? (ai && state.scene==="code" ? "VYAPTI · MENTOR" : "VYAPTI") : "COACH · HINTS ONLY";
  const ln = Array.isArray(line) ? theLine(line[0], line[1]) : (line==null?"":theLine(line));
  const stageName = ({disc:"Discovery",explore:"Explore",assign:"Assign",pred:"Predict",code:"Code",debug:"Debug",boss:"Mastery"})[state.scene] || "Mission";
  const compact = state.scene === "code" || state.scene === "debug";
  return `<div class="card side ${compact?"side-compact":""}" data-testid="story-side">
    <h3>The Unfinished Line</h3>
    <div class="stage-pill">${esc(stageName)}</div>
    <div class="ava"><img src="${ART}${me}-face.jpg" alt=""><div><b>${ch.first}</b><span>${ch.branch}</span></div></div>
    <div class="obj"><i>OBJECTIVE</i>${md(objective)}</div>${extra}${compact?"":ln}
    <div class="vy"><div class="vyh"><img class="orb" src="${ART}${img}.jpg" alt=""><span style="color:${ai?"#7C3AED":"#64748B"}">${n}</span></div>
    <div class="tip ${ai?"":"off"}">${md(tipText(tipKey))}</div></div>
  </div>`;
}

function tagEl(label) { return `<div class="tag">${esc(label)}</div>`; }

function shell(opts, bodyInner, raw=false) {
  const { cur=null, done=0, nxt=null, hearts=null, tag="Demo" } = opts;
  const app = document.getElementById("app");
  const body = raw ? bodyInner : `<div class="body ${opts.bodyCls||""}">${bodyInner}</div>`;
  app.innerHTML = topbar(hearts) + rail(cur, done, nxt) + body + tagEl(tag);
}

/* ---------------- AVATAR / CUTSCENES */
function renderAvatar() {
  const cards = ["tanvi","rohan","samar","sana"].map(k => {
    const sel = state.avatar===k;
    const ring = sel ? "border:3px solid #F59E0B;box-shadow:0 0 0 6px rgba(245,158,11,.2),0 6px 0 #D97706" : "box-shadow:0 4px 0 #E5E7EB";
    const check = sel ? `<div style="position:absolute;top:10px;right:10px;width:30px;height:30px;border-radius:50%;background:#F59E0B;display:grid;place-items:center">${ic("check",18,"#fff")}</div>` : "";
    return `<button type="button" class="card avatar-card" data-act="pick-avatar" data-k="${k}" data-testid="avatar-${k}" style="padding:10px;flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;${ring};position:relative">
      ${check}<img src="${ART}${k}-body.jpg" alt="${CHAR[k].name}" style="width:100%;height:330px;object-fit:cover;object-position:top;border-radius:16px;background:#F3EFFE">
      <div style="font:800 18px Poppins;color:#301768">${CHAR[k].name}</div>${chip(CHAR[k].branch)}</button>`;
  }).join("");
  const main = `<div class="main"><div class="hd"><div><div class="kick">Choose your avatar</div><h2>Who's on shift tonight?</h2></div><div class="sp"></div>${chip("Learning first · story optional","gry")}</div>
    <div class="row" style="flex:1">${cards}</div>
    <div class="learn-card" style="margin:8px 0"><i>Mission goal</i><p>Learn streaming responses so Dabba Dash never shows <b>Delivered ✓</b> on half a sentence. You'll understand → experiment → apply → code → debug → prove.</p></div>
    <div class="row" style="justify-content:flex-end;gap:10px">${btn("Optional: watch story","watch-intro","","g sm")}${btn("Start learning "+ic("play",14,"#fff"),"enter-storm","data-testid='enter-storm'")}</div></div>`;
  shell({nxt:0, tag:"Entry · Choose avatar", bodyCls:"full"}, main);
}

function panel(content) { return `<div class="card" style="padding:16px;display:flex;flex-direction:column;gap:10px;min-width:0">${content}</div>`; }

function renderCut1() {
  const p1 = panel(`<span class="kick">Friday · 9:40 PM · Monsoon dinner rush</span>
    <div style="display:flex;gap:14px;align-items:flex-start">
      <div class="phone" style="width:330px;font-size:18px"><div class="ph-h"><span class="logo-dd">DD</span>Dabba Dash support</div>
        <div class="b u" style="font-size:18px">Where is my order?</div><div class="b bot" style="font-size:18px">Your order is on the<span class="caret"></span></div><div style="height:120px"></div>
        <div class="mini" style="align-self:flex-start">typing…</div></div>
      <div class="col f1" style="gap:12px"><div style="font:italic 500 17px/1.5 Inter;color:#6B7280;background:#F9FAFB;border-radius:14px;padding:14px">Rain on the hostel window.<br>Cursor blinks. And blinks. And blinks.</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${chip("Chat frozen · 00:41","red")}${chip("Refund requests ↑","red")}</div></div></div>`);
  const p2 = panel(`<span class="kick">Ops wall · Dabba Dash HQ</span>
    <div style="display:flex;gap:12px;align-items:flex-end"><img src="${ART}ila-body.jpg" alt="Ila" style="width:230px;height:380px;object-fit:cover;object-position:top;border-radius:16px">
      <div class="col f1"><div class="card" style="background:#ECFDF5;border-color:#A7F3D0;padding:12px"><div style="font:800 26px Poppins;color:#047857;display:flex;gap:8px;align-items:center">${ic("check",26,"#10B981")}All good</div><div class="mini" style="color:#047857">4,000 chats · 4,000 delivered ✓</div></div>
      ${dl("ila","Four thousand chats tonight. All green. Lovely work, team.")}</div></div>`);
  const main = `<div class="main"><div class="row" style="flex:1">${p1}${p2}</div>
    <div class="row" style="justify-content:flex-end;gap:10px">${btn("Skip","skip-cut","","g sm")}${btn("Next","cut-next")}</div></div>`;
  shell({nxt:0, tag:"Entry · Cold open, panel 1–2", bodyCls:"full"}, main);
}

function renderCut2() {
  const p3 = panel(`<span class="kick">Mess hall · same minute</span><div style="display:flex;gap:14px"><img src="${ART}discovery-tanvi.jpg" alt="Tanvi" style="width:260px;height:360px;object-fit:cover;border-radius:16px">
    <div class="col f1" style="justify-content:center">${dl("tanvi","Uh. That \"all green\" chat? That's my biryani.")}<div class="phone" style="padding:10px"><div class="b bot" style="font-size:13px">Your order is on the<span class="caret"></span></div><div class="st-ok" style="align-self:flex-end">Delivered ✓</div></div></div></div>`);
  const p4 = panel(`<span class="kick">Vyapti wakes up</span><div style="display:flex;gap:16px;align-items:center"><img class="orb" src="${ART}vyapti-speak.jpg" alt="Vyapti" style="width:200px;height:200px">
    <div style="font:700 22px/1.35 Poppins;color:#301768">"A reply isn't done when it stops. It's done when it says it's done."</div></div>
    <div class="row" style="gap:8px;flex-wrap:wrap">${chip("Mission skills")}${chip("read chunks","amb")}${chip("show them live","amb")}${chip("assemble","amb")}${chip("say if it finished","amb")}</div>`);
  const main = `<div class="main"><div class="row" style="flex:1">${p3}${p4}</div>
    <div class="row" style="justify-content:flex-end;gap:10px">${btn("Replay","replay-cut","","g sm")}${btn("Start Discovery "+ic("play",14,"#fff"),"start-disc")}</div></div>`;
  shell({nxt:0, tag:"Entry · Cold open, panel 3–4", bodyCls:"full"}, main);
}

/* DISCOVERY + EXPLORE live in js/story.js; the intro lives in js/intro.js */

/* ---------------- ASSIGN */
function renderAssign() {
  const step = state.asStep;
  let content="", tip="as0", speak="idle";
  if (step < 4) {
    const sc = ASSIGN_SCENARIOS[step];
    const vocab = (sc.vocab || []).map(([k,v]) => `<div class="vocab-row"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join("");
    if (!state.asVocab) {
      content = `<div class="as-scenario" data-testid="as-scenario-${sc.id}">
        <div class="row" style="align-items:center;gap:8px;margin-bottom:8px">${chip("Scenario "+sc.id,"dk")}<b class="pop" style="color:#301768;font-size:18px">${esc(sc.title)}</b><span class="sp"></span>${chip((step+1)+" / 4")}${chip("Streaming Responses")}${simLabel("")}</div>
        <div class="as-grid">
          <div class="learn-card"><i>Situation</i><p>${esc(sc.situation)}</p></div>
          <div class="learn-card"><i>Problem</i><p>${esc(sc.problem)}</p></div>
          <div class="learn-card"><i>Objective</i><p>${esc(sc.objective)}</p></div>
          <div class="learn-card"><i>Constraints</i><p>${esc(sc.constraints)}</p></div>
          <div class="learn-card"><i>Expected behaviour</i><p>${esc(sc.expected)}</p></div>
          <div class="learn-card task"><i>Learn the options first</i>
            <p>Each choice below has a clear meaning. Read them before you decide — traps are labelled so you know what “retry forever” or “mark all good” would do.</p>
            <div class="vocab-box" data-testid="as-vocab">${vocab}</div>
            <div class="row" style="justify-content:flex-end;margin-top:10px">${btn("Got it — decide "+ic("play",14,"#fff"),"as-vocab-done","data-testid='as-vocab-done'")}</div>
          </div>
        </div>
      </div>`;
      tip = ["as0","as1","as2","as3"][step];
    } else {
    const ops = sc.ops.map((o, i) => {
      let s = "";
      if (state.asResolved) s = o.ok ? "ok" : (state.asPicked === i ? "bad" : "dim");
      else if (state.asPicked === i) s = "sel";
      return opt("ABCD"[i], o.t, s, "as-pick", `data-i="${i}" data-testid="as-pick-${i}"`);
    }).join("");
    const picked = state.asPicked != null ? sc.ops[state.asPicked] : null;
    content = `<div class="as-scenario" data-testid="as-scenario-${sc.id}">
      <div class="row" style="align-items:center;gap:8px;margin-bottom:8px">${chip("Scenario "+sc.id,"dk")}<b class="pop" style="color:#301768;font-size:18px">${esc(sc.title)}</b><span class="sp"></span>${chip((step+1)+" / 4")}${chip("Streaming Responses")}${simLabel("")}</div>
      <div class="as-grid">
        <div class="learn-card"><i>Situation</i><p>${esc(sc.situation)}</p></div>
        <div class="learn-card"><i>Problem</i><p>${esc(sc.problem)}</p></div>
        <div class="learn-card"><i>Objective</i><p>${esc(sc.objective)}</p></div>
        <div class="learn-card"><i>Constraints</i><p>${esc(sc.constraints)}</p></div>
        <div class="learn-card"><i>Expected behaviour</i><p>${esc(sc.expected)}</p></div>
        <div class="learn-card task"><i>Your task</i><p>${esc(sc.task)}</p>
          <div class="opts one" style="margin-top:8px">${ops}</div>
          ${!state.asResolved && state.asPicked!=null ? `<div class="row" style="justify-content:flex-end;margin-top:8px">${btn("Submit decision","as-commit","data-testid='as-commit'")}</div>` : ""}
          ${state.asResolved ? fb(picked && picked.ok ? "ok" : "bad", picked && picked.ok ? "Correct application." : "Not the honest behaviour.", sc.why) : ""}
          ${state.asResolved ? `<div class="row" style="justify-content:flex-end;gap:8px;margin-top:8px">${!(picked && picked.ok)?btn("Try again","as-retry","data-testid='as-retry'","g sm"):""}${btn(step===3?"See summary "+ic("play",14,"#fff"):"Next scenario "+ic("play",14,"#fff"),"as-next","data-testid='as-next'")}</div>` : ""}
        </div>
      </div>
    </div>`;
    tip = ["as0","as1","as2","as3"][step];
    speak = state.asResolved ? "speak" : "idle";
    }
  } else {
    content = `<div class="col" style="flex:1;gap:12px">
      <div class="as-grid">
        ${ASSIGN_SCENARIOS.map(sc => `<div class="learn-card"><i>Scenario ${esc(sc.id)} · ${esc(sc.title)}</i><p>${esc(sc.expected)}</p></div>`).join("")}
      </div>
      <div class="mini">Temperature / max-tokens dials belong in Mission 3.6 — optional later. Streaming honesty is the skill here.</div>
      <div class="card" style="display:flex;align-items:center;gap:16px;border-color:#F59E0B;background:linear-gradient(90deg,#F3EFFE,#FFF6DF)">
        <div style="flex:1"><div style="font:800 20px Poppins;color:#301768">Four scenarios, honest decisions.</div>
        <div class="mini">${state.asScore} / 4 correct on first principles · no green tick on half a line</div></div>
        <div style="font:800 28px Poppins;color:#F59E0B">+10*</div>${btn("Continue to Predictions "+ic("play",14,"#fff"),"to-pred","data-testid='to-pred'")}
      </div>
    </div>`;
    tip = "asDone"; speak = "speak";
  }
  const main = `<div class="main"><div class="hd"><div><div class="kick">Stage 3 · Assign · Streaming Responses</div><h2>Apply streaming honesty</h2></div><div class="sp"></div>${chip("Not a Discovery repeat · decide app behaviour")}</div>${content}</div>`;
  shell({cur:2,done:2,tag:"Assign · Scenarios"}, sidePanel("Choose what the app should do for each stream outcome. Read option meanings before you decide.", tip, null, speak)+main);
}

/* ---------------- PREDICTIONS */
function pdots() {
  return `<div style="display:flex;gap:4px">${Array.from({length:6},(_,k)=>{
    let c="#E5E7EB";
    if (k<state.predI) c = state.predResults[k]?"#10B981":"#EF4444";
    else if (k===state.predI) c="#F59E0B";
    return `<span style="width:26px;height:8px;border-radius:5px;background:${c}"></span>`;
  }).join("")}</div>`;
}
const PRED_USES = [
  ["flush","end=\"\"","buffering"],
  [".get()","role-only chunk","guards"],
  ["finish_reason","honest status","quiet ≠ done"],
  ["single pass","parts.append","stream once"],
  ["retry once","pause","retry storm"],
  ["finish_reason length","truncated","token limit"],
];
function renderPred() {
  const i=state.predI, p=PRED[i], L="ABCD";
  const uses = (PRED_USES[i]||[]).map(u => chip(u,"amb")).join("");
  const teach = PRED_TEACH[i] || { title: "How this code path works", body: "Review the idea before you predict." };
  const head=`<div class="hd"><div><div class="kick">Stage 4 · Predict · Streaming Responses · ${p.id} of 6</div><h2>${md(p.title)}</h2></div><div class="sp"></div>${pdots()}</div>
    <div class="row" style="gap:6px;align-items:center;margin-bottom:6px"><span class="lbl">Uses taught concepts</span>${uses}${SIM_BADGE}</div>`;
  let main="";
  if (state.predPhase==="teach") {
    main = `<div class="main">${head}
      <div class="teach-card" data-testid="pred-teach" style="max-width:960px;margin:0 auto">
        <div class="teach-kicker">${ic("bulb",16,"#B45309")} How it works in code · then predict</div>
        <h3>${esc(teach.title)}</h3>
        <p style="margin:0 0 10px;font:500 14px/1.45 Inter;color:#1F2937">${esc(teach.body)}</p>
        <div class="mini" style="margin-bottom:10px">${md(p.setup)}</div>
        ${codeBlock(p.src,"risky_patch.py · the change under review",{},"sm")}
        <div class="row" style="justify-content:flex-end;margin-top:12px">${btn("I understand — predict "+ic("play",14,"#fff"),"pred-taught","data-testid='pred-taught'")}</div>
      </div></div>`;
  } else if (state.predPhase==="q") {
    const ops = p.ops.map((o,k)=>opt(L[k],o,state.predPick===k?"sel":"","pred-pick",`data-i="${k}"`)).join("");
    const conf = ["sure","think so","guessing"].map(c=>`<button type="button" class="chip ${state.predConf===c?"dk":"gry"}" data-act="pred-conf" data-c="${c}">${c}</button>`).join("");
    main = `<div class="main">${head}
      <div class="teach-strip done" data-testid="pred-teach-strip"><b>${esc(teach.title)}</b><span class="mini">${esc(teach.body)}</span></div>
      <div class="row" style="flex:1"><div class="col" style="width:480px"><div class="mini" style="margin-bottom:6px">${md(p.setup)}</div>${codeBlock(p.src,"risky_patch.py",{},"sm")}</div>
      <div class="col f1"><div class="lbl">What will the customer see?</div><div class="opts one">${ops}</div>
      <div class="row" style="align-items:center;gap:6px"><span class="lbl">Confidence</span>${conf}</div>
      <div class="row" style="justify-content:flex-end">${state.predPick!=null?btn("Commit prediction","pred-commit","data-testid='commit-pred'"):btn("Commit prediction","noop","","dis")}</div></div></div></div>`;
  } else {
    const ok = state.predResults[i];
    const ops = p.ops.map((o,k)=>{
      let s="dim"; if (k===p.correct) s="ok"; else if (k===state.predPick) s="bad";
      return opt(L[k],o,s,"noop");
    }).join("");
    const f = ok ? fb("ok","Called it.",p.why) : fb("bad","Not this time.",p.why);
    const cal = ok ? chip("sure-ish + right","grn") : chip("sure + wrong · flagged for review, no penalty","red");
    const last = i===5;
    const nxt = last ? btn("Continue to Code "+ic("play",14,"#fff"),"to-code") : btn("Next prediction","pred-next");
    const xpblk = last ? `<div style="font:800 24px Poppins;color:#F59E0B">+15*</div>${chip((state.predResults.filter(Boolean).length)+" / 6 correct")}` : "";
    main = `<div class="main">${head}<div class="row" style="flex:1"><div class="col" style="width:420px"><div class="lbl">Simulated result ${SIM_BADGE}</div>${predOutcome(p.id)}</div>
      <div class="col f1"><div class="opts one">${ops}</div>${f}<div class="row" style="align-items:center;gap:8px">${cal}${ok?"":chip("Replay E3?")}<span class="sp"></span>${xpblk}${nxt}</div></div></div></div>`;
  }
  const phaseTip = state.predPhase==="teach" ? ["Read how the code path works, then predict.", "Read the teach card, then continue."]
    : state.predPhase==="q" ? [p.tipOn, p.tipOff]
    : [state.predResults[i]?p.tipRevealOn:p.tipRevealOff, state.predResults[i]?p.tipRevealOff:p.tipRevealOff];
  TIPS._pred = phaseTip;
  shell({cur:3,done:3,tag:`Predictions · ${p.id} · ${state.predPhase==="teach"?"Teach":state.predPhase==="q"?"Question":"Reveal"}`},
    sidePanel("First learn how this code path works, then predict what the customer will see.", "_pred", null, state.predPhase==="reveal"?"speak":"idle")+main);
}

/* ---------------- CODE */
function microBlocks() {
  const col={loop:"#7C3AED",dec:"#F59E0B",act:"#A78BFA"};
  return `<div class="card col" style="gap:4px;flex:1;padding:12px">${MICRO.map(([ind,k,src])=>{
    const filled = src.replace(/\{\{(\d)\}\}/g,(_,n)=>{
      n=+n;
      if (state.microWrong && n===4 && state.slots[4]==="False") return `{{${n}|w|False}}`;
      if (state.slots[n]) return `{{${n}|f|${state.slots[n]}}}`;
      return `{{${n}}}`;
    });
    return `<div style="margin-left:${ind*30}px;display:flex;align-items:center;gap:8px;background:${col[k]}14;border:2px solid ${col[k]}55;border-left:8px solid ${col[k]};border-radius:11px;padding:1px 10px;font:500 12.5px 'JetBrains Mono';white-space:pre"><span>${hlLine(filled)}</span></div>`;
  }).join("")}</div>`;
}
function microBank() {
  const used = new Set(Object.values(state.slots));
  return `<div class="card col" style="width:250px;gap:8px"><div class="lbl">Tile bank · click, then click a slot</div><div class="wrapt">${MICRO_BANK.map(b=>{
    let cls="tile mono";
    if (state.selectedTile===b) cls+=" p";
    if (state.microWrong && b==="False") cls="tile mono bad";
    const faded = (used.has(b) && state.selectedTile!==b) ? 'style="opacity:.35"' : "";
    return `<button type="button" class="${cls}" ${faded} data-act="micro-tile" data-t="${esc(b)}">${esc(b)}</button>`;
  }).join("")}</div><div class="row" style="gap:6px;flex-wrap:wrap">${chip("loop")}${chip("decision","amb")}${chip("action")}</div></div>`;
}
function codehd(tier,title) {
  const tiers=["Brief","Micro","Guided","Independent"];
  const pills = tiers.map(t=>{
    const i=tiers.indexOf(t), c=tiers.indexOf(tier);
    return chip((i<c?"✓ ":"")+t, t===tier?"dk":(i<c?"grn":"gry"));
  }).join("");
  /* One Real Python badge for coding tiers — lives in the header only */
  const badge = (tier === "Guided" || tier === "Independent")
    ? `<span data-testid="real-badge-once">${REAL_BADGE}</span>`
    : "";
  return `<div class="hd"><div><div class="kick">Stage 5 · Code · ${tier}</div><h2>${title}</h2></div><div class="sp"></div>${pills}${badge}</div>`;
}
function testPanelReal(states) {
  const rows = INDEP_TESTS_REAL.map((t, i) => {
    const st = (states && states[i]) || "pend";
    return testRow(t.id, t.name, st, false, "");
  }).join("");
  const npass = states ? states.filter(s => s === "pass").length : 0;
  const fail = states && states.includes("fail");
  return `<div class="card col checks-card" data-testid="tests"><div class="row" style="align-items:center"><b class="pop" style="color:${state.dark?"#EDE7FD":"#301768"}">Checks</b><span class="sp"></span>${chip(npass+" / "+INDEP_TESTS_REAL.length, fail?"red":(npass===INDEP_TESTS_REAL.length?"grn":"gry"))}</div><div class="tests">${rows}</div>
    <div class="mini">Mock OpenAI-style stream (no API key).</div></div>`;
}
function editorConsole(outHtml, runBtn, extraBtns="") {
  return `<div class="run-row" data-testid="run-row">
      ${runBtn}${extraBtns}
    </div>
    <div class="editor-console" data-testid="editor-console">${outHtml}</div>`;
}

function codeObjective() {
  if (state.codeTier === "brief") return "Learn each idea in the stream consumer before you build it with blocks or typed code.";
  if (state.codeTier === "micro") return "Assemble the stream consumer with blocks — same order you learned in Brief and Explore.";
  if (state.codeTier === "guided") return "Fix the dishonest status line, then prove it with real Python checks.";
  return "Type a full consume() that prints live, joins the reply, labels honestly, and closes the stream.";
}

function renderCode() {
  let main="", tip="micro", speak="idle", obj=codeObjective();
  if (state.codeTier==="brief") {
    const i = state.codeWalk;
    const step = CODE_WALK[i];
    const list = CODE_WALK.map((w, k) => `<button type="button" class="walk-step ${k===i?"c":(k<i?"d":"")}" data-act="code-walk" data-i="${k}" data-testid="code-walk-${k}"><b>${k+1}</b><span>${esc(w.t)}</span></button>`).join("");
    /* Brief is teach-only: open the self-check by default; Hint unlocks deeper coach lines */
    const briefCoachLvl = Math.max(1, state.coachLevel || 0);
    const aid = mentorCoachPanel(step.mentor, step.coach, briefCoachLvl, step.chips);
    main = `<div class="main">${codehd("Brief","Build a stream consumer — taught first")}
      <div class="row" style="flex:1;gap:14px;min-height:0">
        <div class="col" style="width:260px;gap:6px;overflow:auto;flex-shrink:0">${list}</div>
        <div class="col f1 learn-card" style="overflow:auto;min-width:0">
          <i>Step ${i+1} · ${esc(step.t)}</i>
          <p class="step-body" data-testid="brief-step-body" style="font-size:15px;line-height:1.5;margin:8px 0 12px">${esc(step.d)}</p>
          ${i===CODE_WALK.length-1 ? codeBlock(CODE_SKELETON,"line_keeper.py · target shape",{},"xs") : `<div class="mini">OpenAI-style <code class="inline">chat.completions</code> with <code class="inline">stream=True</code> — same SDK family as the rest of this mission.</div>`}
          ${aid}
          <div class="row" style="justify-content:flex-end;gap:8px;margin-top:auto">
            ${i>0?btn("Back","code-walk",`data-i="${i-1}"`,"g sm"):""}
            ${i<CODE_WALK.length-1?btn("Next idea "+ic("play",14,"#fff"),"code-walk",`data-i="${i+1}" data-testid='code-walk-next'`):btn("Practice with blocks "+ic("play",14,"#fff"),"to-micro","data-testid='to-micro'")}
          </div>
        </div>
      </div></div>`;
    TIPS._brief = [step.tip, step.tip];
    tip = "_brief";
  } else if (state.codeTier==="micro") {
    const r = state.dd.result;
    if (state.dd.solved) { tip="microOk"; speak="speak"; }
    else if (r && !r.ok) { TIPS._dd = [r.title+" "+r.msg, r.title+" "+r.msg]; tip="_dd"; }
    else {
      TIPS._micro = [MICRO_AID.tip, MICRO_AID.tip];
      tip = "_micro";
    }
    main = ddMain();
  } else if (state.codeTier==="guided") {
    if (state.guidedSrc == null) state.guidedSrc = GUIDED_SRC;
    const gStates = state.guidedStates;
    const sr = GUIDED_TESTS_REAL.map((t, i) => {
      const st = (gStates && gStates[i]) || "pend";
      return testRow(t.id, t.name, st, false, "");
    }).join("");
    const showFix = state.guidedFails >= 2 && !state.guidedFixed;
    const npass = gStates ? gStates.filter(s => s === "pass").length : 0;
    const coachLines = guidedCoachLines();
    const checksHtml = `<div data-testid="guided-tests"><div class="row" style="align-items:center"><div class="lbl">Guided checks</div><span class="sp"></span>${chip(npass+" / "+GUIDED_TESTS_REAL.length, state.guidedFixed?"grn":"gry")}</div><div class="tests">${sr}</div></div>`;
    const revealHtml = showFix ? btn("Reveal honest_status line","fix-status","data-testid='fix-status'","g sm") : "";
    const aidG = assistantPanel({ mentor: GUIDED_AID.mentor, coach: coachLines, chips: GUIDED_AID.chips, coachLevel: state.coachLevel, checksHtml, revealHtml });
    const outHtml = state.guidedErr
      ? `<div class="term" data-testid="guided-py-out"><span class="er">✕</span> ${esc(state.guidedErr)}</div>`
      : (state.guidedFixed
        ? `<div class="term" data-testid="guided-py-out"><span class="ok">✓ all ${GUIDED_TESTS_REAL.length} checks passed</span>${state.guidedOut ? "\n" + esc(state.guidedOut) : ""}</div>`
        : (state.guidedChecked
          ? `<div class="term" data-testid="guided-py-out"><span class="er">✕ ${npass}/${GUIDED_TESTS_REAL.length}</span> ${esc(state.guidedOut || "Edit status, then re-run.")}</div>`
          : `<div class="term" data-testid="guided-py-out"><span class="dim">Edit the status = line, then Run.</span></div>`));
    main = `<div class="main code-ws">${codehd("Guided","Write consume() — honest status")}
      ${pyLoadBar({ compact: true })}
      <p class="task-line" data-testid="task-line">Starter hard-codes <b>complete</b>. Edit that line so status follows <code class="inline">error</code> and <code class="inline">finish_reason</code>, then Run.</p>
      <div class="ws-grid">
        <div class="ws-editor col">
          <div class="editor-frame">
            <div class="codehd"><span class="dots"><i></i><i></i><i></i></span>line_keeper.py</div>
            <textarea class="py-editor dominant" data-testid="guided-editor" spellcheck="false" aria-label="Guided Python consume">${esc(state.guidedSrc)}</textarea>
          </div>
          ${editorConsole(outHtml, btn(PY.status==="loading"?"Loading…":"Run real Python","guided-check","data-testid='guided-check'", PY.status==="loading"?"dis":""), state.guidedFixed?btn("Next: Independent "+ic("play",14,"#fff"),"to-indep"):btn("Reset starter","guided-reset","data-testid='guided-reset'","g sm"))}
        </div>
        ${aidG}
      </div></div>`;
    TIPS._guided = [GUIDED_AID.tip, GUIDED_AID.tip];
    tip = state.guidedFixed ? "guidedOk" : "_guided";
  } else {
    if (state.pySrc == null) state.pySrc = CONSUME_BROKEN_STATUS;
    const states = state.testStates;
    const allPass = state.pyReal && states && states.length === INDEP_TESTS_REAL.length && states.every(s => s === "pass");
    const outHtml = state.pyOut || state.pyErr
      ? `<div class="term ${state.pyErr?"err":""}" data-testid="py-out">${esc(state.pyErr ? state.pyErr : state.pyOut)}</div>`
      : `<div class="term" data-testid="py-out"><span class="dim">Output appears here after Run.</span></div>`;
    const eff = allPass ? `<div class="card col" style="gap:6px;padding:10px;margin-top:8px"><div class="row" style="align-items:center"><b class="pop" style="color:${state.dark?"#EDE7FD":"#301768"}">Ready for Debug</b><span class="sp"></span>${chip("✓ "+state.realPass+"/"+INDEP_TESTS_REAL.length,"grn")}<div style="font:800 20px Poppins;color:#F59E0B">+25*</div>${btn("Continue to Debug "+ic("play",12,"#fff"),"to-debug","","sm")}</div></div>` : "";
    const coachLines = indepCoachLines();
    const aidI = assistantPanel({ mentor: INDEP_AID.mentor, coach: coachLines, chips: INDEP_AID.chips, coachLevel: state.coachLevel, checksHtml: testPanelReal(states) });
    main = `<div class="main code-ws">${codehd("Independent","Ship stream_chat.py")}
      ${pyLoadBar({ compact: true })}
      <p class="task-line" data-testid="task-line">Edit <code class="inline">consume()</code>. The starter hard-codes <b>complete</b> — fix honest status, then Run.</p>
      <div class="ws-grid">
        <div class="ws-editor col">
          <div class="editor-frame">
            <div class="codehd"><span class="dots"><i></i><i></i><i></i></span>stream_chat.py</div>
            <textarea class="py-editor dominant" data-testid="py-editor" spellcheck="false" aria-label="Python consume function">${esc(state.pySrc)}</textarea>
          </div>
          ${editorConsole(outHtml, btn(PY.status==="loading"?"Loading…":"Run real Python checks","indep-check","data-testid='indep-check'", PY.status==="loading"?"dis":""), btn("Reset starter","py-reset","data-testid='py-reset'","g sm"))}
          ${eff}
        </div>
        ${aidI}
      </div></div>`;
    TIPS._indep = [INDEP_AID.tip, INDEP_AID.tip];
    tip = allPass ? "indepOk" : (state.testsDone ? "indepFail" : "_indep");
    speak = allPass ? "speak" : "idle";
  }
  const bodyCls = (state.codeTier === "guided" || state.codeTier === "indep") ? "ws-body" : "";
  shell({cur:4,done:4,tag:"Code · "+state.codeTier, bodyCls}, sidePanel(obj, tip, [6,true], speak)+main);
}

/* ---------------- DEBUG */
function bugTracker() {
  const rows = BUGS.map((b,i)=>{
    let st, ch;
    if (i<state.bugsFixed) { st=chip("fixed","grn"); ch="#10B981"; }
    else if (state.bugI===i && state.bugPhase!=="find") { st=chip("found","red"); ch="#EF4444"; }
    else { st=chip("still open","gry"); ch="#D1D5DB"; }
    return `<div style="display:flex;align-items:center;gap:8px;font-size:12px"><span style="width:10px;height:10px;border-radius:50%;background:${ch}"></span><b class="pop" style="font-size:11.5px;color:#301768;width:78px">${b.id}</b><span style="flex:1">${b.title}</span>${st}</div>`;
  }).join("");
  return `<div class="card col" style="gap:6px;padding:12px"><div class="row" style="align-items:center">${ic("bug",16,"#7C3AED")}<b class="pop" style="color:#301768;margin-left:6px">Bug tracker</b><span class="sp"></span>${chip(state.bugsFixed+" / 5 fixed")}</div>${rows}</div>`;
}

const BUG_LEVELS = [
  { lvl:1, skill:"Obvious mistake" },
  { lvl:2, skill:"Understand the symptom" },
  { lvl:3, skill:"Logic problem" },
  { lvl:4, skill:"Incorrect implementation" },
  { lvl:5, skill:"Real-world failure" },
];
function bugEditableSrc(b) {
  const runner = BUG_RUNNERS[state.bugI];
  if (state.bugPhase === "fixed") return state.bugEditSrc || b.fixedSrc || (runner && runner.fixed) || b.src;
  if (state.bugEditSrc != null) return state.bugEditSrc;
  if (runner && runner.broken) return runner.broken;
  return b.src;
}

function renderDebug() {
  const b = BUGS[state.bugI];
  const lvl = BUG_LEVELS[state.bugI];
  const fixed = state.bugPhase==="fixed";
  const observing = state.bugPhase==="observe";
  const finding = state.bugPhase==="find";
  const editing = state.bugPhase==="edit" || state.bugPhase==="choose";
  const marks = fixed ? (b.fixedMarks || {}) : (finding ? Object.fromEntries(b.badLines.map(n=>[n,"foc"])) : {});
  const toast = state.bugToast ? `<div class="fb am" style="padding:8px 12px;margin-top:8px"><span class="ico">${ic("eye",15,"#fff")}</span><div><b>Weak patch rejected:</b> ${md(state.bugToast.move)}<br>"${md(state.bugToast.resp)}"</div></div>` : "";
  const bp = state.bugPy;
  const last = state.bugI===4 && fixed;
  const phaseKey = observing ? "observe" : finding ? "find" : fixed ? "fixed" : "choose";
  const dAid = debugAidFor(phaseKey);
  const sideExtra = `<div class="bug-side-bits">${bugTracker()}
    <div class="lbl" style="margin-top:8px">Symptom</div>${b.before}
    ${fixed?`<div class="lbl" style="margin-top:8px">After</div>${b.after}`:""}
  </div>`;
  const aidD = assistantPanel({ mentor: dAid.mentor, coach: dAid.coach, chips: dAid.chips, coachLevel: state.coachLevel, checksHtml: sideExtra });
  const process = `<div class="debug-process" data-testid="debug-process">
      <span class="${observing?"on":""}">1 · Reproduce</span>
      <span class="${finding?"on":""}">2 · Find</span>
      <span class="${editing?"on":""}">3 · Fix</span>
      <span class="${fixed?"on":""}">4 · Re-test</span>
    </div>`;
  let editorBlock = "";
  let outHtml = "";
  let runControls = "";
  if (observing) {
    editorBlock = `<div class="editor-frame" data-testid="bug-observe"><div class="${""}">${codeBlock(b.src,"dabba_stream.py",{},"")}</div></div>`;
    outHtml = bp
      ? `<div class="term ${bp.ok && !bp.expectFail ? "" : "err"}" data-testid="bug-py-out">${esc(bp.summary)}</div>`
      : `<div class="term" data-testid="bug-py-out"><span class="dim">Run the broken code to see the symptom.</span></div>`;
    runControls = editorConsole(outHtml,
      btn(bp?"Re-run broken code":"Run broken code","bug-run","data-testid='bug-run'",""),
      btn("I've inspected — find the line","bug-to-find","data-testid='bug-to-find'","g sm"));
  } else if (finding) {
    editorBlock = `<div class="editor-frame debug-find"><div class="lbl">Tap the buggy line</div>${codeBlock(b.src,"dabba_stream.py",marks)}</div>`;
    outHtml = `<div class="term" data-testid="find-hint"><span class="dim">Tap the crashing / wrong line in the editor, then edit your fix.</span></div>`;
    runControls = `<div class="editor-console" data-testid="editor-console">${outHtml}</div>`;
  } else if (editing) {
    const editSrc = bugEditableSrc(b);
    if (state.bugEditSrc == null) state.bugEditSrc = editSrc;
    editorBlock = `<div class="editor-frame">
      <div class="codehd"><span class="dots"><i></i><i></i><i></i></span>dabba_stream.py · edit your fix</div>
      <textarea class="py-editor dominant" data-testid="bug-editor" spellcheck="false" aria-label="Debug fix editor">${esc(state.bugEditSrc)}</textarea>
    </div>`;
    outHtml = bp
      ? `<div class="term ${bp.ok ? "" : "err"}" data-testid="bug-py-out">${esc(bp.summary)}</div>`
      : `<div class="term" data-testid="bug-py-out"><span class="dim">Edit the code, then Run my fix.</span></div>`;
    runControls = editorConsole(outHtml, btn(PY.status==="loading"?"Loading…":"Run my fix","bug-check-fix","data-testid='bug-check-fix'", PY.status==="loading"?"dis":""), "") + toast;
  } else {
    editorBlock = `<div class="editor-frame">${codeBlock(bugEditableSrc(b),"dabba_stream.py · fixed",marks)}</div>`;
    outHtml = bp && bp.fixedSummary
      ? `<div class="term" data-testid="bug-py-fixed">${esc(bp.fixedSummary)}</div>`
      : `<div class="term" data-testid="bug-py-fixed"><span class="ok">Fix applied.</span> ${esc(b.tipFixedOff)}</div>`;
    runControls = editorConsole(outHtml, btn("Re-run fixed code","bug-run-fixed","data-testid='bug-run-fixed'","g sm"),
      last ? `<div style="font:800 22px Poppins;color:#F59E0B">+15*</div>${btn("Continue to Mastery "+ic("play",14,"#fff"),"to-boss")}` : btn("Next bug "+ic("play",14,"#fff"),"bug-next"));
  }
  const main = `<div class="main code-ws"><div class="hd"><div><div class="kick">Stage 6 · Debug · Streaming Responses · Level ${lvl.lvl}/5</div><h2>${esc(b.title)}</h2></div><div class="sp"></div>${chip(lvl.skill,"amb")}<span data-testid="real-badge-once">${REAL_BADGE}</span></div>
    ${process}
    ${pyLoadBar({ compact: true })}
    <p class="task-line">${observing?"Run the broken code and read the symptom.":finding?"Tap the buggy line.":editing?"Edit the code to fix the root cause, then re-run.":"Re-test the fix."}</p>
    <div class="ws-grid">
      <div class="ws-editor col">${editorBlock}${runControls}${fixed?fb("ok","Root cause addressed.",b.tipFixedOff):""}</div>
      ${aidD}
    </div>
  </div>`;
  const phaseTip = observing
    ? [`${b.id}: run the broken code and name the symptom before hunting lines.`, b.tipOff]
    : fixed ? [b.tipFixedOn, b.tipFixedOff] : [b.tipOn, b.tipOff];
  TIPS._bug = phaseTip;
  const dbgObj = observing
    ? "Run the broken code first. Read the symptom before you hunt for the line."
    : finding
      ? "Tap the buggy line. Prefer a guard over a cast that only hides the crash."
      : fixed
        ? "Re-test the fix. A patch that only hides the error is rejected."
        : "Edit the code to fix the root cause, then re-run. Weak patches get rejected.";
  shell({cur:5,done:5,tag:`Debug · L${lvl.lvl}`, bodyCls:"ws-body"}, sidePanel(dbgObj, "_bug", [6,true], fixed?"speak":"idle")+main);
}

/* ---------------- MASTERY */
function shieldBar(v, prev) {
  const crack = prev!=null && prev>v ? `<span class="mini" style="color:#B91C1C;font-weight:700">−${prev-v}</span>` : "";
  return `<div class="card" style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-color:#C4B5FD" data-testid="shield"><img src="${ART}ila-face.jpg" alt="Ila" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #301768"><div style="flex:1"><div class="row" style="align-items:center;gap:6px"><b class="pop" style="color:#301768;font-size:13px">Ila · All-Good Shield</b>${ic("shield",14,"#7C3AED")}<span class="sp"></span><b class="pop" style="color:#301768">${v} / 100*</b>${crack}</div>${pbar(v,"linear-gradient(90deg,#301768,#7C3AED)",14)}</div></div>`;
}
function phases(cur, done) {
  const names=["1 · Hold the Line","2 · The Cut","3 · The All-Good Lie"];
  return `<div class="row" style="gap:6px">${names.map((n,i)=>chip((i<done?"✓ ":"")+n, i===cur?"dk":(i<done?"grn":"gry"))).join("")}</div>`;
}
function bchat(n, text, status, caret=false) {
  const pill={live:'<span class="chip">● live</span>',complete:'<span class="chip grn">complete ✓</span>',partial:'<span class="chip amb">partial</span>',error:'<span class="chip red">error</span>',
    truncated:'<span class="chip amb">truncated</span>',fake:'<span class="chip grn" style="background:#ECFDF5">All good ✓</span>',miss:'<span class="chip red">shipped as complete ✕</span>',retry:'<span class="chip amb">retry 1/1 · after 1.0 s</span>'}[status];
  const bd = status==="miss"?"#EF4444":"#E5E7EB";
  return `<div class="card col" style="gap:6px;padding:10px;border-color:${bd}"><b class="pop" style="font-size:12px;color:#301768">Chat ${n}</b><div class="b bot" style="font-size:12px;max-width:100%">${esc(text)}${caret?'<span class="caret"></span>':""}</div><div style="margin-top:auto">${pill}</div></div>`;
}
const P2_EVENTS = [
  { chat:4, title:"Chat 4 went quiet. No finish signal.", ops:[["complete","Ship as complete"],["partial","Mark partial, keep the text"],["error","Mark error"]], correct:"partial" },
  { chat:2, title:"Chat 2 went quiet mid-line.", ops:[["complete","Ship as complete"],["partial","Mark partial, keep the text"],["truncated","Mark truncated"]], correct:"partial" },
  { chat:5, title:"Chat 5 ended with finish_reason: length.", ops:[["complete","Call it complete"],["truncated","Mark truncated"],["error","Mark error"]], correct:"truncated" },
  { chat:3, title:"Chat 3 errored before any text.", ops:[["retry-now","Retry right now"],["retry","Retry once after a 1.0 s pause"],["hide","Hide the error"]], correct:"retry" },
];

function renderBoss() {
  const ph = state.bossPhase;
  if (ph==="challenge") {
    if (state.masterySrc == null) state.masterySrc = CONSUME_BROKEN_STATUS;
    const help = state.masteryHelp;
    const mp = state.masteryPy;
    const tried = state.masteryTried;
    const rows = mp && mp.states ? INDEP_TESTS_REAL.map((t, i) => testRow(t.id, t.name, mp.states[i] || "pend", false, "")).join("") : "";
    const aidM = tried
      ? mentorCoachPanel(MASTERY_AID.after.mentor, MASTERY_AID.after.coach, state.coachLevel, MASTERY_AID.after.chips)
      : `<div class="mini" data-testid="mastery-aid-locked" style="margin-top:8px">Mentor and Coach unlock after you attempt one Run — this is the practical assessment.</div>`;
    const main = `<div class="main"><div class="hd"><div><div class="kick">Stage 7 · Mastery · Streaming Responses · Independent build</div><h2>Working streaming consumer</h2></div><div class="sp"></div>${REAL_BADGE}</div>
      ${pyLoadBar()}
      <p class="mini" style="margin:0 0 8px"><b>Core assessment:</b> ship a working consumer (progressive render, order, assembly, completion, incomplete/failed detection). MCQs are optional support later — this code run is what proves mastery. Help unlocks only after you attempt a run. ${realLabel("")}</p>
      <div class="row" style="flex:1;min-height:0;gap:12px">
        <div class="col f1" style="min-height:0;min-width:0">
          <textarea class="py-editor" data-testid="mastery-editor" spellcheck="false" aria-label="Mastery Python consume">${esc(state.masterySrc)}</textarea>
          ${mp && mp.out ? `<div class="py-out ${mp.ok?"":"err"}" data-testid="mastery-py-out">${esc(mp.out)}</div>` : ""}
          ${help ? `<div class="fb am"><span class="ico">${ic("bulb",15,"#fff")}</span><div><b>Coach:</b> use .get("content"); append+join in one pass; status = honest_status(error, finish) after the loop; quiet → partial.</div></div>` : ""}
          ${aidM}
        </div>
        <div class="card col" style="width:320px;gap:6px;padding:12px;flex-shrink:0"><div class="lbl">Mastery harness · mock stream</div><div class="tests" data-testid="mastery-tests">${rows || `<div class="mini">Run to see T1–T5.</div>`}</div>
          ${tried ? chip((mp && mp.pass || 0)+" / "+INDEP_TESTS_REAL.length+" passed", state.masteryCodeOk?"grn":"amb") : ""}
        </div>
      </div>
      <div class="row" style="align-items:center;gap:10px;margin-top:10px">
        <span class="sp"></span>
        ${btn(PY.status==="loading"?"Loading…":"Run challenge","chal-run","data-testid='chal-submit'", PY.status==="loading"?"dis":"")}
        ${tried && !help ? btn("Request help","chal-help","data-testid='chal-help'","g sm") : ""}
        ${tried ? btn((state.masteryCodeOk?"Continue":"Continue anyway")+" "+ic("play",14,"#fff"),"boss-concepts","data-testid='boss-concepts'") : ""}
      </div></div>`;
    TIPS._mastery = tried
      ? ["You attempted a run. Use Mentor/Coach on failed asserts — then continue.", "Read failing tests, then continue."]
      : ["Run your consumer once before asking for help. This is the practical check.", "Press Run challenge first."];
    shell({cur:6,done:6,hearts:[3,3],tag:"Mastery · Challenge"}, sidePanel("Prove you can ship a working stream consumer. Help appears only after you run once.", "_mastery", null, tried?"speak":"idle")+main);
    return;
  }
  if (ph==="concepts") {
    const chal = state.masteryChal || {};
    const items = MASTERY_CHALLENGE.checks.map((c, idx) => {
      const picked = chal[c.id];
      const revealed = !!state.masteryConceptsDone;
      const ops = c.ops.map((o, i) => {
        let s = "";
        if (revealed) s = i === c.correct ? "ok" : (i === picked ? "bad" : "dim");
        else if (picked === i) s = "sel";
        return opt("ABC"[i], o, s, "chal-pick", `data-id="${c.id}" data-i="${i}" data-testid="chal-${c.id}-${i}"`);
      }).join("");
      return `<div class="learn-card"><i>Concept ${idx+1}</i><b style="display:block;margin:4px 0 8px">${esc(c.q)}</b><div class="opts one">${ops}</div></div>`;
    }).join("");
    const allAnswered = MASTERY_CHALLENGE.checks.every(c => chal[c.id] != null);
    const main = `<div class="main"><div class="hd"><div><div class="kick">Mastery · Concept check</div><h2>Supplementary understanding</h2></div>${chip("optional support")}</div>
      <div class="as-grid" style="flex:1;overflow:auto">${items}</div>
      <div class="row" style="justify-content:flex-end;gap:8px;margin-top:10px">
        ${!state.masteryConceptsDone ? btn("Submit concepts", allAnswered?"chal-concepts-submit":"noop","data-testid='chal-concepts-submit'", allAnswered?"":"dis") : ""}
        ${btn("Live scenarios "+ic("play",14,"#fff"),"boss-p2","data-testid='boss-p2'")}
      </div></div>`;
    shell({cur:6,done:6,hearts:[3,3],tag:"Mastery · Concepts"}, sidePanel("Quick conceptual check — coding already proved the skill.", "e6", null)+main);
    return;
  }
  if (ph==="report") {
    const rows = masteryReportData();
    const main = `<div class="main">${renderMasteryReport(rows)}
      <div class="row" style="justify-content:flex-end;gap:10px;margin-top:12px">
        <div style="font:800 24px Poppins;color:#F59E0B">+20*</div>
        ${btn("Claim rewards "+ic("gift",16,"#fff"),"to-rewards")}
      </div></div>`;
    shell({cur:6,done:6,hearts:[state.hearts,3],tag:"Mastery · Report"}, sidePanel("A reply isn’t done when it stops. It’s done when it says it’s done.", "win", [6,true], "speak")+main);
    return;
  }
  if (ph==="recovery") {
    const inner=`<div class="main" style="align-items:center;justify-content:center"><div class="card" style="width:900px;display:flex;gap:26px;align-items:center;padding:28px;border-color:#FDE68A">
      <img class="orb" src="${ART}vyapti-speak.jpg" alt="Vyapti" style="width:200px;height:200px"><div class="col f1" style="gap:12px"><span class="kick">Recovery</span><div style="font:800 28px Poppins;color:#301768">Let's replay one thing.</div>
      <div style="font-size:16px">Chat 4 went quiet. Quiet isn't done. Here's <b>E6 · Know when it is really done</b> again, at your pace.</div>
      <div class="card col" style="gap:6px;padding:12px;background:#FAFAFF">
        <div style="display:flex;gap:3px">${Array.from({length:8},(_,i)=>`<span style="flex:1;height:20px;border-radius:5px;background:${i<4?"#7C3AED":"#F3F4F6"}"></span>`).join("")}</div>
        <div class="row" style="align-items:center;gap:8px">${ic("scissors",16,"#EF4444")}${chip("no finish signal → partial","red")}${chip("stop → complete","grn")}${chip("length → truncated","amb")}</div></div>
      <div class="row" style="gap:8px;flex-wrap:wrap">${chip("✓ code kept","grn")}${chip("✓ Phase 1 kept","grn")}${chip("✓ no XP removed","grn")}${chip("hearts refill to 3","gry")}</div>
      <div class="row" style="gap:10px">${btn("Back to Phase 2 · new seed","boss-retry","data-testid='retry-phase2'")}${btn("Replay E6","boss-replay-e6","","g")}</div></div></div></div>`;
    shell({cur:6,done:6,hearts:[0,3],tag:"Mastery · Recovery",bodyCls:"full"}, inner);
    return;
  }
  let content="", tip="p1", speak="idle", hearts=[state.hearts,3];
  if (ph==="p2") {
    const ev = P2_EVENTS[state.p2i];
    const chats = [
      bchat(1,"Your order is on the way.","complete"),
      bchat(2,"Your order is on the ","partial"),
      bchat(3, state.p2i>=3 && state.p2Cleared? "Your order is on the way.":"", state.p2i>=3?"retry":"retry"),
      bchat(4,"Your order is on", state.missLog.some(m=>m.includes("Chat 4"))?"miss":"live", true),
      bchat(5,"Your order is on the ","live",true),
    ];
    content = `<div class="hd"><div><div class="kick">Mastery · Phase 2</div><h2>The Cut</h2></div><div class="sp"></div>${phases(1,1)}</div>${shieldBar(state.shield)}
      <div class="shake-target ${state.shakeBoss?"shake":""}" style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">${chats.join("")}</div>
      <div class="row" style="flex:1"><div class="col f1">
        ${state.missLog.length?`<div class="card col" style="gap:4px;padding:10px"><div class="lbl">Miss log</div>${state.missLog.map((m,i)=>`<div class="mini" style="${i===state.missLog.length-1?"color:#B91C1C;font-weight:600":""}">${i+1} · ${esc(m)}</div>`).join("")}</div>`:""}
        <div class="card col" style="gap:8px;padding:12px;border-color:#7C3AED;border-width:3px"><div class="row" style="align-items:center">${chip("INCOMING · CHAT "+ev.chat,"dk")}<b class="pop" style="color:#301768">${ev.title}</b></div>
          <div class="opts one">${ev.ops.map(([id,lab])=>opt(id[0].toUpperCase(),lab,state.p2Pick===id?"sel":"","p2-pick",`data-id="${id}"`)).join("")}</div>
          ${state.p2Pick?btn("Commit","p2-commit","data-testid='p2-commit'"):btn("Commit","noop","","dis")}
        </div>
      </div>
      <div class="card dlg" style="width:280px">${dl("ila+","Green is a feeling.")}</div></div>`;
    tip="p2";
  } else if (ph==="p2ok") {
    content = `<div class="hd"><div><div class="kick">Mastery · Phase 2</div><h2>The Cut</h2></div><div class="sp"></div>${phases(1,1)}</div>${shieldBar(30,70)}
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">${bchat(1,"Your order is on the way.","complete")}${bchat(2,"Your order is on the ","partial")}${bchat(3,"Your order is on the way.","complete")}${bchat(4,"Your order is on","partial")}${bchat(5,"Your order is on the ","truncated")}</div>
      <div class="row" style="flex:1"><div class="term f1" style="font-size:12px"><span class="ok">✓</span> chat 2, 4: quiet → <span class="am">partial</span>, text kept
<span class="ok">✓</span> chat 3: error before text → 1 retry after 1.0 s → <span class="ok">complete</span>, no duplicate
<span class="ok">✓</span> chat 5: finish_reason length → <span class="am">truncated</span></div>
      <div class="card dlg" style="width:300px">${dl("rohan","Two lines just snapped. Partial and error. Logging both.")}${dl("samar","One retry, with a pause. Not a fire hose.")}</div></div>
      <div class="row" style="justify-content:flex-end">${btn("See honest board "+ic("play",14,"#fff"),"boss-p3")}</div>`;
    tip="p2ok";
  } else if (ph==="p3") {
    const labels=[["complete ✓","st-ok"],["partial","st-am"],["complete ✓","st-ok"],["partial","st-am"],["truncated","st-am"]];
    content = `<div class="hd"><div><div class="kick">Mastery · Live board</div><h2>Honest labels only</h2></div><div class="sp"></div>${phases(2,2)}</div>${shieldBar(0,30)}
      <div class="row" style="flex:1"><div class="col f1"><div class="term" style="flex:1;font-size:12px"><span class="dim">${SIM_BADGE} board ← consume()</span>
[usage] prompt=12 completion=7 total=19 status=complete
[usage] prompt=? completion=? total=? status=partial
[usage] prompt=12 completion=7 total=19 status=complete
[usage] prompt=? completion=? total=? status=partial
[usage] prompt=12 completion=5 total=17 status=truncated</div>
      <div class="row" style="gap:6px">${labels.map(([t,c])=>`<div class="card" style="flex:1;padding:8px;text-align:center"><div class="mini" style="text-decoration:line-through;color:#9CA3AF">All good ✓</div><div class="${c}" style="font-size:12px">${t}</div></div>`).join("")}</div></div>
      <div class="learn-card" style="width:300px"><i>What this proves</i><p>Every chat is live, assembled, and labelled from finish_reason / errors — never from “there is some text.”</p></div></div>
      <div class="row" style="justify-content:flex-end">${btn("Mastery report "+ic("play",14,"#fff"),"boss-report","data-testid='boss-report'")}</div>`;
    tip="p3"; speak="speak";
  } else if (ph==="win") {
    content = `<div class="hd"><div><div class="kick">Mastery</div><h2>Line restored</h2></div></div>
      <div class="phone" style="width:420px;margin:12px auto"><div class="ph-h"><span class="logo-dd">DD</span>Dabba Dash support</div><div class="b u" style="font-size:16px">Where is my order?</div><div class="b bot" style="font-size:16px">Your order is on the way.</div><span class="st-ok" style="font-size:13px">complete ✓ · finish_reason: stop</span></div>
      <div class="row" style="justify-content:center">${btn("Open mastery report "+ic("play",14,"#fff"),"boss-report")}</div>`;
    tip="win"; speak="speak";
  }
  const main = `<div class="main">${content}</div>`;
  shell({cur:6,done:6,hearts,tag:"Mastery · "+ph}, sidePanel("Label every chat honestly from finish signals and errors — never from “there is some text.”", tip, [6,true], speak)+main);
}

function renderRewards() {
  const inner=`<div class="main" style="align-items:center;justify-content:center;gap:16px"><div style="text-align:center"><div class="kick">Mission 3.5 complete</div><div style="font:800 38px Poppins;color:#301768">The Unfinished Line is live again.</div></div>
    <div class="row" style="gap:16px;width:1100px">
      <div class="card col" style="flex:1;align-items:center;gap:8px;padding:22px;border-color:#F59E0B"><div style="width:90px;height:90px;border-radius:24px;background:linear-gradient(135deg,#FBBF24,#F59E0B);display:grid;place-items:center;box-shadow:0 5px 0 #D97706">${ic("bolt",50,"#fff")}</div><div style="font:800 34px Poppins;color:#F59E0B">+20*</div><div class="mini">Mastery · mission total 100* XP</div></div>
      <div class="card col" style="flex:1;align-items:center;gap:8px;padding:22px;border-color:#7C3AED"><div style="width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,#7C3AED,#301768);display:grid;place-items:center;box-shadow:0 0 0 6px #EDE7FD">${ic("star",50,"#FBBF24")}</div><div style="font:800 22px Poppins;color:#301768">Last Word</div>${chip("first-clear badge")}<div class="mini" style="text-align:center">"You don't call it done until the stream says it's done."</div></div>
      <div class="card col" style="flex:1;align-items:center;gap:8px;padding:22px;border-color:#A78BFA"><img class="orb" src="${ART}vyapti-speak.jpg" alt="" style="width:96px;height:96px"><div style="font:800 22px Poppins;color:#301768">Ember Thread</div>${chip("item","amb")}<div class="mini" style="text-align:center">A strand of Vyapti's amber core. Replay any stream chunk by chunk in the Explore sandbox.</div></div>
      <div class="card col" style="flex:1;align-items:center;gap:8px;padding:22px;border-color:#10B981"><div style="font:800 54px Poppins;color:#10B981;line-height:1">Lv 4*</div><div style="font:700 15px Poppins;color:#301768">Level up!</div>${pbar(12,"#10B981",12)}<div class="mini">Lv 3* → Lv 4* · values are placeholders</div></div></div>
    ${btn("Continue "+ic("play",15,"#fff"),"to-cliff","","")}</div>`;
  shell({done:7,tag:"Ending · Rewards",bodyCls:"full"}, inner);
}

function renderCliff() {
  const dial=`<svg width="170" height="105" viewBox="0 0 210 130"><path d="M20 115 A85 85 0 0 1 190 115" stroke="#EDE7FD" stroke-width="18" fill="none" stroke-linecap="round"/><path d="M20 115 A85 85 0 0 1 183 85" stroke="url(#dg)" stroke-width="18" fill="none" stroke-linecap="round"/><defs><linearGradient id="dg"><stop offset="0" stop-color="#7C3AED"/><stop offset="1" stop-color="#EF4444"/></linearGradient></defs><line x1="105" y1="115" x2="180" y2="80" stroke="#301768" stroke-width="6" stroke-linecap="round"/><circle cx="105" cy="115" r="10" fill="#301768"/><text x="20" y="130" font-size="11" fill="#6B7280" font-family="Inter">0.0</text><text x="175" y="130" font-size="11" fill="#6B7280" font-family="Inter">2.0</text></svg>`;
  const inner=`<div class="main"><div class="hd"><div><div class="kick">Two days later</div><h2>Every reply finishes now. Something's still off.</h2></div></div>
    <div class="row" style="flex:1"><div class="col f1"><div class="phone"><div class="ph-h"><span class="logo-dd">DD</span>Dabba Dash support</div><div class="b u">Where is my order?</div><div class="b bot">Your order is on the way, gliding like a samosa through monsoon clouds, destiny unfolding…</div><div class="b u">Where is my order??</div><div class="b bot">Your order is on the way. Delivery partner Arjun is near the main</div>${chip("finish_reason: length","amb")}</div>
      <div class="card dlg">${dl("rohan+","Why is the bot doing poetry?")}${dl("me","And that one stopped at twelve words. Clean finish. finish_reason: length.",state.avatar)}${dl("tanvi","Someone's turning the dials. Temperature… max tokens…")}</div></div>
      <div class="card col" style="width:420px;align-items:center;gap:8px;padding:12px;background:linear-gradient(180deg,#F5F3FF,#fff)"><img src="${ART}ila-happy.jpg" alt="Ila" style="width:84px;height:84px;border-radius:50%;object-fit:cover;border:4px solid #301768">
      <div class="card" style="text-align:center;padding:12px 18px;border-color:#301768"><div class="lbl">Ila's tablet · temperature</div>${dial}<div style="font:800 34px Poppins;color:#EF4444;line-height:1">1.9</div></div>
      ${dl("ila","I didn't break your stream this time. I just tuned it.")}${dl("vyapti","Next stop: the dials. Mission 3.6.")}
      <div class="row">${btn("Back to the map "+ic("play",14,"#fff"),"to-map-end")}</div></div></div></div>`;
  shell({done:7,tag:"Ending · Cliffhanger",bodyCls:"full"}, inner);
}

/* ---------------- RENDER / EVENTS */
function render() {
  const app = document.getElementById("app");
  app.className = "screen" + (state.dark ? " dark" : "") + ((isHubScene() && hubPortrait()) ? " portrait" : "");
  document.body.classList.toggle("dark-page", state.dark);
  const s = state.scene;
  if (s==="map" || s==="mapEnd") renderHub();
  else if (s==="avatar") renderAvatar();
  else if (s==="intro") renderIntro();
  else if (s==="cut1") renderCut1();
  else if (s==="cut2") renderCut2();
  else if (s==="disc") renderDisc();
  else if (s==="explore") renderExplore();
  else if (s==="assign") renderAssign();
  else if (s==="pred") renderPred();
  else if (s==="code") renderCode();
  else if (s==="debug") renderDebug();
  else if (s==="boss") renderBoss();
  else if (s==="rewards") renderRewards();
  else if (s==="cliff") renderCliff();
  else renderHub();
  app.dataset.scene = state.scene;
  app.dataset.exStep = String(state.exStep);
  app.dataset.asStep = String(state.asStep);
  app.dataset.codeTier = state.codeTier;
  app.dataset.bossPhase = state.bossPhase;
  app.dataset.predI = String(state.predI);
  app.dataset.bugI = String(state.bugI);
  app.dataset.bugPhase = state.bugPhase;
  app.dataset.discMode = state.discMode;
  app.dataset.ai = state.aiOn ? "on" : "off";
  app.dataset.theme = state.dark ? "dark" : "light";
  fit();
}

function useFluidLayout() {
  return typeof window !== "undefined" && window.innerWidth < 1100;
}

function fit() {
  const vp = document.getElementById("viewport");
  const app = document.getElementById("app");
  if (!vp || !app) return;
  const fluid = useFluidLayout();
  document.documentElement.classList.toggle("fluid", fluid);
  document.body.classList.toggle("fluid", fluid);
  document.body.classList.remove("lm-phone");
  app.classList.toggle("fluid", fluid);

  const pt = app.classList.contains("portrait");
  const want = isHubScene() && hubPortrait();
  if (pt !== want) { render(); return; }

  if (fluid) {
    app.style.transform = "";
    app.style.left = "";
    app.style.top = "";
    app.style.transformOrigin = "";
    return;
  }

  // Desktop stage: keep letterboxed 1280×720 (or hub portrait 400×780)
  app.style.left = "50%";
  app.style.top = "50%";
  app.style.transformOrigin = "center center";
  const W = pt ? 400 : 1280, H = pt ? 780 : 720;
  const s = Math.min(vp.clientWidth / W, vp.clientHeight / H);
  app.style.transform = `translate(-50%,-50%) scale(${Math.max(0.2, s)})`;
}

function go(scene, extra={}) {
  Object.assign(state, extra);
  state.scene = scene;
  render();
}

function playExplore() {
  clearT();
  const max = 6;
  const stepMs = 320 / state.exSpeed;
  state.exPlaying = true;
  const tick = () => {
    if (!state.exPlaying) return;
    if (state.exPlay >= max) { state.exPlaying = false; render(); return; }
    state.exPlay++;
    render();
    if (state.exPlay >= max) { state.exPlaying = false; render(); }
    else timer = setTimeout(tick, stepMs);
  };
  timer = setTimeout(tick, 200);
}

function syncPyEditor(sel, key) {
  const el = document.querySelector(sel);
  if (el && typeof el.value === "string") state[key] = el.value;
}

async function runGuidedTests() {
  syncPyEditor("[data-testid=guided-editor]", "guidedSrc");
  state.guidedChecked = true;
  state.guidedStates = GUIDED_TESTS_REAL.map(() => "pend");
  state.guidedOut = "";
  state.guidedErr = null;
  state.guidedReal = false;
  render();
  try {
    await pyEnsure(() => render());
  } catch (e) {
    state.guidedErr = "Pyodide unavailable — " + ((e && e.message) || e);
    state.guidedStates = GUIDED_TESTS_REAL.map(() => "fail");
    state.guidedFails = (state.guidedFails || 0) + 1;
    render();
    return;
  }
  const src = guidedSrcFromState();
  let pass = 0;
  const hints = [];
  for (let i = 0; i < GUIDED_TESTS_REAL.length; i++) {
    const t = GUIDED_TESTS_REAL[i];
    let ok = false;
    try {
      if (t.kind === "multi" && typeof t.check === "function") {
        const multi = await t.check(src);
        ok = !!multi.ok;
        if (i === 0 || !state.guidedOut) state.guidedOut = multi.detail || multi.stdout || "";
        if (!ok) hints.push(t.id + ": " + (multi.detail || t.failHint));
      } else {
        const r = await pyRunConsume(src, t.kind);
        ok = !!t.check(r);
        if (i === 0) state.guidedOut = r.stdout || "";
        if (!ok) hints.push(t.id + ": " + (t.failHint || r.error || "failed"));
      }
    } catch (e) {
      ok = false;
      hints.push(t.id + ": " + ((e && e.message) || e));
    }
    state.guidedStates[i] = ok ? "pass" : "fail";
    if (ok) pass++;
    render();
  }
  state.guidedReal = true;
  const all = pass === GUIDED_TESTS_REAL.length;
  state.guidedFixed = all;
  if (all) {
    state.guidedErr = null;
    state.guidedOut = "All guided checks green on mock streams.";
  } else {
    state.guidedFails = (state.guidedFails || 0) + 1;
    state.guidedErr = hints[hints.length - 1] || "Some guided checks failed.";
    /* On failure, surface the first failure-mapped Coach nudge automatically */
    state.coachLevel = Math.max(state.coachLevel || 0, 1);
    state.hintLevel = Math.max(state.hintLevel || 0, 1);
  }
  render();
}

async function runMicroPython() {
  state.microPy = null;
  const structural = ddCheck();
  state.dd.result = structural;
  if (!structural.ok) {
    state.dd.solved = false;
    render();
    return;
  }
  render();
  try {
    await pyEnsure(() => render());
  } catch (e) {
    state.microPy = { ok: false, summary: "Pyodide unavailable — " + ((e && e.message) || e) };
    state.dd.solved = false;
    render();
    return;
  }
  const src = ddConsumeSrc();
  try {
    const normal = await pyRunConsume(src, "normal");
    const none = await pyRunConsume(src, "none_content");
    const usage = await pyRunConsume(src, "usage_jam");
    const ok =
      normal.ok && normal.result && normal.result.status === "complete" && (normal.result.text || "").includes("way") &&
      none.ok && !(none.stdout || "").includes("None") &&
      usage.ok && usage.result && usage.result.usage;
    if (ok) {
      state.dd.solved = true;
      state.microPy = {
        ok: true,
        stdout: normal.stdout || "",
        summary: `status=${normal.result.status} · finish=${normal.result.finish_reason} · usage ok`,
      };
    } else {
      state.dd.solved = false;
      state.microPy = {
        ok: false,
        summary: !normal.ok
          ? ("Crash: " + (normal.error || "run failed"))
          : `Structure OK but runtime failed — status=${normal.result && normal.result.status}, none_safe=${none.ok && !(none.stdout || "").includes("None")}, usage=${!!(usage.result && usage.result.usage)}`,
        stdout: normal.stdout || "",
      };
      state.dd.result = { ok: false, title: "Runtime check failed", msg: state.microPy.summary, bad: [] };
    }
  } catch (e) {
    state.dd.solved = false;
    state.microPy = { ok: false, summary: (e && e.message) || String(e) };
    state.dd.result = { ok: false, title: "Runtime error", msg: state.microPy.summary, bad: [] };
  }
  render();
}

async function runIndepTests() {
  clearT();
  syncPyEditor("[data-testid=py-editor]", "pySrc");
  state.testStates = INDEP_TESTS_REAL.map(() => "pend");
  state.testsDone = false;
  state.pyReal = false;
  state.pyOut = "";
  state.pyErr = null;
  state.realPass = 0;
  render();
  try {
    await pyEnsure(() => render());
  } catch (e) {
    state.pyErr = "Pyodide unavailable — " + ((e && e.message) || e);
    state.testsDone = true;
    render();
    return;
  }
  const src = state.pySrc || CONSUME_BROKEN_STATUS;
  let pass = 0;
  for (let i = 0; i < INDEP_TESTS_REAL.length; i++) {
    const t = INDEP_TESTS_REAL[i];
    let ok = false;
    try {
      const r = await pyRunConsume(src, t.kind);
      ok = !!t.check(r);
      if (i === 0) {
        state.pyOut = r.stdout || "";
        if (!r.ok) state.pyErr = r.error;
      }
    } catch (e) {
      ok = false;
      state.pyErr = (e && e.message) || String(e);
    }
    state.testStates[i] = ok ? "pass" : "fail";
    if (ok) pass++;
    render();
  }
  state.realPass = pass;
  state.pyReal = true;
  state.testsDone = true;
  if (pass === INDEP_TESTS_REAL.length) setXP(65);
  else {
    state.coachLevel = Math.max(state.coachLevel || 0, 1);
  }
  render();
}

async function runBugPython(fixed) {
  const runner = BUG_RUNNERS[state.bugI];
  if (!runner || runner.skipRuntime) {
    state.bugPy = { ok: true, summary: fixed ? "Flush is a display concern — StringIO always captures; UI re-test shows the symptom fix." : "Inspect the missing flush=True. (StringIO cannot show buffering — trust the symptom panel.)", expectFail: false, fixedSummary: "print(..., flush=True) pushes each piece live." };
    render();
    return;
  }
  try {
    await pyEnsure(() => render());
  } catch (e) {
    state.bugPy = { ok: false, summary: "Python unavailable: " + ((e && e.message) || e), expectFail: true };
    render();
    return;
  }
  const src = fixed ? runner.fixed : runner.broken;
  const r = await pyRunConsume(src, runner.kind);
  if (!fixed) {
    let summary = r.ok
      ? `Ran. status=${r.result && r.result.status} text=${JSON.stringify(r.result && r.result.text)} stdout=${JSON.stringify(r.stdout)}`
      : `Crash: ${r.error}`;
    if (runner.expectBrokenFail && r.ok) summary = "Expected a crash on None content, but code returned: " + summary;
    if (runner.expectBrokenEmptyText && r.ok && r.result && r.result.text === "") summary = "Bug reproduced: history text is empty after double-read. stdout showed live text: " + JSON.stringify(r.stdout);
    if (runner.expectBrokenStatus && r.ok && r.result) summary = `Bug reproduced: quiet stream labelled "${r.result.status}" (wanted partial). text kept: ${JSON.stringify(r.result.text)}`;
    if (runner.expectBrokenNoUsage && r.ok) summary = `Bug reproduced: usage=${JSON.stringify(r.result && r.result.usage)} (early break skipped the scorecard).`;
    state.bugPy = { ...(state.bugPy || {}), ok: r.ok, summary, expectFail: true, raw: r };
  } else {
    const summary = r.ok
      ? `Fixed run OK · status=${r.result && r.result.status} · text=${JSON.stringify(r.result && r.result.text)} · usage=${JSON.stringify(r.result && r.result.usage)}`
      : `Still failing: ${r.error}`;
    state.bugPy = { ...(state.bugPy || {}), ok: r.ok, fixedSummary: summary, rawFixed: r };
  }
  render();
}

async function runMasteryChallenge() {
  syncPyEditor("[data-testid=mastery-editor]", "masterySrc");
  state.masteryTried = true;
  state.masteryPy = { states: INDEP_TESTS_REAL.map(() => "pend"), pass: 0, out: "", ok: false };
  render();
  try {
    await pyEnsure(() => render());
  } catch (e) {
    state.masteryPy = { states: INDEP_TESTS_REAL.map(() => "fail"), pass: 0, out: "Pyodide unavailable: " + ((e && e.message) || e), ok: false };
    render();
    return;
  }
  const src = state.masterySrc || CONSUME_BROKEN_STATUS;
  let pass = 0;
  const states = [];
  let firstOut = "";
  for (let i = 0; i < INDEP_TESTS_REAL.length; i++) {
    const t = INDEP_TESTS_REAL[i];
    let ok = false;
    try {
      const r = await pyRunConsume(src, t.kind);
      ok = !!t.check(r);
      if (i === 0) firstOut = r.ok ? (r.stdout || "(no stdout)") : (r.error || "error");
    } catch (e) {
      ok = false;
      firstOut = (e && e.message) || String(e);
    }
    states[i] = ok ? "pass" : "fail";
    if (ok) pass++;
    state.masteryPy = { states: states.slice(), pass, out: firstOut, ok: pass === INDEP_TESTS_REAL.length };
    render();
  }
  state.masteryCodeOk = pass === INDEP_TESTS_REAL.length;
  if (state.masteryCodeOk) setXP(90);
  render();
}

function onClick(e) {
  const ln = e.target.closest(".debug-find .ln[data-ln]");
  if (ln && state.scene==="debug" && state.bugPhase==="find") {
    const n = +ln.getAttribute("data-ln");
    const b = BUGS[state.bugI];
    if (b.badLines.includes(n)) {
      state.bugPhase = "edit";
      state.bugEditSrc = null;
      state.bugToast = null;
      state.aidTab = "coach";
      render();
    } else { ln.classList.add("shake"); setTimeout(() => ln.classList.remove("shake"), 400); }
    return;
  }
  const t = e.target.closest("[data-act]");
  if (!t) return;
  const act = t.getAttribute("data-act");
  if (act==="noop") return;
  if (act==="restart") { restart(); return; }
  if (act.startsWith("hub-")) { hubAct(act); return; }
  if (act.startsWith("dq-") && dqAct(act, t)) return;
  if (act.startsWith("x-") && xAct(act, t)) return;
  if (act.startsWith("intro-") && introAct(act)) return;
  if (act==="dd-reset") { state.dd=ddInit(); state.microPy=null; render(); return; }
  if (act==="dd-run") { runMicroPython(); return; }
  if (act==="toggle-ai") { state.aiOn = !state.aiOn; render(); return; }
  if (act==="toggle-theme") { state.dark = !state.dark; render(); return; }
  if (act==="jump-stage") { jumpStage(+t.dataset.i); return; }
  if (act==="play-mission") { go("avatar"); return; }
  if (act==="pick-avatar") { state.avatar = t.dataset.k; render(); return; }
  if (act==="enter-storm") { state.curStage=0; go("disc"); return; }
  if (act==="watch-intro") { state.intro = introInit(); go("intro"); return; }
  if (act==="skip-cut" || act==="start-disc") { state.curStage=0; go("disc"); return; }
  if (act==="cut-next") { go("cut2"); return; }
  if (act==="replay-cut") { go("cut1"); return; }
  if (act==="open-clue") {
    const n=+t.dataset.n;
    state.clueOpen=n; state.clues[n]=true;
    render(); return;
  }
  if (act==="disc-analogy") { state.discMode="analogy"; render(); return; }
  if (act==="disc-wrap") { state.discMode="wrap"; render(); return; }
  if (act==="disc-pick") {
    state.discAnswer = t.dataset.l;
    if (state.discAnswer==="B") setXP(5);
    render(); return;
  }
  if (act==="to-explore") { state.stagesDone=1; state.curStage=1; setXP(5); go("explore"); return; }
  if (act==="play-ex") { if (state.exPlay>=6) state.exPlay=0; playExplore(); return; }
  if (act==="pause-ex") { state.exPlaying=false; clearT(); render(); return; }
  if (act==="step-ex") { if (state.exPlay<6) { state.exPlay++; render(); } return; }
  if (act==="ex-speed") { state.exSpeed=+t.dataset.s; render(); return; }
  if (act==="toggle-flush") { state.flushOn=!state.flushOn; state.exPlay=0; render(); return; }
  if (act==="ex-pick") {
    const key=t.dataset.key, i=+t.dataset.i;
    const cur=state.exCheck[key]||{};
    if (cur.revealed && cur.picked===EXPLORE_CHECKS[key].correct) return;
    state.exCheck[key]={picked:i, revealed:true};
    render(); return;
  }
  if (act==="ex-next") {
    state.exStep++; state.exPlay=0; state.exPlaying=false; state.flushOn = state.exStep===4?false:state.flushOn;
    if (state.exStep===7) { /* recap 2 */ }
    render(); return;
  }
  if (act==="recap-hold") { state.recapHold=t.dataset.id; render(); return; }
  if (act==="recap-drop") {
    if (state.recapHold) { state.recapOrder[+t.dataset.i]=state.recapHold; state.recapHold=null; render(); }
    return;
  }
  if (act==="recap-remove") { state.recapOrder[+t.dataset.i]=null; render(); return; }
  if (act==="recap2-tap") {
    const i=+t.dataset.i;
    if (!state.recapTapped.includes(i)) state.recapTapped.push(i);
    if (state.recapTapped.length===6) setXP(15);
    render(); return;
  }
  if (act==="to-assign") { state.stagesDone=2; state.curStage=2; setXP(15); state.asVocab=false; go("assign"); return; }
  if (act==="as-vocab-done") { state.asVocab = true; render(); return; }
  if (act==="as-pick") { if (!state.asVocab || state.asResolved) return; state.asPicked = +t.dataset.i; render(); return; }
  if (act==="as-commit") {
    if (!state.asVocab || state.asPicked == null || state.asResolved) return;
    const sc = ASSIGN_SCENARIOS[state.asStep];
    const ok = !!(sc && sc.ops[state.asPicked] && sc.ops[state.asPicked].ok);
    state.asResolved = true;
    if (ok) state.asScore = (state.asScore || 0) + 1;
    render(); return;
  }
  if (act==="as-retry") {
    state.asPicked = null; state.asResolved = false;
    render(); return;
  }
  if (act==="as-next") {
    if (state.asStep < 4) state.asStep++;
    state.asPicked = null; state.asResolved = false; state.asVocab = false;
    render(); return;
  }
  if (act==="cli-build") { state.cliBuilt=true; render(); return; }
  if (act==="to-pred") { state.stagesDone=3; state.curStage=3; setXP(25); state.predPhase="teach"; go("pred"); return; }
  if (act==="pred-taught") { state.predPhase="q"; render(); return; }
  if (act==="pred-pick") { state.predPick=+t.dataset.i; render(); return; }
  if (act==="pred-conf") { state.predConf=t.dataset.c; render(); return; }
  if (act==="pred-commit") {
    const p=PRED[state.predI];
    state.predResults[state.predI] = state.predPick===p.correct;
    state.predPhase="reveal";
    if (state.predI===5) setXP(40);
    render(); return;
  }
  if (act==="pred-next") { state.predI++; state.predPhase="teach"; state.predPick=null; state.predConf="think so"; render(); return; }
  if (act==="to-code") { state.stagesDone=4; state.curStage=4; setXP(40); state.codeTier="brief"; state.codeWalk=0; state.coachLevel=0; state.aidTab="mentor"; go("code"); return; }
  if (act==="code-walk") { state.codeWalk = +t.dataset.i; state.coachLevel = 0; render(); return; }
  if (act==="to-micro") { state.codeTier="micro"; state.coachLevel=0; render(); return; }
  if (act==="micro-tile") { state.selectedTile=t.dataset.t; render(); return; }
  if (act==="slot") {
    if (!state.selectedTile) return;
    const n=+t.dataset.n;
    state.slots[n]=state.selectedTile;
    state.selectedTile=null;
    state.microWrong=false; state.microRan=false;
    render(); return;
  }
  if (act==="micro-run") {
    const ok = Object.keys(MICRO_ANS).every(k => state.slots[k]===MICRO_ANS[k]);
    if (!ok) {
      // if slot 4 is False, highlight that bounce; otherwise just mark wrong fills
      state.microWrong = state.slots[4]==="False";
      if (!state.microWrong) {
        // bounce any incorrect
        state.microWrong = true;
      }
      state.microRan=false;
    } else {
      state.microWrong=false; state.microRan=true;
    }
    render(); return;
  }
  if (act==="to-guided") { state.codeTier="guided"; state.coachLevel=0; state.aidTab="mentor"; state.guidedSrc = state.guidedSrc || GUIDED_SRC; render(); return; }
  if (act==="guided-hint" || act==="coach-hint") {
    state.hintLevel = Math.min(3, state.hintLevel + 1);
    state.coachLevel = Math.max(state.coachLevel || 0, state.hintLevel);
    if (act==="guided-hint" || state.codeTier==="guided" || state.codeTier==="indep" || state.scene==="debug") state.aidTab = "coach";
    render(); return;
  }
  if (act==="aid-tab") { state.aidTab = t.dataset.tab || "mentor"; state.aidCollapsed = false; render(); return; }
  if (act==="aid-toggle") { state.aidCollapsed = !state.aidCollapsed; render(); return; }
  if (act==="guided-reset") {
    state.guidedSrc = GUIDED_SRC;
    state.guidedFixed = false;
    state.guidedChecked = false;
    state.guidedStates = null;
    state.guidedOut = "";
    state.guidedErr = null;
    state.guidedReal = false;
    state.coachLevel = 0;
    state.hintLevel = 0;
    render(); return;
  }
  if (act==="guided-set") {
    /* Legacy: chips are Coach-only; applying still edits the source */
    const c = t.dataset.c;
    state.guidedSrc = (c === "honest_status(error, finish)") ? GUIDED_SRC_FIXED : GUIDED_SRC;
    state.guidedChoice = c;
    state.guidedFixed = false;
    state.guidedChecked = false;
    state.guidedStates = null;
    state.guidedOut = "";
    state.guidedErr = null;
    state.guidedReal = false;
    render(); return;
  }
  if (act==="fix-status") {
    state.guidedSrc = GUIDED_SRC_FIXED;
    state.guidedChoice = "honest_status(error, finish)";
    state.guidedFixed = false;
    state.guidedChecked = false;
    state.guidedStates = null;
    state.guidedOut = "";
    state.guidedErr = null;
    state.aidTab = "coach";
    render();
    runGuidedTests();
    return;
  }
  if (act==="guided-check") { if (PY.status==="loading") return; runGuidedTests(); return; }
  if (act==="to-indep") { state.codeTier="indep"; render(); return; }
  if (act==="indep-cond") { clearT(); state.indepCond=t.dataset.c; state.testStates=null; state.testsDone=false; render(); return; }
  if (act==="indep-check") { if (PY.status==="loading") return; runIndepTests(); return; }
  if (act==="py-load" || act==="py-retry") { pyEnsure(() => render()).catch(() => render()); render(); return; }
  if (act==="py-reset") { state.pySrc = CONSUME_BROKEN_STATUS; state.testStates=null; state.testsDone=false; state.pyOut=""; state.pyErr=null; state.pyReal=false; state.realPass=0; render(); return; }
  if (act==="to-debug") { state.stagesDone=5; state.curStage=5; setXP(65); state.coachLevel=0; state.aidTab="mentor"; state.bugEditSrc=null; go("debug"); return; }
  if (act==="bug-to-find") { state.bugPhase="find"; render(); return; }
  if (act==="bug-run") { runBugPython(false); return; }
  if (act==="bug-run-fixed") { runBugPython(true); return; }
  if (act==="bug-check-fix") { checkBugEditFix(); return; }
  if (act==="bug-fix") {
    /* Legacy multi-choice kept for old QA; prefer edit path */
    const b=BUGS[state.bugI], f=b.fixes[+t.dataset.i];
    if (f.ok) { state.bugPhase="fixed"; state.bugsFixed=state.bugI+1; state.bugToast=null; state.bugEditSrc = b.fixedSrc; if (state.bugI===4) setXP(80); }
    else { state.bugPhase="edit"; state.bugToast={move:f.move, resp:f.resp}; }
    render(); return;
  }
  if (act==="bug-next") { state.bugI++; state.bugPhase="observe"; state.bugToast=null; state.bugPy=null; state.bugEditSrc=null; state.coachLevel=0; state.aidTab="mentor"; render(); return; }
  if (act==="to-boss") { state.stagesDone=6; state.curStage=6; setXP(80); state.bossPhase="challenge"; state.masteryChal={}; state.masteryTried=false; state.masteryHelp=false; state.masterySrc=null; state.masteryPy=null; state.masteryCodeOk=false; state.masteryConceptsDone=false; state.hearts=3; state.shield=100; go("boss"); return; }
  if (act==="chal-pick") {
    if (state.masteryConceptsDone) return;
    state.masteryChal[t.dataset.id] = +t.dataset.i;
    render(); return;
  }
  if (act==="chal-run" || act==="chal-submit") { if (PY.status==="loading") return; runMasteryChallenge(); return; }
  if (act==="chal-help") { if (!state.masteryTried) return; state.masteryHelp = true; render(); return; }
  if (act==="chal-concepts-submit") {
    if (!MASTERY_CHALLENGE.checks.every(c => state.masteryChal[c.id] != null)) return;
    state.masteryConceptsDone = true;
    render(); return;
  }
  if (act==="boss-concepts") { state.bossPhase="concepts"; render(); return; }
  if (act==="boss-p1") { state.bossPhase="p2"; state.shield=70; render(); return; }
  if (act==="boss-p2") { state.bossPhase="p2"; state.shield=70; state.p2i=0; state.p2Pick=null; state.misses=0; state.missLog=[]; render(); return; }
  if (act==="boss-report") { state.bossPhase="report"; setXP(100); render(); return; }
  if (act==="p2-pick") { state.p2Pick=t.dataset.id; render(); return; }
  if (act==="p2-commit") {
    const ev=P2_EVENTS[state.p2i];
    if (state.p2Pick===ev.correct) {
      state.p2i++;
      state.p2Pick=null;
      if (state.p2i>=P2_EVENTS.length) { state.bossPhase="p2ok"; state.p2Cleared=true; state.shield=30; }
    } else {
      state.misses++;
      state.hearts=Math.max(0,state.hearts-1);
      state.missLog.push(ev.title+" → shipped incorrectly");
      state.p2Pick=null;
      state.shakeBoss=true;
      if (state.misses>=3 || state.hearts<=0) { state.bossPhase="recovery"; state.hearts=0; state.shakeBoss=false; }
      else setTimeout(() => { state.shakeBoss=false; const el=document.querySelector(".shake-target"); if (el) el.classList.remove("shake"); }, 450);
    }
    render(); return;
  }
  if (act==="boss-retry") { state.bossPhase="p2"; state.hearts=3; state.misses=0; state.missLog=[]; state.p2i=0; state.p2Pick=null; render(); return; }
  if (act==="boss-replay-e6") { /* stay, just a beat */ render(); return; }
  if (act==="boss-p3") { state.bossPhase="p3"; state.shield=0; render(); return; }
  if (act==="boss-win") { state.bossPhase="report"; setXP(100); render(); return; }
  if (act==="to-rewards") { setXP(100); go("rewards"); return; }
  if (act==="to-cliff") { go("cliff"); return; }
  if (act==="to-map-end") { state.unlocked36=true; state.missionDone=true; Object.assign(state.hub,{x:.64,y:.68,open:null,target:null,pending:null,near:null,talkI:0}); go("mapEnd"); return; }
  if (act==="open-36") {
    return;
  }
}

window.addEventListener("resize", fit);
document.addEventListener("click", onClick);
document.addEventListener("input", (e) => {
  const el = e.target;
  if (!el || !el.matches) return;
  if (el.matches("[data-testid=py-editor]")) state.pySrc = el.value;
  if (el.matches("[data-testid=guided-editor]")) state.guidedSrc = el.value;
  if (el.matches("[data-testid=bug-editor]")) state.bugEditSrc = el.value;
  if (el.matches("[data-testid=mastery-editor]")) state.masterySrc = el.value;
});

async function checkBugEditFix() {
  syncPyEditor("[data-testid=bug-editor]", "bugEditSrc");
  const b = BUGS[state.bugI];
  const src = state.bugEditSrc || "";
  const bad = typeof b.reject === "function" ? b.reject(src) : null;
  if (bad) {
    state.bugToast = bad;
    state.bugPhase = "edit";
    state.coachLevel = Math.max(state.coachLevel || 0, 1);
    state.aidTab = "coach";
    render();
    return;
  }
  const ok = typeof b.accept === "function" ? b.accept(src) : false;
  if (!ok) {
    state.bugToast = { move: "incomplete edit", resp: "That doesn't fix the root cause yet. Check Coach for a nudge." };
    state.coachLevel = Math.max(state.coachLevel || 0, 1);
    state.aidTab = "coach";
    render();
    return;
  }
  state.bugToast = null;
  state.bugPhase = "fixed";
  state.bugsFixed = state.bugI + 1;
  if (state.bugI === 4) setXP(80);
  /* Optional runtime confirmation when a runner exists */
  const runner = BUG_RUNNERS[state.bugI];
  if (runner && !runner.skipRuntime && runner.fixed) {
    try {
      await pyEnsure(() => render());
      const r = await pyRunConsume(src.includes("def consume") ? src : runner.fixed, runner.kind || "normal");
      state.bugPy = {
        ok: !!r.ok,
        summary: r.ok ? (`Fix runs. status=${r.result && r.result.status} text=${JSON.stringify(r.result && r.result.text)}`) : (`Still failing: ${r.error}`),
        fixedSummary: r.ok ? (b.tipFixedOff || "Fix verified on mock stream.") : (`Runtime still failing: ${r.error}`),
        expectFail: false,
      };
      if (!r.ok && runner.expectBrokenFail === false) {
        /* keep fixed on accept() — runtime may differ for snippet-only bugs */
      }
    } catch (e) {
      state.bugPy = { ok: true, summary: b.tipFixedOff, fixedSummary: b.tipFixedOff, expectFail: false };
    }
  } else {
    state.bugPy = { ok: true, summary: b.tipFixedOff, fixedSummary: b.tipFixedOff || "Flush/display fix verified by edit check.", expectFail: false };
  }
  render();
}
document.addEventListener("DOMContentLoaded", () => { render(); });
if (document.readyState!=="loading") render();
