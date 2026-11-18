# DevQuest · Streaming Responses — in-browser practice harness (runs in Pyodide).
# A fake OpenAI-style client that streams scripted chunks, a fake terminal that
# behaves like a real line-buffered one, and the checks for each challenge.
import sys, json, traceback


class Obj:
    """Tiny attribute bag, shaped like the objects the openai SDK returns."""
    def __init__(self, **kw):
        self.__dict__.update(kw)

    def __repr__(self):
        inner = ", ".join(f"{k}={v!r}" for k, v in self.__dict__.items())
        return f"{type(self).__name__}({inner})"


class ChatCompletionChunk(Obj): pass
class Choice(Obj): pass
class ChoiceDelta(Obj): pass
class CompletionUsage(Obj): pass


class APIConnectionError(ConnectionError):
    """Raised when the network drops in the middle of a stream."""


def build_chunk(e):
    t = e["t"]
    if t == "usage":
        return ChatCompletionChunk(choices=[], usage=CompletionUsage(prompt_tokens=12, completion_tokens=e.get("n", 6), total_tokens=12 + e.get("n", 6)))
    content = None
    role = None
    finish = None
    if t == "role":
        role = "assistant"
    elif t == "text":
        content = e["c"]
    elif t == "empty":
        content = ""
    elif t == "finish":
        finish = e["r"]
    return ChatCompletionChunk(choices=[Choice(index=0, delta=ChoiceDelta(role=role, content=content), finish_reason=finish)], usage=None)


class Screen:
    """A terminal: text you print waits in a buffer until a newline or a flush."""
    def __init__(self):
        self.shown = ""
        self.pending = ""
        self.flushes = 0

    def write(self, s):
        s = str(s)
        self.pending += s
        if "\n" in self.pending:
            k = self.pending.rfind("\n") + 1
            self.shown += self.pending[:k]
            self.pending = self.pending[k:]
        return len(s)

    def flush(self):
        self.shown += self.pending
        self.pending = ""
        self.flushes += 1

    def final(self):
        return self.shown + self.pending


class Stream:
    """Iterate it once to receive chunks. close() hangs up the connection."""
    def __init__(self, events, screen):
        self._events = list(events)
        self._i = 0
        self._screen = screen
        self.closed = False
        self.frames = []      # what the terminal showed each time a new chunk was requested
        self.delivered = 0

    def __iter__(self):
        return self

    def __next__(self):
        self.frames.append(self._screen.shown if self._screen else "")
        if self.closed or self._i >= len(self._events):
            raise StopIteration
        e = self._events[self._i]
        self._i += 1
        if e["t"] == "error":
            raise APIConnectionError(e.get("m", "Connection reset by peer"))
        self.delivered += 1
        return build_chunk(e)

    def close(self):
        self.closed = True

    def __enter__(self):
        return self

    def __exit__(self, *a):
        self.close()
        return False


class Completions:
    def __init__(self, script, screen):
        self._script = [list(s) for s in script]
        self._screen = screen
        self.calls = []
        self.streams = []

    def create(self, model=None, messages=None, stream=False, **kw):
        self.calls.append({"model": model, "messages": [dict(m) for m in (messages or [])], "stream": stream})
        if not self._script:
            raise RuntimeError("The practice server has no more replies scripted for this test.")
        events = self._script.pop(0)
        if not stream:
            text = "".join(e.get("c", "") for e in events if e["t"] == "text")
            return Obj(choices=[Obj(index=0, message=Obj(role="assistant", content=text), finish_reason="stop")])
        s = Stream(events, self._screen)
        self.streams.append(s)
        return s


class OpenAI:
    """Stand-in for `from openai import OpenAI`. Needs no key, never touches the network."""
    def __init__(self, script=None, screen=None, **kw):
        self.chat = Obj(completions=Completions(script or [[]], screen))


# ---------------------------------------------------------------- scripted replies
T = lambda c: {"t": "text", "c": c}
ROLE = {"t": "role"}
EMPTY = {"t": "empty"}
STOP = {"t": "finish", "r": "stop"}
LENGTH = {"t": "finish", "r": "length"}
USAGE = {"t": "usage"}
ERR = {"t": "error", "m": "Connection reset by peer"}

S_NORMAL = [ROLE, T("Your order "), T("is on "), T("the way."), STOP, USAGE]
S_MESSY = [ROLE, EMPTY, T("Your "), T("order "), EMPTY, T("is on "), T("the way."), STOP, USAGE]
S_LENGTH = [ROLE, T("Your order is "), T("with Arjun, "), T("near the main"), LENGTH, USAGE]
S_QUIET = [ROLE, T("Your order "), T("is on "), T("the")]           # the line goes quiet: no finish chunk
S_MIDERR = [ROLE, T("Your refund "), T("will be "), ERR]
S_EARLYERR = [ERR]
S_TABLE = [ROLE, T("Your table "), T("for two "), T("is ready."), STOP, USAGE]

STREAMS = {"normal": S_NORMAL, "messy": S_MESSY, "length": S_LENGTH, "quiet": S_QUIET,
           "miderr": S_MIDERR, "earlyerr": S_EARLYERR, "table": S_TABLE}


def text_of(events):
    return "".join(e.get("c", "") for e in events if e["t"] == "text")


def grew(frames):
    """How many times the visible text got longer while chunks were still arriving."""
    n = 0
    for a, b in zip(frames, frames[1:]):
        if len(b) > len(a):
            n += 1
    return n


# ---------------------------------------------------------------- running student code
class Run:
    def __init__(self, code, script, extra=None):
        self.screen = Screen()
        self.client = OpenAI(script=script, screen=self.screen)
        self.error = None
        self.ns = {"__name__": "__main__"}
        self.pauses = []
        fake_openai = type(sys)("openai")
        client = self.client
        fake_openai.OpenAI = lambda *a, **k: client
        fake_openai.APIConnectionError = APIConnectionError
        sys.modules["openai"] = fake_openai
        self.ns["pause"] = lambda s=1: self.pauses.append(s)
        self.ns["APIConnectionError"] = APIConnectionError
        if extra:
            self.ns.update(extra)
        old = sys.stdout
        sys.stdout = self.screen
        try:
            exec(compile(code, "my_code.py", "exec"), self.ns)
        except Exception as e:
            self.error = e
        finally:
            sys.stdout = old

    def call(self, fn, *args):
        old = sys.stdout
        sys.stdout = self.screen
        try:
            return ("ok", self.ns[fn](*args))
        except Exception as e:
            return ("err", e)
        finally:
            sys.stdout = old

    @property
    def stream(self):
        s = self.client.chat.completions.streams
        return s[0] if s else None


def err_text(e):
    if e is None:
        return ""
    tb = traceback.extract_tb(e.__traceback__)
    line = ""
    for fr in tb:
        if fr.filename == "my_code.py":
            line = f" (line {fr.lineno})"
    return f"{type(e).__name__}: {e}{line}"


def res(tid, name, ok, why=""):
    return {"id": tid, "name": name, "pass": bool(ok), "why": "" if ok else why}


# ---------------------------------------------------------------- suite: script-style consumer (Code · guided)
def suite_script(code):
    out = []
    runs = {k: Run(code, [STREAMS[k]]) for k in ("normal", "messy", "length", "quiet")}
    r = runs["normal"]
    if r.error and not r.stream:
        return [res("C0", "Your code runs", False, err_text(r.error))], demo(r)
    calls = r.client.chat.completions.calls
    out.append(res("C1", "Asks the API for a stream (stream=True)", calls and calls[0]["stream"] is True,
                   "create(...) was not called with stream=True, so the server would send one big reply at the end."))
    bad = [k for k, x in runs.items() if x.error]
    out.append(res("C2", "Runs on every test stream without crashing", not bad,
                   f"Crashed on the '{bad[0]}' stream: {err_text(runs[bad[0]].error)}" if bad else ""))
    s = r.stream
    n_text = sum(1 for e in S_NORMAL if e["t"] == "text")
    out.append(res("C3", "Shows each piece the moment it arrives", s is not None and grew(s.frames) >= n_text,
                   "The terminal stayed blank while chunks arrived. Print each piece with end=\"\" and flush=True inside the loop."))
    final = r.screen.final()
    want = text_of(S_NORMAL)
    out.append(res("C4", "Keeps the reply on one line", want in final,
                   "The words were split across lines. Use end=\"\" so print doesn't add a newline after every piece."))
    m = runs["messy"]
    parts = m.ns.get("parts")
    clean = isinstance(parts, list) and len(parts) > 0 and all(isinstance(p, str) and p for p in parts)
    out.append(res("C5", "Skips empty and non-text chunks", not m.error and clean,
                   ("parts contains " + repr([p for p in parts if not (isinstance(p, str) and p)][:2]) + ". Only append when `if piece:` is true.") if isinstance(parts, list) and not clean else
                   (err_text(m.error) if m.error else "Keep a list called parts and append only real text to it.")))
    reply = r.ns.get("reply")
    out.append(res("C6", "Joins the pieces into the full reply", reply == want,
                   f"reply is {reply!r}; expected {want!r}. Use \"\".join(parts): the pieces already carry their own spaces."))
    fins = (runs["normal"].ns.get("finish"), runs["length"].ns.get("finish"), runs["quiet"].ns.get("finish"))
    out.append(res("C7", "Remembers the finish signal (finish_reason)", fins == ("stop", "length", None),
                   f"finish came out as {fins[0]!r} / {fins[1]!r} / {fins[2]!r} for normal / cut-off / quiet streams; expected 'stop' / 'length' / None."))
    return out, demo(r)


def demo(r):
    s = r.stream
    return {"frames": s.frames if s else [], "screen": r.screen.final(), "error": err_text(r.error)}


# ---------------------------------------------------------------- suite: consume(stream) function (Code · independent)
def suite_consume(code):
    out = []
    base = Run(code, [S_NORMAL])
    if base.error:
        return [res("F0", "Your code runs", False, err_text(base.error))], demo(base)
    if not callable(base.ns.get("consume")):
        return [res("F0", "Defines consume(stream)", False, "Write a function named consume that takes the stream.")], demo(base)
    cases = [
        ("F1", "Normal reply → full text, status 'complete'", "normal", (text_of(S_NORMAL), "complete")),
        ("F2", "Messy chunks (role-only, empty, usage-only) are skipped", "messy", (text_of(S_MESSY), "complete")),
        ("F3", "Cut off by max_tokens → status 'truncated'", "length", (text_of(S_LENGTH), "truncated")),
        ("F4", "Line goes quiet, no finish signal → status 'partial'", "quiet", (text_of(S_QUIET), "partial")),
        ("F5", "Connection drops mid-reply → keep the text, status 'error'", "miderr", (text_of(S_MIDERR), "error")),
        ("F6", "Error before any text → ('', 'error'), no crash", "earlyerr", ("", "error")),
    ]
    first_demo = None
    for tid, name, key, want in cases:
        r = Run(code, [STREAMS[key]])
        stream = r.client.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": "Where is my order?"}], stream=True)
        kind, val = r.call("consume", stream)
        if first_demo is None:
            first_demo = {"frames": stream.frames, "screen": r.screen.final(), "error": ""}
        if kind == "err":
            out.append(res(tid, name, False, f"consume raised {err_text(val)}. Catch connection errors inside consume so the app can show an honest status."))
            continue
        got = tuple(val) if isinstance(val, (tuple, list)) else val
        out.append(res(tid, name, got == want, f"returned {got!r}; expected {want!r}."))
    r = Run(code, [S_NORMAL])
    s = r.client.chat.completions.create(model="gpt-4o-mini", messages=[], stream=True)
    r.call("consume", s)
    out.append(res("F7", "Prints pieces live (end=\"\", flush=True)", grew(s.frames) >= 3,
                   "Nothing appeared until the end. Print each piece with end=\"\" and flush=True as it arrives."))
    closed = []
    for key in ("normal", "miderr", "earlyerr"):
        r = Run(code, [STREAMS[key]])
        s = r.client.chat.completions.create(model="gpt-4o-mini", messages=[], stream=True)
        r.call("consume", s)
        closed.append(s.closed)
    out.append(res("F8", "Always closes the stream (even after an error)", all(closed),
                   "Call stream.close() in a finally: block so the connection is released in every case."))
    return out, first_demo


# ---------------------------------------------------------------- suite: chat_turn (Mastery)
def suite_chat(code):
    out = []
    base = Run(code, [S_NORMAL])
    if base.error:
        return [res("M0", "Your code runs", False, err_text(base.error))], demo(base)
    if not callable(base.ns.get("chat_turn")):
        return [res("M0", "Defines chat_turn(client, history, user_msg)", False, "Write a function named chat_turn(client, history, user_msg).")], demo(base)

    def turn(script, msg="Where is my order?", hist=None):
        r = Run(code, script)
        h = list(hist or [{"role": "system", "content": "You are a restaurant support assistant."}])
        kind, val = r.call("chat_turn", r.client, h, msg)
        return r, h, kind, val

    r, h, kind, val = turn([S_NORMAL])
    d = {"frames": r.client.chat.completions.streams[0].frames if r.client.chat.completions.streams else [], "screen": r.screen.final(), "error": err_text(val) if kind == "err" else ""}
    calls = r.client.chat.completions.calls
    out.append(res("M1", "Sends the history + new message with stream=True",
                   kind == "ok" and calls and calls[0]["stream"] is True and calls[0]["messages"] and calls[0]["messages"][-1] == {"role": "user", "content": "Where is my order?"} and calls[0]["messages"][0]["role"] == "system",
                   err_text(val) if kind == "err" else "Append {'role': 'user', 'content': user_msg} to history, then pass messages=history and stream=True."))
    s = r.client.chat.completions.streams[0] if r.client.chat.completions.streams else None
    out.append(res("M2", "Shows the reply live, word by word", s is not None and grew(s.frames) >= 3,
                   "The reply only appeared at the end. Print each piece with end=\"\" and flush=True."))
    out.append(res("M3", "Saves the full reply to history and returns 'complete'",
                   kind == "ok" and val == "complete" and h[-1] == {"role": "assistant", "content": text_of(S_NORMAL)},
                   f"returned {val!r}, last history item {h[-1]!r}" if kind == "ok" else err_text(val)))
    r, h, kind, val = turn([S_LENGTH])
    out.append(res("M4", "Cut-off reply → returns 'truncated' and says so on screen",
                   kind == "ok" and val == "truncated" and "(truncated)" in r.screen.final(),
                   f"returned {val!r}; screen ended with {r.screen.final()[-30:]!r}. Print '(truncated)' after an unfinished reply." if kind == "ok" else err_text(val)))
    r, h, kind, val = turn([S_MIDERR])
    out.append(res("M5", "Connection drops mid-reply → keeps the text, returns 'error', no crash",
                   kind == "ok" and val == "error" and text_of(S_MIDERR) in r.screen.final() and "(error)" in r.screen.final() and len(r.client.chat.completions.calls) == 1,
                   (err_text(val) if kind == "err" else f"returned {val!r}, screen {r.screen.final()!r}, API calls {len(r.client.chat.completions.calls)}. Don't retry once text has been shown: it would repeat words.")))
    r, h, kind, val = turn([S_EARLYERR, S_TABLE], msg="Is my table ready?")
    n = len(r.client.chat.completions.calls)
    out.append(res("M6", "Error before any text → pause, retry once, then succeed",
                   kind == "ok" and val == "complete" and n == 2 and r.pauses and r.screen.final().count("Your table") == 1,
                   err_text(val) if kind == "err" else f"API calls: {n} (expected 2), pause() called: {bool(r.pauses)}, returned {val!r}."))
    r, h, kind, val = turn([S_EARLYERR, S_EARLYERR, S_NORMAL])
    n = len(r.client.chat.completions.calls)
    out.append(res("M7", "Fails twice → gives up after one retry, returns 'error'",
                   kind == "ok" and val == "error" and n == 2,
                   err_text(val) if kind == "err" else f"API calls: {n} (expected exactly 2: one try + one retry), returned {val!r}."))
    ok_closed = True
    opened = 0
    for sc in ([S_NORMAL], [S_MIDERR], [S_LENGTH]):
        r, h, kind, val = turn(sc)
        ok_closed = ok_closed and all(x.closed for x in r.client.chat.completions.streams)
        opened += len(r.client.chat.completions.streams)
    out.append(res("M8", "Closes every stream it opens", ok_closed and opened >= 3, "Use try/finally (or `with`) so stream.close() always runs."))
    r, h, kind, val = turn([S_EARLYERR, S_EARLYERR])
    out.append(res("M9", "Never saves an empty assistant message",
                   kind == "ok" and len(r.client.chat.completions.calls) >= 1 and not any(m.get("role") == "assistant" and not m.get("content") for m in h),
                   "When no text arrived, don't append an assistant message to history."))
    return out, d


def suite_debug(code):
    out, d = suite_script(code)
    if "status" in code:
        st = []
        for k in ("normal", "length", "quiet"):
            r = Run(code, [STREAMS[k]])
            st.append(r.ns.get("status"))
        out.append(res("C8", "Status is honest (complete / truncated / partial)", tuple(st) == ("complete", "truncated", "partial"),
                       f"status came out as {st[0]!r} / {st[1]!r} / {st[2]!r} for normal / cut-off / quiet streams; expected 'complete' / 'truncated' / 'partial'. Only finish_reason == 'stop' means complete."))
    return out, d


SUITES = {"debug": suite_debug, "script": suite_script, "consume": suite_consume, "chat": suite_chat}


def run_suite(name, code):
    try:
        results, d = SUITES[name](code)
    except Exception as e:
        results, d = [res("X", "Checker", False, "The checker hit an unexpected problem: " + err_text(e))], {"frames": [], "screen": "", "error": ""}
    return json.dumps({"results": results, "demo": d})


def run_free(code, stream_key="normal"):
    """Just run the code against one stream and report what the terminal showed."""
    r = Run(code, [STREAMS.get(stream_key, S_NORMAL)])
    return json.dumps({"results": [], "demo": demo(r)})
