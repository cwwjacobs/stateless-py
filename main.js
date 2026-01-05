// UI + Pyodide integration for stateless
let pyodideReadyPromise = loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/' });

const outputEl = document.getElementById("output");
const runBtn = document.getElementById("runBtn");
const statusEl = document.getElementById("status");
const codeEl = document.getElementById("code");
const examplesSelect = document.getElementById("examples");
const autosaveStatus = document.getElementById("autosaveStatus");
const themeToggle = document.getElementById("themeToggle");

const EXAMPLES = {
  "Hello": "print('Hello, stateless!')",
  "Write JSON (downloadable)": "import json\nopen('result.json','w').write(json.dumps({'ok': True}))\nprint('Wrote result.json')",
  "Loop demo": "for i in range(3):\n    print('count', i)"
};

let autosaveIntervalId = null;

// Initialize UI state
statusEl.textContent = "Loading stateless runtime...";
outputEl.textContent = "Initializing stateless runtime...";

// Populate examples dropdown
(function populateExamples(){
  const defaultOpt = document.createElement('option');
  defaultOpt.text = 'Select example...';
  defaultOpt.value = '';
  examplesSelect.add(defaultOpt);
  for (const key of Object.keys(EXAMPLES)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.text = key;
    examplesSelect.add(opt);
  }
})();

// Theme
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('stateless_theme', theme);
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
}
(function initTheme(){
  const saved = localStorage.getItem('stateless_theme') || 'dark';
  applyTheme(saved);
})();

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// Autosave
function startAutosave() {
  if (autosaveIntervalId) return;
  autosaveStatus.textContent = 'Autosave: on';
  autosaveIntervalId = setInterval(() => {
    localStorage.setItem('stateless_code', codeEl.value);
    // show a brief flash
    autosaveStatus.style.opacity = '0.6';
    setTimeout(()=> autosaveStatus.style.opacity = '1', 200);
  }, 3000);
}
function stopAutosave() {
  if (!autosaveIntervalId) return;
  clearInterval(autosaveIntervalId);
  autosaveIntervalId = null;
  autosaveStatus.textContent = 'Autosave: off';
}
(function restoreCode(){
  const saved = localStorage.getItem('stateless_code');
  if (saved) {
    codeEl.value = saved;
    startAutosave();
  } else {
    autosaveStatus.textContent = 'Autosave: idle';
  }
})();

// Pyodide readiness and UI enable
pyodideReadyPromise.then(() => {
  statusEl.textContent = "stateless ready";
  outputEl.textContent = "stateless ready. Enter Python and press Run (Ctrl/Cmd+Enter).";
  if (runBtn) runBtn.disabled = false;
}).catch((err) => {
  statusEl.textContent = "Failed to load runtime";
  outputEl.textContent = "Failed to load runtime: " + err;
});

// Run code with stdout/stderr capture
async function runCode() {
  const code = codeEl.value;
  outputEl.textContent = "Running...";
  runBtn.disabled = true;
  statusEl.textContent = "Running...";
  let pyodide = await pyodideReadyPromise;

  try {
    const wrapped = `import sys, traceback\nfrom io import StringIO\n_out = StringIO()\n_err = StringIO()\n_old_out, _old_err = sys.stdout, sys.stderr\nsys.stdout, sys.stderr = _out, _err\n_result = None\ntry:\n${code.split('\n').map(line => '    ' + line).join('\n')}\nexcept SystemExit as e:\n    _result = f"SystemExit: ${e}"\nexcept Exception:\n    _err.write(traceback.format_exc())\nfinally:\n    sys.stdout, sys.stderr = _old_out, _old_err\n_out_val = _out.getvalue()\n_err_val = _err.getvalue()\nif _err_val:\n    _print_out = _err_val\nelif _out_val:\n    _print_out = _out_val\nelif _result is not None:\n    _print_out = str(_result)\nelse:\n    _print_out = ''\n_print_out`;

    const result = await pyodide.runPythonAsync(wrapped);
    outputEl.textContent = (typeof result === 'string') ? result : String(result);
  } catch (err) {
    outputEl.textContent = String(err);
  } finally {
    runBtn.disabled = false;
    statusEl.textContent = "stateless ready";
  }
}

// Keyboard shortcut: Ctrl/Cmd+Enter runs code
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    runCode();
  }
});

// File helpers
function clearOutput() { outputEl.textContent = ""; }
function clearCode() { codeEl.value = ""; localStorage.removeItem('stateless_code'); stopAutosave(); autosaveStatus.textContent = 'Autosave: off'; }

function downloadScript() {
  const code = codeEl.value;
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
    codeEl.value = e.target.result;
    startAutosave();
  };
  reader.readAsText(file);
}

function loadExample(event) {
  const key = event.target.value;
  if (!key) return;
  codeEl.value = EXAMPLES[key] || '';
  startAutosave();
}

// Copy output
function copyOutput() {
  const text = outputEl.textContent || '';
  navigator.clipboard?.writeText(text).then(()=> {
    statusEl.textContent = 'Output copied';
    setTimeout(()=> statusEl.textContent = 'stateless ready', 1200);
  }).catch(()=> {
    alert('Copy failed — your browser may block clipboard access.');
  });
}

// Download JSON from pyodide FS
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

// Expose a few functions for inline onclick handlers
window.runCode = runCode;
window.clearOutput = clearOutput;
window.clearCode = clearCode;
window.downloadScript = downloadScript;
window.loadScript = loadScript;
window.downloadJSONFile = downloadJSONFile;
window.loadExample = loadExample;
window.copyOutput = copyOutput;
window.toggleTheme = toggleTheme;
