StatelessPy

A browser-based Python execution environment with no implicit state

StatelessPy allows you to write, evaluate, and export Python code directly in the browser.
No installation. No backend. No persistent runtime.

It is designed for environments where a modern browser is available, but native Python tooling is not.

👉 Live Demo: (GitHub Pages link here)

Overview

StatelessPy is a client-side execution environment built on Pyodide (WebAssembly).
All code runs locally in the browser under explicit constraints.

There is no hidden persistence, no background services, and no assumed continuity between runs.
State exists only when the user chooses to export it.

Key Characteristics

Zero install — runs entirely in the browser

Client-side execution — no servers, no network dependency after load

Stateless by default — no implicit memory between evaluations

Explicit persistence — code and results are saved only on user action

Cross-platform — works on desktop and mobile browsers

How It Works

Python code is executed in a WebAssembly sandbox via Pyodide

A virtual filesystem is used for transient file operations

Outputs are rendered as projections of execution, not retained system state

Exported files are the only durable artifacts

All computation and data remain local to the client.

Design Model

StatelessPy follows a simple, explicit lifecycle:

State — code exists as editable input

Evaluation — execution occurs under bounded conditions

Projection — results are displayed without implying persistence

No evaluation mutates the environment beyond its scope.
No projection claims to represent full system state.

This model prioritizes clarity, trust, and predictable behavior.

Use Cases

Running Python on devices without native tooling

Teaching or experimenting without setup overhead

Inspecting scripts in constrained or ephemeral environments

Lightweight analysis where persistence is optional, not assumed

Limitations

Performance is constrained by browser and device resources

Not intended for long-running or production workloads

No background execution or multi-session state

These constraints are intentional.
