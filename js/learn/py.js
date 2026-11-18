/* Real Python in the browser: a Web Worker running Pyodide + harness.py (fake OpenAI client, fake terminal, checks). */
const PY = (() => {
  let w = null, seq = 0, status = "idle", waiters = {};
  const listeners = new Set();
  function setStatus(s) { status = s; listeners.forEach(f => { try { f(s); } catch (e) {} }); }
  function spawn() {
    w = new Worker("js/learn/py-worker.js");
    w.onmessage = (e) => { const r = waiters[e.data.id]; if (r) { delete waiters[e.data.id]; r(e.data); } };
    w.onerror = () => { setStatus("error"); Object.values(waiters).forEach(r => r({ ok: false, error: "Python could not start." })); waiters = {}; };
  }
  function send(msg, ms) {
    if (!w) spawn();
    const id = ++seq;
    return new Promise((resolve) => {
      const t = setTimeout(() => {
        if (!waiters[id]) return;
        delete waiters[id];
        w.terminate(); w = null; boot = null; setStatus("idle");
        resolve({ ok: false, timeout: true, error: msg.cmd === "boot" ? "Python took too long to load. Check your connection and try again." : "Your code ran for more than 8 seconds, so we stopped it. Look for a loop that never ends." });
      }, ms);
      waiters[id] = (d) => { clearTimeout(t); resolve(d); };
      w.postMessage({ id, ...msg });
    });
  }
  let boot = null;
  function ensure() {
    if (status === "ready") return Promise.resolve(true);
    if (!boot) {
      setStatus("loading");
      boot = send({ cmd: "boot" }, 120000).then(r => { if (r.ok) { setStatus("ready"); return true; } boot = null; setStatus("error"); return false; });
    }
    return boot;
  }
  async function run(cmd, payload) {
    const ok = await ensure();
    if (!ok) return { ok: false, error: "Python could not load. Check your internet connection, then press Run again." };
    const r = await send({ cmd, ...payload }, 8000);
    if (r.timeout) { ensure(); }
    return r;
  }
  return {
    get status() { return status; },
    on(f) { listeners.add(f); },
    preload() { ensure(); },
    suite(suite, code) { return run("suite", { suite, code }); },
    free(code, stream) { return run("free", { code, stream }); },
  };
})();
