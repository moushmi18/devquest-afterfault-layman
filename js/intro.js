/* Cinematic intro (HTML/CSS/JS "video"): 6 shots, ~38 s, scrubber, play/pause, replay, skip, optional ambient sound */
const INTRO_T = 45;
const ISHOTS = [[0,6],[6,12],[12,21],[21,28.3],[28.3,38.6],[38.6,45]];
/* voiceover: [start, file, duration, subtitle, speaker]. Narrator + character lines, timed to the shots. */
const IVO = [
  [0.5, null, 4.2, "Dinner rush. Customers are waiting on their orders."],
  [6.3, "n2", 4.22, "Rohan orders dinner. Then asks where it is."],
  [10.6, "rohan1", 1.39, "Where is my order?", "Rohan"],
  [12.4, "n3", 2.88, "The reply starts typing, word by word…"],
  [16.0, "n4", 2.74, "…and stops. Mid-sentence."],
  [18.8, "rohan2", 2.21, "Hello? You still there?", "Rohan"],
  [21.4, null, 4.5, "Replies freeze. The status board still says: All good."],
  [26.3, "ila", 1.8, "Let them think it's done.", "Ila"],
  [28.6, "n6", 1.92, "Tanvi's crew spots it first."],
  [30.6, "tanvi", 4.27, "That's my chat. Half a sentence. Green tick.", "Tanvi"],
  [35.2, "vyapti", 3.14, "A reply isn't done until it says it's done.", "Vyapti", "ai"],
  [39.0, "n7", 6.05, "Mission 3.5. The Unfinished Line. Make the reply arrive whole."],
];
const IVY_OFF = [35.2, 38.4, "Hint: a reply is done only when it says so."];
function introInit() { return { t:0, playing:true, sound:true }; }
let introRAF = null, introLast = 0, introAudio = null;
const IVO_EL = {};  /* one <audio> per clip, created lazily */
function voEl(f) { if (!IVO_EL[f]) { const a = new Audio(`audio/vo-${f}.mp3`); a.preload = "auto"; IVO_EL[f] = a; } return IVO_EL[f]; }
function voPauseAll() { Object.values(IVO_EL).forEach(a => { if (!a.paused) a.pause(); }); }
function voActive(t) { return IVO.find(([a, f, d, , , ai]) => f && t>=a && t<a+d && !(ai && !state.aiOn)); }
/* keep voice in sync with the timeline: play the clip under the playhead at the right offset, pause the rest */
function voSync(t) {
  const I = state.intro, cur = I.playing && I.sound ? voActive(t) : null;
  Object.entries(IVO_EL).forEach(([f, a]) => { if ((!cur || cur[1]!==f) && !a.paused) a.pause(); });
  if (!cur) return;
  const a = voEl(cur[1]), off = t - cur[0];
  if (a.readyState >= 1 && !a.seeking && Math.abs(a.currentTime - off) > 0.35) { try { a.currentTime = off; } catch (e) {} }
  if (a.paused) { const pr = a.play(); if (pr && pr.catch) pr.catch(() => {}); }
}
const clamp01 = x => Math.max(0, Math.min(1, x));
const ease = x => x<.5 ? 2*x*x : 1-Math.pow(-2*x+2,2)/2;
const lerp = (a, b, x) => a + (b-a)*x;
function seg(t, a, b) { return ease(clamp01((t-a)/(b-a))); }

function renderIntro() {
  const app = document.getElementById("app");
  const I = state.intro;
  const words = ["Your","order","is","on","the"];
  app.innerHTML = topbar(null, "Mission 3.5 · Intro") + `<div class="intro" data-testid="intro">
    <div class="iscreen" id="iscreen">
      <div class="ish" data-s="0"><div class="icam"><img class="ibg" src="${ART}retry-storm.jpg" alt=""><div class="irain"></div><div class="iveil"></div>
        <div class="isig"><i class="r"></i><i class="a"></i><i class="g"></i></div></div></div>
      <div class="ish" data-s="1"><div class="icam lav"><div class="iroom"></div><img class="ichar rohan" src="${ART}rohan-body.jpg" alt="Rohan">
        <div class="iphone small"><div class="ph-h"><span class="logo-dd">RS</span>Restaurant Support</div><div class="iorder">${ic("basket",26,"#F59E0B")}<b>Biryani × 1</b><span class="iplaced">${ic("check",14,"#fff")} Order placed</span></div><div class="b u iask">Where is my order?</div></div></div></div>
      <div class="ish" data-s="2"><div class="icam lav2"><div class="iphone big"><div class="ph-h"><span class="logo-dd">RS</span>Restaurant Support Assistant<span class="sp"></span><span class="st-ok">● live</span></div>
        <div class="b u">Where is my order?</div><div class="b bot"><span id="itype"></span><span class="caret"></span></div><div class="ifrozen" id="ifrozen">${ic("clock",14,"#EF4444")} <span id="itimer">00:00</span></div></div>
        ${words.map((w,i)=>`<span class="ifly" data-i="${i}">${w}</span>`).join("")}</div></div>
      <div class="ish" data-s="3"><div class="icam dark"><img class="ibg" src="${ART}retry-storm.jpg" alt=""><div class="iglitch"></div>
        <div class="iwall">${ic("check",30,"#fff")}<b>All good</b><span>Status board · 4,000 chats ✓</span></div>
        <div class="imini m1">Your order is on the<span class="caret"></span></div><div class="imini m2">Your table is<span class="caret"></span></div><div class="imini m3">Refund will be<span class="caret"></span></div>
        <div class="iila"><img src="${ART}ila-face.jpg" alt="Ila">${ic("glitch",26,"#FCA5A5")}</div></div></div>
      <div class="ish" data-s="4"><div class="icam lav"><img class="ichar tanvi" src="${ART}tanvi-body.jpg" alt="Tanvi"><img class="iface samar" src="${ART}samar-face.jpg" alt="Samar"><img class="iface sana" src="${ART}sana-face.jpg" alt="Sana">
        <div class="ibub tb">${dl("tanvi","That's my chat. Half a sentence. Green tick.")}</div>
        <div class="iorb"><img class="orb" src="${ART}${state.aiOn?"vyapti-speak":"vyapti-off"}.jpg" alt="Vyapti"></div>
        ${state.aiOn ? `<div class="ibub vb">${dl("vyapti","A reply isn't done until it says it's done.")}</div>` : ""}</div></div>
      <div class="ish" data-s="5"><div class="icam title"><div class="itc"><div class="kick">Afterfault · Mission 3.5</div><h1>The Unfinished Line</h1>
        <div class="igoal">${ic("flag",18,"#F59E0B")} Goal: Make the reply arrive whole</div>
        <button type="button" class="btn istart" data-act="intro-start" data-testid="intro-start">${ic("play",18,"#fff")} Start</button></div></div></div>
      <div class="isub" id="isub"></div>
      <button type="button" class="iskip" data-act="intro-start" data-testid="intro-skip">Skip ${ic("step",14,"#fff")}</button>
    </div>
    <div class="ictl">
      <button type="button" class="ib" data-act="intro-play" data-testid="intro-play" aria-label="Play or pause">${ic(I.playing?"pause":"play",16,"#fff")}</button>
      <button type="button" class="ib" data-act="intro-replay" data-testid="intro-replay" aria-label="Replay">${ic("refresh",16,"#fff")}</button>
      <input type="range" class="iscrub" id="iscrub" min="0" max="${INTRO_T}" step="0.05" value="${I.t}" aria-label="Scrub" data-testid="intro-scrub">
      <span class="itime" id="itime"></span>
      <button type="button" class="ib wide" data-act="intro-sound" data-testid="intro-sound" aria-label="Mute or unmute" aria-pressed="${!I.sound}">${ic(I.sound?"wave":"x",14,"currentColor")} ${I.sound?"Voice + sound on":"Muted"}</button>
    </div></div>` + tagEl("Entry · Intro");
  IVO.forEach(v => { if (v[1]) voEl(v[1]); });  /* preload clips that still have audio */
  if (I.sound && I.playing && !introAudio) introSound(true);  /* sound on by default: the Enter-mission click allows autoplay */
  introApply(I.t);
  if (I.playing && !introRAF) { introLast = performance.now(); introRAF = requestAnimationFrame(introLoop); }
}
function introLoop(now) {
  const I = state.intro;
  if (state.scene!=="intro" || !I.playing) { introRAF = null; return; }
  I.t = Math.min(INTRO_T, I.t + Math.min(.1, (now - introLast)/1000)); introLast = now;
  introApply(I.t);
  if (I.t >= INTRO_T) { I.playing = false; introRAF = null; const pb = document.querySelector('[data-testid="intro-play"]'); if (pb) pb.innerHTML = ic("play",16,"#fff"); return; }
  introRAF = requestAnimationFrame(introLoop);
}
function introApply(t) {
  const root = document.getElementById("iscreen"); if (!root) return;
  const q = s => root.querySelector(s);
  ISHOTS.forEach(([a, b], i) => {
    const el = root.querySelector(`.ish[data-s="${i}"]`);
    const o = i===5 ? clamp01((t-a)/.5) : clamp01((t-a)/.35) * clamp01((b-t)/.3);
    el.style.opacity = o; el.style.visibility = o>0 ? "visible" : "hidden";
  });
  // shot 0: slow pan + push in over the city
  let x = seg(t,0,6.5); q('.ish[data-s="0"] .icam').style.transform = `scale(${lerp(1.08,1.32,x)}) translate(${lerp(0,-40,x)}px,${lerp(0,-12,x)}px)`;
  // shot 1: Rohan slides in, phone pops, order placed
  x = seg(t,6,12); q('.ish[data-s="1"] .icam').style.transform = `scale(${lerp(1,1.07,x)})`;
  q('.ichar.rohan').style.transform = `translateX(${lerp(-260,0,seg(t,6.1,7.5))}px) translateY(${Math.sin(t*3)*3}px)`;
  q('.iphone.small').style.transform = `translateY(${lerp(80,0,seg(t,7.1,8.3))}px) rotate(${lerp(8,-3,seg(t,7.1,8.3))}deg)`;
  q('.iplaced').style.opacity = clamp01((t-8.6)/.3); q('.iask').style.opacity = clamp01((t-10.5)/.3);
  // shot 2: phone close-up, typing then freeze
  x = seg(t,12,21); q('.ish[data-s="2"] .icam').style.transform = `scale(${lerp(.92,1.16,x)}) translateY(${lerp(10,-6,x)}px)`;
  const k = Math.max(0, Math.min(5, Math.floor((t-12.8)/0.55)+1));
  const ty = q('#itype'), txt = ["Your","order","is","on","the"].slice(0,k).join(" ");
  if (ty.textContent !== txt) ty.textContent = txt;
  const fz = t > 15.8; q('#ifrozen').style.opacity = fz ? 1 : 0;
  q('#itimer').textContent = "00:" + String(Math.max(0, Math.floor((t-15.8)*4))).padStart(2,"0");
  root.querySelectorAll(".ifly").forEach(f => { const i = +f.dataset.i, a = 12.8 + i*0.55, p = clamp01((t-a)/.5); f.style.opacity = p>0 && p<1 ? 1-p : 0; f.style.transform = `translate(${lerp(-300,-60,p)}px,${lerp(-120,-20,p)}px)`; });
  // shot 3: storm surge, glitch, Ila flicker, shake
  x = seg(t,21,28.3); const sh = t>21 && t<28.3 ? Math.sin(t*41)*lerp(6,1,x) : 0;
  q('.ish[data-s="3"] .icam').style.transform = `scale(${lerp(1.25,1.05,x)}) translate(${sh}px,${-sh/2}px)`;
  q('.iila').style.opacity = (t>22 && (Math.floor(t*7)%3!==0)) ? 1 : 0.08;
  q('.iwall').style.transform = `scale(${lerp(.6,1,seg(t,23.6,24.2))})`; q('.iwall').style.opacity = clamp01((t-23.6)/.3);
  ["m1","m2","m3"].forEach((m, i) => { const el = q('.imini.'+m); el.style.opacity = clamp01((t-21.3-i*.35)/.3); });
  // shot 4: crew + Vyapti orb
  x = seg(t,28.3,38.6); q('.ish[data-s="4"] .icam').style.transform = `scale(${lerp(1.1,1,x)}) translateX(${lerp(30,0,x)}px)`;
  q('.ichar.tanvi').style.transform = `translateY(${lerp(200,0,seg(t,28.4,29.6))}px)`;
  q('.iface.samar').style.transform = `scale(${seg(t,29.2,29.8)})`; q('.iface.sana').style.transform = `scale(${seg(t,29.5,30.1)})`;
  q('.ibub.tb').style.opacity = clamp01((t-30.5)/.3);
  const orb = seg(t,34.2,35.2); q('.iorb').style.transform = `scale(${orb}) translateY(${Math.sin(t*2.2)*5}px)`; q('.iorb').style.opacity = orb;
  const vb = q('.ibub.vb'); if (vb) vb.style.opacity = clamp01((t-35.1)/.3);
  // shot 5: title card
  q('.itc').style.transform = `scale(${lerp(.86,1,seg(t,38.6,39.7))})`;
  q('.istart').style.opacity = clamp01((t-40)/.4);
  // subtitles
  let sub = ""; IVO.forEach(([a,f,d,s,who,ai]) => { if (t>=a-.1 && t<=a+d+.35 && !(ai && !state.aiOn)) sub = who ? `${who}: ${s}` : s; });
  if (!state.aiOn && t>=IVY_OFF[0] && t<=IVY_OFF[1]) sub = IVY_OFF[2];
  const se = document.getElementById("isub"); if (se.textContent !== sub) { se.textContent = sub; se.style.display = sub ? "" : "none"; }
  const sc = document.getElementById("iscrub"); if (sc && document.activeElement!==sc) sc.value = t;
  if (sc) sc.style.setProperty("--pr", (t/INTRO_T*100)+"%");
  const fmt = s => `0:${String(Math.floor(s)).padStart(2,"0")}`;
  document.getElementById("itime").textContent = `${fmt(t)} / ${fmt(INTRO_T)}`;
  document.getElementById("app").dataset.introT = t.toFixed(1);
  const speaking = !!voActive(t);
  if (introAudio) introAudio.gain.gain.value = state.intro.playing ? (speaking ? .012 : (t>21&&t<28.3 ? .09 : .045)) : 0;  /* duck rain under the voice */
  voSync(t);
  const app = document.getElementById("app"); app.dataset.vo = state.intro.playing && state.intro.sound && voActive(t) ? voActive(t)[1] : "";
}
function introSound(on) {
  if (on && !introAudio) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      let last = 0; for (let i=0;i<len;i++) { const w = Math.random()*2-1; last = (last + 0.02*w)/1.02; d[i] = last*3.5; }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900;
      const gain = ctx.createGain(); gain.gain.value = .045;
      src.connect(f); f.connect(gain); gain.connect(ctx.destination); src.start();
      introAudio = { ctx, gain };
    } catch (e) { introAudio = null; }
  } else if (!on && introAudio) { introAudio.ctx.close(); introAudio = null; }
}
function introStop() { state.intro.playing = false; introSound(false); voPauseAll(); }
function introAct(act) {
  const I = state.intro;
  if (act==="intro-play") { if (I.t >= INTRO_T) I.t = 0; I.playing = !I.playing; introSound(I.playing && I.sound); if (!I.playing) voPauseAll(); render(); return true; }
  if (act==="intro-replay") { I.t = 0; I.playing = true; introSound(I.sound); voPauseAll(); render(); return true; }
  if (act==="intro-sound") { I.sound = !I.sound; introSound(I.sound && I.playing); if (!I.sound) voPauseAll(); render(); return true; }
  if (act==="intro-start") { introStop(); state.curStage = 0; go("disc"); return true; }
  return false;
}
document.addEventListener("input", e => {
  if (e.target.id !== "iscrub" || state.scene!=="intro") return;
  state.intro.t = +e.target.value; introApply(state.intro.t);
});
