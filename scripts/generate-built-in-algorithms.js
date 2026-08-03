const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const outputPath = path.join(projectRoot, "built-in-algorithms.js");

// Each string maps Speffz A-X indices to BLDDB's canonical (Chichu) code.
// Additional strings are the other stickers on the same physical piece.
const orientationCodes = {
  corner: [
    "DGJAECMQBLYNKISZHFPTWXRO",
    "EHKBFANOCJZWLGTXIDQRMYSP",
    "FILCDBWPAKXMJHRYGEOSNZTQ"
  ],
  edge: [
    "EGACDTLXBQJSHZPRFWNYIOMK",
    "FHBDCSKWARITGYOQEXMZJPNL"
  ]
};

function selectHighestRankedCommutator(rows) {
  if (!Array.isArray(rows)) return "";

  for (const row of rows) {
    const commutators = Array.isArray(row?.[2]) ? row[2] : [];
    for (const value of commutators) {
      const algorithm = String(value || "").trim();
      if (algorithm && !/^not found\.?$/i.test(algorithm)) return algorithm;
    }
  }

  return "";
}

function buildCaseMap(type) {
  const inputPath = path.join(projectRoot, `${type}Manmade.json`);
  const source = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const result = {};

  for (const [caseCode, rows] of Object.entries(source)) {
    const algorithm = selectHighestRankedCommutator(rows);
    if (algorithm) result[caseCode] = algorithm;
  }

  return result;
}

const payload = {
  source: {
    name: "BLDDB",
    homepage: "https://blddb.net/",
    datasetDate: "2026-08-02",
    defaultBufferSpeffz: {
      corner: "C",
      edge: "C"
    },
    notation: "commutator-first",
    notes: {
      corner: "Derived from BLDDB v2 cornerManmade.json. Supports every Speffz sticker buffer and selects the highest-ranked available commutator for each canonical case.",
      edge: "Derived from BLDDB v2 edgeManmade.json. Supports every Speffz sticker buffer and selects the highest-ranked available commutator for each canonical case."
    }
  },
  orientationCodes,
  corner: buildCaseMap("corner"),
  edge: buildCaseMap("edge")
};

fs.writeFileSync(
  outputPath,
  `window.BUILT_IN_ALGORITHMS = ${JSON.stringify(payload, null, 2)};\n`,
  "utf8"
);

console.log(
  `Generated ${Object.keys(payload.corner).length} corner and ${Object.keys(payload.edge).length} edge cases.`
);
