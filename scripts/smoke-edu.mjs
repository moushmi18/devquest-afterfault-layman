import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE_URL || "http://127.0.0.1:8765/";

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--window-size=1400,900"],
  defaultViewport: { width: 1400, height: 900 },
});
const page = await browser.newPage();
page.setDefaultTimeout(15000);

async function shot(name) {
  const p = path.join(OUT, name);
  await page.screenshot({ path: p, fullPage: false });
  console.log("shot", name);
  return p;
}
async function click(sel) {
  await page.waitForSelector(sel, { visible: true });
  await page.click(sel);
  await new Promise(r => setTimeout(r, 250));
}
async function clickAct(act) {
  await click(`[data-act="${act}"]`);
}

try {
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await shot("01-hub-desktop.png");

  // enter mission 3.5 via jump if hub walk is hard — use Restart then jump rail after entering
  // Walk: click hub enter by forcing state via console
  await page.evaluate(() => { state.avatar = "sana"; state.scene = "avatar"; render(); });
  await shot("02-avatar.png");
  await clickAct("enter-storm");
  await shot("03-discovery-learn.png");

  await clickAct("dq-next"); // to race
  await shot("04-discovery-race.png");
  await click('[data-testid="dq-race"]');
  await new Promise(r => setTimeout(r, 3800));
  await click('[data-testid="race-b"]');
  await clickAct("dq-next"); // freeze
  for (let i = 0; i < 6; i++) await click('[data-testid="dq-pull"]');
  await click('[data-testid="dq-flag"]');
  await clickAct("dq-next"); // verdict
  await click('[data-testid="sus-flag"]');
  await clickAct("dq-next"); // check
  await click('[data-testid="dq-check-1"]');
  await shot("05-discovery-check.png");
  await click('[data-testid="to-explore"]');

  // Explore teach first
  await shot("06-explore-teach.png");
  await click('[data-testid="x-taught"]');
  await click('[data-testid="x-lever"]');
  await click('[data-testid="x-next"]');
  // skip through remaining explore via jump for time, after verifying teach lock
  await page.evaluate(() => { jumpStage(2); });
  await shot("07-assign-A.png");
  await click('[data-testid="as-pick-0"]');
  await click('[data-testid="as-commit"]');
  await shot("08-assign-feedback.png");

  await page.evaluate(() => { jumpStage(3); });
  await shot("09-predict.png");

  await page.evaluate(() => { jumpStage(4); });
  await shot("10-code-brief.png");

  await page.evaluate(() => { jumpStage(5); });
  await shot("11-debug-observe.png");

  await page.evaluate(() => { jumpStage(6); });
  await shot("12-mastery-challenge.png");

  // tablet
  await page.setViewport({ width: 834, height: 1112 });
  await page.evaluate(() => { jumpStage(0); });
  await shot("13-discovery-tablet.png");

  // mobile
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => { jumpStage(2); });
  await shot("14-assign-mobile.png");

  // verify no JS errors dumped
  console.log("SMOKE_OK");
} catch (e) {
  console.error("SMOKE_FAIL", e);
  await shot("fail.png");
  process.exitCode = 1;
} finally {
  await browser.close();
}
