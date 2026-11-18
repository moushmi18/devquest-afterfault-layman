/* Stage intro cards: one idea per card, 2–3 short lines, shown in the Welcome-guide modal style
   the first time a stage opens. Concept detail lives in step lesson cards and "Ask Vyapti". */
const LX_INTROS = [
  [ { t: "Rohan's reply froze", b: ["A support bot stopped at **\"Your order is on the…\"**", "…and the board still said **Delivered ✓**."], f: "Your job: find out why." },
    { t: "The big idea", b: ["AI replies can arrive **piece by piece**. That's **streaming**.", "A reply is only done when it sends its **finish signal**."], flow: ["✍️ piece", "piece", "piece", "🏁 finish"] } ],
  [ { t: "Open up a stream", b: ["See what really travels down the wire: **chunks**, **events**, and the **finish signal**."], flow: ["chunk", "chunk", "chunk", "[DONE]"] },
    { t: "Then handle it", b: ["Show each piece **live**, **keep** it, **join** it, and label the ending **honestly**."], f: "8 short hands-on steps." } ],
  [ { t: "Dinner rush", b: ["Three chats stream at once.", "You decide what the consumer does with **every event**."] },
    { t: "Ila's old rule", b: ["\"Make it green.\"", "Tonight's rule: **honest labels only**."], flow: [["complete", "ok"], ["truncated", "am"], ["partial", "am"], ["error", "rd"]] } ],
  [ { t: "Predict, then run", b: ["Ila changed one line. **Predict** what customers will see.", "A correct guess unlocks a **real run**."], f: "Read the code, not the vibes." } ],
  [ { t: "Write real Python", b: ["Your code runs **in the browser** against a practice API.", "Checks test normal, messy, cut-off and quiet streams."] },
    { t: "Small to big", b: ["**Walk through** → **fill 5 blanks** → **write the loop** → **write consume()**."], flow: ["👀 read", "🧩 fill", "✍️ loop", "🏆 consume()"] } ],
  [ { t: "Five overnight hotfixes", b: ["Ila shipped five \"small improvements\".", "Each one broke streaming in a different way."] },
    { t: "One method, every bug", b: ["The same five moves, every time."], flow: ["▶ Reproduce", "🔍 Locate", "💬 Explain", "🔧 Fix", "✅ Re-test"] } ],
  [ { t: "Mastery: on your own", b: ["Handle a fresh incident, **build a streaming chatbot**, and **decode a raw stream**.", "Hints unlock only after a first try."], f: "Then: your mastery report." } ],
];
LX_INTROS.forEach((cards, i) => { if (LX_STAGES[i]) LX_STAGES[i].intro = cards; });
