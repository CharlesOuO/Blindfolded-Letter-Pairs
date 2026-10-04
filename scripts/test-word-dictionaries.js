const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const stored = new Map([['bld_custom_dict_v3', JSON.stringify({ ab: 'corner word' })]]);
const context = vm.createContext({
    window: {},
    localStorage: {
        getItem: key => stored.get(key) ?? null,
        setItem: (key, value) => stored.set(key, value),
        removeItem: key => stored.delete(key)
    },
    setTimeout, clearTimeout
});
vm.runInContext(fs.readFileSync('script.js', 'utf8'), context);
const run = code => vm.runInContext(code, context);
assert.equal(run("getPairContentValue('ab', 'word')"), 'corner word');
assert.equal(run("getPairContentValue('ab', 'edge-word')"), '');
run("saveContentDict('edge-word', {ab: 'edge word'})");
assert.equal(run("getPairContentValue('ab', 'word')"), 'corner word');
assert.equal(run("getPairContentValue('ab', 'edge-word')"), 'edge word');
run("saveStatusData('ab', {color: 'green'}, 'edge-word')");
assert.equal(run("getPairColor('ab', 'word')"), '');
assert.equal(run("getPairColor('ab', 'edge-word')"), 'green');
run("currentAlgorithmType = 'edge'");
assert.equal(run('getCurrentListContentMode()'), 'edge-word');
assert.equal(run("getCurrentListContentMode('formula')"), 'edge');
run("currentMemoryPieceType = 'edge'");
assert.equal(run("formatMemoryAnswer('ab', getSelectedMemoryContentModes())"), 'edge word');
run("currentMemoryPieceType = 'corner'");
assert.equal(run("formatMemoryAnswer('ab', getSelectedMemoryContentModes())"), 'corner word');
assert.equal(run("Object.keys(normalizeBackupPayload({dict: {ab:'legacy'}}).edgeWordDict).length"), 0);
assert.equal(run("normalizeBackupPayload({dict: {ab:'legacy'}}).dict.ab"), 'legacy');
assert.equal(run("normalizeBackupPayload({sections: {letterPairs: {word: {ab:'corner'}, edgeWord: {ab:'edge'}}}}).edgeWordDict.ab"), 'edge');
const display = {innerText: ''};
context.document = {getElementById: id => id === 'trainer-scramble' ? display : null};
run("chars = [...CHARS_EN]; currentTrainerContentGroup = 'word'; currentTrainerAlgorithmType = 'edge'; setTrainerScrambleDisplay('R U', 'ab')");
assert.match(display.innerText, /edge word/);
run("currentTrainerAlgorithmType = 'corner'; setTrainerScrambleDisplay('R U', 'ab')");
assert.match(display.innerText, /corner word/);
run('clearAppStorageData()');
assert.equal(stored.has('bld_word_edge_dict_v1'), false);
console.log('Word dictionary checks passed.');
