/** Extra screenshots for reviewer-feedback PR report */
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
page.setDefaultTimeout(30000);

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

  // Discovery
  await page.evaluate(() => { jumpStage(0); render(); });
  await dismiss();
  await shot("review-01-discovery.png");

  // Explore SSE taught
  await page.evaluate(() => {
    jumpStage(1);
    state.xq = xqInit();
    const i = XBEATS.findIndex(b => b.id === "sse");
    state.xq.beat = i;
    state.xq.taught.sse = true;
    render();
  });
  await dismiss();
  await shot("review-02-explore-sse.png");

  // Assign vocab
  await page.evaluate(() => { jumpStage(2); state.asVocab = false; render(); });
  await dismiss();
  await shot("review-03-assign-vocab.png");

  // Predict teach
  await page.evaluate(() => { jumpStage(3); state.predPhase = "teach"; render(); });
  await dismiss();
  await shot("review-04-predict-teach.png");

  // Code brief with Mentor/Coach
  await page.evaluate(() => {
    jumpStage(4);
    state.codeTier = "brief";
    state.codeWalk = 3;
    state.coachLevel = 2;
    render();
  });
  await dismiss();
  await shot("review-05-code-mentor-coach.png");

  // Micro with Mentor/Coach
  await page.evaluate(() => {
    state.codeTier = "micro";
    state.coachLevel = 1;
    render();
  });
  await dismiss();
  await shot("review-05b-code-micro-mentor-coach.png");

  // Debug with Mentor/Coach
  await page.evaluate(() => {
    jumpStage(5);
    state.bugPhase = "observe";
    state.coachLevel = 2;
    render();
  });
  await dismiss();
  await shot("review-06-debug-mentor-coach.png");

  // Mastery challenge
  await page.evaluate(() => {
    jumpStage(6);
    state.bossPhase = "challenge";
    state.masterySrc = CONSUME_TEMPLATE;
    render();
  });
  await dismiss();
  await shot("review-07-mastery.png");

  // Mobile discovery
  await page.setViewport({ width: 375, height: 812 });
  await page.evaluate(() => { jumpStage(0); fit(); render(); });
  await dismiss();
  await shot("review-08-mobile-375.png");

  console.log("REVIEW_SHOTS_OK");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
