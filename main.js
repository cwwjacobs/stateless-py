// Initialize Pyodide and manage UI state
let pyodideReadyPromise = loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/' });

const outputEl = document.getElementById("output");
const runBtn = document.getElementById("runBtn");
const statusEl = document.getElementById("status");

// Show loading state and enable Run when ready
statusEl.textContent = "Loading stateless runtime...";
pyodideReadyPromise.then(() => {
  statusEl.textContent = "stateless ready";
  outputEl.textContent = "stateless ready. Enter Python and press Run.";
  if (runBtn) runBtn.disabled = false;
}).catch((err) => {
  statusEl.textContent = "Failed to load runtime";
  outputEl.textContent = "Failed to load runtime: " + err;
});

async function runCode() {
  const code = document.getElementById("code").value;
  outputEl.textContent = "Running...";
  let pyodide = await pyodideReadyPromise;

  try {
    // Wrap user code to capture stdout/stderr and any returned value
    const wrapped = `import sys\nfrom io import StringIO\n_out = StringIO()\n_err = StringIO()\n_old_out, _old_err = sys.stdout, sys.stderr\nsys.stdout, sys.stderr = _out, _err\n_result = None\ntry:\n${code.split('\n').map(line => '    ' + line).join('\n')}\nexcept SystemExit as e:\n    _result = f"SystemExit: {e}"\nexcept Exception as e:\n    import traceback\n    _err.write(traceback.format_exc())\nfinally:\n    sys.stdout, sys.stderr = _old_out, _old_err\n_out_val = _out.getvalue()\n_err_val = _err.getvalue()\nif _err_val:\n    _print_out = _err_val\nelif _out_val:\n    _print_out = _out_val\nelif _result is not None:\n    _print_out = str(_result)\nelse:\n    _print_out = ''\n_print_out`;

    // Execute and receive the captured combined output string
    const result = await pyodide.runPythonAsync(wrapped);
    // Ensure we display something sensible
    if (typeof result === 'string') {
      outputEl.textContent = result || '';
    } else {
      outputEl.textContent = String(result);
    }
  } catch (err) {
    outputEl.textContent = String(err);
  }
}

function clearOutput() {
  outputEl.textContent = "";
}

function downloadScript() {
  const code = document.getElementById("code").value;
  const blob = new Blob([code], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "script.py";
  a.click();
}

function loadScript(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    document.getElementById("code").value = e.target.result;
  };
  reader.readAsText(file);
}

async function downloadJSONFile(filename) {
  let pyodide = await pyodideReadyPromise;
  const fs = pyodide.FS;

  try {
    const data = fs.readFile(filename, { encoding: "utf8" });
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  } catch (err) {
    alert("File not found: " + filename);
  }
}

function clearCode() {
  const editor = document.getElementById("code");
  editor.value = "";
}
