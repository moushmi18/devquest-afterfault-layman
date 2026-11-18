# Afterfault · Redesign Plan — Concept-Driven Streaming Mission

**Principle:** Educator first. Narrative only when it supports learning. Every interaction has a learning purpose. Never test before teaching. Preserve Afterfault identity (Dabba Dash, half-sentence + green tick, Vyapti, purple/amber UI).

**Execution honesty:** All in-browser demos remain **simulated** (JS). Label every “Run” as *Simulated run*. No fake claim of Python execution unless Pyodide is added later.

---

## Learning outcomes (Streaming Responses)

A student who finishes can:

1. Explain streaming vs waiting for the full reply, and why products stream.
2. Describe chunks, deltas, content extraction, and how the UI renders progressive text.
3. Distinguish chunks from tokens; explain finish (`finish_reason` / stream end) vs interruption.
4. Decide correct app behaviour for complete / partial / pre-content failure / false-complete.
5. Write (or correctly assemble) a Python OpenAI-style stream consumer: request → iterate → extract → accumulate → render → detect completion → handle errors.
6. Debug common consumer mistakes.
7. Independently apply the pattern and interpret a mastery report.

---

## Stage redesign

### Discovery — Teach first

| Beat | Purpose |
|------|---------|
| D0 Learn | Plain intro: what streaming is, why it exists, how an AI reply is delivered. Real-world (live chat typing) + technical (SSE / chat.completions stream). Define: stream, chunk, token, delta, finish signal, interruption. Side-by-side static comparison. |
| D1 See | Animated race (Bot A wait-all / Bot B stream) — already built. Understanding prompt after. |
| D2 Interrupt | Teach interruption → Freeze pull + ops wall lie. |
| D3 Check | Short MC: what’s actually wrong (no finish signal / All-good lie). No jargon dump. |

**Cut:** Long character dialogue before any concept. Keep one-line Dabba Dash framing.

### Explore — Concept lab

For **each** control, show a Teach strip *before* the control unlocks:

1. What this control does  
2. Why it matters  
3. What you are testing  

Then: demo → change one thing → observe → short explanation → optional check → next.

| Lab | Concepts |
|-----|----------|
| L1 stream=True | Streaming on/off |
| L2 chunks / delta | Incoming pieces, `delta.content` |
| L3 empty / None | Role-only & missing content; `.get()` |
| L4 flush + end | Buffering vs live one-line render |
| L5 parts.append + join | Accumulate in one pass; `"".join` |
| L6 finish_reason | stop / length / missing → complete / truncated / partial |
| L7 interrupted | Quiet ≠ done |
| L8 guards | Empty choices, usage-only, no crash |

Metaphors (belt, tank) stay as *illustrations after* the teach strip. Recaps become concept checklists, not memorised click orders (or shorten click-order to optional).

### Assign — Application scenarios (not Discovery repeat)

Four scenarios; student chooses behaviour + short reason:

| ID | Situation | Correct behaviour |
|----|-----------|-------------------|
| A | Stream finishes with `finish_reason: stop` | Mark complete; keep full text |
| B | Partial content then silence, no finish | Mark partial; keep text; offer regenerate |
| C | Connection fails before any content | Retry once after pause (or mark error if retry exhausted) |
| D | App marks incomplete as completed | Identify bug; mark partial/error instead |

Each card: situation, problem, objective, constraints, expected behaviour, task, feedback, solution explanation.

Temperature CLI → optional “next mission” tip only.

### Predict — Reasoning

Keep 6 progressive items. Prefix each with “Uses: …” concept chips. Label outcome panel **Simulated result**. Explanation after submit.

### Code — Guided skill build

1. **Brief:** What we’re building (Line Keeper consumer), expected behaviour, SDK note (OpenAI-style `chat.completions`).  
2. **Walkthrough:** Imports → client → create(stream=True) → iterate → extract content → skip empty → print+flush → append → finish_reason → join → status → errors.  
3. **Micro:** Block editor *after* walkthrough (practice).  
4. **Guided:** Fix honest status with hints (Coach); Mentor explains concepts; remove primary one-click as only path — keep as last-resort after 2 failed checks.  
5. **Independent:** Choose/complete critical condition + review full skeleton; **Simulated server check** label on T1–T15.

### Debug — Problem-solving ladder

| Level | Bug | Skill |
|-------|-----|-------|
| 1 | None / missing `if piece` | Obvious mistake |
| 2 | Missing flush | Understand the symptom |
| 3 | Double-read stream | Logic |
| 4 | Status always complete | Incomplete/incorrect impl |
| 5 | Early break / usage | Real-world failure |

Flow: **Simulated run** → clue → fix choice → re-test → root-cause note. No auto-fix as primary.

### Mastery — Independent prove

1. Short objective (no boss monologue gate).  
2. **Challenge:** Complete a working consumer checklist / critical edits + handle 2–3 live scenarios (complete, partial, fail). Help only after attempt.  
3. Soft status scenarios (existing Phase 2) as secondary.  
4. **Mastery report:** Understands / Did well / Needs improvement across streaming concepts, code quality, honest status, error handling, independence.  
5. Then rewards + map unlock.

---

## UI / UX rules (within identity)

- Every stage header: Stage name · Objective · Current task · Primary CTA visible without scroll (within scaled stage).  
- Teach strips: compact, high contrast, one idea.  
- Simulation badges on all Run/Check that aren’t real Python.  
- Purposeful motion only: chunk arrival, stream vs buffer, status changes, errors.  
- Keyboard: keep existing block/Explore affordances; ensure new buttons are focusable.  
- Responsive: preserve scale; tighten Explore foot so checks aren’t lost; mobile helper stays.

---

## Implementation approach

- Stay in vanilla JS architecture (`content.js`, `story.js`, `app.js`, `blocks.js`, CSS).  
- Add `js/curriculum.js` for teach copy + mastery report helpers.  
- Additive CSS in `css/learn.css`.  
- Do not break hub, mentor API, or layman glossary.  
- Prefer editing existing stage renderers over replacing the app shell.

## Out of scope

- New LMS/quiz shell, chat-only UI, backend/DB changes, new npm deps, rewriting Module 3.1–3.4/3.6.
