const fs = require("node:fs");
const path = require("node:path");

const projectRoot = process.cwd();
const webDir = path.join(projectRoot, "www");

const filesToCopy = [
  "index.html",
  "style.css",
  "script.js",
  "built-in-algorithms.js",
  "manifest.webmanifest",
  "service-worker.js",
  "cornerManmade.json",
  "edgeManmade.json"
];

fs.mkdirSync(webDir, { recursive: true });

for (const relPath of filesToCopy) {
  const sourcePath = path.join(projectRoot, relPath);
  const targetPath = path.join(webDir, relPath);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing required file: ${relPath}`);
  }

  fs.copyFileSync(sourcePath, targetPath);
}

const dirsToCopy = ["icons"];

for (const relPath of dirsToCopy) {
  const sourcePath = path.join(projectRoot, relPath);
  const targetPath = path.join(webDir, relPath);

  if (!fs.existsSync(sourcePath)) {
    throw new Error("Missing required directory: " + relPath);
  }

  fs.cpSync(sourcePath, targetPath, { recursive: true, force: true });
}

console.log("Prepared " + filesToCopy.length + " files and " + dirsToCopy.length + " directories into " + webDir);
