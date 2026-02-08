# Test Impact Analyzer (Playwright)

A small CLI tool that reports which Playwright tests are impacted by a given git commit.

This was built as a fast MVP to answer:

> Given a commit SHA, which tests were added / removed / modified — so we can run only impacted tests instead of the full suite.

---

## High-Level Approach

1. Use `git show <sha>` to get the commit diff.
2. Parse changed files from the diff.
3. Detect added / removed tests by matching `test("...")` lines in the diff.
4. For changed `.spec.ts` files, re-scan the file to extract current test names and mark them as `MODIFIED`.
5. If any non-`.spec.ts` file changes (helper / page objects / utilities), I conservatively mark **all tests** as impacted.

This is intentionally coarse for helper changes, but guarantees we don’t miss regressions.

---

## Usage

### Install dependencies

```bash
npm install
````

### Run

```bash
node index.js --commit <commit-sha> --repo <path-to-flash-tests>
```

Example (Windows):

```bash
node index.js --commit 45433fd --repo D:\ML\Projects\AI_assignment\assignment\flash-tests
```

Output:

```
=== IMPACT REPORT ===

HELPER FILE CHANGED — marking all tests as impacted:

MODIFIED: clicking on failed test opens test run
MODIFIED: create new api key and make API request
...
```

---

## Output Semantics

* `ADDED` — New test introduced in this commit
* `REMOVED` — Test deleted in this commit
* `MODIFIED` — Test body changed OR indirectly impacted via helper change

---

## Design Tradeoffs

* Test detection is regex-based (`test("...")`) instead of AST parsing for speed.
* Helper dependency tracking is conservative: if any helper changes, all tests are marked impacted.
* This avoids false negatives at the cost of false positives.
* The goal here is fast iteration and safety, not perfect precision.

With more time, I would:

* Build a TypeScript AST graph for accurate helper → test mapping
* Track imports to reduce false positives
* Add JSON output mode
* Add unit tests

---

## Limitations

* Regex-based parsing
* No deep dependency graph
* Helper changes mark all tests
* Tested primarily on Windows + PowerShell

---

## AI Usage Disclosure

I heavily used ChatGPT during development to:

* Rapidly prototype the initial CLI
* Debug Windows-specific issues (git + shell execution)
* Iterate on regex logic
* Refine README and documentation

All architectural decisions, debugging steps, and tradeoffs were made consciously by me and are explained in the Loom video.

---

## Why This Approach

The intent was to ship a working MVP quickly, demonstrate engineering judgment, and explicitly call out limitations — similar to how real-world infra tooling evolves.

This mirrors how I would approach this problem in production: start conservative, ship early, then incrementally improve accuracy.

