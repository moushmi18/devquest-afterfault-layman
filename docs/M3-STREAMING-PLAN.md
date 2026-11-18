# Mission 3.5 · Streaming Responses — learning redesign (branch `m3-streaming-mission`)

## Sources analysed
- **Afterfault app (this repo)** — story, cast (Rohan, Tanvi, Samar, Sana, Ila, Vyapti), art, palette, 7-stage rail, layman help layer (glossary, tap-to-explain, Ask Vyapti chat).
- **Client review spreadsheet** (`curriculum`, `overall summary`, `Trailer`, `Discovery`, `Explore`, `Assign`, `Predict`, `code`, `Debug`, `Mastery` sheets) — primary acceptance criteria. Topic: *Streaming responses* in Module 03 (APIs & LLM Integration in Python), 7-section breakdown, stage outcomes, Incoming Event Chat scenarios.
- **M3 Mission 1 site** (devquest-m3-mission1-visual) — a single-file prototype. **Note:** its content is Module 3 *topic 1* (REST APIs & JSON, "Relay Isles" courier metaphor: GET/POST, status codes, headers, JSON). It contains no streaming content. Because the client review and the Afterfault mission are both about Streaming Responses, this build teaches Streaming Responses and borrows M3 Mission 1's *pedagogy*: teach-before-test cards, a plain-word → real-term dictionary feel, Discover → Explore → Assign → Predict → Code (blocks → fill blanks → handle errors) → Debug → Master (build it all, read the receipt, recover), XP for applied skills and a final result/review screen.

## How it's built
- Plain static site, no build step (unchanged). New files only under `js/learn/` and `css/learn.css`; small hooks in `app.js`, `layman.js`, `mentor.js`, `hub.js`, `lib.js`, `index.html`.
- Learning stages render in a **fluid responsive layout** (desktop 3 columns, tablet 2, phone 1 with a bottom Mentor/Coach drawer). Hub map, avatar picker and trailer keep the original 1280×720 canvas.
- The original stage screens are still available at `/?classic=1`.
- **Real Python**: Pyodide 0.27.7 in a Web Worker (`js/learn/py-worker.js`) runs `js/learn/harness.py`: a fake OpenAI-style client (`chat.completions.create(stream=True)` returning chunk objects with `choices[0].delta.content` / `finish_reason` / usage-only chunks / `APIConnectionError`), a line-buffered fake terminal (so missing `flush` really shows nothing until the end), and test suites. 8 s timeout kills runaway loops.

## Content map (spreadsheet section → stage/step)
| Section | Where |
|---|---|
| 1 Intro: what/why, normal vs streaming, perceived speed | Discovery d2 (two-phone race with short & long reply, both clocks), d3 (true/false sort), d4 (Rohan diagnosis) |
| 2 Server-sent chunks, SSE, event structure, tokens vs chunks | Explore e1 (token→chunk packer), e2 (SSE wire + sort), e3 (tap fields in a chunk) |
| 3 Rendering: extract, display incrementally, empty chunks, order | Explore e4 (sort 6 real chunks, two guards), e5 (end/flush switches, explained first) |
| 4 Completion: finish_reason, interrupted, connection errors | Explore e7 (label complete/truncated/partial), e8 (mid-stream vs before-text errors) |
| 5 Assembling: collect, append, order, join, compare | Explore e6 (receive → parts → pick join → compare with screen) |
| 6 Python implementation | Code c1 walkthrough + step debugger, c2 micro blanks, c3 guided loop, c4 independent `consume()`; Debug |
| 7 Practical application: streaming chatbot | Mastery m2 `chat_turn` (history, live display, one safe retry, honest status) |

## Character → concept
| Character | Role |
|---|---|
| Vyapti | **AI Mentor** on every step: step-specific explanation + 6 questions per concept (What is it? / In plain words / Why it matters / How it works / Real life / Can I use it?) |
| Tanvi | **AI Coach** (hint ladder: nudge → closer → almost the answer, reacts to every attempt, maps failing checks to advice); teaches Python, `print`, the walkthrough |
| Rohan | Customer whose reply froze (story hook) + comms engineer: chunks, SSE |
| Samar | Assembly-line analogy: empty chunks, append & join |
| Sana | Failure & risk: finish_reason, interruptions, debugging method |
| Ila | Status-board owner whose "improvements" drive Predict and Debug and whose board is the Assign/Mastery incident |
If the player picks a character as their avatar, that character's teaching lines are voiced by another crew member.

## Client comment → fix
| Comment | Fix |
|---|---|
| Mission name must state the topic | "Mission 3.5 · Streaming Responses" in top pill, side panel, hub node, page title; d1 shows "This mission teaches Streaming Responses" + 7-section roadmap |
| Trailer not required / dated | Trailer removed from the main flow (Enter goes straight to Discovery); optional link kept |
| Discovery repetitive, 3 sections, questions before context, machine-like | One 4-step journey; concept taught before every question; plain language; the "race" reframed around the client's point: total time is the same, streaming only lets you read sooner, and the real issue is knowing when it's finished |
| Jargon (chunks, ops wall, Dabba Dash Support) | "Restaurant Support Assistant", "status board"; every term introduced with a plain definition + analogy; tap-to-explain glossary still active |
| Verdict question unclear, at bottom | d4 presents the evidence first, question in the main area, explanation for every option |
| Explore: explanations come after the interaction; stream/end/flush/join/finish/choices not explained | Each Explore step opens with a teach card + analogy, then the interaction, then a check; end and flush explained before the switches; join's "" explained via visible spaces; finish values in a table |
| Animations childish / questions at the bottom / toggles unclear | Animations only show the concept (words arriving, buffer holding text); task banner at the top of every step; questions sit in the main column |
| Assign: no instructions, extension of Discovery, random options | Assign = apply: rules card, then Incoming Event Chat on a 3-chat board using the spreadsheet's 12 actions and its reasoning notes (show+keep, mark partial, retry once after pause, …) with per-option consequences |
| Predict: no explanation of code before predicting; generic & static | Predict after Explore/Assign; each prediction shows the code + "what this code does", a concrete stream; correct prediction unlocks Run, which shows the real outcome |
| Code: how code works not explained; Micro feels like an assignment; no Mentor/Coach; layout | c1 line-by-line explanations + step-through with live variables on 3 streams; c2 one blank at a time with an explanation each; c3/c4 typed code with real Python checks; Mentor + Coach panel on every step; editor-first layout |
| Debug static, process not explained, no Mentor/Coach | g0 teaches the 5 moves; each of 5 bugs: Run for real → tap guilty line → explain → fix in editor → re-test with real checks; graded hints |
| Mastery MCQ-only, no practical assessment | m1 new incident (hints only after an attempt), m2 write `chat_turn` from a spec (9 real checks incl. truncated, mid-stream error, retry-once, close), m3 read a raw stream and type the exact text + status; mastery report with revisit links |
| Biggest point: must write a program that consumes a stream and displays the completed response | c3, c4 and m2 all run student-written Python against simulated streams |
