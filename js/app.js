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
    asStep:0, asPicked:null, asResolved:false, asHint:0, cliBuilt:false, chats:defaultChats(),
    predI:0, predPhase:"q", predPick:null, predConf:"think so", predResults:[],
    codeTier:"micro", slots:{}, selectedTile:null, microWrong:false, microRan:false,
    hintLevel:0, guidedFixed:false, guidedChecked:false,
    indepCond:"text", testStates:null, testsDone:false,
    bugI:0, bugPhase:"find", bugToast:null, bugsFixed:0,
    bossPhase:"intro", p2i:0, p2Pick:null, misses:0, missLog:[], p2Cleared:false, shakeBoss:false,
    unlocked36:false, _xpPop:false, L:(typeof lxInit==="function"?lxInit():null), missionDone:false, dd:ddInit(), hub:hubInit(), dq:dqInit(), xq:xqInit(), intro:introInit(),
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
  if (typeof LEARN_ON!=="undefined" && LEARN_ON) { lxJump(i); return; }
  clearT(); xClear(); if (state.intro) introStop();
  const keys = ["disc","explore","assign","pred","code","debug","boss"];
  state.scene = keys[i];
  state.curStage = i;
  state.stagesDone = i;
  setXP([0,5,15,25,40,65,80][i]);
  // reset that stage's local progress so jumps land at the start
  if (i===0) { state.dq=dqInit(); state.clues=[false,false,false,false]; state.clueOpen=null; state.discMode="scene"; state.discAnswer=null; }
  if (i===1) { state.xq=xqInit(); state.exStep=0; state.exPlay=0; state.exCheck={}; state.flushOn=false; state.recapOrder=[null,null,null]; state.recapTapped=[]; }
  if (i===2) { state.asStep=0; state.asPicked=null; state.asResolved=false; state.asHint=0; state.cliBuilt=false; state.chats=defaultChats(); }
  if (i===3) { state.predI=0; state.predPhase="q"; state.predPick=null; state.predResults=[]; }
  if (i===4) { state.dd=ddInit(); state.codeTier="micro"; state.slots={}; state.selectedTile=null; state.microWrong=false; state.microRan=false; state.hintLevel=0; state.guidedFixed=false; state.guidedChecked=false; state.indepCond="text"; state.testStates=null; state.testsDone=false; }
  if (i===5) { state.bugI=0; state.bugPhase="find"; state.bugToast=null; state.bugsFixed=0; }
  if (i===6) { state.bossPhase="intro"; state.hearts=3; state.shield=100; state.p2i=0; state.misses=0; state.missLog=[]; state.p2Cleared=false; state.p2Pick=null; }
  render();
}

function restart() { clearT(); xClear(); if (state.intro) introStop(); state = initialState(); render(); }

function topbar(hearts, pill) {
  let h = "";
  if (hearts) {
    const [full, tot] = hearts;
    h = `<div class="hearts" data-testid="hearts">${Array.from({length:tot},(_,i)=>ic("heart",17,i<full?"#EF4444":"#E5E7EB")).join("")}</div>`;
  }
  const classicNote = (typeof LEARN_ON !== "undefined" && !LEARN_ON)
    ? `<div class="classic-note" data-testid="classic-note">You're on the old version of this mission. <a href="./">Open the current version</a></div>`
    : "";
  return `<div class="top">
    <div class="wm">${ic("hex",30)}<span><span class="d">Dev</span><span class="q">Quest</span></span></div>
    <div class="mpill">${pill||"Afterfault · 3.5 The Unfinished Line"}</div>
    <div class="sp"></div>${h}
    <div class="xp${state._xpPop?" pop":""}" data-testid="xp">${ic("bolt",15,"#fff")} ${state.xp}${LEARN_ON?"":"*"} XP <small>/ ${LEARN_ON?LX_TOTAL_XP:"100*"}</small></div>
    <button type="button" class="tog" data-act="toggle-ai" data-testid="ai-toggle">AI Mentor <div class="sw ${state.aiOn?"":"off"}"></div></button>
    <button type="button" class="theme-tog" data-act="toggle-theme" data-testid="theme-toggle">${ic(state.dark?"sun":"moon",14)} ${state.dark?"Light":"Dark"}</button>
    <img class="meav" src="${ART}${state.avatar}-face.jpg" alt="">
  </div>${classicNote}`;
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
  const n = ai ? "VYAPTI" : "SCRIPTED HINT · AI OFF";
  const ln = Array.isArray(line) ? theLine(line[0], line[1]) : (line==null?"":theLine(line));
  return `<div class="card side">
    <h3>The Unfinished Line</h3>
    <div class="ava"><img src="${ART}${me}-face.jpg" alt=""><div><b>${ch.first}</b><span>${ch.branch}</span></div></div>
    <div class="obj"><i>OBJECTIVE</i>${md(objective)}</div>${extra}${ln}
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
  const main = `<div class="main"><div class="hd"><div><div class="kick">Choose your avatar</div><h2>Who's on shift tonight?</h2></div><div class="sp"></div>${chip("The path and the XP* stay the same","gry")}</div>
    <div class="row" style="flex:1">${cards}</div>
    <div class="row" style="justify-content:flex-end">${btn("Enter the Retry Storm "+ic("play",14,"#fff"),"enter-storm")}</div></div>`;
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
function chatCol(n, c) {
  const pill = {
    streaming:'<span class="chip">● streaming</span>', complete:'<span class="chip grn">complete ✓</span>',
    partial:'<span class="chip amb">partial</span>', error:'<span class="chip red">error</span>',
    quiet:'<span class="chip gry">quiet… 00:12</span>', lie:'<span class="chip grn">Delivered ✓ (fake)</span>',
    waiting:'<span class="chip gry">waiting</span>', retry:'<span class="chip amb">retrying in 1.0 s</span>',
    truncated:'<span class="chip amb">truncated</span>'
  }[c.status];
  const extra = c.extra||"";
  const bd = c.status==="lie"?"#EF4444":"#E5E7EB";
  return `<div class="card col" style="flex:1;gap:8px;padding:12px;border-color:${bd}"><div class="row" style="align-items:center;gap:6px"><b class="pop" style="color:#301768;font-size:14px">Chat ${n}</b><span class="mini">${c.title}</span>${c.prio?'<span class="chip red" style="font-size:9.5px">PRIORITY</span>':""}<span class="sp"></span></div>
    <div class="b u" style="font-size:13px">Where is my order?</div>${c.text?`<div class="b bot" style="font-size:13px">${esc(c.text)}${c.caret?'<span class="caret"></span>':""}</div>`:""}
    <div style="margin-top:auto;display:flex;gap:6px;align-items:center;flex-wrap:wrap">${pill}${extra}</div></div>`;
}
function tileBank(sel, selcls) {
  return `<div class="wrapt">${ASSIGN_TILES.map(([t,c])=>{
    const cls = t===sel ? `tile ${selcls}` : `tile ${c}`;
    return `<button type="button" class="${cls}" data-act="as-tile" data-t="${esc(t)}" data-testid="tile-${t}">${t}</button>`;
  }).join("")}</div>`;
}

function renderAssign() {
  const step = state.asStep;
  let content="", tip="as0", speak="idle";
  const ev = ASSIGN_EVENTS[Math.min(step,3)];
  if (step<=3) {
    content = `<div class="row" style="flex:1">${[1,2,3].map(n=>chatCol(n,state.chats[n])).join("")}
      <div class="col" style="width:${step===1?"290px":"270px"}">${step===0?`<div class="card dlg">${dl("me","Three chats breaking three ways. Priority: the refund chat. Money plus silence is a lawsuit vibe.",state.avatar)}${dl("samar","Chat 2 just went dry. Tap's open, nothing's coming.")}</div>`:""}
        ${step===1 && state.asPicked==="Mark all good" && !state.asResolved ? fb("bad","Consequence:","the customer sees a green tick on half a sentence.")+`<div class="card col" style="gap:6px;padding:12px;border-color:#FDE68A;background:#FFFBEB"><div class="lbl" style="color:#B45309">Hints</div><div class="mini" style="color:#111827"><b>1 ·</b> Did anything say this reply finished?</div><div style="font-size:13px"><b>2 ·</b> No \`finish_reason\` means unfinished. Keep the text, but don't call it complete.</div><div class="mini"><b>3 ·</b> locked</div></div>${dl("tanvi","Never \"all good\". That's how we got here.")}`:""}
        ${step===2?`<div class="card dlg">${dl("rohan","Chat 3 errored before a single word. Hammer retry?")}${dl("vyapti","One careful retry, after a pause. A storm is just retries with no patience.")}</div>${codeBlock(`if result["status"] == "error" and not result["text"]:
    wait(1.0)   # pause, then one retry*
    result = consume(make_stream(), out)`,null,{},"xs")}`:""}
        ${step===3?codeBlock(`try:
    for chunk in stream:
        ...                     # the loop from Explore
except ConnectionError as exc:
    error = str(exc)
if error:              status = "error"
elif finish == "stop":   status = "complete"
elif finish == "length": status = "truncated"
else:                  status = "partial"`,"SIM · honest status (revealed)",{},"xs"):""}
        ${state.asResolved?fb("ok",ev.okFb[0],ev.okFb[1]):(state.asPicked && state.asPicked!==ev.correct && !(step===1 && state.asPicked==="Mark all good")?fb("bad",ev.otherBad?ev.otherBad[0]:ev.badFb[0],ev.otherBad?ev.otherBad[1]:ev.badFb[1]):"")}
      </div></div>
      <div class="card col" style="gap:8px;border-color:#7C3AED;border-width:3px;padding:12px"><div class="row" style="align-items:center;gap:8px">${chip("INCOMING EVENT · "+ev.chat,"dk")}<b class="pop" style="color:#301768;font-size:14px">${md(ev.txt)}</b><span class="sp"></span><span class="mini">seed #A7-3 · events arrive one by one</span></div>
        ${tileBank(state.asPicked, state.asResolved?"ok":(state.asPicked && state.asPicked!==ev.correct?"bad":"p"))}
        ${state.asResolved?`<div class="row" style="justify-content:flex-end">${btn("Next event "+ic("play",14,"#fff"),"as-next")}</div>`:""}
      </div>`;
    tip = ["as0","as1","as2","as3"][step]; speak = step===2?"speak":"idle";
  } else if (step===4) {
    const form=[["Flag","`--temperature`"],["Type","float"],["Default","0.7*"],["Valid range","0.0 → 2.0"],["Usage log","`[usage] prompt= completion= total=` → stderr"]];
    const fr = form.map(([k,v])=>`<div style="display:flex;align-items:center;gap:10px"><span class="lbl" style="width:90px">${k}</span><div style="flex:1;border:2px solid #E5E7EB;border-radius:12px;padding:7px 10px;font:600 13px Inter;background:#fff">${md(v)}</div></div>`).join("");
    content = `<div class="row" style="flex:1"><div class="card col" style="width:380px"><div class="row" style="align-items:center;gap:8px">${ic("term",18,"#7C3AED")}<b class="pop" style="color:#301768">CLI bot builder</b></div>${fr}
      <div style="margin-top:4px">${pbar(state.cliBuilt?100:40,"#7C3AED",8)}</div>
      ${state.cliBuilt?chip(ic("check",11,"#047857")+" range check added","grn"):btn("Add range check","cli-build","","sm")}</div>
      <div class="col f1">${codeBlock(`p = argparse.ArgumentParser(description="Streaming CLI chat")
p.add_argument("--temperature", type=float, default=0.7)
args = p.parse_args()
if not 0.0 <= args.temperature <= 2.0:
    p.error("--temperature must be between 0.0 and 2.0")`,"generated · stream_chat.py",{},"sm")}
      ${state.cliBuilt?`<div class="term" style="font-size:12px"><span class="dim">$ python stream_chat.py --temperature 2.5</span>
usage: stream_chat.py [-h] [--temperature TEMPERATURE] [--model MODEL]
<span class="er">stream_chat.py: error: --temperature must be between 0.0 and 2.0</span></div>`:""}
      ${state.cliBuilt?`<div class="row" style="justify-content:flex-end">${btn("See the board "+ic("play",14,"#fff"),"as-next")}</div>`:""}</div></div>`;
    tip="asCli";
  } else {
    const c1={...state.chats[1], status:"error", text:"Your order is ", caret:false, extra:'<span class="mini">Regenerate offered</span>'};
    const c2={...state.chats[2], status:"partial", text:"Your order is on the ", caret:false};
    const c3={title:"New order", text:"Your order is on the way.", status:"complete", caret:false};
    content = `<div class="row" style="flex:1">${chatCol(1,c1)}${chatCol(2,c2)}${chatCol(3,c3)}</div>
      <div class="term" style="font-size:12.5px"><span class="dim">[usage]</span> prompt=12 completion=7 total=19 status=complete   <span class="dim"># chat 3</span>
<span class="dim">[usage]</span> prompt=? completion=? total=? status=partial    <span class="dim"># chat 2</span>
<span class="dim">[usage]</span> prompt=? completion=? total=? status=error      <span class="dim"># chat 1</span></div>
      <div class="card" style="display:flex;align-items:center;gap:16px;border-color:#F59E0B;background:linear-gradient(90deg,#F3EFFE,#FFF6DF)"><div style="flex:1"><div style="font:800 20px Poppins;color:#301768">Three chats, three honest labels.</div><div class="mini">No green tick on half a line · CLI flag built</div></div><div style="font:800 28px Poppins;color:#F59E0B">+10*</div>${btn("Continue to Predictions "+ic("play",14,"#fff"),"to-pred")}</div>`;
    tip="asDone"; speak="speak";
  }
  const main = `<div class="main"><div class="hd"><div><div class="kick">Stage 3 · Assign</div><h2>Dinner rush console</h2></div><div class="sp"></div>${chip("Rain ↑ · 3 live chats","red")}</div>${content}</div>`;
  shell({cur:2,done:2,tag:"Assign · Dinner rush"}, sidePanel('Give every chat an honest status. Never "all good" on half a line.', tip, [6,true], speak)+main);
}

function applyAssignTile(t) {
  const ev = ASSIGN_EVENTS[state.asStep];
  state.asPicked = t;
  if (t===ev.correct) {
    state.asResolved = true;
    if (state.asStep===0) { state.chats[1].text = "Your order is "; }
    if (state.asStep===1) { state.chats[2] = { title:"Late order", text:"Your order is on the ", status:"partial", extra:'<span class="mini">text kept</span>', caret:false }; }
    if (state.asStep===2) { state.chats[3] = { title:"New order", text:"", status:"retry", extra:ic("spin",18), caret:false }; }
    if (state.asStep===3) { state.chats[1] = { title:"Refund", text:"Your order is ", status:"error", prio:true, extra:'<span class="btn p sm" style="padding:5px 10px;font-size:11px">Regenerate</span>', caret:false }; state.chats[3] = { title:"New order", text:"Your order is on the way.", status:"complete", extra:'<span class="mini">usage logged</span>', caret:false }; }
  } else {
    state.asResolved = false;
    if (state.asStep===1 && t==="Mark all good") {
      state.chats[2] = { title:"Late order", text:"Your order is on the ", status:"lie", extra:'<span class="st-rd">customer: "so is it coming??"</span>', caret:false };
    }
  }
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
function renderPred() {
  const i=state.predI, p=PRED[i], L="ABCD";
  const head=`<div class="hd"><div><div class="kick">Stage 4 · Predictions · ${p.id} of 6</div><h2>${md(p.title)}</h2></div><div class="sp"></div>${pdots()}</div>`;
  let main="";
  if (state.predPhase==="q") {
    const ops = p.ops.map((o,k)=>opt(L[k],o,state.predPick===k?"sel":"","pred-pick",`data-i="${k}"`)).join("");
    const conf = ["sure","think so","guessing"].map(c=>`<button type="button" class="chip ${state.predConf===c?"dk":"gry"}" data-act="pred-conf" data-c="${c}">${c}</button>`).join("");
    main = `<div class="main">${head}<div class="row" style="flex:1"><div class="col" style="width:480px">${dl("ila",p.ila)}<div style="font-size:14px;font-weight:500">${md(p.setup)}</div>${codeBlock(p.src,"ila_patch.py",{},"sm")}</div>
      <div class="col f1"><div class="lbl">What will the customer see?</div><div class="opts one">${ops}</div>
      <div class="row" style="align-items:center;gap:6px"><span class="lbl">Confidence</span>${conf}</div>
      <div class="row" style="justify-content:flex-end">${state.predPick!=null?btn("Commit prediction","pred-commit","data-testid='commit-pred'"):btn("Commit prediction","noop","","dis")}</div></div></div></div>`;
    shell({cur:3,done:3,tag:`Predictions · ${p.id} · Question`}, sidePanel("Predict what customers will see after each of Ila's \"improvements\".", "unused", null)+main.replace("unused",""));
    // fix tip - I used a hack. Let me just pass p.tip
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
    main = `<div class="main">${head}<div class="row" style="flex:1"><div class="col" style="width:420px"><div class="lbl">Running Ila's patch…</div>${predOutcome(p.id)}</div>
      <div class="col f1"><div class="opts one">${ops}</div>${f}<div class="row" style="align-items:center;gap:8px">${cal}${ok?"":chip("Replay E3?")}<span class="sp"></span>${xpblk}${nxt}</div></div></div></div>`;
  }
  const tipOn = state.predPhase==="q" ? (i===0?p.tipOn:p.tipOn) : (okTip());
  function okTip() { return state.predResults[i] ? p.tipRevealOn : p.tipRevealOff; }
  // re-shell with correct tip
  const tipKeyCustom = state.predPhase==="q" ? (state.aiOn?p.tipOn:p.tipOff) : (state.aiOn?(state.predResults[i]?p.tipRevealOn:p.tipRevealOff):(state.predResults[i]?p.tipRevealOff:p.tipRevealOff));
  // Use sidePanel with a one-off tip by temporarily stuffing TIPS
  TIPS._pred = [state.predPhase==="q"?p.tipOn: (state.predResults[i]?p.tipRevealOn:p.tipRevealOff), state.predPhase==="q"?p.tipOff:p.tipRevealOff];
  shell({cur:3,done:3,tag:`Predictions · ${p.id} · ${state.predPhase==="q"?"Question":"Reveal"}`},
    sidePanel("Predict what customers will see after each of Ila's \"improvements\".", "_pred", null, state.predPhase==="reveal"?"speak":"idle")+main);
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
  const tiers=["Micro","Guided","Independent"];
  const pills = tiers.map(t=>{
    const i=tiers.indexOf(t), c=tiers.indexOf(tier);
    return chip((i<c?"✓ ":"")+t, t===tier?"dk":(i<c?"grn":"gry"));
  }).join("");
  return `<div class="hd"><div><div class="kick">Stage 5 · Code · ${tier}</div><h2>${title}</h2></div><div class="sp"></div>${pills}</div>`;
}
function testPanel(states, failNote) {
  const rows = TESTS.map(([id,n,h],i)=>{
    const st = (states && states[i]) || "pend";
    const note = (st==="fail" && id==="T3") ? (failNote||"Chat 2 shows a green tick on half a sentence") : "";
    return testRow(id,n,st,!!h,note);
  }).join("");
  const npass = states ? states.filter(s=>s==="pass").length : 0;
  const fail = states && states.includes("fail");
  const running = states && states.includes("pend") && states.some(s=>s!=="pend");
  return `<div class="card col" style="width:400px;gap:6px;padding:12px"><div class="row" style="align-items:center"><b class="pop" style="color:${state.dark?"#EDE7FD":"#301768"}">Server check</b><span class="sp"></span>${chip(npass+" / 15 passed", fail?"red":(npass===15?"grn":"gry"))}</div><div class="tests" data-testid="tests">${rows}</div></div>`;
}

function renderCode() {
  let main="", tip="micro", speak="idle";
  if (state.codeTier==="micro") {
    const r = state.dd.result;
    if (state.dd.solved) { tip="microOk"; speak="speak"; }
    else if (r && !r.ok) { TIPS._dd = [r.title+" "+r.msg, r.title+" "+r.msg]; tip="_dd"; }
    else tip="micro";
    main = ddMain();
  } else if (state.codeTier==="guided") {
    const steps=[["1","Usage-only chunk doesn't crash; usage stored", "pass"],["2","Output is live and flushed; no \"None\"","pass"],["3","`finish_reason` captured","pass"],["4","Cut → partial · error → error · length → truncated", state.guidedFixed?"pass":(state.guidedChecked?"fail":"pend")]];
    const sr = steps.map(([n,t,s])=>`<div class="t ${s}"><span class="bx">${s==="pass"?ic("check",12,"#fff"):s==="fail"?ic("x",12,"#fff"):""}</span><b>${n}</b><span>${md(t)}</span></div>`).join("");
    const src = state.guidedFixed ? GUIDED_SRC.replace('status = "complete"          # Step 4: TODO','status = honest_status(error, finish)') : GUIDED_SRC;
    const marks = state.guidedFixed ? {14:"good"} : {14:"foc"};
    const hint = `<div class="card col" style="gap:6px;padding:12px;border-color:#FDE68A;background:#FFFBEB"><div class="row" style="align-items:center">${ic("bulb",18,"#F59E0B")}<b class="pop" style="color:#B45309;margin-left:6px">Step 4 hints</b><span class="sp"></span>${btn("Hint","guided-hint","data-testid='hint'","g sm")}</div>
      ${state.hintLevel>=1?`<div class="mini" style="color:#111827"><b>1 · Nudge</b> What did Assign teach?</div>`:""}
      ${state.hintLevel>=2?`<div style="font-size:13.5px;background:#fff;border-radius:10px;padding:7px 9px;border:2px solid #FDE68A"><b>2 · Concept</b> Wrap the loop in try/except; decide status after.</div>`:""}
      ${state.hintLevel>=3?`<div style="font-size:13px"><b>3 · Pointer</b> Replace line 14 with a status that looks at error and <code class="inline">finish_reason</code>.</div>`:`<div class="row" style="align-items:center;gap:6px"><span class="mini"><b>3 · Pointer</b></span><span class="chip gry">${ic("lock",10,"#6B7280")} tap Hint to open</span></div>`}
    </div>`;
    const term = state.guidedChecked && !state.guidedFixed
      ? `<div class="term" style="flex:1;padding:8px 12px;font-size:12px"><span class="er">✕ step 4:</span> cut stream → expected status <span class="am">"partial"</span>, got <span class="am">"complete"</span></div>`
      : (state.guidedFixed?`<div class="term" style="flex:1;padding:8px 12px;font-size:12px"><span class="ok">✓ all 4 guided checks passed</span></div>`:`<div class="term" style="flex:1;padding:8px 12px;font-size:12px"><span class="dim">Run or Check when you're ready.</span></div>`);
    main = `<div class="main">${codehd("Guided","Write consume()")}<div class="row" style="flex:1"><div class="col f1">${codeBlock(src,"line_keeper.py",marks,"sm")}
      ${!state.guidedFixed?`<button type="button" class="btn g sm" data-act="fix-status" data-testid="fix-status">Fix status after the loop</button>`:""}</div>
      <div class="col" style="width:350px"><div class="card col" style="gap:5px;padding:12px"><div class="lbl">Guided checks</div><div class="tests">${sr}</div></div>${hint}</div></div>
      <div class="row" style="align-items:center;gap:10px">${term}${btn("Run","guided-check","","g sm")}${btn("Check","guided-check","data-testid='guided-check'","sm")}${state.guidedFixed?btn("Next: Independent "+ic("play",14,"#fff"),"to-indep"):""}</div></div>`;
    tip = state.guidedFixed?"guidedOk":"guided";
  } else {
    const cond = state.indepCond;
    const marks = cond==='finish == "stop"' ? {13:"good"} : (state.testsDone?{13:"bad"}:{});
    const fail = cond!=='finish == "stop"';
    const states = state.testStates;
    const allPass = states && states.every(s=>s==="pass");
    const eff = allPass ? `<div class="card col" style="gap:6px;padding:12px"><div class="row" style="align-items:center"><b class="pop" style="color:${state.dark?"#EDE7FD":"#301768"}">Efficiency</b><span class="sp"></span>${chip("meter, not a gate*")}</div>
      <div class="mini">50,000-chunk stream · 0.03 s · budget TBC*</div>${pbar(18,"#10B981",10)}
      <div class="row" style="gap:6px;align-items:center">${chip("✓ single pass","grn")}${chip("✓ list + join","grn")}${chip("✓ live","grn")}<span class="sp"></span><div style="font:800 22px Poppins;color:#F59E0B">+25*</div>${btn("Continue to Debug "+ic("play",12,"#fff"),"to-debug","","sm")}</div></div>` : "";
    const condBtns = `<div class="row" style="gap:6px;flex-wrap:wrap"><span class="lbl">complete when</span>
      ${['text', 'finish == "stop"', 'text.endswith(".")'].map(c=>`<button type="button" class="tile mono ${cond===c?"p":""}" data-act="indep-cond" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
    main = `<div class="main">${codehd("Independent","Ship stream_chat.py")}<div class="row" style="flex:1"><div class="col f1">${codeBlock(INDEP_SRC(cond),"stream_chat.py · consume()",marks,"xs")}
      ${condBtns}
      ${state.testsDone && fail?`<div class="term" style="padding:8px 12px;font-size:11.5px"><span class="er">✕ T3</span> quiet stream after "the " → expected <span class="am">partial</span>, got <span class="am">complete</span></div>`:""}
      ${eff}</div>${testPanel(states)}</div>
      <div class="row" style="justify-content:flex-end;gap:8px">${btn("Run / Check","indep-check","data-testid='indep-check'","")}</div></div>`;
    tip = allPass?"indepOk":(state.testsDone?"indepFail":"indepFail");
    speak = allPass?"speak":"idle";
  }
  shell({cur:4,done:4,tag:"Code · "+state.codeTier}, sidePanel("Forge the Line Keeper: live, assembled, honest.", tip, [6,true], speak)+main);
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

function renderDebug() {
  const b = BUGS[state.bugI];
  const fixed = state.bugPhase==="fixed";
  const marks = fixed ? b.fixedMarks : (state.bugPhase==="find" ? {} : Object.fromEntries(b.badLines.map(n=>[n,"foc"])));
  const src = fixed ? b.fixedSrc : b.src;
  const toast = state.bugToast ? `<div class="fb am" style="padding:8px 12px"><span class="ico">${ic("eye",15,"#fff")}</span><div><b>Vyapti spotted:</b> ${md(state.bugToast.move)}<br>"${md(state.bugToast.resp)}"</div></div>` : "";
  const fixes = state.bugPhase==="choose" ? `<div class="card col" style="gap:8px;padding:12px"><div class="lbl">Pick a fix</div>${b.fixes.map((f,i)=>btn(md(f.t),"bug-fix",`data-i="${i}" data-testid="fix-${i}"`,"g sm fix-opt")).join("")}</div>` : (fixed ? fb("ok", b.id+" fixed.", b.tipFixedOff) : `<div class="card" style="padding:12px" data-testid="find-hint"><div class="lbl">Find the bug</div><div class="mini">Tap the buggy line in the code, then pick a fix.</div></div>`);
  const last = state.bugI===4 && fixed;
  const main = `<div class="main"><div class="hd"><div><div class="kick">Stage 6 · Debug</div><h2>Ila's night-shift hotfix</h2></div><div class="sp"></div>${chip("02:10 AM · hotfix: minor stream polish (Ila)","dk")}</div>
    <div class="row" style="flex:1"><div class="col f1"><div class="lbl">${fixed?"Fix applied":"dabba_stream.py · tap the buggy line"}</div>
      <div class="${state.bugPhase==="find"?"debug-find":""}">${codeBlock(src,"dabba_stream.py",marks)}</div>
      ${state.bugPhase==="find"?`<div class="card dlg" style="padding:10px">${dl("ila","The tests pass, don't they?")}${dl("me","The tests she wrote. Sure.",state.avatar)}</div>`:""}
      ${fixed?fb("ok",b.id+" fixed.","Targeted test green, nothing else broke."):""}
    </div>
    <div class="col" style="width:380px">${bugTracker()}<div class="lbl">${fixed?"Symptom · before → after":"Symptom · live preview"}</div>${b.before}${fixed?b.after:""}${toast}${state.bugPhase==="choose"||state.bugPhase==="find"?fixes:""}
    </div></div>
    ${fixed?`<div class="row" style="justify-content:flex-end;gap:10px">${last?`<div style="font:800 24px Poppins;color:#F59E0B">+15*</div>${btn("Continue to Mastery "+ic("play",14,"#fff"),"to-boss")}`:btn("Next bug "+ic("play",14,"#fff"),"bug-next")}</div>`:""}
  </div>`;
  const tip = fixed? (state.aiOn?b.tipFixedOn:b.tipFixedOff) : (state.aiOn?b.tipOn:b.tipOff);
  TIPS._bug=[b.tipOn,b.tipOff];
  if (fixed) TIPS._bug=[b.tipFixedOn,b.tipFixedOff];
  shell({cur:5,done:5,tag:`Debug · ${b.id}`}, sidePanel("Fix Ila's hotfix without hiding anything.", "_bug", [6,true], fixed?"speak":"idle")+main);
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
  if (ph==="intro") {
    const inner=`<div style="position:absolute;inset:126px 28px 26px 28px;border-radius:26px;overflow:hidden;background:linear-gradient(135deg,#301768,#7C3AED)">
      <img src="${ART}retry-storm.jpg" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.22;mix-blend-mode:screen">
      <img src="${ART}ila-body.jpg" alt="Ila" style="position:absolute;right:60px;bottom:0;height:540px;border-radius:24px 24px 0 0;border:4px solid rgba(255,255,255,.4)">
      <div style="position:absolute;left:50px;top:50px;width:640px;color:#fff">
        <span class="chip" style="background:#F59E0B;color:#fff;font-size:12px">BOSS · MISSION 3.5</span>
        <div style="font:800 52px/1.1 Poppins;margin:14px 0 6px">The All-Good Board</div>
        <div style="font:500 17px Inter;opacity:.9">Peak rush. Five chats at once. Ila's board glows green behind a shimmering shield.</div>
        <div style="margin:22px 0;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.3);border-radius:18px;padding:14px 18px;font:700 20px/1.4 Poppins">"Customers don't want truth. They want a tick. I give them ticks."<div style="font:600 12px Inter;opacity:.8;margin-top:4px">ILA VARGHESE</div></div>
        <div style="display:flex;gap:14px;align-items:center"><div style="background:rgba(255,255,255,.14);border-radius:14px;padding:10px 14px"><div style="font:700 11px Poppins;opacity:.8">ALL-GOOD SHIELD</div><div style="font:800 22px Poppins">100 / 100*</div></div>
        <div style="background:rgba(255,255,255,.14);border-radius:14px;padding:10px 14px"><div style="font:700 11px Poppins;opacity:.8">YOUR HEARTS</div><div style="display:flex;gap:4px;margin-top:3px">${ic("heart",22,"#FCA5A5").repeat(3)}</div></div>
        ${btn("Start Phase 1 "+ic("play",15,"#fff"),"boss-p1","","")}</div></div></div>`;
    shell({cur:6,done:6,hearts:[3,3],tag:"Mastery · Boss intro"}, inner, true);
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
  if (ph==="p1") {
    const W=["Your order is on the way.","Your order is on","Your order is on the way.","Your order is","Your order is on the"];
    content = `<div class="hd"><div><div class="kick">Mastery · Phase 1</div><h2>Hold the Line</h2></div><div class="sp"></div>${phases(0,0)}</div>${shieldBar(70,100)}
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">${bchat(1,W[0],"complete")}${bchat(2,W[1],"live",true)}${bchat(3,W[2],"complete")}${bchat(4,W[3],"live",true)}${bchat(5,W[4],"live",true)}</div>
      <div class="row" style="flex:1"><div class="term f1" style="font-size:12px"><span class="dim">board ← your stream_chat.consume()</span>
<span class="ok">✓</span> role-only chunks skipped   <span class="ok">✓</span> keep-alives skipped   <span class="ok">✓</span> flushed per piece
<span class="ok">✓</span> chats 1 and 3 assembled: "Your order is on the way."</div><div class="card dlg" style="width:300px">${dl("tanvi","Phase one: keep every line live.")}</div></div>
      <div class="row" style="justify-content:flex-end">${btn("Start Phase 2 "+ic("play",14,"#fff"),"boss-p2")}</div>`;
    tip="p1";
  } else if (ph==="p2") {
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
      <div class="row" style="justify-content:flex-end">${btn("Start Phase 3 "+ic("play",14,"#fff"),"boss-p3")}</div>`;
    tip="p2ok";
  } else if (ph==="p3") {
    const labels=[["complete ✓","st-ok"],["partial","st-am"],["complete ✓","st-ok"],["partial","st-am"],["truncated","st-am"]];
    content = `<div class="hd"><div><div class="kick">Mastery · Phase 3</div><h2>The All-Good Lie</h2></div><div class="sp"></div>${phases(2,2)}</div>${shieldBar(0,30)}
      <div class="row" style="flex:1"><div class="col f1"><div class="term" style="flex:1;font-size:12px"><span class="dim">$ python stream_chat.py --temperature 0.3</span>
[usage] prompt=12 completion=7 total=19 status=complete
[usage] prompt=? completion=? total=? status=partial
[usage] prompt=12 completion=7 total=19 status=complete
[usage] prompt=? completion=? total=? status=partial
[usage] prompt=12 completion=5 total=17 status=truncated</div>
      <div class="row" style="gap:6px">${labels.map(([t,c])=>`<div class="card" style="flex:1;padding:8px;text-align:center"><div class="mini" style="text-decoration:line-through;color:#9CA3AF">All good ✓</div><div class="${c}" style="font-size:12px">${t}</div></div>`).join("")}</div></div>
      <div class="card dlg" style="width:330px">${dl("me","Phase three: flip the board to honest. Amber where it's amber.",state.avatar)}${dl("ila","Honest dashboards make terrible screenshots.")}${dl("me","Then stop screenshotting. Start shipping.",state.avatar)}</div></div>
      <div class="row" style="justify-content:flex-end">${btn("See victory "+ic("play",14,"#fff"),"boss-win")}</div>`;
    tip="p3"; speak="speak";
  } else if (ph==="win") {
    const rb = RUBRIC.map(r=>`<div style="display:flex;align-items:center;gap:8px;font-size:13px"><span style="width:20px;height:20px;border-radius:6px;background:#10B981;display:grid;place-items:center">${ic("check",12,"#fff")}</span>${r}</div>`).join("");
    content = `<div class="row" style="flex:1"><div class="card col" style="flex:1;align-items:center;justify-content:center;gap:16px;background:linear-gradient(135deg,#F3EFFE,#FFF6DF);border-color:#F59E0B">
      ${chip("LINE RESTORED")}<div class="phone" style="width:420px"><div class="ph-h"><span class="logo-dd">DD</span>Dabba Dash support</div><div class="b u" style="font-size:16px">Where is my order?</div><div class="b bot" style="font-size:16px">Your order is on the way.</div><span class="st-ok" style="font-size:13px">complete ✓ · finish_reason: stop</span></div>
      ${shieldBar(0)}</div><div class="card col" style="width:310px;gap:9px"><div class="lbl">Rubric · all criteria met</div>${rb}<div class="mini">Weights and pass mark: TBC*</div>${btn("Claim rewards "+ic("gift",16,"#fff"),"to-rewards","","")}</div></div>`;
    tip="win"; speak="speak";
  }
  const main = `<div class="main">${content}</div>`;
  shell({cur:6,done:6,hearts,tag:"Mastery · "+ph}, sidePanel("Beat the All-Good Board: every chat live, assembled and honest.", tip, [6,true], speak)+main);
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
  if (typeof lxTimersClear==="function") lxTimersClear();
  app.className = "screen" + (LEARN_ON && (lxIsStage(state.scene)) ? " lx-fluid" : "") + (state.dark ? " dark" : "") + ((isHubScene() && hubPortrait()) ? " portrait" : "");
  document.body.classList.toggle("dark-page", state.dark);
  const s = state.scene;
  if (s==="map" || s==="mapEnd") renderHub();
  else if (s==="avatar") renderAvatar();
  else if (s==="intro") renderIntro();
  else if (s==="cut1") renderCut1();
  else if (s==="cut2") renderCut2();
  else if (LEARN_ON && lxIsStage(s)) lxRender();
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

function fit() {
  const vp = document.getElementById("viewport");
  const app = document.getElementById("app");
  if (!vp || !app) return;
  document.body.classList.toggle("lx-page", app.classList.contains("lx-fluid"));
  if (app.classList.contains("lx-fluid")) { app.style.transform = "none"; return; }
  const pt = app.classList.contains("portrait");
  const want = isHubScene() && hubPortrait();
  if (pt !== want) { render(); return; }
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

function runIndepTests() {
  clearT();
  const fail = state.indepCond !== 'finish == "stop"';
  state.testStates = TESTS.map(()=>"pend");
  state.testsDone = false;
  render();
  let i = 0;
  const step = () => {
    if (i>=15) { state.testsDone = true; if (!fail) setXP(65); render(); return; }
    const id = TESTS[i][0];
    state.testStates[i] = (fail && id==="T3") ? "fail" : "pass";
    i++;
    render();
    timer = setTimeout(step, 85);
  };
  timer = setTimeout(step, 80);
}

function onClick(e) {
  const ln = e.target.closest(".debug-find .ln[data-ln]");
  if (ln && state.scene==="debug" && state.bugPhase==="find") {
    const n = +ln.getAttribute("data-ln");
    const b = BUGS[state.bugI];
    if (b.badLines.includes(n)) { state.bugPhase="choose"; render(); }
    else { ln.classList.add("shake"); setTimeout(() => ln.classList.remove("shake"), 400); }
    return;
  }
  const t = e.target.closest("[data-act]");
  if (!t) return;
  const act = t.getAttribute("data-act");
  if (act==="noop") return;
  if (act==="restart") { restart(); return; }
  if (act.startsWith("lx-") && LEARN_ON) { lxAct(act, t); return; }
  if (act.startsWith("hub-")) { hubAct(act); return; }
  if (act.startsWith("dq-") && dqAct(act, t)) return;
  if (act.startsWith("x-") && xAct(act, t)) return;
  if (act.startsWith("intro-") && introAct(act)) return;
  if (act==="dd-reset") { state.dd=ddInit(); render(); return; }
  if (act==="dd-run") { const r=ddCheck(); state.dd.result=r; if (r.ok) state.dd.solved=true; render(); return; }
  if (act==="toggle-ai") { state.aiOn = !state.aiOn; render(); return; }
  if (act==="toggle-theme") { state.dark = !state.dark; render(); return; }
  if (act==="jump-stage") { jumpStage(+t.dataset.i); return; }
  if (act==="play-mission") { go("avatar"); return; }
  if (act==="pick-avatar") { state.avatar = t.dataset.k; render(); return; }
  if (act==="enter-storm") { if (LEARN_ON) { state.curStage=0; go("disc"); return; } state.intro = introInit(); go("intro"); return; }
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
  if (act==="to-assign") { state.stagesDone=2; state.curStage=2; setXP(15); go("assign"); return; }
  if (act==="as-tile") { if (!state.asResolved) { applyAssignTile(t.dataset.t); render(); } return; }
  if (act==="as-next") {
    state.asStep++; state.asPicked=null; state.asResolved=false;
    render(); return;
  }
  if (act==="cli-build") { state.cliBuilt=true; render(); return; }
  if (act==="to-pred") { state.stagesDone=3; state.curStage=3; setXP(25); go("pred"); return; }
  if (act==="pred-pick") { state.predPick=+t.dataset.i; render(); return; }
  if (act==="pred-conf") { state.predConf=t.dataset.c; render(); return; }
  if (act==="pred-commit") {
    const p=PRED[state.predI];
    state.predResults[state.predI] = state.predPick===p.correct;
    state.predPhase="reveal";
    if (state.predI===5) setXP(40);
    render(); return;
  }
  if (act==="pred-next") { state.predI++; state.predPhase="q"; state.predPick=null; state.predConf="think so"; render(); return; }
  if (act==="to-code") { state.stagesDone=4; state.curStage=4; setXP(40); go("code"); return; }
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
  if (act==="to-guided") { state.codeTier="guided"; render(); return; }
  if (act==="guided-hint") { state.hintLevel=Math.min(3,state.hintLevel+1); render(); return; }
  if (act==="fix-status") { state.guidedFixed=true; state.guidedChecked=true; render(); return; }
  if (act==="guided-check") { state.guidedChecked=true; render(); return; }
  if (act==="to-indep") { state.codeTier="indep"; render(); return; }
  if (act==="indep-cond") { clearT(); state.indepCond=t.dataset.c; state.testStates=null; state.testsDone=false; render(); return; }
  if (act==="indep-check") { runIndepTests(); return; }
  if (act==="to-debug") { state.stagesDone=5; state.curStage=5; setXP(65); go("debug"); return; }
  if (act==="bug-fix") {
    const b=BUGS[state.bugI], f=b.fixes[+t.dataset.i];
    if (f.ok) { state.bugPhase="fixed"; state.bugsFixed=state.bugI+1; state.bugToast=null; if (state.bugI===4) setXP(80); }
    else { state.bugPhase="choose"; state.bugToast={move:f.move, resp:f.resp}; }
    render(); return;
  }
  if (act==="bug-next") { state.bugI++; state.bugPhase="find"; state.bugToast=null; render(); return; }
  if (act==="to-boss") { state.stagesDone=6; state.curStage=6; setXP(80); state.bossPhase="intro"; state.hearts=3; state.shield=100; go("boss"); return; }
  if (act==="boss-p1") { state.bossPhase="p1"; state.shield=70; render(); return; }
  if (act==="boss-p2") { state.bossPhase="p2"; state.p2i=0; state.p2Pick=null; state.misses=0; state.missLog=[]; render(); return; }
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
  if (act==="boss-win") { state.bossPhase="win"; render(); return; }
  if (act==="to-rewards") { setXP(100); go("rewards"); return; }
  if (act==="to-cliff") { go("cliff"); return; }
  if (act==="to-map-end") { state.unlocked36=true; state.missionDone=true; Object.assign(state.hub,{x:.64,y:.68,open:null,target:null,pending:null,near:null,talkI:0}); go("mapEnd"); return; }
  if (act==="open-36") {
    return;
  }
}

window.addEventListener("resize", fit);
document.addEventListener("click", onClick);
document.addEventListener("DOMContentLoaded", () => { render(); });
if (document.readyState!=="loading") render();
