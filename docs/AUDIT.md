# Afterfault · The Unfinished Line — Learning Audit

**Scope:** Mission 3.5 source in this repo + live site  
**Live:** https://devquest-afterfault-layman.vercel.app/  
**Repo vs live:** Live hub, art, and mission framing match this repo (Retry Storm map, 3.5 broken, layman welcome). Deployed via CLI (not git-linked); content appears current with `main` as of this audit. No material drift found in entry UX.

**Verdict:** Strong narrative identity and working stage machinery. Weak as education: concepts arrive after (or as) interaction, cinematic delay before teaching, Explore is metaphor-heavy before terms are defined, Code leans toward fill-and-click, Mastery is status MCQs not independent implementation. Pattern today ≈ **Story → Animation → Button → Question**. Target ≈ **Understand → Learn → See → Experiment → Apply → Practice → Debug → Prove**.

---

## Cross-cutting

| Area | Exists | Works | Confusing / teaches little | Preserve |
|------|--------|-------|----------------------------|----------|
| Identity | Dabba Dash, Ila, Vyapti, purple/amber, Retry Storm | Visual language coherent | Purple Inter/Poppins stack is fine for brand; dense side panel + fixed 1280×720 scale | Art, characters, theme, map hub |
| Narrative | Hub NPCs, 45s cinematic intro, cutscenes, dialogue | Skip exists on intro | Trailer delays learning; cricket metaphors before plain definitions | Light framing (half-sentence + green tick) |
| Progression | 7-stage rail, XP*, jump-stage, localStorage (layman) | Completes end-to-end | Jump unlocks mid-mission without teaching | Rail, stage order, save |
| Mentor | Vyapti tips + Ask Vyapti chat + `/api/mentor` | Offline fallback works | Tips often narrate story, not teach | AI Mentor / Coach split idea |
| Execution | All demos are JS simulations | Clearly a demo | Never labels “simulated” vs real Python | Simulated demos OK if labeled |
| Layman layer | Glossary, recaps, explain-lines, welcome | Helpful overlay | Doesn’t fix teach-before-test order | Keep as support, not primary pedagogy |
| Responsiveness | Hub portrait; stage scaled to viewport | Readable on phone with caveats | Questions/checks can sit below fold; Explore minimap dense | Scale model; tighten fold |

---

## Stage map (current → 7 pedagogical stages)

### 1. Discovery

**What exists:** 3 beats — Race (buffered vs streamed), Freeze (pull chunks → flag All-good lie), Verdict (pick suspect). Side objective + Vyapti tip.

**What works:** Side-by-side race visual; freeze + ops wall; “quiet isn’t done” punchline; act-to-advance.

**Confusing / teaches nothing:** No plain-language **what / why / how** before the race. Terms (`chunk`, `finish_reason`, streaming vs non-streaming) appear after metaphor. No technical example of how an app receives chunks. Verdict tests after thin teaching.

**Missing:** Teach-first brief; chunks vs tokens; how the app renders progressive text; how a stream finishes; what interruption means; short understanding check *after* teaching.

**Redesign:** Insert Learn panel → then Race → teach interruption → Freeze → define terms with visual → Check. Cut long dialogue.

**Preserve:** Race animation, freeze phone, All-good flag, finish-signal verdict.

---

### 2. Explore

**What exists:** 12 beats across kitchen/dock/hallway metaphors: stream lever, chunks zoom, buffer tank, flush dials, recap, parts basket, join, cut/lie, finish_reason, jam, guards, final recap. Checks unlock after “try the visual.”

**What works:** Interactive mental model; stream=True / flush / join / finish / guards covered; goal bar; code value taps.

**Confusing / teaches nothing:** Controls appear before explanation (lever, zoom lens, dials). Heavy journey metaphor delays Python semantics. Recaps are sequence memory, not concept checks. Blank/bin/jam beats feel gamey.

**Missing:** Per-control “what / why / what you’re testing” before interaction; delta / empty-None / finish_reason / interrupted stream as named concepts; clear demo → change → observe → explain loop.

**Redesign:** Teach card before each control; rename beats to concept names; keep visuals as demos of taught ideas; drop or shorten pure story beats that don’t teach.

**Preserve:** Lever, chunk fan, flush pipe, parts/join, finish flag, guards — as labs after teaching.

---

### 3. Assign

**What exists:** Dinner-rush tile game: show+keep, quiet→partial, error→retry, mid-stream error→error; then CLI `--temperature` builder; board summary. Dialogue-heavy.

**What works:** Decision practice for honest status; trap tiles (Mark all good); consequence feedback.

**Confusing:** Feels like Discovery redux with more story. Events aren’t framed as distinct scenarios with objective/constraints. Temperature CLI is off-topic for streaming consumer core.

**Missing:** Four clear scenarios (A finish, B partial stop, C fail before content, D incomplete marked complete) with situation → problem → objective → constraints → expected behaviour → task → feedback → solution explanation.

**Redesign:** Replace event stream with scenario cards A–D; keep tile/decision UI; demote temperature to optional tip / Mission 3.6 teaser.

**Preserve:** Honest-status vocabulary; chat status chips; consequence of “all good.”

---

### 4. Predict

**What exists:** 6 Ila patches: no flush, no `.get()`, text⇒complete, double-read stream, retry storm, length→truncated. Predict → reveal simulated outcome.

**What works:** Progressive difficulty; uses taught concepts; reveal with explanation; confidence chips.

**Confusing:** “Ila dialogue” framing; some tips assume Explore IDs (E3/E4) students may not remember by name.

**Missing:** Explicit “taught concepts only” banner; clearer “simulated run” label; progressive scaffolding text.

**Redesign:** Keep 6 items; label simulation; lead with concept reminder; ensure order matches teach order.

**Preserve:** Structure, patches, outcomes.

---

### 5. Code

**What exists:** Micro (block editor), Guided (fix status line), Independent (pick complete condition + animated fake tests T1–T15).

**What works:** Micro teaches loop structure semantically; guided focuses honest status; independent reinforces finish==stop.

**Confusing / teaches nothing:** Micro is still assemble-from-palette (near fill-in). Guided one-click “Fix status.” Independent is multiple-choice on a condition, not writing a consumer. Tests look real but are simulated. No walkthrough of imports → client → request → iterate → accumulate → complete → errors.

**Missing:** Guided incremental build of a practical Python stream consumer; AI Mentor explains / Coach hints without answers; honest “simulated check” labels; small editable tasks with run feedback.

**Redesign:** Add Code Brief (what’s being built + expected output); step-through consumer curriculum; keep Micro as practice after teaching; Guided as edit-and-reason (no primary one-click fix); Independent as assemble/write + simulated harness clearly labeled.

**Preserve:** Block editor, Line Keeper name, honest_status idea.

---

### 6. Debug

**What exists:** 5 bugs: None concat, missing flush, double-read join, All-good status, early break skipping usage. Find line → pick fix. Wrong fixes get Vyapti toast.

**What works:** Realistic mistakes; prefers guards over casts; before/after symptoms.

**Confusing:** Primary path is tap-line + pick-fix (near one-click after find). Little run/inspect. Levels not numbered as skill ladder. Dialogue filler.

**Missing:** Run/inspect broken code first; levels 1–5 difficulty ladder; re-test after fix; explanation of root cause.

**Redesign:** Phase per bug: observe (simulated run) → clue → fix → re-test → explain. Label levels. Keep wrong-fix traps.

**Preserve:** Five bug scenarios and good vs bad fixes.

---

### 7. Mastery

**What exists:** Boss intro cinematic → Phase 1 watch chats → Phase 2 status MCQs (hearts) → Phase 3 flip board → rubric checklist → rewards → cliffhanger 3.6.

**What works:** Spaced practice of honest labels; recovery path; rubric list.

**Confuses assessment with spectacle:** Boss intro; Phase 1 is watch-and-click Next (no task); no independent implementation; no mastery report (understands / did well / needs work); hints available via recovery but assessment is only status picks.

**Missing:** Practical challenge (build/complete a streaming consumer under constraints); evaluate correctness, understanding, quality, logic, error handling; end report.

**Redesign:** Short brief → independent challenge (edit/select critical consumer pieces + scenario handling) → optional help after attempt → mastery report. Keep light Afterfault framing, cut boss monologue as gate.

**Preserve:** Honest-status scenarios, hearts as soft retry, rewards/map unlock as celebration after report.

---

## Interactions & animations

| Item | Purpose? | Keep / cut / redesign |
|------|----------|----------------------|
| 45s intro + VO | Mood | Optional; don’t gate learning |
| Explore room pans | Atmosphere | Shorten; teach first |
| Chunk belt crates | Show streaming | Keep after definition |
| Zoom lens | Gate to code | Keep but explain before unlock |
| Hub walk | World | Preserve |
| XP pop / hearts | Feedback | Keep as soft signals |
| Boss shield cinematic | Spectacle | Shorten |

---

## Content correctness notes

- OpenAI-style `chat.completions.create(..., stream=True)` and `delta.content` / `finish_reason` / usage-last match the mission’s SDK choice — keep.
- Chunks ≠ tokens is under-taught (glossary has it; stages barely use it).
- `data: [DONE]` appears in content constants but Explore emphasises `finish_reason` more — both should be taught clearly.

---

## Priority (from reviewer + this audit)

1. **Streaming Responses curriculum** — teach logic before controls (highest).
2. Teach-before-test across all stages.
3. Explore as concept lab, not trailer.
4. Code/Debug/Mastery as real skill + assessment.
5. UI clarity (stage/objective/task/primary action above fold).
6. Label simulated execution everywhere.
