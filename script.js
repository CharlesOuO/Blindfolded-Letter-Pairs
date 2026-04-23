const CHARS_ZH = ['ㄅ', 'ㄆ', 'ㄇ', 'ㄈ', 'ㄉ', 'ㄊ', 'ㄋ', 'ㄌ', 'ㄍ', 'ㄎ', 'ㄏ', 'ㄐ', 'ㄑ', 'ㄒ', 'ㄓ', 'ㄔ', 'ㄕ', 'ㄖ', 'ㄗ', 'ㄘ', 'ㄙ', 'ㄧ', 'ㄨ', 'ㄩ'];
const CHARS_EN = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x'];
let chars = [...CHARS_ZH];

const STORAGE_KEY = 'bld_custom_dict_v3';
const FORMULA_STORAGE_KEY = 'bld_formula_dict_v1';
const STATUS_KEY = 'bld_status_v1';
const FORMULA_STATUS_KEY = 'bld_formula_status_v1';
const LANG_KEY = 'bld_lang_v1';
const CHARS_KEY = 'bld_chars_v1';

let currentPair = null;
let isMemAnswerShown = false;
let testStartTime = 0;
let isWaitingTestNext = true;
let timerInterval = null;
let lastMemPair = null;
let lastTestPair = null;
let currentLang = localStorage.getItem(LANG_KEY) || 'zh-TW';
let isMatrixMode = false;
let currentListViewMode = 'list';
let currentMemoryContentModes = ['word'];

// --- [新增] 矩陣模式目前選中的配對 ---
let currentMatrixPair = null;
let selectedMatrixPairs = new Set();

// --- 優化工具: 防抖函數 (Debounce) ---
const debounce = (fn, delay = 500) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
};

const savePairDataDebounced = debounce((pair, value, contentMode = 'word') => {
    const d = getContentDict(contentMode);
    d[pair] = value.trim();
    saveContentDict(contentMode, d);
}, 500);

const translations = {
    'zh-TW': {
        nav_list: "列表輸入", nav_mem: "記憶翻牌", nav_test: "打字測驗", nav_data: "資料備份",
        lbl_start_char: "開頭代碼：", btn_reset_color: "重置熟悉度：",
        lbl_range: "選擇範圍：", lbl_test_range: "測驗範圍：", btn_next: "下一題 (Space)", btn_start_test: "開始測驗 (Space)",
        btn_submit: "提交 (Enter)", ph_input: "輸入後按 Enter",
        title_backup: "資料備份與還原", lbl_select_file: "匯入檔案：", btn_import: "確認匯入", btn_clear_all: "清空所有資料",
        opt_json: "系統備份檔 (.json)", opt_csv: "Excel 表格 (.csv)", btn_export_exec: "匯出資料",
        hint_matrix_edit: "提示：點擊表頭可修改代碼",
        btn_reset_chars: "回復預設", mode_card: "列表模式", mode_matrix: "表格模式", btn_same: "同",
        alert_chars_empty: "輸入不能為空！", alert_reset: "確定重置？", alert_reset_done: "已重置",
        opt_start: " 開頭", sel_full: "全選", sel_none: "未選擇", sel_count: "已選 {n} 個", sel_prefix: "SEL: ",
        hint_click_flip: "點擊卡片翻牌", fb_empty: "空白跳過", fb_wrong: "不熟", fb_slow: "猶豫", fb_good: "熟練",
        ans_prefix: "答案：", alert_no_data: "請先輸入資料！", alert_sel_range: "請選擇範圍", alert_import_success: "匯入成功", alert_import_error: "格式錯誤",
        lbl_start: "開頭：", lbl_end: "結尾：",
        btn_hide: "隱藏", lbl_edit_mode: "編輯模式", btn_reset_all: "全部"
    },
    'en': {
        nav_list: "List Input", nav_mem: "Flashcards", nav_test: "Typing Test", nav_data: "Backup",
        lbl_start_char: "Start Code:", btn_reset_color: "Reset familiarity:",
        lbl_range: "Select Range:", lbl_test_range: "Test Range:", btn_next: "Next (Space)", btn_start_test: "Start Test (Space)",
        btn_submit: "Submit (Enter)", ph_input: "Type & Enter",
        title_backup: "Backup & Restore", lbl_select_file: "Import File:", btn_import: "Import", btn_clear_all: "Clear All Data",
        opt_json: "Backup File (.json)", opt_csv: "Excel Table (.csv)", btn_export_exec: "Export Data",
        hint_matrix_edit: "Click header to edit code",
        btn_reset_chars: "Reset Default", mode_card: "List Mode", mode_matrix: "Table Mode", btn_same: "Same",
        alert_chars_empty: "Cannot be empty!", alert_reset: "Are you sure?", alert_reset_done: "Reset done.",
        opt_start: " Start", sel_full: "ALL", sel_none: "NONE", sel_count: "{n} selected", sel_prefix: "SEL: ",
        hint_click_flip: "Click to flip", fb_empty: "Skipped", fb_wrong: "Hard", fb_slow: "Slow", fb_good: "Good",
        ans_prefix: "Ans: ", alert_no_data: "No data!", alert_sel_range: "Select range", alert_import_success: "Success", alert_import_error: "Error",
        lbl_start: "Start:", lbl_end: "End:",
        btn_hide: "Hide", lbl_edit_mode: "Edit Mode", btn_reset_all: "All"
    }
};

Object.assign(translations['zh-TW'], {
    mode_formula: "\u516c\u5f0f\u6a21\u5f0f",
    mode_formula_matrix: "\u516c\u5f0f\u8868\u683c",
    group_words: "\u5b57\u8a5e",
    group_formula: "\u516c\u5f0f",
    switch_layout: "\u7248\u578b",
    switch_content: "\u5167\u5bb9",
    switch_list: "\u5217\u8868",
    switch_matrix: "\u8868\u683c",
    switch_words: "\u5b57\u8a5e",
    switch_algorithm: "\u516c\u5f0f",
    content_word_label: "\u5b57\u8a5e",
    content_formula_label: "\u516c\u5f0f",
    study_word_mode: "\u5b57\u8a5e\u6a21\u5f0f",
    study_formula_mode: "\u516c\u5f0f\u6a21\u5f0f",
    ph_formula: "\u8f38\u5165\u516c\u5f0f",
    hint_formula_edit: "\u53ef\u5728\u9019\u88e1\u70ba\u6bcf\u7d44 letter pair \u8f38\u5165\u516c\u5f0f\uff0cFlashcards \u53ef\u5207\u63db\u6210\u516c\u5f0f\u6a21\u5f0f\u7df4\u7fd2",
    alert_no_formula_data: "\u76ee\u524d\u9078\u53d6\u7bc4\u570d\u6c92\u6709\u516c\u5f0f\u8cc7\u6599\uff01",
    alert_select_matrix_cells: "\u8acb\u5148\u9ede\u9078\u77e9\u9663\u4e2d\u7684\u683c\u5b50\uff01",
    msg_matrix_updated: "\u5df2\u66f4\u65b0\uff01",
    confirm_switch_chars_en: "\u8981\u4e00\u8d77\u5207\u63db\u6210 English a-x \u4ee3\u78bc\u55ce\uff1f",
    confirm_switch_chars_zh: "\u8981\u5207\u56de\u6ce8\u97f3\u4ee3\u78bc\u55ce\uff1f",
    btn_toggle_lang: "English / \u4e2d\u6587",
    page_title: "Letter Pairs \u7df4\u7fd2 (SM-2)",
    sel_prefix: "\u5df2\u9078\uff1a"
});

Object.assign(translations.en, {
    mode_formula: "Formula Mode",
    mode_formula_matrix: "Formula Table",
    group_words: "Words",
    group_formula: "Formula",
    switch_layout: "Layout",
    switch_content: "Content",
    switch_list: "List",
    switch_matrix: "Table",
    switch_words: "Words",
    switch_algorithm: "Algorithm",
    content_word_label: "Word",
    content_formula_label: "Formula",
    study_word_mode: "Word Mode",
    study_formula_mode: "Formula Mode",
    ph_formula: "Enter formula",
    hint_formula_edit: "Edit algorithms or formulas for the selected start code. Flashcards can switch to Formula Mode.",
    alert_no_formula_data: "No formula data in this range!",
    alert_select_matrix_cells: "Please select matrix cells first!",
    msg_matrix_updated: "Updated!",
    confirm_switch_chars_en: "Also switch to English a-x codes?",
    confirm_switch_chars_zh: "Switch back to Zhuyin codes as well?",
    btn_toggle_lang: "\u4e2d\u6587 / English",
    page_title: "Letter Pairs Practice (SM-2)"
});

const SM2_SETTINGS = { defaultEf: 2.5, minEf: 1.3, intervals: [1, 3] };

function calculateNextReview(currentData, grade) {
    let card = (typeof currentData === 'object' && currentData !== null) ? currentData : {
        interval: 0, repetition: 0, ef: SM2_SETTINGS.defaultEf, dueDate: 0, color: 'red'
    };
    let nextInterval, nextRepetition, nextEf;
    if (grade < 3) {
        nextRepetition = 0; nextInterval = 1; nextEf = Math.max(SM2_SETTINGS.minEf, card.ef - 0.2);
    } else {
        nextRepetition = card.repetition + 1;
        nextEf = card.ef + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
        if (nextEf < SM2_SETTINGS.minEf) nextEf = SM2_SETTINGS.minEf;
        if (nextRepetition === 1) nextInterval = SM2_SETTINGS.intervals[0];
        else if (nextRepetition === 2) nextInterval = SM2_SETTINGS.intervals[1];
        else nextInterval = Math.round(card.interval * nextEf);
    }
    const nextDueDate = Date.now() + (nextInterval * 24 * 60 * 60 * 1000);
    let nextColor = grade >= 4 ? 'green' : (grade === 3 ? 'yellow' : 'red');
    return { interval: nextInterval, repetition: nextRepetition, ef: nextEf, dueDate: nextDueDate, color: nextColor };
}

function getStatusMap(contentMode = 'word') {
    const statusKey = contentMode === 'formula' ? FORMULA_STATUS_KEY : STATUS_KEY;
    return JSON.parse(localStorage.getItem(statusKey)) || {};
}
function getPairData(pair, contentMode = 'word') {
    const map = getStatusMap(contentMode);
    let data = map[pair];
    if (typeof data === 'string') {
        return { interval: (data === 'green' ? 10 : 3), repetition: 1, ef: 2.5, dueDate: Date.now(), color: data };
    }
    return data || null;
}
function saveStatusData(pair, dataObject, contentMode = 'word') {
    const map = getStatusMap(contentMode);
    const statusKey = contentMode === 'formula' ? FORMULA_STATUS_KEY : STATUS_KEY;
    map[pair] = dataObject;
    localStorage.setItem(statusKey, JSON.stringify(map));
}
function getPairColor(pair, contentMode = 'word') { const data = getPairData(pair, contentMode); return data ? (data.color || 'red') : ''; }

function t(key, params = {}) { let str = translations[currentLang][key] || key; Object.keys(params).forEach(k => { str = str.replace(`{${k}}`, params[k]); }); return str; }
function getDict() { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
function saveDict(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function getFormulaDict() { return JSON.parse(localStorage.getItem(FORMULA_STORAGE_KEY)) || {}; }
function saveFormulaDict(d) { localStorage.setItem(FORMULA_STORAGE_KEY, JSON.stringify(d)); }
function getContentDict(contentMode = 'word') { return contentMode === 'formula' ? getFormulaDict() : getDict(); }
function saveContentDict(contentMode = 'word', dict) { return contentMode === 'formula' ? saveFormulaDict(dict) : saveDict(dict); }

function init() {
    const savedChars = localStorage.getItem(CHARS_KEY);
    if (savedChars) chars = JSON.parse(savedChars);
    initUI(); setupDynamicUI(); applyLanguage(); updateLayoutMode();
    setupEventListeners();
    updateMemoryContentModeButtons();
}

function setupEventListeners() {
    document.addEventListener('click', function (e) { if (!e.target.closest('.dropdown-wrapper')) { closeAllDropdowns(); } });

    const testInput = document.getElementById('test-input');
    testInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            checkTestAnswer();
        }
    });

    document.addEventListener('keydown', function (e) {
        const activeTab = document.querySelector('.view-section.active').id;
        if (e.code === 'Space' || e.key === 'Enter') {
            if (document.activeElement.tagName === 'INPUT' && !isWaitingTestNext && activeTab === 'view-test') return;
            if (document.activeElement.tagName === 'INPUT' && document.activeElement.id !== 'test-input') return;
            if (document.activeElement.tagName === 'TEXTAREA' && document.activeElement.id !== 'test-input') return;
            e.preventDefault(); triggerAction(activeTab);
        }
    });

    const listContainer = document.getElementById('grid-area');
    listContainer.addEventListener('input', (e) => {
        if (e.target.matches('.pair-input')) {
            const pair = e.target.dataset.pair;
            savePairDataDebounced(pair, e.target.value, e.target.dataset.store || 'word');
        }
    });

    const formulaContainer = document.getElementById('formula-area');
    formulaContainer.addEventListener('input', (e) => {
        if (e.target.matches('.formula-input')) {
            const pair = e.target.dataset.pair;
            savePairDataDebounced(pair, e.target.value, 'formula');
        }
    });

    const matrixContainer = document.getElementById('matrix-area');
    matrixContainer.addEventListener('input', (e) => {
        if (e.target.matches('.matrix-input')) {
            const pair = e.target.dataset.pair;
            savePairDataDebounced(pair, e.target.value, e.target.dataset.store || 'word');
        }
    });
    matrixContainer.addEventListener('focusin', (e) => {
        if (e.target.matches('.matrix-input')) {
            handleMatrixFocus(e.target);
        }
    });
    matrixContainer.addEventListener('focusout', (e) => {
        if (e.target.matches('.matrix-input')) {
            handleMatrixBlur();
        }
    });
    matrixContainer.addEventListener('click', (e) => {
        if (e.target.matches('.btn-diagonal-check')) {
            const pair = e.target.dataset.pair;
            const char = e.target.dataset.char;
            const contentMode = e.target.dataset.store || 'word';
            const input = e.target.previousElementSibling;
            const d = getContentDict(contentMode);
            d[pair] = char;
            saveContentDict(contentMode, d);
            input.value = char;
        } else if (e.target.matches('.matrix-input')) {
            const pair = e.target.dataset.pair;
            // 讓 currentMatrixPair 保持為最後一個點擊的，以便兼容舊邏輯（若有的話）
            currentMatrixPair = pair;
            const td = e.target.closest('td');
            toggleMatrixSelection(pair, td);
        }
    });
}

function updateLayoutMode() {
    if (chars.includes('A') || chars.includes('a')) { document.body.classList.remove('mode-zh'); document.body.classList.add('mode-en'); }
    else { document.body.classList.remove('mode-en'); document.body.classList.add('mode-zh'); }
}

function initUI() {
    const listSel = document.getElementById('char-select'); listSel.innerHTML = '';
    chars.forEach(c => { let opt1 = document.createElement('option'); opt1.value = c; opt1.innerText = `${c.toUpperCase()}`; listSel.appendChild(opt1); });

    // Init checkboxes for Start/End in Mem and Test
    renderCheckboxes('mem-start-range-grid', 'mem_start');
    renderCheckboxes('mem-end-range-grid', 'mem_end');
    renderCheckboxes('test-start-range-grid', 'test_start');
    renderCheckboxes('test-end-range-grid', 'test_end');

    updateDropdownLabel('mem_start');
    updateDropdownLabel('mem_end');
    updateDropdownLabel('test_start');
    updateDropdownLabel('test_end');
}

function setupDynamicUI() {
    const charSelect = document.getElementById('char-select');
    if (charSelect) {
        charSelect.onchange = renderCurrentListView;
    }

    const modeRow = document.querySelector('#view-list .control-panel .control-row');
    const listButton = document.getElementById('btn-mode-list');
    const matrixButton = document.getElementById('btn-mode-matrix');
    let wordButton = document.getElementById('btn-mode-content-word');
    let algorithmButton = document.getElementById('btn-mode-content-formula');

    if (!wordButton) {
        wordButton = document.createElement('button');
        wordButton.id = 'btn-mode-content-word';
        wordButton.className = 'action-btn';
    }
    if (!algorithmButton) {
        algorithmButton = document.createElement('button');
        algorithmButton.id = 'btn-mode-content-formula';
        algorithmButton.className = 'action-btn';
    }

    if (listButton) {
        listButton.onclick = () => setListLayoutMode('list');
        listButton.innerHTML = `<span data-i18n="switch_list">${t('switch_list')}</span>`;
    }
    if (matrixButton) {
        matrixButton.onclick = () => setListLayoutMode('matrix');
        matrixButton.innerHTML = `<span data-i18n="switch_matrix">${t('switch_matrix')}</span>`;
    }

    wordButton.onclick = () => setListContentMode('word');
    wordButton.innerHTML = `<span data-i18n="switch_words">${t('switch_words')}</span>`;

    algorithmButton.onclick = () => setListContentMode('formula');
    algorithmButton.innerHTML = `<span data-i18n="switch_algorithm">${t('switch_algorithm')}</span>`;

    if (modeRow) {
        modeRow.className = 'list-mode-switcher';
        modeRow.style.marginBottom = '16px';
        modeRow.innerHTML = '';
        modeRow.appendChild(createListModeGroup('switch_layout', [listButton, matrixButton], 'list-mode-group-layout'));
        modeRow.appendChild(createListModeGroup('switch_content', [wordButton, algorithmButton], 'list-mode-group-content'));
    }

    const listControls = document.getElementById('list-mode-controls');
    if (listControls && !document.getElementById('formula-mode-hint')) {
        const formulaHint = document.createElement('div');
        formulaHint.id = 'formula-mode-hint';
        formulaHint.className = 'mode-hint hidden';
        formulaHint.setAttribute('data-i18n', 'hint_formula_edit');
        formulaHint.innerText = t('hint_formula_edit');
        listControls.insertAdjacentElement('afterend', formulaHint);
    }

    const gridArea = document.getElementById('grid-area');
    if (gridArea && !document.getElementById('formula-area')) {
        const formulaArea = document.createElement('div');
        formulaArea.id = 'formula-area';
        formulaArea.className = 'grid-container formula-grid hidden';
        gridArea.insertAdjacentElement('afterend', formulaArea);
    }

    const matrixFooter = document.getElementById('matrix-footer');
    if (matrixFooter) {
        matrixFooter.classList.add('matrix-footer');
        matrixFooter.innerHTML = `
            <span class="matrix-footer-label" data-i18n="btn_reset_color">${t('btn_reset_color')}</span>
            <div class="matrix-footer-actions">
                <button class="btn-grade" onclick="resetAllColors('all')" data-i18n="btn_reset_all">${t('btn_reset_all')}</button>
                <button class="btn-grade bg-green" onclick="resetAllColors('green')" data-i18n="fb_good">${t('fb_good')}</button>
                <button class="btn-grade bg-yellow" onclick="resetAllColors('yellow')" data-i18n="fb_slow">${t('fb_slow')}</button>
                <button class="btn-grade bg-red" onclick="resetAllColors('red')" data-i18n="fb_wrong">${t('fb_wrong')}</button>
                <button class="btn-grade bg-gray" onclick="resetAllColors('gray')" data-i18n="btn_hide">${t('btn_hide')}</button>
            </div>
        `;
    }

    const memoryPanel = document.querySelector('#view-memory .control-panel');
    if (memoryPanel && !document.getElementById('btn-mem-content-word')) {
        const modeRow = document.createElement('div');
        modeRow.className = 'control-row';
        modeRow.style.gap = '10px';
        modeRow.style.marginBottom = '16px';

        const wordButton = document.createElement('button');
        wordButton.id = 'btn-mem-content-word';
        wordButton.className = 'action-btn';
        wordButton.onclick = () => toggleMemoryContentMode('word');
        wordButton.setAttribute('data-i18n', 'study_word_mode');
        wordButton.innerText = t('study_word_mode');

        const formulaButton = document.createElement('button');
        formulaButton.id = 'btn-mem-content-formula';
        formulaButton.className = 'action-btn';
        formulaButton.onclick = () => toggleMemoryContentMode('formula');
        formulaButton.setAttribute('data-i18n', 'study_formula_mode');
        formulaButton.innerText = t('study_formula_mode');

        modeRow.appendChild(wordButton);
        modeRow.appendChild(formulaButton);
        memoryPanel.insertBefore(modeRow, memoryPanel.firstElementChild);
    }
}

function createListModeGroup(labelKey, buttons, groupId) {
    const group = document.createElement('div');
    group.id = groupId;
    group.className = 'list-mode-group';

    const label = document.createElement('div');
    label.className = 'list-mode-group-label';
    label.setAttribute('data-i18n', labelKey);
    label.innerText = t(labelKey);

    const actions = document.createElement('div');
    actions.className = 'list-mode-group-actions';

    buttons.filter(Boolean).forEach((button) => {
        button.classList.add('mode-choice-btn');
        actions.appendChild(button);
    });

    group.appendChild(label);
    group.appendChild(actions);
    return group;
}

function setActionButtonActive(button, isActive) {
    if (!button) return;
    button.style.borderColor = isActive ? "var(--primary-color)" : "#cbd5e1";
    button.style.color = isActive ? "var(--primary-color)" : "#64748b";
    button.style.backgroundColor = isActive ? "#eff6ff" : "white";
}

function normalizeContentModes(contentModes = ['word']) {
    const modes = Array.isArray(contentModes) ? contentModes : [contentModes];
    return [...new Set(modes.filter(Boolean))];
}

function getSelectedMemoryContentModes() {
    return normalizeContentModes(currentMemoryContentModes);
}

function isMemoryContentModeActive(mode) {
    return getSelectedMemoryContentModes().includes(mode);
}

function getContentLabelKey(mode) {
    return mode === 'formula' ? 'content_formula_label' : 'content_word_label';
}

function getPairContentValue(pair, contentMode) {
    const dict = getContentDict(contentMode);
    return (dict[pair] || '').trim();
}

function getAvailablePairContentModes(pair, contentModes = ['word']) {
    return normalizeContentModes(contentModes).filter((mode) => {
        const value = getPairContentValue(pair, mode);
        if (!value) return false;
        const status = getPairData(pair, mode);
        return !(status && status.color === 'gray');
    });
}

function formatMemoryAnswer(pair, contentModes = ['word']) {
    const availableModes = getAvailablePairContentModes(pair, contentModes);
    if (availableModes.length === 0) return "N/A";

    if (availableModes.length === 1) {
        return getPairContentValue(pair, availableModes[0]);
    }

    return availableModes.map((mode) => {
        const title = t(getContentLabelKey(mode));
        const value = getPairContentValue(pair, mode);
        return `${title}: ${value}`;
    }).join('\n\n');
}

function isMatrixListView(mode = currentListViewMode) {
    return mode === 'matrix' || mode === 'formula-matrix';
}

function isFormulaListView(mode = currentListViewMode) {
    return mode === 'formula' || mode === 'formula-matrix';
}

function getCurrentListContentMode(mode = currentListViewMode) {
    return isFormulaListView(mode) ? 'formula' : 'word';
}

function getCurrentListLayoutMode(mode = currentListViewMode) {
    return isMatrixListView(mode) ? 'matrix' : 'list';
}

function buildListViewMode(layout = 'list', contentMode = 'word') {
    if (contentMode === 'formula') {
        return layout === 'matrix' ? 'formula-matrix' : 'formula';
    }
    return layout === 'matrix' ? 'matrix' : 'list';
}

function setListLayoutMode(layout) {
    toggleViewMode(buildListViewMode(layout, getCurrentListContentMode()));
}

function setListContentMode(contentMode) {
    toggleViewMode(buildListViewMode(getCurrentListLayoutMode(), contentMode));
}

function renderCurrentListView() {
    if (isMatrixListView()) renderMatrix(getCurrentListContentMode());
    else if (getCurrentListContentMode() === 'formula') renderFormulaList();
    else renderList();
}

function updateMemoryContentModeButtons() {
    setActionButtonActive(document.getElementById('btn-mem-content-word'), isMemoryContentModeActive('word'));
    setActionButtonActive(document.getElementById('btn-mem-content-formula'), isMemoryContentModeActive('formula'));
}

function toggleMemoryContentMode(mode) {
    const selectedModes = getSelectedMemoryContentModes();
    if (selectedModes.includes(mode)) {
        if (selectedModes.length === 1) return;
        currentMemoryContentModes = selectedModes.filter((item) => item !== mode);
    } else {
        currentMemoryContentModes = [...selectedModes, mode];
    }
    updateMemoryContentModeButtons();
    nextMemoryCard();
}

function toggleViewMode(mode) {
    currentListViewMode = mode;
    isMatrixMode = isMatrixListView(mode);
    const listBtn = document.getElementById('btn-mode-list');
    const matrixBtn = document.getElementById('btn-mode-matrix');
    const wordBtn = document.getElementById('btn-mode-content-word');
    const formulaBtn = document.getElementById('btn-mode-content-formula');
    const listControls = document.getElementById('list-mode-controls');
    const formulaHint = document.getElementById('formula-mode-hint');
    const matrixSettings = document.getElementById('matrix-settings');
    const gridArea = document.getElementById('grid-area');
    const formulaArea = document.getElementById('formula-area');
    const matrixArea = document.getElementById('matrix-area');
    const matrixFooter = document.getElementById('matrix-footer');
    const container = document.getElementById('main-container');
    const currentLayout = getCurrentListLayoutMode(mode);
    const currentContent = getCurrentListContentMode(mode);

    setActionButtonActive(listBtn, currentLayout === 'list');
    setActionButtonActive(matrixBtn, currentLayout === 'matrix');
    setActionButtonActive(wordBtn, currentContent === 'word');
    setActionButtonActive(formulaBtn, currentContent === 'formula');

    if (isMatrixListView(mode)) {
        container.classList.add('wide-mode');
        listControls.classList.add('hidden');
        formulaHint.classList.add('hidden');
        matrixSettings.classList.remove('hidden');
        gridArea.classList.add('hidden');
        formulaArea.classList.add('hidden');
        matrixArea.classList.remove('hidden');
        if (matrixFooter) matrixFooter.classList.remove('hidden');
        renderMatrix(currentContent);
    } else if (currentContent === 'formula') {
        container.classList.remove('wide-mode');
        listControls.classList.remove('hidden');
        formulaHint.classList.remove('hidden');
        matrixSettings.classList.add('hidden');
        gridArea.classList.add('hidden');
        formulaArea.classList.remove('hidden');
        matrixArea.classList.add('hidden');
        if (matrixFooter) matrixFooter.classList.add('hidden');
        renderFormulaList();
    } else {
        container.classList.remove('wide-mode');
        listControls.classList.remove('hidden');
        formulaHint.classList.add('hidden');
        matrixSettings.classList.add('hidden');
        gridArea.classList.remove('hidden');
        formulaArea.classList.add('hidden');
        matrixArea.classList.add('hidden');
        if (matrixFooter) matrixFooter.classList.add('hidden');
        renderList();
    }
}

function renderList() {
    const startChar = document.getElementById('char-select').value;
    const container = document.getElementById('grid-area');
    const dict = getDict();
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    chars.forEach((endChar) => {
        if (startChar === endChar) return;
        const pair = startChar + endChar;
        const div = document.createElement('div'); div.className = 'pair-item';
        div.innerHTML = `<div class="pair-label">${pair.toUpperCase()}</div>`;

        const input = document.createElement('input');
        input.className = 'pair-input';
        input.dataset.pair = pair;

        const stColor = getPairColor(pair);
        if (stColor) input.classList.add(`status-${stColor}`);
        input.value = dict[pair] || "";

        div.appendChild(input);
        fragment.appendChild(div);
    });
    container.appendChild(fragment);
}

function renderFormulaList() {
    const startChar = document.getElementById('char-select').value;
    const container = document.getElementById('formula-area');
    const formulaDict = getFormulaDict();
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    chars.forEach((endChar) => {
        if (startChar === endChar) return;
        const pair = startChar + endChar;
        const div = document.createElement('div');
        div.className = 'pair-item pair-item-formula';
        div.innerHTML = `<div class="pair-label">${pair.toUpperCase()}</div>`;

        const textarea = document.createElement('textarea');
        textarea.className = 'pair-input formula-input';
        textarea.dataset.pair = pair;
        textarea.dataset.store = 'formula';
        textarea.rows = 3;
        textarea.placeholder = t('ph_formula');

        const stColor = getPairColor(pair, 'formula');
        if (stColor) textarea.classList.add(`status-${stColor}`);
        textarea.value = formulaDict[pair] || "";

        div.appendChild(textarea);
        fragment.appendChild(div);
    });

    container.appendChild(fragment);
}

function renderMatrix(contentMode = 'word') {
    const table = document.getElementById('full-matrix');
    const matrixWrapper = document.getElementById('matrix-area');
    const dict = getContentDict(contentMode);
    if (matrixWrapper) matrixWrapper.classList.toggle('formula-matrix-mode', contentMode === 'formula');

    // [修改] 渲染時清空選取
    selectedMatrixPairs.clear();
    updateMatrixToolbar();

    const rows = [];

    let headerHtml = '<thead><tr><th></th>';
    chars.forEach((c, index) => {
        headerHtml += `<th><input value="${c.toUpperCase()}" onchange="updateGlobalChar(${index}, this.value)" class="header-input char-idx-${index}"></th>`;
    });
    headerHtml += '</tr></thead><tbody>';
    rows.push(headerHtml);

    chars.forEach((rowChar, rowIndex) => {
        let rowHtml = `<tr><th><input value="${rowChar.toUpperCase()}" onchange="updateGlobalChar(${rowIndex}, this.value)" class="header-input char-idx-${rowIndex}"></th>`;
        chars.forEach((colChar, colIndex) => {
            const pair = rowChar + colChar;
            const stColor = getPairColor(pair, contentMode);
            let cellClass = stColor ? `status-${stColor}` : '';
            const val = dict[pair] || '';
            const inputMarkup = contentMode === 'formula'
                ? `<textarea class="matrix-input" data-pair="${pair}" data-store="${contentMode}" rows="3">${val}</textarea>`
                : `<input class="matrix-input" value="${val}" data-pair="${pair}" data-store="${contentMode}">`;

            if (rowChar === colChar) {
                rowHtml += `<td class="cell-diagonal ${cellClass}">
                    <div class="diagonal-wrapper">
                        ${inputMarkup}
                        <button class="btn-diagonal-check" data-pair="${pair}" data-char="${rowChar}" data-store="${contentMode}">${t('btn_same')}</button>
                    </div>
                </td>`;
            } else {
                rowHtml += `<td class="${cellClass}">
                    ${inputMarkup}
                </td>`;
            }
        });
        rowHtml += '</tr>';
        rows.push(rowHtml);
    });
    rows.push('</tbody>');
    table.innerHTML = rows.join('');
}

// --- [核心修改] 矩陣聚焦邏輯 (僅保留十字線) ---
function handleMatrixFocus(el) {
    // 十字線高亮
    const td = el.closest('td'); if (!td) return;
    const tr = td.parentElement; const table = document.getElementById('full-matrix');
    if (!tr || !table) return;
    const colIndex = td.cellIndex;
    for (let c = 0; c < tr.cells.length; c++) { if (tr.cells[c]) tr.cells[c].classList.add('highlight-guide'); }
    for (let r = 0; r < table.rows.length; r++) { if (table.rows[r] && table.rows[r].cells[colIndex]) { table.rows[r].cells[colIndex].classList.add('highlight-guide'); } }
}

// --- [新增] 切換選取狀態 ---
function toggleMatrixSelection(pair, cellElement) {
    if (selectedMatrixPairs.has(pair)) {
        selectedMatrixPairs.delete(pair);
        cellElement.classList.remove('is-selected');
    } else {
        selectedMatrixPairs.add(pair);
        cellElement.classList.add('is-selected');
    }
    updateMatrixToolbar();
}

function updateMatrixToolbar() {
    const label = document.getElementById('active-pair-label');
    if (label) {
        if (selectedMatrixPairs.size > 0) {
            label.innerText = t('sel_count', { n: selectedMatrixPairs.size });
        } else {
            label.innerText = "";
        }
    }
}

function handleMatrixBlur() {
    document.querySelectorAll('.highlight-guide').forEach(el => el.classList.remove('highlight-guide'));
    // 不隱藏工具列，方便連續操作
}

// --- [新增] 手動設定狀態功能 (含隱藏) ---
window.setMatrixStatus = function (statusType) {
    if (selectedMatrixPairs.size === 0) {
        alert(t('alert_select_matrix_cells'));
        return;
    }

    const contentMode = getCurrentListContentMode();
    const pairsToUpdate = Array.from(selectedMatrixPairs);

    pairsToUpdate.forEach(pair => {
        let newData;
        if (statusType === 'gray') {
            // 隱藏狀態
            newData = { interval: -1, repetition: 0, ef: 2.5, dueDate: 0, color: 'gray' };
        } else {
            // 手動評分
            const grade = statusType === 'green' ? 5 : (statusType === 'yellow' ? 3 : 1);
            const currentData = getPairData(pair, contentMode);
            newData = calculateNextReview(currentData, grade);
        }

        saveStatusData(pair, newData, contentMode);

        // 更新畫面颜色
        const inputEl = document.querySelector(`.matrix-input[data-pair="${pair}"]`);
        if (inputEl) {
            const td = inputEl.closest('td');
            if (td) {
                td.className = ''; // 清除舊顏色
                if (newData.color) td.classList.add(`status-${newData.color}`);
                if (pair[0] === pair[1]) td.classList.add('cell-diagonal');
                // Clear selection style
                td.classList.remove('is-selected');
            }
        }
    });

    // 動作完成後，清空選取
    selectedMatrixPairs.clear();
    updateMatrixToolbar();

    // 顯示成功訊息
    const label = document.getElementById('active-pair-label');
    if (label) {
        // label text is already updated by updateMatrixToolbar (to empty/sel:0)
        label.innerText = t('msg_matrix_updated');
        setTimeout(() => label.innerText = "", 800);
    }
};

window.updateGlobalChar = function (index, newValue) {
    const val = newValue.trim(); if (!val) { alert(t('alert_chars_empty')); return; }
    chars[index] = val; localStorage.setItem(CHARS_KEY, JSON.stringify(chars));
    document.querySelectorAll(`.char-idx-${index}`).forEach(inp => inp.value = val);
    initUI(); updateLayoutMode(); renderCurrentListView();
}

window.toggleMatrixEdit = function (editable) {
    document.querySelectorAll('.matrix-input').forEach(inp => inp.readOnly = !editable);
    document.querySelectorAll('.header-input').forEach(inp => inp.readOnly = !editable);
};;

function resetDefaultChars() {
    if (confirm(t('alert_reset'))) {
        chars = (currentLang === 'en') ? [...CHARS_EN] : [...CHARS_ZH];
        localStorage.removeItem(CHARS_KEY); initUI(); applyLanguage(); updateLayoutMode(); renderCurrentListView(); alert(t('alert_reset_done'));
    }
}
function toggleLanguage() {
    currentLang = currentLang === 'zh-TW' ? 'en' : 'zh-TW';
    localStorage.setItem(LANG_KEY, currentLang); applyLanguage();
    if (currentLang === 'en' && JSON.stringify(chars) === JSON.stringify(CHARS_ZH)) {
        if (confirm(t('confirm_switch_chars_en'))) { chars = [...CHARS_EN]; localStorage.setItem(CHARS_KEY, JSON.stringify(chars)); initUI(); }
    } else if (currentLang === 'zh-TW' && JSON.stringify(chars) === JSON.stringify(CHARS_EN)) {
        if (confirm(t('confirm_switch_chars_zh'))) { chars = [...CHARS_ZH]; localStorage.setItem(CHARS_KEY, JSON.stringify(chars)); initUI(); }
    }
    updateLayoutMode(); renderCurrentListView();
}
function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.getAttribute('data-i18n'); if (translations[currentLang][key]) el.innerText = translations[currentLang][key]; });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { const key = el.getAttribute('data-i18n-placeholder'); if (translations[currentLang][key]) el.placeholder = translations[currentLang][key]; });
    document.documentElement.lang = currentLang === 'zh-TW' ? 'zh-TW' : 'en';
    document.title = t('page_title');
    const listSel = document.getElementById('char-select'); const currentVal = listSel.value; listSel.innerHTML = '';
    chars.forEach(c => { let opt = document.createElement('option'); opt.value = c; opt.innerText = `${c.toUpperCase()}${t('opt_start')}`; listSel.appendChild(opt); });
    if (currentVal && chars.includes(currentVal)) listSel.value = currentVal;
    if (isWaitingTestNext) document.getElementById('test-btn').innerText = t('btn_start_test'); else document.getElementById('test-btn').innerText = t('btn_submit');
    if (isMemAnswerShown) document.getElementById('mem-hint').style.visibility = 'hidden'; else document.getElementById('mem-hint').style.visibility = 'visible';
    if (isMemAnswerShown) document.getElementById('mem-hint').style.visibility = 'hidden'; else document.getElementById('mem-hint').style.visibility = 'visible';
    updateDropdownLabel('mem_start'); updateDropdownLabel('mem_end');
    updateDropdownLabel('test_start'); updateDropdownLabel('test_end');
    updateMemoryContentModeButtons();
    toggleViewMode(currentListViewMode);
}

function toggleDropdown(id) { const content = document.getElementById(`${id}-content`); const isShown = content.classList.contains('show'); closeAllDropdowns(); if (!isShown) content.classList.add('show'); }
function closeAllDropdowns() { document.querySelectorAll('.dropdown-content').forEach(el => el.classList.remove('show')); }

// Modified to handle generic ID
function updateDropdownLabel(key) {
    // key ex: mem_start
    const selected = getSelectedRanges(key);
    const btn = document.getElementById(`${key}-btn`);
    if (!btn) return;

    const displaySelected = selected.map(s => s.toUpperCase());

    if (selected.length === chars.length) btn.innerText = t('sel_full');
    else if (selected.length === 0) btn.innerText = t('sel_none');
    else btn.innerText = selected.length <= 5 ? `${t('sel_prefix')}${displaySelected.join(', ')}` : t('sel_count', { n: selected.length });
}

function renderCheckboxes(containerId, inputName) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    chars.forEach((c) => {
        const label = document.createElement('label');
        label.style = 'display:flex;align-items:center;';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = c;
        input.name = inputName + '_range'; // ex: mem_start_range
        input.checked = true;
        input.onchange = () => updateDropdownLabel(inputName);
        label.appendChild(input);
        label.appendChild(document.createTextNode(c.toUpperCase()));
        container.appendChild(label);
    });
}
function toggleAll(inputName, state) {
    document.querySelectorAll(`input[name="${inputName}_range"]`).forEach(input => input.checked = state);
    updateDropdownLabel(inputName);
}
function getSelectedRanges(inputName) {
    return Array.from(document.querySelectorAll(`input[name="${inputName}_range"]:checked`)).map(i => i.value);
}
function triggerAction(tabId) { if (tabId === 'view-memory') { if (isMemAnswerShown) nextMemoryCard(); else toggleMemoryAnswer(); } else if (tabId === 'view-test') { if (isWaitingTestNext) startTestQuestion(); } }

function switchTab(tab) {
    document.querySelectorAll('.view-section').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(e => e.classList.remove('active'));
    document.getElementById(`view-${tab}`).classList.add('active');
    const btnIndex = { 'list': 0, 'memory': 1, 'test': 2, 'data': 3 };
    document.querySelectorAll('.nav-btn')[btnIndex[tab]].classList.add('active');
    const container = document.getElementById('main-container');
    if (tab === 'list' && isMatrixListView()) container.classList.add('wide-mode'); else container.classList.remove('wide-mode');
    if (timerInterval) clearInterval(timerInterval);
    if (tab === 'list') renderCurrentListView();
    if (tab === 'memory') nextMemoryCard();
    if (tab === 'test') { document.getElementById('test-feedback').innerText = ''; document.getElementById('test-correct-msg').innerText = ''; isWaitingTestNext = true; applyLanguage(); }
}

function resetAllColors(targetColor = 'all') {
    if (confirm(t('alert_reset'))) {
        const contentMode = getCurrentListContentMode();
        const statusKey = contentMode === 'formula' ? FORMULA_STATUS_KEY : STATUS_KEY;

        if (targetColor === 'all') {
            localStorage.setItem(statusKey, JSON.stringify({}));
        } else {
            const currentMap = getStatusMap(contentMode);
            const nextMap = {};

            Object.entries(currentMap).forEach(([pair, data]) => {
                const color = typeof data === 'string' ? data : data?.color;
                if (color !== targetColor) nextMap[pair] = data;
            });

            localStorage.setItem(statusKey, JSON.stringify(nextMap));
        }

        renderCurrentListView();
        alert(t('alert_reset_done'));
    }
}

function markMemStatus(gradeType) {
    if (!currentPair) return;
    let grade = gradeType === 'red' ? 1 : (gradeType === 'yellow' ? 3 : 5);
    const selectedModes = getAvailablePairContentModes(currentPair, getSelectedMemoryContentModes());
    if (selectedModes.length === 0) return;
    selectedModes.forEach((mode) => {
        const currentData = getPairData(currentPair, mode);
        const newData = calculateNextReview(currentData, grade);
        saveStatusData(currentPair, newData, mode);
    });
    nextMemoryCard();
}

function getCandidatePool(mode, contentModes = ['word']) {
    return getStudyCandidatePool(mode, contentModes);

    const startChars = getSelectedRanges(`${mode}_start`);
    const endChars = getSelectedRanges(`${mode}_end`);
    const normalizedModes = normalizeContentModes(contentModes);

    if (startChars.length === 0 || endChars.length === 0) return { error: 'alert_sel_range' };

    // 分類桶
    let groupNew = [];
    let groupRed = [];
    let groupYellow = [];
    let groupGreen = [];

    chars.forEach(start => {
        if (!startChars.includes(start)) return;
        chars.forEach(end => {
            if (!endChars.includes(end)) return;

            const pair = start + end;

            // 排除隱藏
            const availableModes = getAvailablePairContentModes(pair, normalizedModes);
            if (availableModes.length === 0) return;
            const statuses = availableModes.map((item) => getPairData(pair, item)).filter(Boolean);

            // 必須在字典中有資料
            if (dict[pair]) {
                if (!status) {
                    groupNew.push(pair);
                } else if (status.color === 'red') {
                    // 為了避免永遠只複習某幾個，這裡可以加入一點隨機性或檢查 dueDate
                    // 但用戶要求「優先」，所以先嚴格執行
                    groupRed.push(pair);
                } else if (status.color === 'yellow') {
                    groupYellow.push(pair);
                } else {
                    groupGreen.push(pair);
                }
            }
        });
    });

    // 檢查是否有任何有效資料
    if (groupNew.length === 0 && groupRed.length === 0 && groupYellow.length === 0 && groupGreen.length === 0) {
        return { error: contentMode === 'formula' ? 'alert_no_formula_data' : 'alert_no_data' };
    }

    // 優先順序：沒測驗過 (New) > 不熟悉 (Red) > 猶豫 (Yellow) > 精熟 (Green)
    if (groupNew.length > 0) return { pool: groupNew };
    if (groupRed.length > 0) return { pool: groupRed };
    if (groupYellow.length > 0) return { pool: groupYellow };
    return { pool: groupGreen };
}

function getStudyCandidatePool(mode, contentModes = ['word']) {
    const startChars = getSelectedRanges(`${mode}_start`);
    const endChars = getSelectedRanges(`${mode}_end`);
    const normalizedModes = normalizeContentModes(contentModes);

    if (startChars.length === 0 || endChars.length === 0) return { error: 'alert_sel_range' };

    let groupNew = [];
    let groupRed = [];
    let groupYellow = [];
    let groupGreen = [];

    chars.forEach(start => {
        if (!startChars.includes(start)) return;
        chars.forEach(end => {
            if (!endChars.includes(end)) return;

            const pair = start + end;
            const availableModes = getAvailablePairContentModes(pair, normalizedModes);
            if (availableModes.length === 0) return;

            const statuses = availableModes.map((item) => getPairData(pair, item)).filter(Boolean);

            if (statuses.length < availableModes.length) {
                groupNew.push(pair);
            } else if (statuses.some((status) => status.color === 'red')) {
                groupRed.push(pair);
            } else if (statuses.some((status) => status.color === 'yellow')) {
                groupYellow.push(pair);
            } else {
                groupGreen.push(pair);
            }
        });
    });

    if (groupNew.length === 0 && groupRed.length === 0 && groupYellow.length === 0 && groupGreen.length === 0) {
        return { error: normalizedModes.length === 1 && normalizedModes[0] === 'formula' ? 'alert_no_formula_data' : 'alert_no_data' };
    }

    if (groupNew.length > 0) return { pool: groupNew };
    if (groupRed.length > 0) return { pool: groupRed };
    if (groupYellow.length > 0) return { pool: groupYellow };
    return { pool: groupGreen };
}

function nextMemoryCard() {
    const result = getStudyCandidatePool('mem', getSelectedMemoryContentModes());
    if (result.error) {
        currentPair = null;
        document.getElementById('mem-q').innerText = '--';
        document.getElementById('mem-a').innerText = '';
        document.getElementById('mem-a').classList.remove('show');
        document.getElementById('mem-grading-area').classList.add('hidden');
        document.getElementById('mem-hint').style.visibility = 'visible';
        isMemAnswerShown = false;
        alert(t(result.error));
        return;
    }

    let pool = result.pool;
    if (pool.length > 1 && lastMemPair) pool = pool.filter(p => p !== lastMemPair);

    currentPair = pool[Math.floor(Math.random() * pool.length)];
    lastMemPair = currentPair;

    document.getElementById('mem-q').innerText = currentPair.toUpperCase();
    document.getElementById('mem-a').classList.remove('show');
    document.getElementById('mem-grading-area').classList.add('hidden');
    document.getElementById('mem-hint').style.visibility = 'visible';

    isMemAnswerShown = false; applyLanguage();
}

function toggleMemoryAnswer() {
    if (!currentPair || isMemAnswerShown) return;
    const answerEl = document.getElementById('mem-a');
    answerEl.innerText = formatMemoryAnswer(currentPair, getSelectedMemoryContentModes());

    answerEl.classList.add('show');
    document.getElementById('mem-grading-area').classList.remove('hidden');
    document.getElementById('mem-hint').style.visibility = 'hidden';
    isMemAnswerShown = true; applyLanguage();
}

function startTestQuestion() {
    const result = getStudyCandidatePool('test', ['word']);
    if (result.error) { alert(t(result.error)); return; }

    let pool = result.pool;
    if (pool.length > 1 && lastTestPair) pool = pool.filter(p => p !== lastTestPair);

    currentPair = pool[Math.floor(Math.random() * pool.length)];
    lastTestPair = currentPair;

    document.getElementById('test-q').innerText = currentPair.toUpperCase();
    const inp = document.getElementById('test-input');
    inp.value = ''; inp.disabled = false; inp.focus();

    document.getElementById('test-feedback').innerText = '';
    document.getElementById('test-correct-msg').innerText = '';
    isWaitingTestNext = false;
    applyLanguage();

    if (timerInterval) clearInterval(timerInterval);
    testStartTime = Date.now();
    document.getElementById('timer').innerText = "0.0s";
    timerInterval = setInterval(() => {
        document.getElementById('timer').innerText = ((Date.now() - testStartTime) / 1000).toFixed(1) + "s";
    }, 100);
}

function checkTestAnswer() {
    if (isWaitingTestNext) return;
    clearInterval(timerInterval);
    const duration = (Date.now() - testStartTime) / 1000;
    const val = document.getElementById('test-input').value.trim();
    const dict = getDict();
    const ans = dict[currentPair];

    let grade = 0;
    let msg = '';
    let textColorClass = '';

    if (val === '') {
        grade = 0; msg = t('fb_empty'); textColorClass = 'text-danger';
    } else if (val !== ans) {
        grade = 1; msg = t('fb_wrong'); textColorClass = 'text-danger';
    } else {
        if (duration < 8.0) {
            grade = 5; msg = t('fb_good'); textColorClass = 'text-success';
        } else if (duration <= 12.0) {
            grade = 3; msg = t('fb_slow'); textColorClass = 'text-warning';
        } else {
            grade = 1; msg = t('fb_wrong') + " (Timeout)"; textColorClass = 'text-danger';
        }
    }

    const currentData = getPairData(currentPair);
    const newData = calculateNextReview(currentData, grade);
    saveStatusData(currentPair, newData);

    const feedbackEl = document.getElementById('test-feedback');
    feedbackEl.innerText = msg + ` (${duration.toFixed(1)}s)`;
    feedbackEl.className = '';
    feedbackEl.classList.add(textColorClass);

    const correctMsgEl = document.getElementById('test-correct-msg');
    correctMsgEl.innerText = t('ans_prefix') + ans;

    document.getElementById('test-input').disabled = true; isWaitingTestNext = true; applyLanguage();
}

function exportData() {
    const exportType = document.getElementById('export-type').value;
    const dict = getDict();
    const formulaDict = getFormulaDict();

    if (exportType === 'csv') {
        let csvContent = "\ufeff";
        csvContent += "," + chars.join(",") + "\n";
        chars.forEach(rowChar => {
            let row = [rowChar];
            chars.forEach(colChar => {
                const pair = rowChar + colChar;
                if (rowChar === colChar) {
                    row.push("");
                } else {
                    let val = dict[pair] || "";
                    if (val.includes(",")) val = `"${val}"`;
                    row.push(val);
                }
            });
            csvContent += row.join(",") + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `letter_pairs_table_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } else {
        const statusMap = getStatusMap();
        const formulaStatusMap = getStatusMap('formula');
        const cleanDict = {};
        const cleanFormulaDict = {};
        const cleanStatus = {};
        const cleanFormulaStatus = {};

        chars.forEach(start => {
            chars.forEach(end => {
                const pair = start + end;
                if (dict[pair]) {
                    cleanDict[pair] = dict[pair];
                    if (statusMap[pair]) cleanStatus[pair] = statusMap[pair];
                }
                if (formulaDict[pair]) {
                    cleanFormulaDict[pair] = formulaDict[pair];
                    if (formulaStatusMap[pair]) cleanFormulaStatus[pair] = formulaStatusMap[pair];
                }
            });
        });

        const blob = new Blob([JSON.stringify({
            dict: cleanDict,
            formulaDict: cleanFormulaDict,
            status: cleanStatus,
            formulaStatus: cleanFormulaStatus,
            chars: chars
        })], { type: "application/json" });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
}

function importData() {
    const fileInput = document.getElementById('file-input');
    const f = fileInput.files[0];
    if (!f) return; const r = new FileReader(); r.onload = (e) => {
        try {
            const d = JSON.parse(e.target.result);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(d.dict || {}));
            localStorage.setItem(FORMULA_STORAGE_KEY, JSON.stringify(d.formulaDict || {}));
            localStorage.setItem(STATUS_KEY, JSON.stringify(d.status || {}));
            localStorage.setItem(FORMULA_STATUS_KEY, JSON.stringify(d.formulaStatus || {}));
            if (d.chars) { chars = d.chars; localStorage.setItem(CHARS_KEY, JSON.stringify(chars)); }
            alert(t('alert_import_success')); initUI(); updateLayoutMode();
            renderCurrentListView();
        } catch (err) { alert(t('alert_import_error')); }
    };
    r.readAsText(f);
}
function clearAllData() {
    if (confirm(t('alert_reset'))) { localStorage.clear(); location.reload(); }
}
