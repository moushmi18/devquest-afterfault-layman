/* Runs Python (Pyodide) off the main thread so a stuck loop can be stopped. */
const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
let ready = null;
function boot() {
  if (!ready) ready = (async () => {
    importScripts(PYODIDE + "pyodide.js");
    const py = await loadPyodide({ indexURL: PYODIDE });
    const src = await (await fetch("harness.py", { cache: "no-cache" })).text();
    py.FS.writeFile("/home/pyodide/harness.py", src);
    py.runPython("import sys; sys.path.insert(0, '/home/pyodide'); import harness");
    return py;
  })();
  return ready;
}
self.onmessage = async (e) => {
  const { id, cmd, suite, code, stream } = e.data;
  try {
    const py = await boot();
    if (cmd === "boot") { self.postMessage({ id, ok: true }); return; }
    py.globals.set("_code", code || "");
    let out;
    if (cmd === "suite") { py.globals.set("_suite", suite); out = py.runPython("harness.run_suite(_suite, _code)"); }
    else { py.globals.set("_stream", stream || "normal"); out = py.runPython("harness.run_free(_code, _stream)"); }
    self.postMessage({ id, ok: true, data: JSON.parse(out) });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err && err.message || err) });
  }
};
