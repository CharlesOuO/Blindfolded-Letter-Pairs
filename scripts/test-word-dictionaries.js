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
vm.runInContext(fs.readFileSync('lettering.js', 'utf8'), context);
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

run('letteringState = null; chars = [...CHARS_EN]; ensureLetteringState()');
assert.equal(run("validateLetteringScheme(Array(24).fill('a'))"), null);
assert.equal(run("validateLetteringScheme(CHARS_EN).length"), 24);
run("saveContentDict('word', {ab:'corner'}); saveContentDict('edge-word', {ab:'edge'}); saveStatusData('ab', {color:'green'}, 'edge-word')");
run("const reversed = [...CHARS_EN].reverse(); remapLetteringData('edge', getPieceChars('edge'), reversed); letteringState.active.edge = reversed; letteringState.custom.edge = [...reversed]; letteringState.selected = 'custom'; saveLetteringState()");
assert.equal(run("getPairContentValue('xw','edge-word')"), 'edge');
assert.equal(run("getPairContentValue('ab','word')"), 'corner');
assert.equal(run("getPairColor('xw','edge-word')"), 'green');
assert.equal(run("JSON.stringify(getPairIndices('xw', 'edge'))"), '[0,1]');
assert.equal(run("JSON.stringify(getPairIndices('ab', 'corner'))"), '[0,1]');
assert.equal(run("normalizeBackupPayload({sections:{settings:{lettering:ensureLetteringState()}}}).lettering.active.edge[0]"), 'x');
console.log('Word dictionary and independent lettering checks passed.');
