// Each face follows Speffz clockwise order: corners TL, TR, BR, BL;
// edges top, right, bottom, left. Face order is U, L, F, R, B, D.
const LETTERING_KEY = 'bld_lettering_schemes_v1';
let letteringState = null;
let letteringDraft = null;

function validateLetteringScheme(value) {
    if (!Array.isArray(value) || value.length !== 24) return null;
    const labels = value.map(label => typeof label === 'string' ? label.trim().toLowerCase() : '');
    return labels.every(label => [...label].length === 1) && new Set(labels).size === 24 ? labels : null;
}

function sanitizeLetteringState(value) {
    if (!value || !['zh', 'en', 'custom'].includes(value.selected)) return null;
    const result = { selected: value.selected, active: {}, custom: {} };
    for (const type of ['corner', 'edge']) {
        result.active[type] = validateLetteringScheme(value.active?.[type]);
        result.custom[type] = validateLetteringScheme(value.custom?.[type]);
        if (!result.active[type] || !result.custom[type]) return null;
    }
    return result;
}

function ensureLetteringState() {
    if (letteringState) return letteringState;
    letteringState = sanitizeLetteringState(readStoredJson(LETTERING_KEY, null));
    if (!letteringState) {
        const active = validateLetteringScheme(chars) || [...CHARS_ZH];
        const custom = validateLetteringScheme(getSavedCustomChars()) || [...active];
        letteringState = {
            selected: isSameCharScheme(active, CHARS_EN) ? 'en' : isSameCharScheme(active, CHARS_ZH) ? 'zh' : 'custom',
            active: { corner: [...active], edge: [...active] },
            custom: { corner: [...custom], edge: [...custom] }
        };
    }
    return letteringState;
}

function getPieceChars(type = 'corner') {
    const state = ensureLetteringState();
    return state.active[type === 'edge' || type === 'edge-word' ? 'edge' : 'corner'];
}

function saveLetteringState() {
    localStorage.setItem(LETTERING_KEY, JSON.stringify(letteringState));
    chars = [...letteringState.active.corner];
    localStorage.setItem(CHARS_KEY, JSON.stringify(chars));
    localStorage.setItem(CUSTOM_CHARS_KEY, JSON.stringify(letteringState.custom.corner));
}

function remapLetteringData(type, oldLabels, newLabels) {
    const remap = pair => {
        for (let i = 0; i < oldLabels.length; i++) {
            if (!pair.startsWith(oldLabels[i])) continue;
            const j = oldLabels.indexOf(pair.slice(oldLabels[i].length));
            if (j >= 0) return newLabels[i] + newLabels[j];
        }
        return pair;
    };
    for (const mode of [type, type === 'edge' ? 'edge-word' : 'word']) {
        for (const key of [getContentStorageKey(mode), getStatusStorageKey(mode)]) {
            const map = readStoredJson(key, {});
            const next = {};
            Object.entries(map).forEach(([pair, value]) => { next[remap(pair)] = value; });
            localStorage.setItem(key, JSON.stringify(next));
        }
    }
    trainerRecords = trainerRecords.map(record => record.algorithmType === type ? { ...record, pair: remap(record.pair) } : record);
}

function applyLetteringScheme(scheme) {
    savePairDataDebounced.flush();
    const state = ensureLetteringState();
    for (const type of ['corner', 'edge']) {
        const next = scheme === 'custom' ? [...state.custom[type]] : [...(scheme === 'en' ? CHARS_EN : CHARS_ZH)];
        remapLetteringData(type, state.active[type], next);
        state.active[type] = next;
    }
    state.selected = scheme;
    saveLetteringState();
    localStorage.setItem(TRAINER_RECORDS_KEY, JSON.stringify(trainerRecords));
    resetTrainerScrambleNavigation();
    currentTrainerPair = null;
    currentTrainerScramble = '';
    recentMemPairs = [];
    lastMemPair = null;
    initUI();
    applyLanguage();
    updateLayoutMode();
    renderCurrentListView();
    renderLetteringNet();
    generateTrainerScramble({ silent: true, resetTimerDisplay: true });
    if (currentTab === 'memory') nextMemoryCard();
}

function letteringText(zh, en) { return currentLang === 'en' ? en : zh; }

function renderLetteringNet() {
    const container = document.getElementById('lettering-net-editor');
    if (!container) return;
    const state = ensureLetteringState();
    const displayed = state.selected === 'custom' ? state.custom : state.active;
    letteringDraft = { corner: [...displayed.corner], edge: [...displayed.edge] };
    container.replaceChildren();
    const hint = document.createElement('p');
    hint.className = 'mode-hint';
    hint.textContent = letteringText('角格＝Corners、邊格＝Edges。每套需有 24 個不重複的單字元；填寫後按「套用自訂」。上黃、前綠。', 'Corner cells = Corners; side cells = Edges. Each set needs 24 unique single characters. Click Apply Custom to save. Yellow top, green front.');
    container.appendChild(hint);
    const net = document.createElement('div');
    net.className = 'lettering-cube-net';
    const faces = [ ['U', 2, 1, '#ffe435'], ['L', 1, 2, '#f56c68'], ['F', 2, 2, '#65cf78'], ['R', 3, 2, '#ffb449'], ['B', 4, 2, '#62b4f3'], ['D', 2, 3, '#f8fafc'] ];
    const corners = { 0: 0, 2: 1, 8: 2, 6: 3 };
    const edges = { 1: 0, 5: 1, 7: 2, 3: 3 };
    faces.forEach(([face, column, row, color], faceIndex) => {
        const grid = document.createElement('div');
        grid.className = 'lettering-cube-face';
        grid.style.gridColumn = column;
        grid.style.gridRow = row;
        grid.style.backgroundColor = color;
        for (let cell = 0; cell < 9; cell++) {
            if (cell === 4) {
                const center = document.createElement('span');
                center.className = 'lettering-cube-center';
                center.textContent = face;
                grid.appendChild(center);
                continue;
            }
            const type = cell in corners ? 'corner' : 'edge';
            const index = faceIndex * 4 + (type === 'corner' ? corners[cell] : edges[cell]);
            const input = document.createElement('input');
            input.className = 'lettering-sticker';
            input.value = letteringDraft[type][index].toUpperCase();
            input.autocomplete = 'off';
            input.spellcheck = false;
            input.setAttribute('aria-label', `${type === 'corner' ? 'Corners' : 'Edges'} ${BUFFER_STICKER_NAMES[type][index]}`);
            input.dataset.piece = type;
            input.dataset.index = index;
            input.addEventListener('input', () => { letteringDraft[type][index] = input.value.trim().toLowerCase(); });
            grid.appendChild(input);
        }
        net.appendChild(grid);
    });
    container.appendChild(net);
    const button = document.createElement('button');
    button.className = 'action-btn';
    button.textContent = letteringText('套用自訂', 'Apply Custom');
    button.onclick = () => {
        const corner = validateLetteringScheme(letteringDraft.corner);
        const edge = validateLetteringScheme(letteringDraft.edge);
        if (!corner || !edge) {
            alert(letteringText('Corners 和 Edges 各需 24 個不重複的單字元，不能留空。', 'Corners and Edges each need 24 unique single characters, with no empty cells.'));
            return;
        }
        state.custom = { corner, edge };
        applyLetteringScheme('custom');
    };
    container.appendChild(button);
}
