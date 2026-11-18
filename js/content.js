const GOAL_WORDS = ["Your","order","is","on","the","way."];
const CLUES = [
  { title: "The blinking cursor", txt: "Text stopped. Nothing says it finished." },
  { title: "Ila's green tick", txt: "The status says \"delivered\"." },
  { title: "The spinner bot", txt: "Long wait, then the full reply dumps at once." },
  { title: "The token meter", txt: "Usage never arrived: \"?\"" },
];
const CLUE_OPEN = [
  { kick: "Clue 1 · The blinking cursor", body: "The reply stopped mid-sentence. The cursor is still blinking. Nothing said the stream finished.", mini: "Like live commentary going silent mid-over." },
  { kick: "Clue 2 · Ila's green tick", body: "The board says \"Delivered ✓\". The customer has half a sentence.", mini: "Like a scoreboard saying \"match won\" while rain stopped play." },
  { kick: "Clue 3 · The spinner bot", body: "The other bot waits, then dumps the whole reply at once. Customers stare at a spinner the whole time.", mini: "That's the next-day match report, not live commentary." },
  { kick: "Clue 4 · The token meter", body: "Usage never arrived. The meter still says \"?\". We don't know if the scorecard came in.", mini: "The scorecard usually arrives last." },
];

const SSE_LINES = [
  { t: 'data: {"choices":[{"delta":{"role":"assistant"},"finish_reason":null}]}', kind: "data" },
  { t: "", kind: "blank" },
  { t: ": keep-alive", kind: "ka" },
  { t: 'data: {"choices":[{"delta":{"content":"Your order "},"finish_reason":null}]}', kind: "data" },
  { t: "", kind: "blank" },
  { t: 'data: {"choices":[{"delta":{"content":"is on the way."},"finish_reason":null}]}', kind: "data" },
  { t: "", kind: "blank" },
  { t: 'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}', kind: "data" },
  { t: "", kind: "blank" },
  { t: "data: [DONE]", kind: "done" },
];

const EXPLORE_CHECKS = {
  e1: {
    q: "Why do support bots stream?",
    ops: ["It makes the model smarter.","Customers see the reply start right away instead of staring at a spinner.","It uses fewer tokens."],
    correct: 1,
    ok: ["Yes!","Same reply, same model. Streaming just shows it while it's being written."],
    bad: ["Not quite.","The model doesn't get smarter, and token count stays the same. Streaming just shows the reply as it's written."],
  },
  e2: {
    q: "Which line means the stream is over?",
    ops: ["a blank line","`: keep-alive`","`data: [DONE]`"],
    correct: 2,
    ok: ["That's it.","Blank lines just separate events. The stream ends at `data: [DONE]`."],
    bad: ["Not quite.","A blank line just separates events. The stream ends at `data: [DONE]`. Try again."],
  },
  e3: {
    q: '`delta` is `{"role": "assistant"}`. What does `delta.get("content")` give?',
    ops: ['`""`',"`None`","KeyError"],
    correct: 1,
    ok: ["Right.","`.get()` gives `None` when the key is missing. That's why we check `if piece:`."],
    bad: ["Not this one.","`.get()` doesn't raise, and it doesn't invent an empty string. Missing key → `None`."],
  },
  e4: {
    q: "Without `flush=True`, what does the student see in a terminal?",
    ops: ["each word on a new line","nothing for a while, then the whole reply at once","an error"],
    correct: 1,
    ok: ["Exactly.","No newline means the terminal waits. `flush=True` pushes every piece now."],
    bad: ["Try again.","There's no newline, so the terminal holds the text until the end. Same look as Discovery."],
  },
  e5: {
    q: "You print every chunk, then loop over `stream` again to build the text. What is the text?",
    ops: ["the full reply","an empty string","the reply twice"],
    correct: 1,
    ok: ["Nailed it.","Print and collect in the same pass."],
    bad: ["Not quite.","A stream can be read only once. The second loop is empty."],
  },
  e6: {
    q: "Text stopped arriving and no `finish_reason` came. Is the reply finished?",
    ops: ["Yes, text stopped","No. It's unfinished; we can't call it complete","Yes, if it ends with a full stop"],
    correct: 1,
    ok: ["That's the whole mission.","Quiet isn't done. Done is `stop` (or `length`)."],
    bad: ["Careful.","Quiet isn't done. Without `finish_reason`, we can't call it complete."],
  },
};

const ASSIGN_TILES = [
  ["Show + keep",""],["Skip",""],["Mark complete",""],["Mark partial",""],["Mark truncated",""],["Mark error",""],
  ["Retry once after pause",""],["Log usage",""],["Mark all good","trap"],["Retry now","trap"],["Retry forever","trap"],["Hide error","trap"],
];

const ASSIGN_EVENTS = [
  {
    chat: "CHAT 1",
    txt: "Content piece arrives: `\"is \"`",
    correct: "Show + keep",
    okFb: ["Shown and kept.","The piece is on screen and in the log. Stream still open."],
    badFb: ["Not this event.","A content piece arrived. Show it and keep it. Don't close the chat yet."],
  },
  {
    chat: "CHAT 2",
    txt: "Stream goes quiet, no finish signal",
    correct: "Mark partial",
    okFb: ["Honest label.","Text is kept, but we don't call it complete. No green tick on half a sentence."],
    badSpecial: "Mark all good",
    badFb: ["Consequence:","the customer sees a green tick on half a sentence."],
    otherBad: ["Not the honest label.","No `finish_reason` means unfinished. Keep the text, but don't call it complete."],
  },
  {
    chat: "CHAT 3",
    txt: "Error before any text",
    correct: "Retry once after pause",
    okFb: ["One careful retry.","Nothing was shown yet, so one retry can't duplicate text."],
    badFb: ["Easy on the hammer.","One careful retry, after a pause. A storm is just retries with no patience."],
  },
  {
    chat: "CHAT 1",
    txt: "Error raised after some text",
    correct: "Mark error",
    okFb: ["Kept and labelled.","Keep what arrived, label it **error**, and let the customer regenerate."],
    badFb: ["Don't hide it.","Keep the text that arrived, mark **error**, and offer Regenerate."],
  },
];

const PRED = [
  {
    id:"P1", title:"\"Cleaner output\"",
    setup:"Ila removed `flush=True` \"to tidy the code\". The bot runs in a terminal.",
    src:`for chunk in stream:
    if chunk.get("choices"):
        piece = chunk["choices"][0]["delta"].get("content")
        if piece:
            print(piece, end="")`,
    ops:["The words appear one by one, same as before.","The screen sits blank, then the whole sentence lands at once.","Each word appears on its own line.","The bot crashes on the last chunk."],
    correct:1,
    why:"With `end=\"\"` there's no newline, so the terminal holds the text until the end. The stream is fine; the screen just looks frozen.",
    ila:"Hi juniors. I've pushed a few tiny improvements. Purely cosmetic.",
    tipOn:"Predict first. Then we run it. Your gut gets calibrated, not your ego.",
    tipOff:"Read the patch. Choose what the customer will see, then commit.",
    tipRevealOn:"Sure and right. Your gut is getting calibrated.",
    tipRevealOff:"Correct. No newline means the terminal holds the text until the end.",
  },
  {
    id:"P2", title:"\"Fewer checks, faster code\"",
    setup:"Ila dropped the `.get()` and the empty-chunk guard.",
    src:`for chunk in stream:
    print(chunk["choices"][0]["delta"]["content"], end="", flush=True)`,
    ops:["The full reply, slightly faster.","The reply, then a crash at the very end.","Nothing at all: the bot crashes on the first chunk, before a single word.","The word \"None\" before the reply."],
    correct:2,
    why:"The first chunk is role-only (`{\"role\": \"assistant\"}`), so `[\"content\"]` raises KeyError immediately.",
    ila:"Fewer checks, faster code. That's just engineering.",
    tipOn:"Commit before you see it run.",
    tipOff:"Look at the first chunk. Does it have `content`?",
    tipRevealOn:"You were sure on this one. Let's look at the first chunk again: it has no text.",
    tipRevealOff:"The first chunk is role-only. `[\"content\"]` raises KeyError immediately.",
  },
  {
    id:"P3", title:"\"Smarter status\"",
    setup:"The stream goes quiet after \"Your order is on the \". Ila's status rule:",
    src:`status = "complete" if text else "failed"
show_tick(status)`,
    ops:["Half a sentence with a green \"Delivered ✓\" tick.","Half a sentence marked \"partial\".","An error message instead of the text.","The bot quietly finishes the sentence."],
    correct:0,
    why:"Text exists, so her rule says complete. No `finish_reason` ever arrived. That's the Discovery bug: the All-Good lie.",
    ila:"If there's text, it's done. Simple.",
    tipOn:"Commit before you see it run.",
    tipOff:"Does her rule check `finish_reason`?",
    tipRevealOn:"That's the Discovery bug: the All-Good lie.",
    tipRevealOff:"Text exists, so her rule says complete. No finish signal arrived.",
  },
  {
    id:"P4", title:"\"Save the reply for history\"",
    setup:"After printing, Ila builds the text for chat history with a second loop.",
    src:`for chunk in stream:
    ...                                  # prints every piece live
history.append({"role": "assistant",
                "content": "".join(piece_of(c) for c in stream)})`,
    ops:["Everything works; the bot remembers its reply.","The reply never shows on screen.","The reply shows live, but the bot's memory saves an empty message, so a follow-up gets a confused answer.","The reply shows twice."],
    correct:2,
    why:"A stream can be read only once. The second loop gets nothing, so history stores `\"\"`.",
    ila:"We'll just read it again for the log. Streams are data. Data can be read twice.",
    tipOn:"Commit before you see it run.",
    tipOff:"Can a stream be iterated twice?",
    tipRevealOn:"A stream can be read only once.",
    tipRevealOff:"The second loop gets nothing, so history stores an empty message.",
  },
  {
    id:"P5", title:"\"Never give up\"",
    setup:"Out-of-the-box: the provider is dropping streams for everyone tonight. Ila adds:",
    src:`result = consume(make_stream(), out)
while result["status"] != "complete":
    result = consume(make_stream(), out)   # try again, right now`,
    ops:["The bot politely says it will try later.","After one retry the reply arrives.","\"Your order is on the Your order is on the…\" repeats, and thousands of bots hammer the provider until it rate-limits the city.","Nothing changes; the loop runs once."],
    correct:2,
    why:"No cap, no pause, and each attempt reprints the partial text. Multiply by every customer and you get a retry storm.",
    ila:"Never give up. The customer will thank us.",
    tipOn:"Commit before you see it run.",
    tipOff:"Is there a cap? A pause? What happens to the partial text?",
    tipRevealOn:"That's how a retry storm starts.",
    tipRevealOff:"No cap, no pause, and each attempt reprints the partial text.",
  },
  {
    id:"P6", title:"\"Shorter replies save money\"",
    setup:"Out-of-the-box: Ila set a tiny token limit. The stream ends with `finish_reason: \"length\"`. The squad's honest status code is running.",
    src:`# stream ends: ... "Your order is on the "
#   then {"delta": {}, "finish_reason": "length"}`,
    ops:["An error popup.","The full reply; limits only apply to the prompt.","The reply stops neatly mid-sentence, no error, and the chat labels it \"truncated\".","The bot waits forever."],
    correct:2,
    why:"The model stopped because it hit the limit, not because it finished its thought. Mission 3.6 is about these dials.",
    ila:"Shorter replies save money. The customers won't notice.",
    tipOn:"Commit before you see it run.",
    tipOff:"`finish_reason` is `length`. What does honest status say?",
    tipRevealOn:"Clean finish, cut short. Remember that one for 3.6.",
    tipRevealOff:"The model hit the token limit. Honest status is truncated.",
  },
];

const MICRO = [
  [0,"act",'parts, finish, usage = [], None, None'],
  [0,"loop",'for chunk in stream:'],
  [1,"dec",'if not chunk.get("choices"):'],
  [2,"act",'usage = chunk.get({{1}})'],
  [2,"act",'continue'],
  [1,"act",'choice = chunk["choices"][0]'],
  [1,"act",'piece = choice["delta"].get({{2}})'],
  [1,"dec",'if piece:'],
  [2,"act",'print(piece, end={{3}}, flush={{4}})'],
  [2,"act",'parts.{{5}}(piece)'],
  [1,"dec",'if choice.get("finish_reason"):'],
  [2,"act",'finish = choice["finish_reason"]'],
  [0,"act",'text = {{6}}.join(parts)'],
];
const MICRO_ANS = {1:'"usage"',2:'"content"',3:'""',4:'True',5:'append',6:'""'};
const MICRO_BANK = ['"usage"','"tokens"','"content"','"text"','"role"','""','"\\n"','True','False','append','+=','" "','"[DONE]"'];

const GUIDED_SRC = `import sys

def honest_status(error, finish):
    if error:
        return "error"
    if finish == "length":
        return "truncated"
    if finish == "stop":
        return "complete"
    return "partial"

def consume(stream, out=sys.stdout):
    parts, finish, usage, error = [], None, None, None
    try:
        for chunk in stream:
            if not chunk.get("choices"):
                usage = chunk.get("usage")
                continue
            choice = chunk["choices"][0]
            piece = choice["delta"].get("content")
            if piece:
                print(piece, end="", flush=True, file=out)
                parts.append(piece)
            if choice.get("finish_reason"):
                finish = choice["finish_reason"]
    except ConnectionError as exc:
        error = str(exc)
    status = "complete"          # Step 4: TODO — ignore finish/error
    return {"text": "".join(parts), "finish_reason": finish,
            "usage": usage, "status": status, "error": error}`;

const GUIDED_SRC_FIXED = GUIDED_SRC.replace(
  'status = "complete"          # Step 4: TODO — ignore finish/error',
  "status = honest_status(error, finish)"
);

const INDEP_SRC = (cond) => `def consume(stream, out=sys.stdout):
    parts, finish, usage, error = [], None, None, None
    try:
        for chunk in stream:
            ...                  # live print + collect
    except ConnectionError as exc:
        error = str(exc)
    print(file=out)
    if error:
        status = "error"
    elif finish == "length":
        status = "truncated"
    elif ${cond}:
        status = "complete"
    else:
        status = "partial"
    return {"text": "".join(parts), "finish_reason": finish,
            "usage": usage, "status": status, "error": error}`;

const TESTS = [
  ["T1","Normal stream → complete",0],
  ["T2","Role-only + empty delta, no \"None\"",0],
  ["T3","Goes quiet → partial",0],
  ["T4","Error mid-stream → error",0],
  ["T5","length → truncated",0],
  ["T6","No usage chunk",1],
  ["T7","Usage line format",0],
  ["T8","Usage missing → ?",1],
  ["T9","--temperature 0.3",0],
  ["T10","Default 0.7*",1],
  ["T11","--temperature 2.5 → exit 2",1],
  ["T12","Liveness: flushed per piece",1],
  ["T13","Single pass",1],
  ["T14","50,000 chunks in budget*",1],
  ["T15","Empty stream → partial",1],
];

const BUGS = [
  {
    id:"Bug 1", title:"The None that broke the line",
    src:`text = ""
for chunk in stream:
    if not chunk.get("choices"):
        continue
    piece = chunk["choices"][0]["delta"].get("content")
    print(piece or "", end="", flush=True)
    text += piece`,
    badLines:[7],
    fixes:[
      { t: "Guard once: `if piece:` then append to parts", ok:true },
      { t: "`text += str(piece)`", ok:false, move:"`text += str(piece)`", resp:"Now the log says None twice. Ila would frame that." },
    ],
    before:'<div class="term" style="font-size:11.5px"><span class="er">TypeError: can only concatenate str\n(not "NoneType") to str</span>\n<span class="dim"># customer saw nothing</span></div>',
    after:'<div class="phone" style="padding:8px"><div class="b bot" style="font-size:12.5px">Your order is on the way.</div></div>',
    fixedSrc:`text = ""
for chunk in stream:
    if not chunk.get("choices"):
        continue
    piece = chunk["choices"][0]["delta"].get("content")
    print(piece or "", end="", flush=True)
    text += piece
    if piece:
        parts.append(piece)`,
    fixedMarks:{7:"del",8:"good",9:"good"},
    tipOn:"I'll watch your moves. If you reach for a quick patch that hides the problem, I'll tap your shoulder.",
    tipOff:"Tap the crashing line, then edit the code. Prefer a guard, not a cast.",
    tipFixedOn:"One guard, both problems gone: no crash, no \"None\".",
    tipFixedOff:"Bug 1 fixed. Guard once: `if piece:` then collect.",
    accept(src){ return /\bif\s+piece\s*:/.test(src) && !/str\s*\(\s*piece\s*\)/.test(src); },
    reject(src){ return /str\s*\(\s*piece\s*\)/.test(src) ? { move:"`text += str(piece)`", resp:"Now the log says None twice. Ila would frame that." } : null; },
  },
  {
    id:"Bug 2", title:"The frozen-looking screen",
    src:`if piece:
    print(piece, end="")
    parts.append(piece)`,
    badLines:[2],
    fixes:[
      { t: "`print(piece, end=\"\", flush=True)`", ok:true },
      { t: "added `time.sleep(0.05)`", ok:false, move:"added `time.sleep(0.05)`", resp:"Slower isn't more live." },
    ],
    before:'<div class="term" style="font-size:11.5px"><span class="dim">… nothing for 2.4 s …</span>\nYour order is on the way.</div>',
    after:'<div class="term" style="font-size:11.5px">Your order is on<span class="am">▌</span>  <span class="ok">live</span></div>',
    fixedSrc:`if piece:
    print(piece, end="")
    print(piece, end="", flush=True)
    parts.append(piece)`,
    fixedMarks:{2:"del",3:"good"},
    tipOn:"Flush every piece, not at the funeral.",
    tipOff:"Remember E4. What's missing from `print`? Edit the line, then re-run.",
    tipFixedOn:"Flush every piece, not at the funeral.",
    tipFixedOff:"Bug 2 fixed. `flush=True` pushes every piece now.",
    accept(src){ return /flush\s*=\s*True/.test(src); },
    reject(src){ return /sleep\s*\(/.test(src) ? { move:"added `time.sleep(0.05)`", resp:"Slower isn't more live." } : null; },
  },
  {
    id:"Bug 3", title:"The reply the bot forgot",
    src:`for chunk in stream:
    ...                                    # prints live, correctly
text = "".join((c["choices"][0]["delta"].get("content") or "")
               for c in stream if c.get("choices"))`,
    badLines:[3,4],
    fixes:[
      { t: "Collect `parts.append(piece)` inside the same loop, then `\"\".join(parts)`", ok:true },
      { t: "`chunks = list(stream)` first", ok:false, move:"`chunks = list(stream)` first", resp:"You bought the whole match report. We wanted live commentary." },
    ],
    before:'<div class="code xs" style="padding:6px 10px;white-space:pre-wrap">history[-1]["content"] == ""</div>',
    after:'<div class="code xs" style="padding:6px 10px;white-space:pre-wrap">history[-1]["content"] == "Your order is on the way."</div>',
    fixedSrc:`for chunk in stream:
    ...                                    # prints live, correctly
        parts.append(piece)                # collect in the same loop
text = "".join((c["choices"][0]["delta"].get("content") or "")
               for c in stream if c.get("choices"))
text = "".join(parts)`,
    fixedMarks:{3:"good",4:"del",5:"del",6:"good"},
    tipOn:"Collect in the same loop that prints.",
    tipOff:"A stream can be read only once. Collect while you print — edit the code.",
    tipFixedOn:"Collect in the same loop that prints.",
    tipFixedOff:"Bug 3 fixed. One pass for print and history.",
    accept(src){ return /parts\.append\s*\(\s*piece\s*\)/.test(src) && /["']{2}\s*\.join\s*\(\s*parts\s*\)/.test(src); },
    reject(src){ return /list\s*\(\s*stream\s*\)/.test(src) ? { move:"`chunks = list(stream)` first", resp:"You bought the whole match report. We wanted live commentary." } : null; },
  },
  {
    id:"Bug 4", title:"The All-Good lie",
    src:`status = "complete"
try:
    for chunk in stream:
        ...
except ConnectionError:
    pass
return {"text": "".join(parts), "status": status}`,
    badLines:[1,5,6],
    fixes:[
      { t: "Catch the error, then `status = honest_status(error, finish)` after the loop", ok:true },
      { t: "`if text.endswith(\".\")`", ok:false, move:"`if text.endswith(\".\")`", resp:"Punctuation isn't a protocol." },
    ],
    before:'<div class="phone" style="padding:8px"><div class="b bot" style="font-size:12.5px">Your order is on the</div><span class="st-ok">Delivered ✓</span></div>',
    after:'<div class="phone" style="padding:8px"><div class="b bot" style="font-size:12.5px">Your order is on the</div><span class="st-am">partial · Regenerate</span></div>',
    fixedSrc:`status = "complete"
error = None
try:
    for chunk in stream:
        ...
except ConnectionError:
    pass
except ConnectionError as exc:
    error = str(exc)
status = honest_status(error, finish)      # complete / truncated / partial / error
return {"text": "".join(parts), "status": status}`,
    fixedMarks:{1:"del",2:"good",6:"del",7:"del",8:"good",9:"good",10:"good"},
    tipOn:"Status comes from the error and `finish_reason`. Never before the loop.",
    tipOff:"Don't set complete before you know. Edit status after the loop, then re-run.",
    tipFixedOn:"Status comes from the error and `finish_reason`. Never before the loop.",
    tipFixedOff:"Bug 4 fixed. Honest status after the loop.",
    accept(src){ return /honest_status\s*\(/.test(src) || (/finish\s*==\s*["']stop["']/.test(src) && /error/.test(src)); },
    reject(src){ return /endswith\s*\(/.test(src) ? { move:"`if text.endswith(\".\")`", resp:"Punctuation isn't a protocol." } : null; },
  },
  {
    id:"Bug 5 · bonus", title:"The missing scorecard",
    src:`for chunk in stream:
    if chunk.get("usage"):
        usage = chunk["usage"]
    ...
    if chunk["choices"][0].get("finish_reason"):
        break                              # done!`,
    badLines:[5,6],
    fixes:[
      { t: "No `break`: let the stream end; usage comes last", ok:true },
      { t: "`len(text.split())` as tokens", ok:false, move:"`len(text.split())` as tokens", resp:"Close enough is how budgets explode." },
    ],
    before:'<div class="term" style="font-size:11.5px">[usage] prompt=? completion=? total=?</div>',
    after:'<div class="term" style="font-size:11.5px"><span class="ok">[usage] prompt=12 completion=7 total=19</span></div>',
    fixedSrc:`for chunk in stream:
    if chunk.get("usage"):
        usage = chunk["usage"]
    ...
    if chunk["choices"][0].get("finish_reason"):
        break                              # done!
    # no break: let the stream end; usage comes last`,
    fixedMarks:{5:"del",6:"del",7:"good"},
    tipOn:"Usage arrives last. Don't break when you see `finish_reason`.",
    tipOff:"Don't break early. Edit out the early break, then re-run.",
    tipFixedOn:"Five for five. Ila's \"minor polish\" is history.",
    tipFixedOff:"Bug 5 fixed. Let the stream end so usage can arrive.",
    accept(src){ return !/\bbreak\b/.test(src); },
    reject(src){ return /len\s*\(\s*text\.split/.test(src) ? { move:"`len(text.split())` as tokens", resp:"Close enough is how budgets explode." } : null; },
  },
];

const RUBRIC = ["Live streaming","Correct assembly","Safe chunk handling","Honest status","Error handling","Retry discipline","Usage logging","CLI temperature flag"];

const TIPS = {
  map: ["The Retry Storm is waiting. Mission 3.5 is live.","Module 3 · The Retry Storm. Open mission 3.5."],
  avatar: ["Pick who's on shift. The path and the XP* stay the same.","Choose one of the four preset avatars, then enter."],
  cut1: ["Rain on the hostel window. Cursor blinks. And blinks.","Friday, 9:40 PM. Watch both panels, then go Next."],
  cut2: ["A reply isn't done when it stops. It's done when it says it's done.","Note the mission skills, then start Discovery."],
  disc: ["This reply stopped mid-sentence. Let's find out why. Tap the clues.","Tap at least 3 of the 4 clues, then answer the wrap-up."],
  discSpeak: ["Text stopped. Nothing said \"finished\". And the board still said \"all good\".","Two clues found. Keep tapping until you have at least three."],
  analogy: ["Ever followed a match on live text commentary? Ball by ball, line by line.","Each ball is a chunk. Rain stopped play is a cut stream. The umpire's signal is finish_reason."],
  wrap: ["Text stopped. Nothing said \"finished\". The board still said \"all good\".","What's actually wrong? Pick the honest diagnosis."],
  e1: ["Same question, two bots. Press play and watch which one talks first.","Press Play packet run. Compare the buffered bot and the streamed bot."],
  e1play: ["See that? The streamed bot is already talking. The other one is still thinking.","The streamed bot talks first. Then answer the check."],
  e1ok: ["Commentary beats waiting for tomorrow's match report.","Streaming shows the same reply while it's being written."],
  e2: ["Close! Blank lines are just gaps between balls. Look for the final line.","Find the line that ends the stream, then answer the check."],
  e3: ["Throat-clear, words, final whistle, scorecard. Only one type carries text.","Role-only, content, finish, usage. Only content has text."],
  r1: ["Three balls bowled. We know how the commentary travels and how to read one line.","Put Wire, Chunk, then Text in that order."],
  e4off: ["Switch flush off, then press play. Feel familiar?","With flush off, the terminal holds the text. Toggle flush on and play again."],
  e4on: ["Now every word lands the moment it arrives.","`flush=True` pushes every piece to the screen now."],
  e5: ["Collect while you print. The stream won't come back for a second read.","Print and collect in the same pass."],
  e6: ["Finished, and we can prove it.","Quiet isn't done. Done is `stop` or `length`."],
  r2: ["Six for six. That's 70% of the job. The other 30% is what you do when the rain comes.","All six Explore ideas are in. Continue to Assign."],
  as0: ["Scenario A: a healthy stream ended with stop. What is honest?","Pick the behaviour that matches finish_reason stop."],
  as1: ["Scenario B: text stopped, no finish signal. Quiet isn't done.","Mark partial, keep the text, never all-good."],
  as2: ["Scenario C: failed before any content. One patient retry is safe.","Retry once after a pause — not a storm."],
  as3: ["Scenario D: incomplete marked complete — the Discovery bug.","Status after the loop from finish_reason and error."],
  asCli: ["Temperature dials are Mission 3.6. Streaming honesty is this mission.","Continue — parameter tuning comes next."],
  asDone: ["Four scenarios, honest decisions. Next: predict risky patches.","Continue to Predictions."],
  micro: ["Drag blocks under the loop in Explore order. Nest with a rightward drag.","Drag blocks into the editor. Drag right to nest. Keyboard: Enter adds, arrows move, Delete removes."],
  microWrong: ["Close. Check the highlighted block against the Brief order.","Check the highlighted block."],
  microOk: ["Blocks match a valid consumer. Next: type the honest status fix yourself.","Line Keeper structure built. Continue to Guided."],
  guided: ["The starter always says complete. Pick the honest status expression, then Run.","Cut stream → expected partial, got complete. Use Coach hints tied to the failing check."],
  guidedOk: ["Status now comes after the loop from error and finish_reason. Continue to Independent.","Guided checks green. Continue to Independent."],
  indepFail: ["Read which test id failed (T1–T5). Coach maps that failure to a targeted hint.","A quiet stream expected partial. Change how you decide complete."],
  indepOk: ["Your consume() passed live checks. Continue to Debug.","All real Python checks passed on the mock stream. Continue to Debug."],
  p1: ["Run your consumer once before asking for help. This is the practical check.","Press Run challenge first."],
  p2: ["Quiet isn't done. Label honestly, retry once with a pause, and treat `length` as truncated.","For each cut chat, pick the honest status."],
  recov: ["Let's replay one thing. Chat 4 went quiet. Quiet isn't done.","Code, Phase 1 and XP are kept. Hearts refill to 3. Back to Phase 2."],
  p2ok: ["That's retry discipline. The storm can't feed on you.","Phase 2 cleared. Continue to Phase 3."],
  p3: ["The board tells the truth now. Watch the shield.","Flip every All-good tick to an honest label."],
  win: ["Line restored. Every word, and the truth about every word.","All rubric items are met. Claim rewards."],
  rewards: ["Mission 3.5 complete. The Unfinished Line is live again.","Collect the badge, the item, and the level-up, then continue."],
  cliff: ["Next stop: the dials. Mission 3.6.","Ila set temperature to 1.9. Continue to the map."],
  mapEnd: ["3.6 is unlocked. Parameter tuning is next.","Mission 3.6 · Parameter tuning is now playable (concept only)."],
};

function predOutcome(id) {
  if (id==="P1") return '<div class="term" style="flex:1;font-size:15px"><span class="dim">$ python bot.py</span>\n<span class="dim">… 2.4 s of nothing …</span>\nYour order is on the way.</div>';
  if (id==="P2") return '<div class="term" style="flex:1;font-size:12.5px"><span class="dim">$ python bot.py</span>\n<span class="er">Traceback (most recent call last):\n  ...\nKeyError: \'content\'</span>\n<span class="dim"># the customer saw nothing</span></div>';
  if (id==="P3") return '<div class="phone" style="flex:1"><div class="ph-h"><span class="logo-dd">DD</span>Dabba Dash support</div><div class="b u">Where is my order?</div><div class="b bot">Your order is on the</div><div class="st-ok" style="align-self:flex-start;font-size:14px">Delivered ✓</div></div>';
  if (id==="P4") return '<div class="col" style="flex:1"><div class="phone"><div class="b bot">Your order is on the way.</div><div class="b u">What time?</div><div class="b bot">Sorry, which order do you mean?</div></div><div class="code xs" style="padding:6px 10px;white-space:pre-wrap">history[-1] = {"role": "assistant", "content": ""}</div></div>';
  if (id==="P5") return '<div class="col" style="flex:1"><div class="phone"><div class="b bot">Your order is on the Your order is on the Your order is on the Your order is on the…</div></div><div class="fb bad" style="padding:8px 12px"><span class="ico">'+ic("x",15,"#fff")+'</span><div><b>429 · Too many requests</b> The provider rate-limited the city.</div></div></div>';
  if (id==="P6") return '<div class="phone" style="flex:1"><div class="b u">Where is my order?</div><div class="b bot">Your order is on the</div><span class="chip amb" style="align-self:flex-start">truncated · finish_reason: length</span></div>';
}
