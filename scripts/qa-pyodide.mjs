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

  // Mobile screenshot of python output (Independent, after a real run)
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

  console.log("ISSUES", JSON.stringify(issues, null, 2));
  fs.writeFileSync(path.join(OUT, "qa-py-issues.json"), JSON.stringify({ issues, indep }, null, 2));
  if (issues.length) process.exitCode = 2;
  else console.log("QA_PY_PASS");
} catch (e) {
  console.error("FAIL", e);
  await shot("qa-py-fail.png");
  process.exitCode = 1;
} finally {
  await browser.close();
}
