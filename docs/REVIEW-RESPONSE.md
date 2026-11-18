# Reviewer feedback → changes map

Source of truth: `afterfault-review.xlsx` / `afterfault-feedback.txt` (all sheets).  
Branch: `cursor/reviewer-feedback-streaming-f6c9` (from current `main` after PR #1).  
This document maps **every** sheet/row comment to what changed and where. Items already partly addressed on main were re-checked and completed where gaps remained.

---

## Sheet: curriculum

| Topic (Module 03) | Status in app | Change |
|---|---|---|
| REST APIs and JSON | Hub mission 3.1 topic label (out of this mission’s interactive scope) | Left as hub node; Streaming mission stays focused |
| Making API calls with Python | Hub 3.2 | Unchanged (separate mission) |
| LLM API usage | Hub 3.3 | Unchanged |
| Prompt-based interactions | Hub 3.4 | Unchanged |
| **Streaming responses** | Mission 3.5 (this app) | Fully rebuilt teach path; hub topic → **Streaming Responses** (`js/hub.js`) |
| Parameter tuning | Hub 3.6 cliff / next mission | Explicitly deferred; Assign notes dials belong in 3.6 |

---

## Sheet: overall summary curriculum wise

### Seven sections + stage outcomes

| # | Section / subtopics | Taught where | Stage outcome |
|---|---|---|---|
| 1 | Intro: what streaming is; vs non-streaming; why chat UIs; perceived speed | Discovery Learn (`DISC_TEACH`, `discLearn`) | Discovery: understand what/why |
| 2 | Server-sent chunks; incremental send; **SSE**; event structure; content per chunk; **tokens vs chunks** | Explore `sse` + `chunks` (`XTEACH`, `SSE_LINES`, sse-box) | Explore: chunks/events |
| 3 | Rendering as they arrive; extract; partial UI; empty/non-content; order | Explore `blank`/`endline`/`flush`/`jam`/`guard` | Explore |
| 4 | Completion signals; **finish_reason stop / length / None**; interrupted; connection errors | Explore `cut`/`finish`; Assign C/D; Code walk Errors | Assign / Predict |
| 5 | Collect; append; order; **join**; **assembled vs displayed** | Explore `basket`/`join` (+ assemble-vs-display compare) | Explore → Code |
| 6 | Python: stream API; iterate; extract; incremental print; consumer; **errors + close stream** | Code Brief (`CODE_WALK` + `CODE_SKELETON` `finally: close()`), Micro/Guided/Indep | Code |
| 7 | Practical app: streaming chatbot; word-by-word; interrupted; stream vs non-stream | Discovery race/freeze; Mastery challenge + live board | Mastery |

### Reviewer overall verdict (fragments ≠ teaching)

| Feedback | Response |
|---|---|
| Streaming not explained (what/how/why) | Discovery opens with What/Why/How + 7-section roadmap before any question |
| Chunks demonstrated but structure/SSE not taught | New Explore **SSE** beat with wire transcript + tokens vs chunks |
| Rendering not explained | Teach cards before flush/end/guards; questions moved **above** demos |
| End/Flush via controls without teaching | Dedicated **endline** beat then flush; teach-before-try gate |
| join(parts) without purpose | Teach card + assemble-vs-display comparison |
| finish_reason stop/length/None without meaning | XTEACH finish lists all three; interactive status map |
| No complete Python consumer taught | CODE_WALK 11 steps + skeleton with close; Micro guided → Guided → Indep |
| “Mentioning a term ≠ teaching” | Every Explore beat: What/Why/How card must be dismissed before controls |

---

## Sheet: Trailer

| Comment | Change | Where |
|---|---|---|
| Trailer not required / skip | **Skip trailer** control first-class (top + title card) | `js/intro.js`, `.iskip-first` |
| Old monsoon / “4G ad” framing | Subtitles reframed to restaurant support chat under peak load | `IVO` copy |
| English feels plotted / not layman | Clearer spoken lines; topic badge on shot 0 | `js/intro.js` |
| Dabba Dash jargon | Intro phones → **Restaurant Support / Assistant** | `js/intro.js` |
| Mission identification | Title: **Streaming Responses**; goal includes honest finish signals | `js/intro.js` |
| Keep story beats (Rohan, freeze, All good, Tanvi, Vyapti) | Preserved; clearer status-board language | intro shots 1–5 |

**Disagreement / limit:** Audio VO files still play historical clips when unmuted; on-screen subtitles/copy carry the corrected teaching language. Re-recording VO assets was out of scope for this pass.

---

## Sheet: Discovery

| Comment | Change | Where |
|---|---|---|
| Mission must name the topic | Kickers/headings: **Streaming Responses** | `renderDisc`, hub |
| Repetitive / three forced sections | Kept a short Learn → See → Interrupt → Diagnose → Check arc (5 steps); Learn consolidates concept first | `DQ_STEPS` |
| Questions before concept | Step 0 is teach-only; race/freeze after | `discLearn` |
| Gen Z: care about complete message more than first-word latency | Race copy acknowledges both full delivery and perceived speed | `discRace` |
| Jargon: chunks / ops wall / Dabba Dash | Soft language; **Restaurant Support Assistant**; **status board** | `discFreeze`, mentor |
| Verdict unclear / LLM abrupt / question at bottom | Diagnose framed as finish-signal missing; check is separate step with clear context | `discVerdict`, `discCheck` |
| Machine-like language / UI | Natural student-facing copy; learn cards hierarchy | `DISC_TEACH`, `learn.css` |

---

## Sheet: Explore

| Comment | Change | Where |
|---|---|---|
| Topic not named | Kick: Explore · Streaming Responses · n/N | `renderExplore` |
| Not real exploration; tasks before concepts | Teach card gate per beat (`x-taught`) | `teachCard`, `xq.taught` |
| stream=True toggle unexplained | Open beat What/Why/How then lever | `XTEACH.open` |
| Questions at bottom / poor alignment | Checks moved to **`xcheck-top` above demo** | `renderExplore` |
| End/flush cartoons without teaching | Separate **endline** lab then flush; Customer’s screen label | `endline`, `flush` |
| join childish / not taught | Teach + assemble vs display | `join` |
| finish_reason None/length/stop unexplained | Explicit meanings in teach + interactive | `finish` |
| Storm / flow illogical | Interrupted stream beat reframed; still teaches quiet ≠ done | `cut` |
| Guards / pieces assignment-like | Teach first; checks after placement | `guard` |
| Animations for understanding | Kept motion that shows buffer/stream; reduced “toy” framing in copy | tips |

New beats: **`sse`**, **`endline`** (14 beats total).

---

## Sheet: Assign

| Comment | Change | Where |
|---|---|---|
| Topics not introduced; confusing options (show+keep, skip, mark partial, retry forever, …) | **Vocab gate** per scenario explains each option/trap before choices | `asVocab`, `ASSIGN_SCENARIOS.vocab` |
| Feels like Discovery extension | Scenario cards: situation/problem/objective/constraints/expected/task | `renderAssign` |
| UI / questions at bottom | Task card with options after vocab; clear Submit / Try again | `renderAssign` |
| Mission identification | Kick includes Streaming Responses | `renderAssign` |
| Chat1 finish stop → keep complete | Scenario A | curriculum |
| Chat2 quiet → mark partial keep text | Scenario B | curriculum |
| Chat3 error before text → retry once after pause | Scenario C | curriculum |
| Incomplete marked complete | Scenario D | curriculum |

---

## Sheet: Predict

| Comment | Change | Where |
|---|---|---|
| Asking to predict without explaining how code works; generic/static | **`predPhase: teach`** with `PRED_TEACH[i]` + code before each question | `renderPred`, `PRED_TEACH` |
| Must align with taught concepts | Uses chips map to flush/.get/status/single-pass/retry/length | `PRED_USES` |

---

## Sheet: code

| Comment | Change | Where |
|---|---|---|
| Concepts / how code works not explained | Brief walkthrough 11 steps incl. **close the stream** | `CODE_WALK`, `CODE_SKELETON` |
| Micro feels like assignment | Guided banner + ordered recipe; not a dump | `ddMain` `micro-guide` |
| AI Mentor + AI Coach missing | Visible **dual-aid** on Brief/Micro/Guided/Indep; Ask Vyapti + graded Hint | `mentorCoachPanel` |
| UI alignment | dual-aid grid; consistent headers | `learn.css` |
| **Follow-up:** Mentor echoed step text | Per-step authored Mentor (why / walk-through / tiny example / misconception / Explore link) ≠ body | `CODE_WALK[].mentor`, `MICRO_AID`, `GUIDED_AID`, `INDEP_AID` |
| **Follow-up:** Coach hints generic | Brief = self-check (unlocked by default); Guided/Indep map failing assert ids (G4/T3…) to nudge→narrow→near; auto-open nudge on fail | `guidedCoachLines`, `indepCoachLines`, `runGuidedTests` |
| **Follow-up:** Ask Vyapti generic | Step chips + offline QA for iterator/chunk/SSE/honest_status/… | `mentorChips`, `mentor.js` QA |
| **Follow-up:** Sidebar said “drag blocks” on Brief | Per-tier tips/objectives; Brief tip from `CODE_WALK[].tip` (e.g. stream=True return type) | `renderCode`, `TIPS` |
| **Follow-up:** Jargon objective (“Forge the Line Keeper…”) | Plain-English per-tier objectives | `codeObjective()` |
| **Follow-up:** Mentor/Coach crowded / clipped | dual-aid for Brief/Micro; Guided/Indep/Debug use tabbed `assistantPanel` | `learn.css`, `assistantPanel` |
| **Follow-up:** QA for Mentor≠body, Coach differs, sidebar match | Assertions in qa-full + qa-pyodide | `scripts/qa-full.mjs`, `qa-pyodide.mjs` |
| **Layout cleanup:** Editor collapsed / Coach duplicated / badges ×3 / chip-primary Guided | Editor-first `code-ws` (dominant `py-editor`); one tabbed Coach; one Real badge; Guided/Debug = typing edits; output under editor; compact story side | `renderCode`, `renderDebug`, `learn.css` |
| **Layout QA:** editor min-height, no overlap, one Coach, one badge | Bounding-box + count asserts at 375/768/1024/1440 | `qa-full.mjs` |

---

## Sheet: Debug

| Comment | Change | Where |
|---|---|---|
| Too static; process not explained | **1 Reproduce → 2 Find → 3 Fix → 4 Re-test** hierarchy | `debug-process` |
| Mentor/Coach missing | Dual-aid + **per-bug / per-phase** `DEBUG_AID` | `renderDebug` |
| Hierarchy / alignment | Process chips + compact aid under code | `learn.css` |
| **Follow-up:** Mentor/Coach generic | Authored content for Bugs 1–5 × observe/find/choose/fixed | `DEBUG_AID` |

---

## Sheet: Mastery

| Comment | Change | Where |
|---|---|---|
| Core missing; MCQ-only | Primary = **independent Pyodide consumer challenge**; concepts marked optional support | `renderBoss` challenge |
| Practical understanding / problem solving | Live Phase 2 scenarios + honest board + report | p2 / p3 / report |
| Meaningful report | `masteryReportData` / `renderMasteryReport` | curriculum |
| **Follow-up:** Mentor/Coach only after attempt | Locked until Run; then `MASTERY_AID.after` | `renderBoss` challenge |

---

## Identity / platform constraints (kept)

- Afterfault / DevQuest identity preserved  
- Real Pyodide execution + honest **Real Python · Mock API** vs **Simulated** labels  
- Responsive fluid layout (&lt;1100px); tested 375 / 768 / 1440  

## QA

- Extended `scripts/qa-full.mjs` (SSE/endline, Assign vocab, Predict teach, Mentor≠body, Coach differs per Brief step, sidebar tip match, Mentor/Coach)  
- Extended `scripts/qa-pyodide.mjs` (aid surfaces, chips, coach differ across steps, SSE box)  
- Follow-up review shots: `review-fu-01` Brief step 4, `review-fu-02` Guided fail+Coach, `review-fu-03` Debug, `review-fu-04` mobile 375  

## What we disagreed with or could not fully do

1. **Removing the trailer entirely** — Reviewer said it is “not required.” We made Skip first-class and clarifying, but kept a short optional cinematic for mission context (brand + unfinished-line hook). Students can skip immediately.  
2. **Replacing VO audio assets** — Subtitles/copy updated; MP3s still old wording if unmuted.  
3. **Collapsing Discovery to a single screen** — Reviewer disliked three sections; we kept a short progressive arc but front-loaded teaching so questions never come first.  
4. **Module 03 non-streaming topics** — Only Streaming is interactive in this mission; other curriculum rows remain hub placeholders for sibling missions (aligned by topic labels, not duplicate content).
