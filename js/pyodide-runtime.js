/* Real in-browser Python via Pyodide + mock OpenAI-style stream.
   Label: REAL Python execution · MOCK API stream (no API key). */

const PY_CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
const PY = {
  status: "idle", // idle | loading | ready | error
  error: null,
  pyodide: null,
  loadPromise: null,
  lastRun: null,
};

const REAL_BADGE = `<span class="real-badge" title="Runs real Python in your browser via Pyodide. The AI API is a mock stream — no API key.">Real Python · Mock API</span>`;
function realLabel(text) {
  return `<span class="sim-row">${REAL_BADGE}<span class="mini">${esc(text || "Pyodide in-browser · mock chat.completions stream")}</span></span>`;
}
function pyStatusChip() {
  if (PY.status === "ready") return chip("Python ready", "grn");
  if (PY.status === "loading") return chip("Loading Python…", "amb");
  if (PY.status === "error") return chip("Python unavailable", "red");
  return chip("Python not loaded", "gry");
}

const MOCK_STREAM_PY = `
import io, sys, traceback

def _chunk(content=None, role=None, finish=None, usage=None):
    if usage is not None and content is None and role is None and finish is None:
        return {"choices": [], "usage": usage}
    delta = {}
    if role is not None:
        delta["role"] = role
    if content is not None:
        delta["content"] = content
    choice = {"delta": delta, "finish_reason": finish}
    return {"choices": [choice]}

def make_stream(kind="normal"):
    """Yield OpenAI-style dict chunks. kind: normal|partial|error|none_content|length|usage_jam|error_before"""
    words = ["Your ", "order ", "is ", "on ", "the ", "way."]
    if kind == "normal":
        yield _chunk(role="assistant")
        for w in words:
            yield _chunk(content=w)
        yield _chunk(finish="stop")
        yield {"choices": [], "usage": {"prompt_tokens": 12, "completion_tokens": 7, "total_tokens": 19}}
        return
    if kind == "partial":
        yield _chunk(role="assistant")
        for w in words[:5]:
            yield _chunk(content=w)
        return
    if kind == "error":
        yield _chunk(role="assistant")
        yield _chunk(content="Your ")
        yield _chunk(content="order ")
        raise ConnectionError("connection dropped mid-stream")
    if kind == "error_before":
        raise ConnectionError("connection failed before any content")
    if kind == "none_content":
        yield _chunk(role="assistant")
        for w in words:
            yield _chunk(content=w)
        yield _chunk(finish="stop")
        return
    if kind == "length":
        yield _chunk(role="assistant")
        for w in words[:5]:
            yield _chunk(content=w)
        yield _chunk(finish="length")
        return
    if kind == "usage_jam":
        yield _chunk(role="assistant")
        for w in words:
            yield _chunk(content=w)
        yield _chunk(finish="stop")
        yield {"choices": [], "usage": {"prompt_tokens": 12, "completion_tokens": 7, "total_tokens": 19}}
        return
    raise ValueError("unknown stream kind: " + kind)

def honest_status(error, finish):
    if error:
        return "error"
    if finish == "length":
        return "truncated"
    if finish == "stop":
        return "complete"
    return "partial"

def _run_consume(src, kind="normal"):
    ns = {
        "make_stream": make_stream,
        "honest_status": honest_status,
        "ConnectionError": ConnectionError,
        "sys": sys,
        "io": io,
    }
    out = io.StringIO()
    try:
        exec(src, ns, ns)
        consume = ns.get("consume")
        if consume is None:
            return {"ok": False, "error": "Define a function named consume(stream, out=sys.stdout).", "stdout": "", "result": None}
        stream = make_stream(kind)
        result = consume(stream, out)
        return {"ok": True, "error": None, "stdout": out.getvalue(), "result": result}
    except Exception as exc:
        return {"ok": False, "error": "".join(traceback.format_exception_only(type(exc), exc)).strip(), "stdout": out.getvalue(), "result": None, "trace": traceback.format_exc()}
`;

async function pyEnsure(onProgress) {
  if (PY.status === "ready") return PY.pyodide;
  if (PY.loadPromise) return PY.loadPromise;
  PY.status = "loading";
  PY.error = null;
  if (typeof onProgress === "function") onProgress("loading");
  PY.loadPromise = (async () => {
    try {
      if (!window.loadPyodide) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = PY_CDN + "pyodide.js";
          s.onload = resolve;
          s.onerror = () => reject(new Error("Failed to load Pyodide script from CDN"));
          document.head.appendChild(s);
        });
      }
      const pyodide = await window.loadPyodide({ indexURL: PY_CDN });
      await pyodide.runPythonAsync(MOCK_STREAM_PY);
      PY.pyodide = pyodide;
      PY.status = "ready";
      if (typeof onProgress === "function") onProgress("ready");
      return pyodide;
    } catch (e) {
      PY.status = "error";
      PY.error = (e && e.message) || String(e);
      PY.loadPromise = null;
      if (typeof onProgress === "function") onProgress("error");
      throw e;
    }
  })();
  return PY.loadPromise;
}

function pyEscape(src) {
  return JSON.stringify(src);
}

async function pyRunConsume(studentSrc, kind = "normal") {
  const py = await pyEnsure();
  const code = `
import json
_src = ${pyEscape(studentSrc)}
_kind = ${pyEscape(kind)}
_res = _run_consume(_src, _kind)
# jsonify result for JS
def _ser(o):
    if o is None: return None
    if isinstance(o, dict):
        return {k: _ser(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [_ser(v) for v in o]
    if isinstance(o, (str, int, float, bool)):
        return o
    return str(o)
json.dumps(_ser(_res))
`;
  const raw = await py.runPythonAsync(code);
  const parsed = JSON.parse(raw);
  PY.lastRun = { kind, ...parsed, at: Date.now() };
  return parsed;
}

async function pyRunRaw(src) {
  const py = await pyEnsure();
  const code = `
import json, io, sys, traceback
_out = io.StringIO()
_err = None
_old = sys.stdout
sys.stdout = _out
try:
${src.split("\n").map(l => "    " + l).join("\n")}
except Exception as exc:
    _err = "".join(traceback.format_exception_only(type(exc), exc)).strip()
finally:
    sys.stdout = _old
json.dumps({"ok": _err is None, "stdout": _out.getvalue(), "error": _err})
`;
  return JSON.parse(await py.runPythonAsync(code));
}

const INDEP_TESTS_REAL = [
  { id: "T1", name: "Normal stream → complete", kind: "normal", check: (r) => r.ok && r.result && r.result.status === "complete" && (r.result.text || "").includes("way") && (r.stdout || "").includes("Your") },
  { id: "T2", name: "Role-only / None content safe", kind: "none_content", check: (r) => r.ok && r.result && r.result.status === "complete" && !(r.stdout || "").includes("None") },
  { id: "T3", name: "Goes quiet → partial", kind: "partial", check: (r) => r.ok && r.result && r.result.status === "partial" },
  { id: "T4", name: "Error mid-stream → error", kind: "error", check: (r) => !!(r.ok && r.result && r.result.status === "error" && r.result.error) },
  { id: "T5", name: "length → truncated", kind: "length", check: (r) => r.ok && r.result && r.result.status === "truncated" },
];

const GUIDED_TESTS_REAL = [
  {
    id: "G1",
    name: "Usage-only chunk safe · usage kept",
    kind: "usage_jam",
    check: (r) => r.ok && r.result && r.result.usage && r.result.usage.total_tokens === 19,
    failHint: "Guard usage-only chunks (empty choices) and store usage — don’t crash on choices[0].",
  },
  {
    id: "G2",
    name: "Live print · no literal None",
    kind: "none_content",
    check: (r) => r.ok && r.result && (r.result.text || "").includes("way") && !(r.stdout || "").includes("None"),
    failHint: "Use .get(\"content\") and only print when piece is truthy.",
  },
  {
    id: "G3",
    name: "finish_reason captured on stop",
    kind: "normal",
    check: (r) => r.ok && r.result && r.result.finish_reason === "stop",
    failHint: "Store choice.get(\"finish_reason\") when it appears.",
  },
  {
    id: "G4",
    name: "Honest status: partial / error / truncated",
    kind: "multi",
    check: async (src) => {
      const partial = await pyRunConsume(src, "partial");
      const err = await pyRunConsume(src, "error");
      const len = await pyRunConsume(src, "length");
      const ok =
        partial.ok && partial.result && partial.result.status === "partial" &&
        err.ok && err.result && err.result.status === "error" &&
        len.ok && len.result && len.result.status === "truncated";
      return {
        ok,
        detail: ok
          ? "partial / error / truncated all honest"
          : `got partial=${partial.result && partial.result.status}, error=${err.result && err.result.status}, length=${len.result && len.result.status}`,
        stdout: partial.stdout || "",
      };
    },
    failHint: "After the loop: status = honest_status(error, finish) — never hard-code complete.",
  },
];

function guidedSrcFromState() {
  if (state.guidedSrc != null) return state.guidedSrc;
  if (state.guidedFixed) return GUIDED_SRC_FIXED;
  return GUIDED_SRC;
}

const CONSUME_TEMPLATE = `import sys

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
    status = honest_status(error, finish)
    return {"text": "".join(parts), "finish_reason": finish,
            "usage": usage, "status": status, "error": error}
`;

const CONSUME_BROKEN_STATUS = CONSUME_TEMPLATE.replace(
  "status = honest_status(error, finish)",
  'status = "complete"  # BUG: ignores finish_reason'
);

const BUG_RUNNERS = [
  {
    // Bug 1 None concat
    broken: `import sys
def consume(stream, out=sys.stdout):
    text = ""
    for chunk in stream:
        if not chunk.get("choices"):
            continue
        piece = chunk["choices"][0]["delta"].get("content")
        print(piece or "", end="", flush=True, file=out)
        text += piece
    return {"text": text, "status": "complete", "finish_reason": "stop", "usage": None, "error": None}
`,
    fixed: `import sys
def consume(stream, out=sys.stdout):
    parts = []
    finish = None
    for chunk in stream:
        if not chunk.get("choices"):
            continue
        choice = chunk["choices"][0]
        piece = choice["delta"].get("content")
        if piece:
            print(piece, end="", flush=True, file=out)
            parts.append(piece)
        if choice.get("finish_reason"):
            finish = choice["finish_reason"]
    return {"text": "".join(parts), "status": "complete" if finish=="stop" else "partial", "finish_reason": finish, "usage": None, "error": None}
`,
    kind: "none_content",
    expectBrokenFail: true,
  },
  {
    // Bug 2 flush — hard to detect in StringIO; check code contains flush=True after fix via UI. For runtime, both "work" on StringIO.
    broken: null,
    fixed: null,
    kind: "normal",
    skipRuntime: true,
  },
  {
    // Bug 3 double-read
    broken: `import sys
def consume(stream, out=sys.stdout):
    parts = []
    for chunk in stream:
        if not chunk.get("choices"):
            continue
        piece = chunk["choices"][0]["delta"].get("content")
        if piece:
            print(piece, end="", flush=True, file=out)
            parts.append(piece)
    text = "".join((c["choices"][0]["delta"].get("content") or "") for c in stream if c.get("choices"))
    return {"text": text, "status": "complete", "finish_reason": "stop", "usage": None, "error": None}
`,
    fixed: `import sys
def consume(stream, out=sys.stdout):
    parts = []
    finish = None
    for chunk in stream:
        if not chunk.get("choices"):
            continue
        choice = chunk["choices"][0]
        piece = choice["delta"].get("content")
        if piece:
            print(piece, end="", flush=True, file=out)
            parts.append(piece)
        if choice.get("finish_reason"):
            finish = choice["finish_reason"]
    return {"text": "".join(parts), "status": "complete" if finish=="stop" else "partial", "finish_reason": finish, "usage": None, "error": None}
`,
    kind: "normal",
    expectBrokenEmptyText: true,
  },
  {
    // Bug 4 always complete
    broken: CONSUME_BROKEN_STATUS,
    fixed: CONSUME_TEMPLATE,
    kind: "partial",
    expectBrokenStatus: "complete",
    expectFixedStatus: "partial",
  },
  {
    // Bug 5 early break — simulate with break on finish before usage; check usage missing
    broken: `import sys
def consume(stream, out=sys.stdout):
    parts, finish, usage = [], None, None
    for chunk in stream:
        if chunk.get("usage"):
            usage = chunk["usage"]
        if not chunk.get("choices"):
            continue
        choice = chunk["choices"][0]
        piece = choice["delta"].get("content")
        if piece:
            print(piece, end="", flush=True, file=out)
            parts.append(piece)
        if choice.get("finish_reason"):
            finish = choice["finish_reason"]
            break
    return {"text": "".join(parts), "status": "complete", "finish_reason": finish, "usage": usage, "error": None}
`,
    fixed: `import sys
def consume(stream, out=sys.stdout):
    parts, finish, usage = [], None, None
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
    return {"text": "".join(parts), "status": "complete" if finish=="stop" else "partial", "finish_reason": finish, "usage": usage, "error": None}
`,
    kind: "usage_jam",
    expectBrokenNoUsage: true,
  },
];

function pyLoadBar(opts) {
  /* Status only — Real Python badge lives once in the stage header / Run row */
  const o = opts || {};
  if (PY.status === "ready") return o.compact ? "" : `<div class="py-bar ready compact" data-testid="py-bar"><span class="mini">Python runtime ready</span></div>`;
  if (PY.status === "loading") return `<div class="py-bar loading" data-testid="py-bar"><span class="spinny"></span><b>Loading Python (Pyodide)…</b><span class="mini">First load may take ~10–20s</span></div>`;
  if (PY.status === "error") return `<div class="py-bar err" data-testid="py-bar"><b>Python failed to load.</b><span class="mini">${esc(PY.error || "CDN blocked or offline")}. Falling back to simulated checks.</span>${btn("Retry load","py-retry","data-testid='py-retry'","g sm")}</div>`;
  return `<div class="py-bar idle" data-testid="py-bar">${btn("Load Python runtime","py-load","data-testid='py-load'","sm")}<span class="mini">Needed for real Run / Check</span></div>`;
}
