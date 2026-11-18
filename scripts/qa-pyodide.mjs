import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });
const issues = [];
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,900"],
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
page.setDefaultTimeout(120000);
page.on("pageerror", e => issues.push("pageerror: " + e.message));

async function dismiss() {
  await page.evaluate(() => {
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
    try { localStorage.setItem("welcomed2", "true"); } catch (e) {}
  });
}
async function shot(n) {
  await page.screenshot({ path: path.join(OUT, n) });
  console.log("shot", n);
}

try {
  await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle0" });
  await dismiss();

  // Independent: broken should fail T3, fixed should pass all
  const indep = await page.evaluate(async () => {
    jumpStage(4);
    state.codeTier = "indep";
    state.pySrc = CONSUME_BROKEN_STATUS;
    render();
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
    await pyEnsure();
    // run broken
    const brokenStates = [];
    for (const t of INDEP_TESTS_REAL) {
      const r = await pyRunConsume(CONSUME_BROKEN_STATUS, t.kind);
      brokenStates.push({ id: t.id, pass: !!t.check(r), status: r.result && r.result.status, err: r.error });
    }
    // run good
    const goodStates = [];
    for (const t of INDEP_TESTS_REAL) {
      const r = await pyRunConsume(CONSUME_TEMPLATE, t.kind);
      goodStates.push({ id: t.id, pass: !!t.check(r), status: r.result && r.result.status, text: r.result && r.result.text, stdout: r.stdout });
    }
    return { brokenStates, goodStates, py: PY.status };
  });
  console.log("INDEP", JSON.stringify(indep, null, 2));
  if (indep.brokenStates.find(t => t.id === "T3")?.pass) issues.push("Broken status incorrectly passes T3");
  if (!indep.goodStates.every(t => t.pass)) issues.push("Good template failed: " + JSON.stringify(indep.goodStates.filter(t => !t.pass)));

  // Guided real Python — broken then fixed
  await page.evaluate(() => {
    jumpStage(4);
    state.codeTier = "guided";
    state.guidedChoice = '"complete"';
    state.guidedFixed = false;
    state.guidedStates = null;
    render();
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
  });
  await shot("qa-py-00-guided-broken.png");
  await page.click("[data-testid=guided-check]");
  await page.waitForFunction(() => state.guidedChecked && state.guidedStates && state.guidedStates.every(s => s !== "pend"), { timeout: 90000 });
  const gBroken = await page.evaluate(() => state.guidedStates);
  if (gBroken[3] === "pass") issues.push("Guided G4 should fail on hard-coded complete");
  await page.evaluate(() => {
    state.guidedChoice = "honest_status(error, finish)";
    state.guidedFixed = false;
    state.guidedStates = null;
    render();
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
  });
  await page.click("[data-testid=guided-check]");
  await page.waitForFunction(() => state.guidedFixed === true, { timeout: 90000 });
  await shot("qa-py-00b-guided-passed.png");
  if (!(await page.evaluate(() => state.guidedStates?.every(s => s === "pass")))) issues.push("Guided fixed did not pass all G*");

  // UI run with template
  await page.evaluate(() => {
    jumpStage(4);
    state.codeTier = "indep";
    state.pySrc = CONSUME_TEMPLATE;
    render();
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
  });
  await shot("qa-py-01-indep-editor.png");
  await page.click("[data-testid=indep-check]");
  // wait for tests
  await page.waitForFunction(() => state.testsDone === true, { timeout: 90000 });
  await shot("qa-py-02-indep-passed.png");
  const passN = await page.evaluate(() => state.realPass);
  if (passN !== 5) issues.push("UI indep realPass expected 5 got " + passN);

  // Debug bug 1 real run
  await page.evaluate(() => { jumpStage(5); state.bugI = 0; state.bugPhase = "observe"; state.bugPy = null; render(); document.querySelectorAll(".lm-veil").forEach(v => v.remove()); });
  await page.click("[data-testid=bug-run]");
  await page.waitForFunction(() => state.bugPy && state.bugPy.summary, { timeout: 60000 });
  await shot("qa-py-03-debug-run.png");
  const bugSum = await page.evaluate(() => state.bugPy.summary);
  console.log("BUG1", bugSum);
  if (!/TypeError|None|Crash/i.test(bugSum)) issues.push("Bug1 run did not show TypeError/None: " + bugSum);

  // Mastery with good template
  await page.evaluate(() => {
    jumpStage(6);
    state.bossPhase = "challenge";
    state.masterySrc = CONSUME_TEMPLATE;
    state.masteryTried = false;
    state.masteryPy = null;
    render();
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
  });
  await shot("qa-py-04-mastery-editor.png");
  await page.click("[data-testid=chal-submit]");
  await page.waitForFunction(() => state.masteryTried && state.masteryPy && state.masteryPy.states && state.masteryPy.states.every(s => s !== "pend"), { timeout: 90000 });
  await shot("qa-py-05-mastery-passed.png");
  const mOk = await page.evaluate(() => state.masteryCodeOk);
  if (!mOk) issues.push("Mastery code did not pass with template");

  // Fluid mobile / tablet — no page horizontal scroll; guided visible
  for (const [w, h, name] of [[375, 812, "mobile"], [768, 1024, "tablet"]]) {
    await page.setViewport({ width: w, height: h });
    await page.evaluate(() => {
      jumpStage(4);
      state.codeTier = "guided";
      state.guidedChoice = "honest_status(error, finish)";
      state.guidedFixed = true;
      state.guidedStates = GUIDED_TESTS_REAL.map(() => "pass");
      state.guidedOut = "All guided checks green on mock streams.";
      render();
      fit();
      document.querySelectorAll(".lm-veil").forEach(v => v.remove());
    });
    await shot(`qa-py-06-guided-${name}.png`);
    const ov = await page.evaluate(() => {
      fit();
      return {
        fluid: document.body.classList.contains("fluid"),
        lmPhone: document.body.classList.contains("lm-phone"),
        sw: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        cw: document.documentElement.clientWidth,
      };
    });
    if (!ov.fluid) issues.push(`${name} not fluid`);
    if (ov.lmPhone) issues.push(`${name} still lm-phone`);
    if (ov.sw > ov.cw + 2) issues.push(`${name} horizontal overflow ${ov.sw}>${ov.cw}`);
  }

  // Independent mobile
  await page.setViewport({ width: 375, height: 812 });
  await page.evaluate(() => {
    jumpStage(4);
    state.codeTier = "indep";
    state.pySrc = CONSUME_TEMPLATE;
    state.testStates = INDEP_TESTS_REAL.map(() => "pass");
    state.testsDone = true;
    state.pyReal = true;
    state.realPass = 5;
    state.pyOut = "Your order is on the way.";
    state.pyErr = null;
    render();
    fit();
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
  });
  await shot("qa-py-06-indep-mobile.png");

  // Desktop 1440 hub
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluate(() => { jumpStage(0); fit(); document.querySelectorAll(".lm-veil").forEach(v => v.remove()); });
  await shot("qa-py-07-disc-1440.png");

  // Mentor/Coach visible on Code + Debug; Predict teach gate
  await page.setViewport({ width: 1440, height: 900 });
  const aid = await page.evaluate(() => {
    const out = { problems: [] };
    jumpStage(4); state.codeTier = "brief"; state.codeWalk = 3; state.coachLevel = 2; render();
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
    out.codeBrief = !!document.querySelector("[data-testid=mentor-coach]");
    const body = document.querySelector("[data-testid=brief-step-body]")?.textContent || "";
    const mentor = document.querySelector("[data-testid=mentor-body]")?.textContent || "";
    const tip = document.querySelector(".side .tip")?.textContent || "";
    if (!mentor || mentor === body) out.problems.push("brief mentor equals/missing body");
    if (!/iterator|chunk|SSE|stream=True/i.test(mentor)) out.problems.push("brief step4 mentor weak");
    if (/drag the blocks/i.test(tip)) out.problems.push("brief tip still drag-blocks");
    if (!document.querySelector("[data-testid=mentor-chips]")) out.problems.push("brief chips missing");
    const c0 = CODE_WALK[3].coach[0];
    const c0b = CODE_WALK[0].coach[0];
    if (c0 === c0b) out.problems.push("brief coach identical across steps");
    state.codeTier = "micro"; state.coachLevel = 1; render();
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
    out.micro = !!document.querySelector("[data-testid=mentor-coach]") && !!document.querySelector("[data-testid=micro-guide]");
    jumpStage(5); state.coachLevel = 1; render();
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
    out.debug = !!document.querySelector("[data-testid=mentor-coach]") && !!document.querySelector("[data-testid=debug-process]");
    const dm = document.querySelector("[data-testid=mentor-body]")?.textContent || "";
    if (!/Bug 1|None|TypeError|guard/i.test(dm)) out.problems.push("debug mentor not bug-specific");
    jumpStage(3); render();
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
    out.predTeach = !!document.querySelector("[data-testid=pred-teach]");
    jumpStage(2); state.asVocab = false; render();
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
    out.asVocab = !!document.querySelector("[data-testid=as-vocab]");
    jumpStage(1);
    state.xq = xqInit();
    const sseI = XBEATS.findIndex(b => b.id === "sse");
    state.xq.beat = sseI; state.xq.taught.sse = true; render();
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
    out.sse = !!document.querySelector("[data-testid=sse-box]");
    return out;
  });
  await shot("qa-py-08-mentor-coach-code.png");
  await page.evaluate(() => { jumpStage(5); state.coachLevel = 2; render(); document.querySelectorAll(".lm-veil").forEach(v => v.remove()); });
  await shot("qa-py-09-mentor-coach-debug.png");
  for (const [k, v] of Object.entries(aid)) {
    if (k === "problems") continue;
    if (!v) issues.push("pyodide aid check failed: " + k);
  }
  (aid.problems || []).forEach(p => issues.push("pyodide aid: " + p));

  console.log("ISSUES", JSON.stringify(issues, null, 2));
  fs.writeFileSync(path.join(OUT, "qa-py-issues.json"), JSON.stringify({ issues, indep, aid }, null, 2));
  if (issues.length) process.exitCode = 2;
  else console.log("QA_PY_PASS");
} catch (e) {
  console.error("FAIL", e);
  await shot("qa-py-fail.png");
  process.exitCode = 1;
} finally {
  await browser.close();
}
