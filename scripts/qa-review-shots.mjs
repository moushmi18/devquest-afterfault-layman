/** Layout-cleanup review screenshots for PR #2 follow-up */
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,900"],
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
page.setDefaultTimeout(90000);

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

try {
  await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle0" });
  await dismiss();

  // Guided fail + Coach tab
  await page.evaluate(() => {
    jumpStage(4);
    state.codeTier = "guided";
    state.guidedSrc = GUIDED_SRC;
    state.guidedFixed = false;
    state.guidedStates = null;
    state.coachLevel = 0;
    state.hintLevel = 0;
    state.aidTab = "coach";
    render();
  });
  await dismiss();
  await page.click("[data-testid=guided-check]");
  await page.waitForFunction(() => state.guidedChecked && state.guidedStates && state.guidedStates.every(s => s !== "pend"), { timeout: 90000 });
  await page.evaluate(() => {
    state.coachLevel = 2;
    state.hintLevel = 2;
    state.aidTab = "coach";
    render();
    document.querySelectorAll(".lm-veil").forEach(v => v.remove());
  });
  await shot("layout-01-guided-fail-1440.png");

  // Independent
  await page.evaluate(() => {
    jumpStage(4);
    state.codeTier = "indep";
    state.pySrc = CONSUME_BROKEN_STATUS;
    state.testStates = null;
    state.coachLevel = 1;
    state.aidTab = "mentor";
    render();
  });
  await dismiss();
  await shot("layout-02-indep-1440.png");

  // Debug fix phase (edit)
  await page.evaluate(() => {
    jumpStage(5);
    state.bugI = 0;
    state.bugPhase = "edit";
    state.bugEditSrc = null;
    state.coachLevel = 2;
    state.aidTab = "coach";
    render();
  });
  await dismiss();
  await shot("layout-03-debug-fix-1440.png");

  // Guided @ 768
  await page.setViewport({ width: 768, height: 1024 });
  await page.evaluate(() => {
    jumpStage(4);
    state.codeTier = "guided";
    state.guidedSrc = GUIDED_SRC;
    state.guidedChecked = true;
    state.guidedStates = ["pass", "pass", "pass", "fail"];
    state.guidedErr = "G4: got partial=complete";
    state.coachLevel = 2;
    state.aidTab = "coach";
    fit();
    render();
  });
  await dismiss();
  await shot("layout-04-guided-768.png");

  // Guided @ 375
  await page.setViewport({ width: 375, height: 812 });
  await page.evaluate(() => {
    jumpStage(4);
    state.codeTier = "guided";
    state.guidedSrc = GUIDED_SRC;
    state.coachLevel = 1;
    state.aidTab = "coach";
    fit();
    render();
  });
  await dismiss();
  await shot("layout-05-guided-375.png");

  console.log("LAYOUT_SHOTS_OK");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
