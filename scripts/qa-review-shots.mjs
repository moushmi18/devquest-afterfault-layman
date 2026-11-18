/** Extra screenshots for reviewer-feedback follow-up */
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

  // Code Brief step 4 with Mentor/Coach unlocked
  await page.evaluate(() => {
    jumpStage(4);
    state.codeTier = "brief";
    state.codeWalk = 3;
    state.coachLevel = 2;
    render();
  });
  await dismiss();
  await page.evaluate(() => document.querySelector("[data-testid=mentor-coach]")?.scrollIntoView({ block: "center" }));
  await shot("review-fu-01-code-brief-step4.png");

  // Guided with failing run + targeted coach
  await page.evaluate(() => {
    jumpStage(4);
    state.codeTier = "guided";
    state.guidedChoice = '"complete"';
    state.guidedFixed = false;
    state.guidedStates = null;
    state.coachLevel = 0;
    state.hintLevel = 0;
    render();
  });
  await dismiss();
  await page.click("[data-testid=guided-check]");
  await page.waitForFunction(() => state.guidedChecked && state.guidedStates && state.guidedStates.every(s => s !== "pend"), { timeout: 90000 });
  await page.evaluate(() => { state.coachLevel = 2; state.hintLevel = 2; render(); document.querySelectorAll(".lm-veil").forEach(v => v.remove()); });
  await page.evaluate(() => document.querySelector("[data-testid=coach-panel]")?.scrollIntoView({ block: "center" }));
  await shot("review-fu-02-guided-fail-coach.png");

  // Debug Mentor/Coach
  await page.evaluate(() => {
    jumpStage(5);
    state.bugI = 0;
    state.bugPhase = "observe";
    state.coachLevel = 2;
    render();
  });
  await dismiss();
  await page.evaluate(() => document.querySelector("[data-testid=mentor-coach]")?.scrollIntoView({ block: "center" }));
  await shot("review-fu-03-debug-mentor-coach.png");

  // Mobile Brief — scroll so Mentor/Coach + step body are visible
  await page.setViewport({ width: 375, height: 812 });
  await page.evaluate(() => {
    jumpStage(4);
    state.codeTier = "brief";
    state.codeWalk = 3;
    state.coachLevel = 1;
    fit();
    render();
  });
  await dismiss();
  await page.evaluate(() => document.querySelector("[data-testid=mentor-coach]")?.scrollIntoView({ block: "start" }));
  await shot("review-fu-04-mobile-375-brief.png");

  console.log("REVIEW_FU_SHOTS_OK");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
