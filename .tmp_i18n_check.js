const fs = require('fs');
const html = fs.readFileSync('index.html','utf8');
const js = fs.readFileSync('script.js','utf8');

const i18nKeys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]);
const tKeys = [...js.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
const used = [...new Set([...i18nKeys, ...tKeys])].sort();

const start = js.indexOf("const translations = {");
const end = js.indexOf("Object.assign(translations['zh-TW']", start);
const block = js.slice(start, end);

const zhMatch = block.match(/'zh-TW'\s*:\s*\{([\s\S]*?)\n\s*\},\s*'en'\s*:/);
const enMatch = block.match(/'en'\s*:\s*\{([\s\S]*?)\n\s*\}\s*\n\s*\};/);

function dictKeys(dictBlock) {
  return [...dictBlock.matchAll(/\n\s*([a-zA-Z0-9_]+)\s*:/g)].map(m => m[1]);
}

const zhKeys = new Set(dictKeys(zhMatch ? zhMatch[1] : ''));
const enKeys = new Set(dictKeys(enMatch ? enMatch[1] : ''));

const missingZh = used.filter(k => !zhKeys.has(k));
const missingEn = used.filter(k => !enKeys.has(k));

console.log('USED:', used.length);
console.log('MISSING_ZH:', missingZh.length);
if (missingZh.length) console.log(missingZh.join('\n'));
console.log('MISSING_EN:', missingEn.length);
if (missingEn.length) console.log(missingEn.join('\n'));
