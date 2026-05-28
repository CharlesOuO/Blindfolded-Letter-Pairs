const fs = require("node:fs");
const path = require("node:path");

const projectRoot = process.cwd();
const webDir = path.join(projectRoot, "www");

const filesToCopy = [
  "index.html",
  "style.css",
  "script.js",
  "built-in-algorithms.js",
  "cornerManmade.json",
  "edgeManmade.json"
];

if (fs.existsSync(webDir)) {
  fs.rmSync(webDir, { recursive: true, force: true });
}

fs.mkdirSync(webDir, { recursive: true });

for (const relPath of filesToCopy) {
  const sourcePath = path.join(projectRoot, relPath);
  const targetPath = path.join(webDir, relPath);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing required file: ${relPath}`);
  }

  fs.copyFileSync(sourcePath, targetPath);
}

console.log(`Prepared ${filesToCopy.length} files into ${webDir}`);
