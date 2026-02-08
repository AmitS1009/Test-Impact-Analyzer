const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);

function getArg(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}

const commit = getArg("--commit");
const repo = getArg("--repo");

if (!commit || !repo) {
  console.log("Usage: node index.js --commit <sha> --repo <path>");
  process.exit(1);
}

function run(cmd, cwd) {
  return execSync(cmd, { cwd, encoding: "utf8", shell: true });
}

// get git diff
const diff = run(`git show ${commit}`, repo);

// changed files
const fileRegex = /^diff --git a\/(.+?) b\/(.+)$/gm;
let m;
const changedFiles = [];

while ((m = fileRegex.exec(diff))) {
  changedFiles.push(m[2]);
}

// extract tests from file
function extractTests(file) {
  if (!fs.existsSync(file)) return [];
  const txt = fs.readFileSync(file, "utf8");
  const r = /test\(["'`](.+?)["'`]/g;
  const out = [];
  let x;
  while ((x = r.exec(txt))) out.push(x[1]);
  return out;
}

// added / removed tests
const added = diff.split("\n").filter(l => l.startsWith("+") && l.includes("test("));
const removed = diff.split("\n").filter(l => l.startsWith("-") && l.includes("test("));

const addedTests = added.map(l => l.match(/test\(["'`](.+?)["'`]/)?.[1]).filter(Boolean);
const removedTests = removed.map(l => l.match(/test\(["'`](.+?)["'`]/)?.[1]).filter(Boolean);

console.log("\n=== IMPACT REPORT ===\n");

// ADDED
addedTests.forEach(t => console.log("ADDED:", t));

// REMOVED
removedTests.forEach(t => console.log("REMOVED:", t));

// MODIFIED direct specs
changedFiles
  .filter(f => f.includes(".spec."))
  .forEach(f => {
    const full = path.join(repo, f);
    extractTests(full).forEach(t => {
      if (!addedTests.includes(t) && !removedTests.includes(t)) {
        console.log("MODIFIED:", t);
      }
    });
  });


  
const helperChanged = changedFiles.some(f => !f.includes(".spec."));

if (helperChanged) {
  console.log("\nHELPER FILE CHANGED — marking all tests as impacted:\n");

  function walk(dir) {
    let results = [];
    fs.readdirSync(dir).forEach(file => {
      const full = path.join(dir, file);
      if (fs.statSync(full).isDirectory()) results = results.concat(walk(full));
      else if (file.endsWith(".spec.ts")) results.push(full);
    });
    return results;
  }

  const specs = walk(path.join(repo, "tests"));

  specs.forEach(f => {
    extractTests(f).forEach(t => console.log("MODIFIED:", t));
  });
}

