# DevQuest · The Unfinished Line (layman edition)

Live preview: https://devquest-afterfault-layman.vercel.app

## What the game is
DevQuest Afterfault, Mission 3.5 "The Unfinished Line" is a short story game. You play a junior engineer at Dabba Dash, a made-up food delivery app. Its support chatbot keeps stopping mid-sentence while the dashboard says "All good". Across 7 stages (Discovery, Explore, Assign, Predictions, Code, Debug, Mastery) you learn how AI replies arrive piece by piece ("streaming"), and why a reply only counts as finished when it sends its finish signal.

## What the layman layer adds
The original game files are unchanged. These helpers sit on top of them:

- **Welcome guide.** A "What is this?" card on the first visit. The purple **What is this?** button in the bottom bar reopens it.
- **Tap-to-explain words.** Purple dotted words show a plain-English meaning. The **Glossary** has every term with an everyday comparison.
- **Stage recaps.** "What you just learned" appears after each stage. All recaps are also under **? Help → Recaps**.
- **Explain lines.** The **💡 Explain lines** chip on every code panel adds a simple note to each line.
- **Sample numbers.** A small "i" badge on every `*` explains that it marks a sample number, not an error.
- **Ask Vyapti.** A mentor chat that knows which stage you're on and gives hints before answers.
- **Saved progress.** Progress saves in the browser.
- **Phones.** Mission screens are readable on phones; swipe sideways on the game to see the rest.
- **Smaller extras.** A quick tour, character cards, a "Try it" streaming demo, and plain names instead of raw IDs.

The added files are `js/layman-data.js`, `js/layman.js`, `js/mentor.js`, `css/layman.css` and `api/mentor.mjs`, plus a few lines in `index.html`.

## Run locally
It's a plain static site with no build step. From this folder, start any static server:

```
npx serve .
# or
python3 -m http.server 8000
```

Then open the address it prints. Locally, the Vyapti chat uses its built-in offline mentor, because `/api/mentor` needs Vercel to run.

## Deploy on Vercel
1. On vercel.com, click **Add New → Project** and import this repo.
2. Set Framework Preset to **Other**. Leave the build command and output directory empty.
3. Deploy.

`api/mentor.mjs` becomes a serverless function that calls Vercel AI Gateway. Live AI replies need AI Gateway credits on the team, which means a card on file. Without credits, the chat automatically falls back to the built-in offline mentor, so nothing breaks. No API keys are stored in this repo.
