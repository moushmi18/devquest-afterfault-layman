import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });
const BASE = "http://127.0.0.1:8765/";
const issues = [];
const consoleMsgs = [];

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,900"],
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
page.setDefaultTimeout(20000);
page.on("pageerror", e => { consoleMsgs.push("PAGEERR " + e.message); issues.push("pageerror: " + e.message); });
page.on("console", m => {
  const t = m.type();
  if (t === "error" || t === "warning") consoleMsgs.push(t.toUpperCase() + " " + m.text());
  if (t === "error") issues.push("console.error: " + m.text());
});

async function dismiss() {
  await page.evaluate(() => {
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
    try { localStorage.setItem("welcomed2", "true"); } catch (e) {}
  });
}
async function shot(n) {
  await page.screenshot({ path: path.join(OUT, n), fullPage: false });
  console.log("shot", n);
}
async function clickTid(id) {
  const ok = await page.evaluate((testid) => {
    const el = document.querySelector(`[data-testid="${testid}"]`);
    if (!el) return false;
    el.click();
    return true;
  }, id);
  if (!ok) issues.push("missing testid " + id + " @ " + (await page.evaluate(() => state.scene + "/" + (state.dq?.step ?? state.xq?.beat ?? state.asStep ?? state.codeTier ?? state.bugPhase ?? state.bossPhase))));
  await new Promise(r => setTimeout(r, 200));
}
async function clickAct(act) {
  const ok = await page.evaluate((a) => {
    const el = document.querySelector(`[data-act="${a}"]`);
    if (!el) return false;
    el.click();
    return true;
  }, act);
  if (!ok) issues.push("missing act " + act);
  await new Promise(r => setTimeout(r, 200));
}
async function overflowCheck(label) {
  const o = await page.evaluate(() => {
    const app = document.getElementById("app");
    const vp = document.getElementById("viewport");
    if (!app || !vp) return { missing: true };
    fit();
    const bad = [];
    const docEl = document.documentElement;
    const sw = Math.max(docEl.scrollWidth, document.body.scrollWidth);
    const cw = docEl.clientWidth;
    // True fluid layout must not create page-level horizontal scroll.
    if (document.body.classList.contains("fluid") && sw > cw + 2) {
      bad.push(`h-scroll page ${sw}>${cw} fluid=${document.body.classList.contains("fluid")}`);
    }
    if (document.body.classList.contains("lm-phone")) {
      bad.push("lm-phone still active — scaled pan layout should be gone");
    }
    return {
      w: app.getBoundingClientRect().width,
      h: app.getBoundingClientRect().height,
      vw: window.innerWidth,
      vh: window.innerHeight,
      fluid: document.body.classList.contains("fluid"),
      scrollWidth: sw,
      clientWidth: cw,
      bad: bad.slice(0, 8),
    };
  });
  if (o.bad && o.bad.length) issues.push(`overflow ${label}: ${o.bad.join(" | ")}`);
  return o;
}

try {
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await dismiss();
  await shot("qa-01-hub-1440.png");

  // Discovery full path
  await page.evaluate(() => { state = initialState(); state.avatar = "sana"; go("disc"); });
  await dismiss();
  await shot("qa-02-disc-learn-1440.png");
  await overflowCheck("disc-learn");
  await clickAct("dq-next");
  await clickTid("dq-race");
  await new Promise(r => setTimeout(r, 3800));
  await clickTid("race-b");
  await clickAct("dq-next");
  for (let i = 0; i < 6; i++) await clickTid("dq-pull");
  await clickTid("dq-flag");
  await clickAct("dq-next");
  // wrong then right
  await clickTid("sus-crash");
  await clickTid("sus-flag");
  await clickAct("dq-next");
  await clickTid("dq-check-0"); // wrong
  await clickTid("dq-check-1"); // right
  await shot("qa-03-disc-check.png");
  await clickTid("to-explore");
  await dismiss();

  // Explore: teach gate + SSE / endline labs + full beat teach coverage
  await shot("qa-04-explore-teach.png");
  if (!(await page.$("[data-testid=teach-card]"))) issues.push("Explore missing teach-card on first beat");
  await clickTid("x-taught");
  await clickTid("x-lever");
  if (!(await page.$("[data-testid=x-next]"))) issues.push("Explore next missing after open");
  const exploreIds = await page.evaluate(() => XBEATS.map(b => b.id));
  if (!exploreIds.includes("sse") || !exploreIds.includes("endline")) issues.push("Explore missing sse/endline beats: " + exploreIds.join(","));
  // Complete explore via state but verify each beat has teach
  const teachCoverage = await page.evaluate(() => {
    const missing = [];
    const sseOk = [];
    for (let i = 0; i < XBEATS.length; i++) {
      state.xq = xqInit();
      state.xq.beat = i;
      state.scene = "explore";
      render();
      const id = XBEATS[i].id;
      const hasTeach = !!document.querySelector("[data-testid=teach-card]");
      const taughtStrip = !!document.querySelector("[data-testid=teach-strip]");
      if (!hasTeach && !taughtStrip) missing.push(id);
      // unlock and ensure interactive surface appears
      state.xq.taught[id] = true;
      render();
      if (id === "sse") sseOk.push(!!document.querySelector("[data-testid=sse-box]"), !!document.querySelector("[data-testid=xcheck-sse]"));
      if (id === "endline") sseOk.push(!!document.querySelector("[data-testid=xcheck-endline]"));
    }
    return { missing, sseOk, n: XBEATS.length };
  });
  if (teachCoverage.missing.length) issues.push("Explore beats without teach: " + teachCoverage.missing.join(","));
  if (teachCoverage.n < 14) issues.push("Explore beat count expected >=14 got " + teachCoverage.n);
  if (teachCoverage.sseOk.includes(false)) issues.push("Explore SSE/endline interactive surface missing");

  // Assign A-D wrong/right (vocab gate first)
  await page.evaluate(() => { jumpStage(2); });
  await dismiss();
  if (!(await page.$("[data-testid=as-vocab]"))) issues.push("Assign missing vocab teach gate");
  for (let s = 0; s < 4; s++) {
    await page.evaluate((step) => {
      state.asStep = step; state.asPicked = null; state.asResolved = false; state.asVocab = false; render();
      document.querySelectorAll(".lm-veil").forEach(v => v.remove());
    }, s);
    await clickTid("as-vocab-done");
    // pick wrong first if possible
    const sc = await page.evaluate(() => ASSIGN_SCENARIOS[state.asStep]);
    const wrong = sc.ops.findIndex(o => !o.ok);
    await clickTid("as-pick-" + wrong);
    await clickTid("as-commit");
    const wrongMarkedOk = await page.evaluate((wi) => {
      const el = document.querySelector(`[data-testid=as-pick-${wi}]`);
      return el && el.classList.contains("ok");
    }, wrong);
    if (wrongMarkedOk) issues.push(`Assign ${sc.id} marked wrong answer as ok`);
    await clickTid("as-next");
  }
  // redo Assign correctly for score
  await page.evaluate(() => {
    state.asStep = 0; state.asScore = 0; state.asPicked = null; state.asResolved = false; state.asVocab = false; render();
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
  });
  for (let s = 0; s < 4; s++) {
    await clickTid("as-vocab-done");
    const right = await page.evaluate(() => ASSIGN_SCENARIOS[state.asStep].ops.findIndex(o => o.ok));
    await clickTid("as-pick-" + right);
    await clickTid("as-commit");
    await clickTid("as-next");
  }
  const asScore = await page.evaluate(() => state.asScore);
  if (asScore !== 4) issues.push("Assign score expected 4 got " + asScore);
  await shot("qa-05-assign-done.png");

  // Predict all 6 — teach gate before each question
  await page.evaluate(() => { jumpStage(3); });
  await dismiss();
  if (!(await page.$("[data-testid=pred-teach]"))) issues.push("Predict missing teach-first card");
  for (let i = 0; i < 6; i++) {
    await clickTid("pred-taught");
    const correct = await page.evaluate(() => PRED[state.predI].correct);
    await page.evaluate((c) => {
      const el = document.querySelector(`[data-act=pred-pick][data-i="${c}"]`);
      if (el) el.click();
    }, correct);
    await clickTid("commit-pred");
    if (i < 5) await clickAct("pred-next");
  }
  await shot("qa-06-predict-done.png");

  // Code brief → micro skip via solve → guided → indep
  await page.evaluate(() => { jumpStage(4); });
  await dismiss();
  if (!(await page.$("[data-testid=mentor-coach]"))) issues.push("Code Brief missing Mentor/Coach panel");
  // Mentor must differ from step body; Coach self-checks differ per Brief step; sidebar matches Brief
  const briefAid = await page.evaluate(() => {
    const problems = [];
    const tipsSeen = new Set();
    const coach0 = new Set();
    for (let i = 0; i < CODE_WALK.length; i++) {
      state.codeWalk = i;
      state.coachLevel = 1;
      render();
      document.querySelectorAll(".lm-veil").forEach(v => v.remove());
      const body = (document.querySelector("[data-testid=brief-step-body]")?.textContent || "").trim();
      const mentor = (document.querySelector("[data-testid=mentor-body]")?.textContent || "").trim();
      const tip = (document.querySelector(".side .tip")?.textContent || "").trim();
      const obj = (document.querySelector(".side .obj")?.textContent || "").trim();
      const c0 = (document.querySelector("[data-testid=coach-step-0] .coach-txt")?.textContent || "").trim();
      if (!mentor || !body) problems.push("missing mentor/body at step " + i);
      else {
        if (mentor === body) problems.push("mentor === body at " + i);
        // Mentor must not be a trivial prefix/echo of the step body
        const bodyCore = body.replace(/\s+/g, " ").slice(0, 60);
        if (bodyCore.length > 20 && mentor.replace(/\s+/g, " ").includes(bodyCore)) problems.push("mentor contains step body verbatim at " + i);
        if (!/why|misconception|walk|plain|explore|example/i.test(mentor)) problems.push("mentor lacks teaching markers at " + i);
      }
      if (/drag the blocks|nest them under the loop/i.test(tip)) problems.push("Brief tip still talks about dragging blocks at " + i);
      if (/forge the line keeper/i.test(obj)) problems.push("jargon objective on Brief");
      if (tip) tipsSeen.add(tip);
      if (c0) coach0.add(c0);
      if (!document.querySelector("[data-testid=mentor-chips]")) problems.push("missing mentor chips at " + i);
    }
    if (coach0.size < Math.min(5, CODE_WALK.length)) problems.push("coach hints not unique enough: " + coach0.size);
    return { problems, tipCount: tipsSeen.size, coachUnique: coach0.size };
  });
  briefAid.problems.forEach(p => issues.push("Brief aid: " + p));
  await page.evaluate(() => { state.codeWalk = 3; state.coachLevel = 2; render(); document.querySelectorAll(".lm-veil").forEach(v => v.remove()); });
  await shot("qa-07-code-brief.png");
  // walk last step
  await page.evaluate(() => { state.codeWalk = CODE_WALK.length - 1; state.coachLevel = 0; render(); document.querySelectorAll(".lm-veil").forEach(v => v.remove()); });
  await clickTid("to-micro");
  if (!(await page.$("[data-testid=mentor-coach]"))) issues.push("Code Micro missing Mentor/Coach panel");
  if (!(await page.$("[data-testid=micro-guide]"))) issues.push("Code Micro missing guided learning banner");
  const microTip = await page.evaluate(() => (document.querySelector(".side .tip")?.textContent || ""));
  if (/brief step|request with streaming/i.test(microTip)) issues.push("Micro sidebar tip mismatched");
  if (!/drag|block|nest|loop/i.test(microTip)) issues.push("Micro tip should mention blocks/loop");
  // auto-solve micro for progression test
  await page.evaluate(() => {
    state.dd.lines = [
      { bid: "given", depth: 0 },
      { bid: "loop", depth: 0 },
      { bid: "guard", depth: 1 },
      { bid: "usage", depth: 2 },
      { bid: "cont", depth: 2 },
      { bid: "choice", depth: 1 },
      { bid: "piece", depth: 1 },
      { bid: "ifpiece", depth: 1 },
      { bid: "print", depth: 2 },
      { bid: "append", depth: 2 },
      { bid: "iffin", depth: 1 },
      { bid: "fin", depth: 2 },
      { bid: "join", depth: 0 },
    ];
    state.dd.slots = { usage: '"usage"', piece: '"content"', flush: "True", join: '""' };
    state.microPy = null;
    state.dd.solved = false;
    render();
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
  });
  await clickTid("micro-run");
  await page.waitForFunction(() => state.dd.solved === true || (state.microPy && state.microPy.ok === false), { timeout: 90000 });
  const microOk = await page.evaluate(() => ({ solved: state.dd.solved, microPy: state.microPy, structural: state.dd.result }));
  if (!microOk.solved) issues.push("Micro real Python failed: " + JSON.stringify(microOk));
  await clickTid("to-guided");
  // Broken status should fail G4 under real Python
  await page.evaluate(() => {
    state.guidedChoice = '"complete"';
    state.guidedFixed = false;
    state.guidedStates = null;
    render();
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
  });
  await clickTid("guided-check");
  await page.waitForFunction(() => state.guidedChecked && state.guidedStates && state.guidedStates.every(s => s !== "pend"), { timeout: 90000 });
  const brokenGuided = await page.evaluate(() => ({ fixed: state.guidedFixed, states: state.guidedStates }));
  if (brokenGuided.fixed) issues.push("Guided marked fixed with hard-coded complete");
  if (brokenGuided.states && brokenGuided.states[3] === "pass") issues.push("Guided G4 passed with broken status");
  // Targeted coach after failing G4
  await page.evaluate(() => { state.coachLevel = 1; render(); document.querySelectorAll(".lm-veil").forEach(v => v.remove()); });
  const guidedCoach = await page.evaluate(() => {
    const t = document.querySelector("[data-testid=coach-step-0]")?.dataset?.hint
      || document.querySelector("[data-testid=coach-step-0]")?.textContent || "";
    const mentor = document.querySelector("[data-testid=mentor-body]")?.textContent || "";
    const tip = document.querySelector(".side .tip")?.textContent || "";
    return { t, mentor, tip };
  });
  if (!/G4|quiet|complete|finish_reason/i.test(guidedCoach.t)) issues.push("Guided coach not targeted to failing assert: " + guidedCoach.t);
  if (/drag the blocks/i.test(guidedCoach.tip)) issues.push("Guided tip still talks about dragging blocks");
  if (!/honest|complete|finish|status/i.test(guidedCoach.mentor)) issues.push("Guided mentor missing status teaching");
  await shot("qa-07a-guided-fail-coach.png");
  await page.evaluate(() => {
    [...document.querySelectorAll("[data-act=guided-set]")].find(b => b.dataset.c === "honest_status(error, finish)")?.click();
  });
  await clickTid("guided-check");
  await page.waitForFunction(() => state.guidedFixed === true, { timeout: 90000 });
  await shot("qa-07b-guided-real.png");
  if (!(await page.evaluate(() => state.guidedFixed && state.guidedStates?.every(s => s === "pass")))) {
    issues.push("Guided real Python did not fully pass after honest_status");
  }
  // Code stage should not show Simulated badge on Guided
  const simOnGuided = await page.evaluate(() => !!document.querySelector(".main .sim-badge"));
  if (simOnGuided) issues.push("Guided still shows Simulated badge");
  await clickAct("to-indep");
  await page.evaluate(() => {
    state.pySrc = CONSUME_TEMPLATE;
    state.testStates = null;
    state.testsDone = false;
    render();
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
  });
  await clickTid("indep-check");
  await page.waitForFunction(() => state.testsDone === true, { timeout: 90000 });
  const indep = await page.evaluate(() => ({ done: state.testsDone, states: state.testStates, pass: state.realPass, py: PY.status }));
  if (!indep.done || !indep.states?.every(s => s === "pass") || indep.pass !== 5) issues.push("Independent tests failed: " + JSON.stringify(indep));

  // Debug all 5
  await page.evaluate(() => { jumpStage(5); });
  await dismiss();
  if (!(await page.$("[data-testid=mentor-coach]"))) issues.push("Debug missing Mentor/Coach panel");
  if (!(await page.$("[data-testid=debug-process]"))) issues.push("Debug missing process hierarchy");
  const dbgAid = await page.evaluate(() => {
    const problems = [];
    const coaches = new Set();
    for (let i = 0; i < BUGS.length; i++) {
      state.bugI = i; state.bugPhase = "observe"; state.coachLevel = 1; render();
      document.querySelectorAll(".lm-veil").forEach(v => v.remove());
      const mentor = document.querySelector("[data-testid=mentor-body]")?.textContent || "";
      const c0 = document.querySelector("[data-testid=coach-step-0]")?.textContent || "";
      const tip = document.querySelector(".side .tip")?.textContent || "";
      if (!/bug|run|symptom|typeerror|flush|history|complete|usage/i.test(mentor)) problems.push("weak debug mentor @" + i);
      if (/drag the blocks/i.test(tip)) problems.push("debug tip mentions blocks @" + i);
      coaches.add(c0.slice(0, 48));
    }
    if (coaches.size < 4) problems.push("debug coach not unique per bug: " + coaches.size);
    state.bugI = 0; state.bugPhase = "observe"; state.coachLevel = 0;
    return problems;
  });
  dbgAid.forEach(p => issues.push("Debug aid: " + p));
  for (let i = 0; i < 5; i++) {
    await clickTid("bug-to-find");
    await page.evaluate(() => {
      const b = BUGS[state.bugI];
      const ln = document.querySelector(`.debug-find .ln[data-ln="${b.badLines[0]}"]`);
      if (ln) ln.click();
    });
    await new Promise(r => setTimeout(r, 150));
    // try wrong fix if exists then right
    await page.evaluate(() => {
      const b = BUGS[state.bugI];
      const wrong = b.fixes.findIndex(f => !f.ok);
      const right = b.fixes.findIndex(f => f.ok);
      if (wrong >= 0) document.querySelector(`[data-testid=fix-${wrong}]`)?.click();
      setTimeout(() => document.querySelector(`[data-testid=fix-${right}]`)?.click(), 50);
    });
    await new Promise(r => setTimeout(r, 250));
    if (i < 4) await clickAct("bug-next");
  }
  const bugsFixed = await page.evaluate(() => state.bugsFixed);
  if (bugsFixed !== 5) issues.push("Debug bugsFixed expected 5 got " + bugsFixed);
  await shot("qa-08-debug-done.png");

  // Mastery
  await clickAct("to-boss");
  await dismiss();
  await shot("qa-09-mastery-challenge.png");
  // help before attempt should not spoil - help button only after attempt
  const helpBefore = await page.$("[data-testid=chal-help]");
  if (helpBefore) issues.push("Mastery help visible before attempt");
  await page.evaluate(() => {
    state.masterySrc = CONSUME_TEMPLATE;
    state.masteryTried = false;
    state.masteryPy = null;
    state.masteryCodeOk = false;
    render();
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
  });
  await clickTid("chal-submit");
  await page.waitForFunction(() => state.masteryTried && state.masteryPy && state.masteryPy.states && state.masteryPy.states.every(s => s !== "pend"), { timeout: 90000 });
  if (!(await page.$("[data-testid=chal-help]"))) issues.push("Mastery help missing after attempt");
  if (!(await page.evaluate(() => state.masteryCodeOk))) issues.push("Mastery template did not pass real checks");
  await clickTid("boss-concepts");
  // concepts optional — jump to live scenarios
  await clickTid("boss-p2");
  for (let i = 0; i < 4; i++) {
    const correct = await page.evaluate(() => P2_EVENTS[state.p2i].correct);
    await page.evaluate((id) => {
      document.querySelector(`[data-act=p2-pick][data-id="${id}"]`)?.click();
    }, correct);
    await clickTid("p2-commit");
  }
  await clickAct("boss-p3");
  await clickTid("boss-report");
  await shot("qa-10-mastery-report.png");

  // Responsive — true fluid (no lm-phone), no page horizontal scroll
  for (const [w, h, name] of [[1024, 768, "laptop"], [768, 1024, "tablet"], [414, 896, "mobile414"], [375, 812, "mobile"]]) {
    await page.setViewport({ width: w, height: h });
    await page.evaluate(() => { jumpStage(0); fit(); document.querySelectorAll(".lm-veil").forEach(v => v.remove()); });
    await shot(`qa-11-disc-${name}.png`);
    await overflowCheck(`disc-${name}`);
    await page.evaluate(() => { jumpStage(2); fit(); document.querySelectorAll(".lm-veil").forEach(v => v.remove()); });
    await shot(`qa-12-assign-${name}.png`);
    await overflowCheck(`assign-${name}`);
    await page.evaluate(() => {
      jumpStage(4);
      state.codeTier = "guided";
      state.guidedChoice = "honest_status(error, finish)";
      state.guidedFixed = true;
      state.guidedStates = GUIDED_TESTS_REAL.map(() => "pass");
      render();
      fit();
      document.querySelectorAll(".lm-veil").forEach(v => v.remove());
    });
    await overflowCheck(`guided-${name}`);
    const fluid = await page.evaluate(() => document.body.classList.contains("fluid"));
    if (w < 1100 && !fluid) issues.push(`expected fluid layout at ${w}`);
    if (w >= 1100 && fluid) issues.push(`expected stage layout at ${w}`);
  }

  // Dead buttons sample
  await page.setViewport({ width: 1440, height: 900 });
  const dead = await page.evaluate(() => {
    jumpStage(0); render();
    const acts = [...document.querySelectorAll("[data-act]")].map(e => e.getAttribute("data-act"));
    return acts.filter(a => a === "noop");
  });
  console.log("noop buttons on disc:", dead.length);

  console.log("ISSUES", JSON.stringify(issues, null, 2));
  console.log("CONSOLE", consoleMsgs.slice(0, 30));
  fs.writeFileSync(path.join(OUT, "qa-issues.json"), JSON.stringify({ issues, consoleMsgs }, null, 2));
  if (issues.length) process.exitCode = 2;
  else console.log("QA_PASS");
} catch (e) {
  console.error("QA_CRASH", e);
  await shot("qa-fail.png");
  process.exitCode = 1;
} finally {
  await browser.close();
}
