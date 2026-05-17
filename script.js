const CHARS_ZH = ['ㄅ', 'ㄆ', 'ㄇ', 'ㄈ', 'ㄉ', 'ㄊ', 'ㄋ', 'ㄌ', 'ㄍ', 'ㄎ', 'ㄏ', 'ㄐ', 'ㄑ', 'ㄒ', 'ㄓ', 'ㄔ', 'ㄕ', 'ㄖ', 'ㄗ', 'ㄘ', 'ㄙ', 'ㄧ', 'ㄨ', 'ㄩ'];
const CHARS_EN = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x'];
let chars = [...CHARS_ZH];

const STORAGE_KEY = 'bld_custom_dict_v3';
const STATUS_KEY = 'bld_status_v1';
const LEGACY_FORMULA_STORAGE_KEY = 'bld_formula_dict_v1';
const LEGACY_FORMULA_STATUS_KEY = 'bld_formula_status_v1';
const CORNER_FORMULA_STORAGE_KEY = 'bld_formula_corner_dict_v1';
const EDGE_FORMULA_STORAGE_KEY = 'bld_formula_edge_dict_v1';
const CORNER_FORMULA_STATUS_KEY = 'bld_formula_corner_status_v1';
const EDGE_FORMULA_STATUS_KEY = 'bld_formula_edge_status_v1';
const LANG_KEY = 'bld_lang_v1';
const CHARS_KEY = 'bld_chars_v1';
const TRAINER_RECORDS_KEY = 'bld_trainer_records_v1';
const APP_STORAGE_KEYS = [
    STORAGE_KEY,
    STATUS_KEY,
    LEGACY_FORMULA_STORAGE_KEY,
    LEGACY_FORMULA_STATUS_KEY,
    CORNER_FORMULA_STORAGE_KEY,
    EDGE_FORMULA_STORAGE_KEY,
    CORNER_FORMULA_STATUS_KEY,
    EDGE_FORMULA_STATUS_KEY,
    LANG_KEY,
    CHARS_KEY,
    TRAINER_RECORDS_KEY
];

let currentPair = null;
let isMemAnswerShown = false;
let lastMemPair = null;
let recentMemPairs = [];
let currentLang = localStorage.getItem(LANG_KEY) || 'zh-TW';
let isMatrixMode = false;
let currentListViewMode = 'list';
let currentAlgorithmType = 'corner';
let currentMemoryContentModes = ['word'];
let currentTrainerAlgorithmType = 'corner';
let currentTrainerPair = null;
let currentTrainerScramble = '';
let lastTrainerPair = null;
let trainerRecords = [];
let latestTrainerRecordId = null;
let trainerTimerState = 'idle';
let trainerHoldTimeoutId = null;
let trainerAnimationFrameId = null;
let trainerStartTimestamp = 0;
let currentTrainerStatusKey = 'trainer_status_idle';
let trainerDeleteConfirmArmed = false;
let currentTab = 'list';
const BUILT_IN_ALGORITHMS = window.BUILT_IN_ALGORITHMS || { corner: {}, edge: {} };
const MEMORY_REPEAT_GAP = 5;
const TAB_ORDER = ['list', 'memory', 'trainer', 'data'];
const TRAINER_RECORDS_LIMIT = 200;
const TRAINER_HISTORY_PREVIEW_LIMIT = 8;
const TRAINER_AVERAGE_COUNTS = [5, 12, 50, 100];

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
        nav_list: "列表輸入", nav_mem: "記憶翻牌", nav_test: "打字測驗", nav_data: "設定",
        lbl_start_char: "開頭代碼：", btn_reset_color: "重置熟悉度：",
        lbl_range: "選擇範圍：", lbl_test_range: "測驗範圍：", btn_next: "下一題", btn_start_test: "開始測驗 (Space)",
        btn_submit: "提交 (Enter)", ph_input: "輸入後按 Enter",
        title_settings: "設定", title_backup: "備份", lbl_select_file: "匯入檔案：", btn_import: "確認匯入", btn_clear_all: "清空所有資料",
        opt_json: "系統備份檔 (.json)", opt_csv: "Excel 表格 (.csv)", btn_export_exec: "匯出資料",
        hint_matrix_edit: "提示：點擊表頭可修改代碼",
        btn_reset_chars: "回復預設", mode_card: "列表模式", mode_matrix: "表格模式", btn_same: "同",
        alert_chars_empty: "輸入不能為空！", alert_reset: "確定重置？", alert_reset_done: "已重置",
        opt_start: " 開頭", sel_full: "全選", sel_none: "未選擇", sel_count: "已選 {n} 個", sel_prefix: "SEL: ",
        hint_click_flip: "點擊卡片翻牌", fb_empty: "空白跳過", fb_wrong: "不熟", fb_slow: "猶豫", fb_good: "熟練",
        ans_prefix: "答案：", alert_no_data: "請先輸入資料！", alert_sel_range: "請選擇範圍", alert_import_success: "匯入成功", alert_import_error: "格式錯誤",
        lbl_start: "開頭：", lbl_end: "結尾：",
        btn_hide: "隱藏", lbl_edit_mode: "編輯模式", btn_reset_all: "全部",
        settings_formula_title: "公式預設",
        settings_formula_prefix: "公式預設來源為 ",
        settings_formula_suffix: "，預設使用 Speffz lettering scheme。",
        settings_language_label: "Language",
        settings_language_hint: "可在中文與 English 之間切換介面語言。"
    },
    'en': {
        nav_list: "List Input", nav_mem: "Flashcards", nav_test: "Typing Test", nav_data: "Setting",
        lbl_start_char: "Start Code:", btn_reset_color: "Reset familiarity:",
        lbl_range: "Select Range:", lbl_test_range: "Test Range:", btn_next: "Next", btn_start_test: "Start Test (Space)",
        btn_submit: "Submit (Enter)", ph_input: "Type & Enter",
        title_settings: "Setting", title_backup: "Backup", lbl_select_file: "Import File:", btn_import: "Import", btn_clear_all: "Clear All Data",
        opt_json: "Backup File (.json)", opt_csv: "Excel Table (.csv)", btn_export_exec: "Export Data",
        hint_matrix_edit: "Click header to edit code",
        btn_reset_chars: "Reset Default", mode_card: "List Mode", mode_matrix: "Table Mode", btn_same: "Same",
        alert_chars_empty: "Cannot be empty!", alert_reset: "Are you sure?", alert_reset_done: "Reset done.",
        opt_start: " Start", sel_full: "ALL", sel_none: "NONE", sel_count: "{n} selected", sel_prefix: "SEL: ",
        hint_click_flip: "Click to flip", fb_empty: "Skipped", fb_wrong: "Hard", fb_slow: "Slow", fb_good: "Good",
        ans_prefix: "Ans: ", alert_no_data: "No data!", alert_sel_range: "Select range", alert_import_success: "Success", alert_import_error: "Error",
        lbl_start: "Start:", lbl_end: "End:",
        btn_hide: "Hide", lbl_edit_mode: "Edit Mode", btn_reset_all: "All",
        settings_formula_title: "Formula Defaults",
        settings_formula_prefix: "Default algorithms are sourced from ",
        settings_formula_suffix: " and use the Speffz lettering scheme.",
        settings_language_label: "Language",
        settings_language_hint: "Switch the interface between English and Chinese."
    }
};

Object.assign(translations['zh-TW'], {
    nav_trainer: "3-Style Trainer",
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
    algorithm_type: "\u516c\u5f0f\u985e\u578b",
    algorithm_corners: "Corners",
    algorithm_edges: "Edges",
    content_word_label: "\u5b57\u8a5e",
    content_formula_label: "\u516c\u5f0f",
    content_corner_label: "Corners",
    content_edge_label: "Edges",
    study_word_mode: "\u5b57\u8a5e\u6a21\u5f0f",
    study_formula_mode: "\u516c\u5f0f\u6a21\u5f0f",
    study_corner_mode: "Corners",
    study_edge_mode: "Edges",
    ph_formula: "\u8f38\u5165\u516c\u5f0f",
    ph_algorithm: "\u8f38\u5165\u516c\u5f0f",
    hint_formula_edit: "\u53ef\u5728\u9019\u88e1\u70ba\u6bcf\u7d44 letter pair \u8f38\u5165 corners \u6216 edges \u516c\u5f0f\uff0c\u7a7a\u767d\u6642\u6703\u986f\u793a\u5167\u5efa BLDDB \u9810\u8a2d commutator\uff0cFlashcards \u4e5f\u53ef\u4ee5\u5206\u958b\u7df4\u7fd2",
    alert_no_formula_data: "\u76ee\u524d\u9078\u53d6\u7bc4\u570d\u6c92\u6709\u516c\u5f0f\u8cc7\u6599\uff01",
    alert_no_algorithm_data: "\u76ee\u524d\u9078\u53d6\u7bc4\u570d\u6c92\u6709 corners \u6216 edges \u516c\u5f0f\u8cc7\u6599\uff01",
    alert_select_matrix_cells: "\u8acb\u5148\u9ede\u9078\u77e9\u9663\u4e2d\u7684\u683c\u5b50\uff01",
    msg_matrix_updated: "\u5df2\u66f4\u65b0\uff01",
    confirm_switch_chars_en: "\u8981\u4e00\u8d77\u5207\u63db\u6210 English a-x \u4ee3\u78bc\u55ce\uff1f",
    confirm_switch_chars_zh: "\u8981\u5207\u56de\u6ce8\u97f3\u4ee3\u78bc\u55ce\uff1f",
    trainer_scramble_label: "Scramble",
    trainer_scramble_placeholder: "\u6309\u4e0b\u300c\u7522\u751f\u4e0b\u4e00\u7d44 Scramble\u300d\u958b\u59cb\u3002",
    trainer_scramble_hint: "\u6253\u4e82\u5b8c\u6210\u5f8c\u6309\u4e00\u4e0b\u7a7a\u767d\u9375\u958b\u59cb\u8a08\u6642\uff0c\u4efb\u610f\u9375\u505c\u6b62\u3002",
    trainer_status_idle: "\u6309\u4e00\u4e0b\u7a7a\u767d\u9375\u958b\u59cb",
    trainer_status_holding: "\u7e7c\u7e8c\u6309\u4f4f\u2026",
    trainer_status_ready: "\u653e\u958b\u958b\u59cb",
    trainer_status_running: "\u8a08\u6642\u4e2d",
    trainer_status_stopped: "\u5df2\u8a18\u9304\u9019\u6b21\u6210\u7e3e\uff0c\u53ef\u4ee5\u9078\u64c7 +2\u3001DNF \u6216\u522a\u9664\u3002",
    trainer_status_delete_confirm: "\u518d\u6309\u4e00\u6b21\u300c\u78ba\u8a8d\u300d\u624d\u6703\u522a\u9664\u6700\u8fd1\u4e00\u6b21\u6210\u7e3e\u3002",
    trainer_status_no_scramble: "\u76ee\u524d\u7bc4\u570d\u6c92\u6709\u53ef\u7528\u7684 scramble\u3002",
    btn_generate_scramble: "\u7522\u751f\u4e0b\u4e00\u7d44 Scramble",
    btn_penalty_plus2: "+2",
    btn_penalty_dnf: "DNF",
    btn_delete_solve: "\u522a\u9664",
    btn_delete_cancel: "\u53d6\u6d88",
    btn_delete_confirm: "\u78ba\u8a8d",
    trainer_last_result_label: "\u6700\u8fd1\u4e00\u6b21",
    trainer_averages_label: "\u5e73\u5747",
    trainer_history_label: "\u7d00\u9304",
    trainer_history_empty: "\u9084\u6c92\u6709\u8a08\u6642\u7d00\u9304",
    alert_invalid_algorithm_format: "\u9019\u7d44\u516c\u5f0f\u683c\u5f0f\u76ee\u524d\u7121\u6cd5\u7528\u4f86\u751f\u6210 scramble\u3002",
    btn_toggle_lang: "English / \u4e2d\u6587",
    page_title: "3BLD(3 style & letter pairs) practice",
    sel_prefix: "\u5df2\u9078\uff1a"
});

Object.assign(translations.en, {
    nav_trainer: "3-Style Trainer",
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
    algorithm_type: "Algorithm Type",
    algorithm_corners: "Corners",
    algorithm_edges: "Edges",
    content_word_label: "Word",
    content_formula_label: "Formula",
    content_corner_label: "Corners",
    content_edge_label: "Edges",
    study_word_mode: "Word Mode",
    study_formula_mode: "Formula Mode",
    study_corner_mode: "Corners",
    study_edge_mode: "Edges",
    ph_formula: "Enter formula",
    ph_algorithm: "Enter algorithm",
    hint_formula_edit: "Edit corner or edge algorithms for the selected start code. Empty fields show built-in BLDDB commutators, and Flashcards can study them separately too.",
    alert_no_formula_data: "No formula data in this range!",
    alert_no_algorithm_data: "No corner or edge algorithm data in this range!",
    alert_select_matrix_cells: "Please select matrix cells first!",
    msg_matrix_updated: "Updated!",
    confirm_switch_chars_en: "Also switch to English a-x codes?",
    confirm_switch_chars_zh: "Switch back to Zhuyin codes as well?",
    trainer_scramble_label: "Scramble",
    trainer_scramble_placeholder: "Press Next Scramble to begin.",
    trainer_scramble_hint: "Scramble first, press Space to start, and press any key to stop.",
    trainer_status_idle: "Press Space to start",
    trainer_status_holding: "Keep holding...",
    trainer_status_ready: "Release to start",
    trainer_status_running: "Timer running",
    trainer_status_stopped: "Solve saved. You can choose +2, DNF, or delete it.",
    trainer_status_delete_confirm: "Press Confirm again to delete the latest solve.",
    trainer_status_no_scramble: "No available scramble in this range.",
    btn_generate_scramble: "Next Scramble",
    btn_penalty_plus2: "+2",
    btn_penalty_dnf: "DNF",
    btn_delete_solve: "Delete",
    btn_delete_cancel: "Cancel",
    btn_delete_confirm: "Confirm",
    trainer_last_result_label: "Last Solve",
    trainer_averages_label: "Averages",
    trainer_history_label: "History",
    trainer_history_empty: "No solves yet.",
    alert_invalid_algorithm_format: "This algorithm format cannot be converted into a scramble yet.",
    btn_toggle_lang: "\u4e2d\u6587 / English",
    page_title: "3BLD(3 style & letter pairs) practice"
});

const SM2_SETTINGS = { defaultEf: 2.5, minEf: 1.3, intervals: [1, 3] };
const REVIEW_DELAY_SETTINGS = {
    hardMinutes: 10,
    slowHours: 6
};

function isAlgorithmContentMode(contentMode = 'word') {
    return contentMode === 'corner' || contentMode === 'edge';
}

function getContentStorageKey(contentMode = 'word') {
    if (contentMode === 'corner') return CORNER_FORMULA_STORAGE_KEY;
    if (contentMode === 'edge') return EDGE_FORMULA_STORAGE_KEY;
    return STORAGE_KEY;
}

function getStatusStorageKey(contentMode = 'word') {
    if (contentMode === 'corner') return CORNER_FORMULA_STATUS_KEY;
    if (contentMode === 'edge') return EDGE_FORMULA_STATUS_KEY;
    return STATUS_KEY;
}

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
    let nextColor = grade >= 4 ? 'green' : (grade === 3 ? 'yellow' : 'red');
    let nextDueDate;

    if (grade < 3) {
        nextDueDate = Date.now() + (REVIEW_DELAY_SETTINGS.hardMinutes * 60 * 1000);
    } else if (grade === 3) {
        nextDueDate = Date.now() + (REVIEW_DELAY_SETTINGS.slowHours * 60 * 60 * 1000);
    } else {
        nextDueDate = Date.now() + (nextInterval * 24 * 60 * 60 * 1000);
    }

    return { interval: nextInterval, repetition: nextRepetition, ef: nextEf, dueDate: nextDueDate, color: nextColor };
}

function getStatusMap(contentMode = 'word') {
    return JSON.parse(localStorage.getItem(getStatusStorageKey(contentMode))) || {};
}
function shouldDefaultHidePair(pair, contentMode = 'word') {
    if (!isAlgorithmContentMode(contentMode)) return false;

    const storedValue = (getContentDict(contentMode)[pair] || '').trim();
    if (storedValue) return false;

    return !getBuiltInAlgorithm(pair, contentMode);
}
function getPairData(pair, contentMode = 'word') {
    const map = getStatusMap(contentMode);
    let data = map[pair];
    if (typeof data === 'string') {
        return { interval: (data === 'green' ? 10 : 3), repetition: 1, ef: 2.5, dueDate: Date.now(), color: data };
    }
    if (data) return data;
    if (shouldDefaultHidePair(pair, contentMode)) {
        return { interval: -1, repetition: 0, ef: 2.5, dueDate: 0, color: 'gray' };
    }
    return null;
}
function saveStatusData(pair, dataObject, contentMode = 'word') {
    const map = getStatusMap(contentMode);
    map[pair] = dataObject;
    localStorage.setItem(getStatusStorageKey(contentMode), JSON.stringify(map));
}
function getPairColor(pair, contentMode = 'word') { const data = getPairData(pair, contentMode); return data ? (data.color || 'red') : ''; }

function t(key, params = {}) { let str = translations[currentLang][key] || key; Object.keys(params).forEach(k => { str = str.replace(`{${k}}`, params[k]); }); return str; }
function getDict() { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
function saveDict(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function getFormulaDict(formulaType = 'corner') { return JSON.parse(localStorage.getItem(getContentStorageKey(formulaType))) || {}; }
function saveFormulaDict(formulaType = 'corner', dict) { localStorage.setItem(getContentStorageKey(formulaType), JSON.stringify(dict)); }
function getContentDict(contentMode = 'word') { return isAlgorithmContentMode(contentMode) ? getFormulaDict(contentMode) : getDict(); }
function saveContentDict(contentMode = 'word', dict) { return isAlgorithmContentMode(contentMode) ? saveFormulaDict(contentMode, dict) : saveDict(dict); }

function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function escapeCsvCell(value = '') {
    const stringValue = String(value ?? '');
    if (!/[",\n\r]/.test(stringValue)) return stringValue;
    return `"${stringValue.replace(/"/g, '""')}"`;
}

function sanitizeStringMap(value) {
    if (!isPlainObject(value)) return {};
    const next = {};
    Object.entries(value).forEach(([key, mapValue]) => {
        if (typeof key !== 'string' || typeof mapValue !== 'string') return;
        next[key] = mapValue;
    });
    return next;
}

function sanitizeStatusMap(value) {
    if (!isPlainObject(value)) return {};

    const next = {};
    const allowedColors = new Set(['green', 'yellow', 'red', 'gray']);

    Object.entries(value).forEach(([key, statusValue]) => {
        if (typeof key !== 'string') return;

        if (typeof statusValue === 'string') {
            if (allowedColors.has(statusValue)) next[key] = statusValue;
            return;
        }

        if (!isPlainObject(statusValue)) return;

        const color = allowedColors.has(statusValue.color) ? statusValue.color : 'red';
        next[key] = {
            interval: Number.isFinite(Number(statusValue.interval)) ? Number(statusValue.interval) : 0,
            repetition: Number.isFinite(Number(statusValue.repetition)) ? Number(statusValue.repetition) : 0,
            ef: Number.isFinite(Number(statusValue.ef)) ? Number(statusValue.ef) : SM2_SETTINGS.defaultEf,
            dueDate: Number.isFinite(Number(statusValue.dueDate)) ? Number(statusValue.dueDate) : 0,
            color
        };
    });

    return next;
}

function sanitizeChars(value) {
    if (!Array.isArray(value)) return null;

    const next = value
        .map((char) => typeof char === 'string' ? char.trim() : '')
        .filter(Boolean);

    if (next.length < 2) return null;
    if (new Set(next).size !== next.length) return null;

    return next;
}

function sanitizeTrainerRecords(value) {
    if (!Array.isArray(value)) return [];

    const allowedPenalties = new Set(['ok', 'plus2', 'dnf']);

    return value.map((record, index) => {
        if (!isPlainObject(record)) return null;

        const rawTimeMs = Number(record.rawTimeMs);
        if (!Number.isFinite(rawTimeMs) || rawTimeMs < 0) return null;

        return {
            id: typeof record.id === 'string' && record.id ? record.id : `trainer-${Date.now()}-${index}`,
            rawTimeMs,
            penalty: allowedPenalties.has(record.penalty) ? record.penalty : 'ok',
            scramble: typeof record.scramble === 'string' ? record.scramble : '',
            pair: typeof record.pair === 'string' ? record.pair : '',
            algorithm: typeof record.algorithm === 'string' ? record.algorithm : '',
            algorithmType: record.algorithmType === 'edge' ? 'edge' : 'corner',
            createdAt: Number.isFinite(Number(record.createdAt)) ? Number(record.createdAt) : Date.now()
        };
    }).filter(Boolean);
}

function normalizeBackupPayload(value) {
    if (!isPlainObject(value)) throw new Error('Invalid backup payload');

    const knownKeys = [
        'dict',
        'formulaDict',
        'cornerFormulaDict',
        'edgeFormulaDict',
        'status',
        'formulaStatus',
        'cornerFormulaStatus',
        'edgeFormulaStatus',
        'trainerRecords',
        'chars',
        'lang'
    ];
    const hasKnownKey = knownKeys.some((key) => Object.prototype.hasOwnProperty.call(value, key));
    if (!hasKnownKey) throw new Error('Unknown backup format');

    const normalizedChars = value.chars == null ? null : sanitizeChars(value.chars);
    if (value.chars != null && !normalizedChars) throw new Error('Invalid chars');

    const normalizedLang = value.lang === 'zh-TW' || value.lang === 'en' ? value.lang : null;

    return {
        dict: sanitizeStringMap(value.dict),
        cornerFormulaDict: sanitizeStringMap(value.cornerFormulaDict || value.formulaDict),
        edgeFormulaDict: sanitizeStringMap(value.edgeFormulaDict),
        status: sanitizeStatusMap(value.status),
        cornerFormulaStatus: sanitizeStatusMap(value.cornerFormulaStatus || value.formulaStatus),
        edgeFormulaStatus: sanitizeStatusMap(value.edgeFormulaStatus),
        trainerRecords: sanitizeTrainerRecords(value.trainerRecords),
        chars: normalizedChars,
        lang: normalizedLang
    };
}

function clearAppStorageData() {
    APP_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

function getTrainerRecords() {
    try {
        return sanitizeTrainerRecords(JSON.parse(localStorage.getItem(TRAINER_RECORDS_KEY)) || []);
    } catch (error) {
        return [];
    }
}

function saveTrainerRecords(records) {
    trainerRecords = records.slice(0, TRAINER_RECORDS_LIMIT);
    latestTrainerRecordId = trainerRecords[0]?.id || null;
    trainerDeleteConfirmArmed = false;
    localStorage.setItem(TRAINER_RECORDS_KEY, JSON.stringify(trainerRecords));
    renderTrainerRecords();
}

function migrateLegacyFormulaData() {
    const hasCornerFormula = !!localStorage.getItem(CORNER_FORMULA_STORAGE_KEY);
    const hasCornerStatus = !!localStorage.getItem(CORNER_FORMULA_STATUS_KEY);
    const legacyFormula = JSON.parse(localStorage.getItem(LEGACY_FORMULA_STORAGE_KEY)) || {};
    const legacyStatus = JSON.parse(localStorage.getItem(LEGACY_FORMULA_STATUS_KEY)) || {};

    if (!hasCornerFormula && Object.keys(legacyFormula).length > 0) {
        localStorage.setItem(CORNER_FORMULA_STORAGE_KEY, JSON.stringify(legacyFormula));
    }
    if (!hasCornerStatus && Object.keys(legacyStatus).length > 0) {
        localStorage.setItem(CORNER_FORMULA_STATUS_KEY, JSON.stringify(legacyStatus));
    }
}

function init() {
    const savedChars = localStorage.getItem(CHARS_KEY);
    if (savedChars) chars = JSON.parse(savedChars);
    trainerRecords = getTrainerRecords();
    latestTrainerRecordId = trainerRecords[0]?.id || null;
    migrateLegacyFormulaData();
    currentTab = document.querySelector('.view-section.active')?.id?.replace('view-', '') || 'list';
    initUI(); setupDynamicUI(); enhanceMemoryCardLayout(); applyLanguage(); updateLayoutMode();
    setupEventListeners();
    updateMemoryContentModeButtons();
    updateTrainerAlgorithmButtons();
    renderTrainerRecords();
    generateTrainerScramble({ silent: true });
}

function setupEventListeners() {
    document.addEventListener('click', function (e) { if (!e.target.closest('.dropdown-wrapper')) { closeAllDropdowns(); } });

    document.addEventListener('keydown', function (e) {
        const activeTab = document.querySelector('.view-section.active')?.id;
        if (activeTab === 'view-trainer' && handleTrainerKeyDown(e)) return;
        if (e.code === 'Space' || e.key === 'Enter') {
            if (isEditableElement(document.activeElement)) return;
            e.preventDefault(); triggerAction(activeTab);
        }
    });

    document.addEventListener('keyup', function (e) {
        const activeTab = document.querySelector('.view-section.active')?.id;
        if (activeTab === 'view-trainer') handleTrainerKeyUp(e);
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
            savePairDataDebounced(pair, e.target.value, e.target.dataset.store || getCurrentListContentMode());
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

    // Init checkboxes for Start/End in Memory and Trainer
    renderCheckboxes('mem-start-range-grid', 'mem_start');
    renderCheckboxes('mem-end-range-grid', 'mem_end');
    renderCheckboxes('trainer-start-range-grid', 'trainer_start');
    renderCheckboxes('trainer-end-range-grid', 'trainer_end');

    updateDropdownLabel('mem_start');
    updateDropdownLabel('mem_end');
    updateDropdownLabel('trainer_start');
    updateDropdownLabel('trainer_end');
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
    let cornerAlgorithmButton = document.getElementById('btn-algorithm-type-corner');
    let edgeAlgorithmButton = document.getElementById('btn-algorithm-type-edge');

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
    if (!cornerAlgorithmButton) {
        cornerAlgorithmButton = document.createElement('button');
        cornerAlgorithmButton.id = 'btn-algorithm-type-corner';
        cornerAlgorithmButton.className = 'action-btn';
    }
    if (!edgeAlgorithmButton) {
        edgeAlgorithmButton = document.createElement('button');
        edgeAlgorithmButton.id = 'btn-algorithm-type-edge';
        edgeAlgorithmButton.className = 'action-btn';
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

    cornerAlgorithmButton.onclick = () => setAlgorithmType('corner');
    cornerAlgorithmButton.innerHTML = `<span data-i18n="algorithm_corners">${t('algorithm_corners')}</span>`;

    edgeAlgorithmButton.onclick = () => setAlgorithmType('edge');
    edgeAlgorithmButton.innerHTML = `<span data-i18n="algorithm_edges">${t('algorithm_edges')}</span>`;

    if (modeRow) {
        modeRow.className = 'list-mode-switcher';
        modeRow.innerHTML = '';
        modeRow.appendChild(createListModeGroup('switch_layout', [listButton, matrixButton], 'list-mode-group-layout'));
        modeRow.appendChild(createListModeGroup('switch_content', [wordButton, algorithmButton], 'list-mode-group-content'));

        let algorithmTypeSwitcher = document.getElementById('algorithm-type-switcher');
        if (!algorithmTypeSwitcher) {
            algorithmTypeSwitcher = document.createElement('div');
            algorithmTypeSwitcher.id = 'algorithm-type-switcher';
            algorithmTypeSwitcher.className = 'algorithm-type-switcher hidden';
            modeRow.insertAdjacentElement('afterend', algorithmTypeSwitcher);
        }
        algorithmTypeSwitcher.innerHTML = '';
        algorithmTypeSwitcher.appendChild(createListModeGroup('algorithm_type', [cornerAlgorithmButton, edgeAlgorithmButton], 'algorithm-type-group'));
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
        modeRow.className = 'control-row control-row-wrap memory-mode-row';

        const wordButton = document.createElement('button');
        wordButton.id = 'btn-mem-content-word';
        wordButton.className = 'action-btn';
        wordButton.onclick = () => toggleMemoryContentMode('word');
        wordButton.setAttribute('data-i18n', 'study_word_mode');
        wordButton.innerText = t('study_word_mode');

        const cornerButton = document.createElement('button');
        cornerButton.id = 'btn-mem-content-corner';
        cornerButton.className = 'action-btn';
        cornerButton.onclick = () => toggleMemoryContentMode('corner');
        cornerButton.setAttribute('data-i18n', 'study_corner_mode');
        cornerButton.innerText = t('study_corner_mode');

        const edgeButton = document.createElement('button');
        edgeButton.id = 'btn-mem-content-edge';
        edgeButton.className = 'action-btn';
        edgeButton.onclick = () => toggleMemoryContentMode('edge');
        edgeButton.setAttribute('data-i18n', 'study_edge_mode');
        edgeButton.innerText = t('study_edge_mode');

        modeRow.appendChild(wordButton);
        modeRow.appendChild(cornerButton);
        modeRow.appendChild(edgeButton);
        memoryPanel.insertBefore(modeRow, memoryPanel.firstElementChild);
    }
}

function enhanceMemoryCardLayout() {
    const memoryCard = document.getElementById('memory-card');
    const gradingArea = document.getElementById('mem-grading-area');
    const questionEl = document.getElementById('mem-q');
    const answerEl = document.getElementById('mem-a');
    const hintEl = document.getElementById('mem-hint');

    if (!memoryCard || !gradingArea || !questionEl || !answerEl || !hintEl) return;
    if (memoryCard.querySelector('.flashcard-stage')) return;

    const stage = document.createElement('div');
    stage.className = 'flashcard-stage';

    const scene = document.createElement('div');
    scene.className = 'flashcard-3d';

    const front = document.createElement('div');
    front.className = 'flashcard-face flashcard-front';

    const back = document.createElement('div');
    back.className = 'flashcard-face flashcard-back';

    hintEl.classList.add('flashcard-subtext');
    answerEl.classList.add('flashcard-answer');

    front.appendChild(questionEl);
    front.appendChild(hintEl);
    back.appendChild(answerEl);
    back.appendChild(gradingArea);
    scene.appendChild(front);
    scene.appendChild(back);
    stage.appendChild(scene);
    memoryCard.appendChild(stage);
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
    button.style.borderColor = '';
    button.style.color = '';
    button.style.backgroundColor = '';
    button.classList.toggle('is-active', isActive);
}

function normalizeContentModes(contentModes = ['word']) {
    const modes = Array.isArray(contentModes) ? contentModes : [contentModes];
    return [...new Set(modes.filter(Boolean))];
}

function getSelectedMemoryContentModes() {
    return normalizeContentModes(currentMemoryContentModes);
}

function getMemoryStatusTargetModes(contentModes = ['word']) {
    const normalizedModes = normalizeContentModes(contentModes);
    const algorithmModes = normalizedModes.filter(isAlgorithmContentMode);
    return algorithmModes.length > 0 ? algorithmModes : normalizedModes;
}

function isMemoryContentModeActive(mode) {
    return getSelectedMemoryContentModes().includes(mode);
}

function getContentLabelKey(mode) {
    if (mode === 'corner') return 'content_corner_label';
    if (mode === 'edge') return 'content_edge_label';
    return 'content_word_label';
}

function getBuiltInAlgorithmMap(contentMode = 'corner') {
    return isAlgorithmContentMode(contentMode) ? (BUILT_IN_ALGORITHMS[contentMode] || {}) : {};
}

function getPairIndices(pair) {
    for (let startIndex = 0; startIndex < chars.length; startIndex++) {
        const startLabel = chars[startIndex];
        if (!pair.startsWith(startLabel)) continue;

        const endLabel = pair.slice(startLabel.length);
        const endIndex = chars.indexOf(endLabel);
        if (endIndex !== -1) return [startIndex, endIndex];
    }

    return [-1, -1];
}

function isSameCharPair(pair) {
    const [startIndex, endIndex] = getPairIndices(pair);
    return startIndex !== -1 && startIndex === endIndex;
}

function getBuiltInAlgorithm(pair, contentMode = 'corner') {
    if (!isAlgorithmContentMode(contentMode)) return '';

    const [startIndex, endIndex] = getPairIndices(pair);
    if (startIndex === -1 || endIndex === -1) return '';

    const value = getBuiltInAlgorithmMap(contentMode)[`${startIndex}-${endIndex}`] || '';
    if (/^not found\.?$/i.test(String(value).trim())) return '';
    return value;
}

function getAlgorithmPlaceholder(pair, contentMode = 'corner') {
    return getBuiltInAlgorithm(pair, contentMode) || t('ph_algorithm');
}

function getNoDataErrorKey(contentModes = ['word']) {
    return normalizeContentModes(contentModes).every(isAlgorithmContentMode) ? 'alert_no_algorithm_data' : 'alert_no_data';
}

function getPairContentValue(pair, contentMode, options = {}) {
    const dict = getContentDict(contentMode);
    const storedValue = (dict[pair] || '').trim();
    if (storedValue) return storedValue;

    if (isAlgorithmContentMode(contentMode)) {
        const builtInValue = options.includeBuiltIn === false ? '' : getBuiltInAlgorithm(pair, contentMode);
        if (builtInValue) return builtInValue;

        if (options.includePlaceholder && !isSameCharPair(pair)) {
            return getAlgorithmPlaceholder(pair, contentMode);
        }
    }

    return '';
}

function splitTopLevelExpression(expression, separator) {
    let depth = 0;

    for (let index = 0; index < expression.length; index++) {
        const char = expression[index];
        if (char === '[') depth += 1;
        else if (char === ']') depth -= 1;
        else if (char === separator && depth === 0) {
            return [
                expression.slice(0, index).trim(),
                expression.slice(index + 1).trim()
            ];
        }
    }

    return null;
}

function parseMoveToken(token) {
    const normalized = String(token || '').trim();
    if (!normalized) return null;

    const match = normalized.match(/^([A-Za-z]+w?)(2)?('?){0,1}$/);
    if (match) {
        const base = match[1];
        const amount = match[2] ? 2 : (match[3] ? 3 : 1);
        return { base, amount };
    }

    const altMatch = normalized.match(/^([A-Za-z]+w?)('?)(2)$/);
    if (altMatch) {
        return { base: altMatch[1], amount: 2 };
    }

    return null;
}

function normalizeMoveToken({ base, amount }) {
    if (amount === 2) return `${base}2`;
    if (amount === 3) return `${base}'`;
    return base;
}

function parseMoveSequence(sequence) {
    const normalized = String(sequence || '').trim();
    if (!normalized) return [];

    return normalized.split(/\s+/).map((token) => {
        const parsed = parseMoveToken(token);
        if (!parsed) throw new Error(`Invalid move token: ${token}`);
        return normalizeMoveToken(parsed);
    });
}

function invertMoveToken(token) {
    const parsed = parseMoveToken(token);
    if (!parsed) throw new Error(`Invalid move token: ${token}`);
    return normalizeMoveToken({
        base: parsed.base,
        amount: parsed.amount === 2 ? 2 : (parsed.amount === 3 ? 1 : 3)
    });
}

function invertMoveSequence(moves = []) {
    return moves.slice().reverse().map(invertMoveToken);
}

function mergeAdjacentSameBaseMoves(moves = []) {
    const normalized = [];

    moves.forEach((move) => {
        const parsedMove = parseMoveToken(move);
        if (!parsedMove) {
            normalized.push(move);
            return;
        }

        const currentMove = normalizeMoveToken(parsedMove);
        const lastMove = normalized[normalized.length - 1];
        const parsedLastMove = parseMoveToken(lastMove);

        if (!parsedLastMove || parsedLastMove.base !== parsedMove.base) {
            normalized.push(currentMove);
            return;
        }

        const combinedAmount = (parsedLastMove.amount + parsedMove.amount) % 4;
        normalized.pop();
        if (combinedAmount !== 0) {
            normalized.push(normalizeMoveToken({
                base: parsedMove.base,
                amount: combinedAmount
            }));
        }
    });

    return normalized;
}

function getMoveAxis(base = '') {
    const face = String(base || '').trim().charAt(0).toUpperCase();
    if (face === 'U' || face === 'D') return 'UD';
    if (face === 'R' || face === 'L') return 'RL';
    if (face === 'F' || face === 'B') return 'FB';
    return null;
}

function collapseSameAxisMoves(parsedMoves = []) {
    if (parsedMoves.length <= 1) {
        return parsedMoves.map((move) => normalizeMoveToken(move));
    }

    const amountByBase = new Map();
    const order = [];
    parsedMoves.forEach((move) => {
        if (!amountByBase.has(move.base)) {
            amountByBase.set(move.base, 0);
            order.push(move.base);
        }
        amountByBase.set(move.base, (amountByBase.get(move.base) + move.amount) % 4);
    });

    const collapsed = [];
    order.forEach((base) => {
        const amount = amountByBase.get(base);
        if (!amount) return;
        collapsed.push(normalizeMoveToken({ base, amount }));
    });
    return collapsed;
}

function normalizeTrainerScrambleMoves(moves = []) {
    const adjacentNormalized = mergeAdjacentSameBaseMoves(moves);
    const normalized = [];
    let axisBuffer = [];
    let currentAxis = null;

    const flushAxisBuffer = () => {
        if (axisBuffer.length === 0) return;
        normalized.push(...collapseSameAxisMoves(axisBuffer));
        axisBuffer = [];
        currentAxis = null;
    };

    adjacentNormalized.forEach((move) => {
        const parsedMove = parseMoveToken(move);
        if (!parsedMove) {
            flushAxisBuffer();
            normalized.push(move);
            return;
        }

        const axis = getMoveAxis(parsedMove.base);
        if (!axis) {
            flushAxisBuffer();
            normalized.push(normalizeMoveToken(parsedMove));
            return;
        }

        if (currentAxis && axis !== currentAxis) {
            flushAxisBuffer();
        }

        currentAxis = axis;
        axisBuffer.push(parsedMove);
    });

    flushAxisBuffer();
    return mergeAdjacentSameBaseMoves(normalized);
}

function expandAlgorithmExpression(expression) {
    const normalized = String(expression || '').trim();
    if (!normalized) return [];

    const conjugateParts = splitTopLevelExpression(normalized, ':');
    if (conjugateParts) {
        const setupMoves = expandAlgorithmExpression(conjugateParts[0]);
        const bodyMoves = expandAlgorithmExpression(conjugateParts[1]);
        return [...setupMoves, ...bodyMoves, ...invertMoveSequence(setupMoves)];
    }

    if (normalized.startsWith('[') && normalized.endsWith(']')) {
        const inner = normalized.slice(1, -1).trim();
        const commutatorParts = splitTopLevelExpression(inner, ',');
        if (!commutatorParts) throw new Error(`Invalid commutator: ${normalized}`);

        const aMoves = expandAlgorithmExpression(commutatorParts[0]);
        const bMoves = expandAlgorithmExpression(commutatorParts[1]);
        return [...aMoves, ...bMoves, ...invertMoveSequence(aMoves), ...invertMoveSequence(bMoves)];
    }

    return parseMoveSequence(normalized);
}

function getAvailablePairContentModes(pair, contentModes = ['word'], options = {}) {
    return normalizeContentModes(contentModes).filter((mode) => {
        const value = getPairContentValue(pair, mode, options);
        if (!value) return false;
        const status = getPairData(pair, mode);
        return !(status && status.color === 'gray');
    });
}

function formatMemoryAnswer(pair, contentModes = ['word']) {
    const answerOptions = { includePlaceholder: true };
    const availableModes = getAvailablePairContentModes(pair, contentModes, answerOptions);
    if (availableModes.length === 0) return "N/A";

    if (availableModes.length === 1) {
        return getPairContentValue(pair, availableModes[0], answerOptions);
    }

    return availableModes.map((mode) => {
        const title = t(getContentLabelKey(mode));
        const value = getPairContentValue(pair, mode, answerOptions);
        return `${title}: ${value}`;
    }).join('\n\n');
}

function isMatrixListView(mode = currentListViewMode) {
    return mode === 'matrix' || mode === 'formula-matrix';
}

function isFormulaListView(mode = currentListViewMode) {
    return mode === 'formula' || mode === 'formula-matrix';
}

function getCurrentListContentGroup(mode = currentListViewMode) {
    return isFormulaListView(mode) ? 'formula' : 'word';
}

function getCurrentListContentMode(mode = currentListViewMode) {
    return isFormulaListView(mode) ? currentAlgorithmType : 'word';
}

function getCurrentListLayoutMode(mode = currentListViewMode) {
    return isMatrixListView(mode) ? 'matrix' : 'list';
}

function buildListViewMode(layout = 'list', contentGroup = 'word') {
    if (contentGroup === 'formula') {
        return layout === 'matrix' ? 'formula-matrix' : 'formula';
    }
    return layout === 'matrix' ? 'matrix' : 'list';
}

function setListLayoutMode(layout) {
    toggleViewMode(buildListViewMode(layout, getCurrentListContentGroup()));
}

function setListContentMode(contentGroup) {
    toggleViewMode(buildListViewMode(getCurrentListLayoutMode(), contentGroup));
}

function setAlgorithmType(type) {
    currentAlgorithmType = type === 'edge' ? 'edge' : 'corner';
    toggleViewMode(currentListViewMode);
}

function renderCurrentListView() {
    if (isMatrixListView()) renderMatrix(getCurrentListContentMode());
    else if (getCurrentListContentGroup() === 'formula') renderFormulaList();
    else renderList();
}

function updateMemoryContentModeButtons() {
    setActionButtonActive(document.getElementById('btn-mem-content-word'), isMemoryContentModeActive('word'));
    setActionButtonActive(document.getElementById('btn-mem-content-corner'), isMemoryContentModeActive('corner'));
    setActionButtonActive(document.getElementById('btn-mem-content-edge'), isMemoryContentModeActive('edge'));
}

function updateTrainerAlgorithmButtons() {
    setActionButtonActive(document.getElementById('btn-trainer-type-corner'), currentTrainerAlgorithmType === 'corner');
    setActionButtonActive(document.getElementById('btn-trainer-type-edge'), currentTrainerAlgorithmType === 'edge');
}

function updateTrainerTypeBadge() {
    const badge = document.getElementById('trainer-type-badge');
    if (!badge) return;
    badge.innerText = t(currentTrainerAlgorithmType === 'edge' ? 'algorithm_edges' : 'algorithm_corners');
}

function updateAlgorithmTypeButtons() {
    setActionButtonActive(document.getElementById('btn-algorithm-type-corner'), currentAlgorithmType === 'corner');
    setActionButtonActive(document.getElementById('btn-algorithm-type-edge'), currentAlgorithmType === 'edge');
}

function toggleMemoryContentMode(mode) {
    const selectedModes = getSelectedMemoryContentModes();
    const isEdgeMode = mode === 'edge';
    const hasEdgeMode = selectedModes.includes('edge');

    if (isEdgeMode) {
        currentMemoryContentModes = hasEdgeMode && selectedModes.length === 1 ? selectedModes : ['edge'];
    } else if (selectedModes.includes(mode)) {
        const nonEdgeModes = selectedModes.filter((item) => item !== 'edge');
        if (nonEdgeModes.length === 1) return;
        currentMemoryContentModes = nonEdgeModes.filter((item) => item !== mode);
    } else {
        const baseModes = hasEdgeMode ? [] : selectedModes.filter((item) => item !== 'edge');
        currentMemoryContentModes = [...baseModes, mode];
    }

    updateMemoryContentModeButtons();
    nextMemoryCard();
}

function setTrainerAlgorithmType(type) {
    currentTrainerAlgorithmType = type === 'edge' ? 'edge' : 'corner';
    trainerDeleteConfirmArmed = false;
    updateTrainerAlgorithmButtons();
    updateTrainerTypeBadge();
    generateTrainerScramble({ silent: true, resetTimerDisplay: true });
}

function getTrainerCandidatePairs() {
    const startChars = getSelectedRanges('trainer_start');
    const endChars = getSelectedRanges('trainer_end');

    if (startChars.length === 0 || endChars.length === 0) {
        return { error: 'alert_sel_range' };
    }

    const pairs = [];
    chars.forEach((start) => {
        if (!startChars.includes(start)) return;
        chars.forEach((end) => {
            if (!endChars.includes(end)) return;

            const pair = start + end;
            if (!getPairContentValue(pair, currentTrainerAlgorithmType)) return;

            const status = getPairData(pair, currentTrainerAlgorithmType);
            if (status && status.color === 'gray') return;

            pairs.push(pair);
        });
    });

    if (pairs.length === 0) {
        return { error: 'alert_no_algorithm_data' };
    }

    return { pairs };
}

function getTrainerPairScrambleMoves(pair) {
    const algorithmText = getPairContentValue(pair, currentTrainerAlgorithmType);
    const expandedMoves = expandAlgorithmExpression(algorithmText);
    return invertMoveSequence(expandedMoves);
}

function formatTrainerCommutatorText(text = '') {
    return String(text || '')
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\s*:\s*/g, ': ')
        .replace(/\s*,\s*/g, ', ')
        .replace(/\[\s*/g, '[')
        .replace(/\s*\]/g, ']');
}

function getTrainerRecordAlgorithmText(record) {
    if (!record) return '';
    const storedAlgorithm = formatTrainerCommutatorText(record.algorithm || '');
    if (storedAlgorithm) return storedAlgorithm;

    if (!record.pair) return '';
    const fallbackAlgorithm = getPairContentValue(record.pair, record.algorithmType);
    return formatTrainerCommutatorText(fallbackAlgorithm);
}

function chooseTrainerPairFromPool(pool) {
    let nextPool = [...pool];
    if (nextPool.length > 1 && lastTrainerPair) {
        const filteredPool = nextPool.filter((pair) => pair !== lastTrainerPair);
        if (filteredPool.length > 0) nextPool = filteredPool;
    }
    return nextPool[Math.floor(Math.random() * nextPool.length)];
}

function isOuterFaceBase(base = '') {
    const face = String(base || '').trim().toUpperCase();
    return face === 'U' || face === 'D' || face === 'R' || face === 'L' || face === 'F' || face === 'B';
}

function areCommutingOppositeOuterFaceMoves(leftMove, rightMove) {
    const parsedLeft = parseMoveToken(leftMove);
    const parsedRight = parseMoveToken(rightMove);
    if (!parsedLeft || !parsedRight) return false;

    const leftBase = String(parsedLeft.base || '').toUpperCase();
    const rightBase = String(parsedRight.base || '').toUpperCase();
    if (!isOuterFaceBase(leftBase) || !isOuterFaceBase(rightBase)) return false;

    return (
        (leftBase === 'U' && rightBase === 'D') || (leftBase === 'D' && rightBase === 'U') ||
        (leftBase === 'R' && rightBase === 'L') || (leftBase === 'L' && rightBase === 'R') ||
        (leftBase === 'F' && rightBase === 'B') || (leftBase === 'B' && rightBase === 'F')
    );
}

function shuffleCommutingOppositeFaceMoves(moves = [], passes = 2) {
    const shuffledMoves = [...moves];
    const passCount = Math.max(1, Math.floor(Number(passes) || 1));

    for (let passIndex = 0; passIndex < passCount; passIndex++) {
        for (let index = 0; index < shuffledMoves.length - 1; index++) {
            if (!areCommutingOppositeOuterFaceMoves(shuffledMoves[index], shuffledMoves[index + 1])) continue;
            if (Math.random() < 0.5) {
                const current = shuffledMoves[index];
                shuffledMoves[index] = shuffledMoves[index + 1];
                shuffledMoves[index + 1] = current;
                index += 1;
            }
        }
    }

    return shuffledMoves;
}

function buildRomanTrainerScrambleMoves(baseMoves = []) {
    const normalizedMoves = normalizeTrainerScrambleMoves(baseMoves);
    if (normalizedMoves.length === 0) return normalizedMoves;

    const shuffledMoves = shuffleCommutingOppositeFaceMoves(
        normalizedMoves,
        2 + Math.floor(Math.random() * 2)
    );
    const compactMoves = mergeAdjacentSameBaseMoves(shuffledMoves);

    if (compactMoves.length > 0) return compactMoves;
    return normalizedMoves;
}

function isEditableElement(element) {
    return !!element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT' || element.isContentEditable);
}

function getTrainerNow() {
    return (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
}

function requestAnimationFrameSafe(callback) {
    if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(callback);
    return setTimeout(() => callback(getTrainerNow()), 16);
}

function cancelAnimationFrameSafe(frameId) {
    if (frameId == null) return;
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frameId);
    else clearTimeout(frameId);
}

function formatTrainerTime(rawTimeMs = 0) {
    const totalCentiseconds = Math.round(rawTimeMs / 10);
    const minutes = Math.floor(totalCentiseconds / 6000);
    const seconds = Math.floor((totalCentiseconds % 6000) / 100);
    const centiseconds = totalCentiseconds % 100;

    if (minutes > 0) {
        return `${minutes}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    }

    return `${seconds}.${String(centiseconds).padStart(2, '0')}`;
}

function getTrainerDisplayTime(record) {
    if (!record) return '0.00';
    if (record.penalty === 'dnf') return `DNF (${formatTrainerTime(record.rawTimeMs)})`;
    if (record.penalty === 'plus2') return `${formatTrainerTime(record.rawTimeMs + 2000)}+`;
    return formatTrainerTime(record.rawTimeMs);
}

function getTrainerRecordFinalTime(record) {
    if (!record) return Infinity;
    if (record.penalty === 'dnf') return Infinity;
    return record.rawTimeMs + (record.penalty === 'plus2' ? 2000 : 0);
}

function calculateTrainerAverage(count) {
    const recentRecords = trainerRecords.slice(0, count);
    if (recentRecords.length < count) return null;

    const trimCount = Math.ceil(count * 0.05);
    const times = recentRecords.map(getTrainerRecordFinalTime);
    const dnfCount = times.filter((time) => !Number.isFinite(time)).length;

    if (dnfCount > trimCount) return 'DNF';

    const sortedTimes = [...times].sort((left, right) => left - right);
    const keptTimes = sortedTimes.slice(trimCount, sortedTimes.length - trimCount);

    if (keptTimes.length === 0 || keptTimes.some((time) => !Number.isFinite(time))) {
        return 'DNF';
    }

    const averageMs = keptTimes.reduce((sum, time) => sum + time, 0) / keptTimes.length;
    return formatTrainerTime(averageMs);
}

function renderTrainerAverages() {
    TRAINER_AVERAGE_COUNTS.forEach((count) => {
        const valueEl = document.getElementById(`trainer-avg-${count}`);
        if (!valueEl) return;

        const averageValue = calculateTrainerAverage(count);
        const displayValue = averageValue ?? '--';

        valueEl.innerText = displayValue;
        valueEl.classList.toggle('is-empty', averageValue == null);
        valueEl.classList.toggle('is-dnf', averageValue === 'DNF');
    });
}

function setTrainerStatus(statusKey = 'trainer_status_idle') {
    currentTrainerStatusKey = statusKey;
    const statusEl = document.getElementById('trainer-status');
    if (statusEl) statusEl.innerText = t(statusKey);
}

function setTrainerTimerDisplay(value = '0.00') {
    const timerEl = document.getElementById('trainer-timer');
    if (timerEl) timerEl.innerText = value;
}

function updateTrainerTimerVisualState() {
    const timerEl = document.getElementById('trainer-timer');
    if (!timerEl) return;

    timerEl.classList.remove('is-holding', 'is-ready', 'is-running');
    if (trainerTimerState === 'holding') timerEl.classList.add('is-holding');
    if (trainerTimerState === 'ready') timerEl.classList.add('is-ready');
    if (trainerTimerState === 'running') timerEl.classList.add('is-running');
}

function syncTrainerTimerToLatestRecord() {
    setTrainerTimerDisplay(getTrainerDisplayTime(trainerRecords[0] || null));
    updateTrainerTimerVisualState();
}

function updateTrainerDeleteButtons() {
    const deleteBtn = document.getElementById('trainer-delete-btn');
    const confirmBtn = document.getElementById('trainer-delete-confirm-btn');
    if (!deleteBtn || !confirmBtn) return;

    deleteBtn.innerText = t(trainerDeleteConfirmArmed ? 'btn_delete_cancel' : 'btn_delete_solve');
    deleteBtn.classList.toggle('is-armed', trainerDeleteConfirmArmed);
    confirmBtn.classList.toggle('hidden', !trainerDeleteConfirmArmed);
}

function renderTrainerRecords() {
    const latestRecord = trainerRecords[0] || null;
    const penaltyShellEl = document.getElementById('trainer-penalty-shell');
    const historyEl = document.getElementById('trainer-history');

    if (penaltyShellEl) penaltyShellEl.classList.toggle('hidden', !latestRecord);

    setActionButtonActive(document.getElementById('trainer-plus2-btn'), latestRecord?.penalty === 'plus2');
    setActionButtonActive(document.getElementById('trainer-dnf-btn'), latestRecord?.penalty === 'dnf');
    updateTrainerDeleteButtons();

    if (historyEl) {
        historyEl.innerHTML = '';

        if (!latestRecord) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'trainer-history-empty';
            emptyEl.innerText = t('trainer_history_empty');
            historyEl.appendChild(emptyEl);
        } else {
            const fragment = document.createDocumentFragment();
            trainerRecords.slice(0, TRAINER_HISTORY_PREVIEW_LIMIT).forEach((record, index) => {
                const itemEl = document.createElement('div');
                itemEl.className = `trainer-history-item${index === 0 ? ' is-latest' : ''}`;

                const headEl = document.createElement('div');
                headEl.className = 'trainer-history-head';

                const timeEl = document.createElement('div');
                timeEl.className = 'trainer-history-time';
                timeEl.innerText = getTrainerDisplayTime(record);

                const metaEl = document.createElement('div');
                metaEl.className = 'trainer-history-meta';
                const metaParts = [];
                if (record.pair) metaParts.push(record.pair.toUpperCase());
                metaParts.push(t(record.algorithmType === 'edge' ? 'algorithm_edges' : 'algorithm_corners'));
                const algorithmText = getTrainerRecordAlgorithmText(record);
                if (algorithmText) metaParts.push(algorithmText);
                metaEl.innerText = metaParts.join(' / ');
                if (record.scramble) itemEl.title = record.scramble;

                headEl.appendChild(timeEl);
                headEl.appendChild(metaEl);
                itemEl.appendChild(headEl);
                fragment.appendChild(itemEl);
            });
            historyEl.appendChild(fragment);
        }
    }

    renderTrainerAverages();

    if (trainerTimerState === 'idle') syncTrainerTimerToLatestRecord();
}

function stopTrainerHold() {
    if (trainerHoldTimeoutId) {
        clearTimeout(trainerHoldTimeoutId);
        trainerHoldTimeoutId = null;
    }
}

function stopTrainerAnimation() {
    cancelAnimationFrameSafe(trainerAnimationFrameId);
    trainerAnimationFrameId = null;
}

function resetTrainerTimerState(options = {}) {
    stopTrainerHold();
    stopTrainerAnimation();
    trainerStartTimestamp = 0;
    trainerTimerState = 'idle';
    updateTrainerTimerVisualState();
    if (options.keepStatus !== true) setTrainerStatus(options.statusKey || 'trainer_status_idle');
    if (options.resetTimerDisplay === true) syncTrainerTimerToLatestRecord();
}

function tickTrainerTimer() {
    if (trainerTimerState !== 'running') return;
    setTrainerTimerDisplay(formatTrainerTime(getTrainerNow() - trainerStartTimestamp));
    trainerAnimationFrameId = requestAnimationFrameSafe(tickTrainerTimer);
}

function startTrainerTimer() {
    stopTrainerHold();
    trainerTimerState = 'running';
    trainerStartTimestamp = getTrainerNow();
    setTrainerStatus('trainer_status_running');
    setTrainerTimerDisplay('0.00');
    updateTrainerTimerVisualState();
    stopTrainerAnimation();
    trainerAnimationFrameId = requestAnimationFrameSafe(tickTrainerTimer);
}

function stopTrainerTimer() {
    if (trainerTimerState !== 'running') return;

    const rawTimeMs = Math.max(0, Math.round(getTrainerNow() - trainerStartTimestamp));
    stopTrainerAnimation();
    trainerTimerState = 'idle';
    updateTrainerTimerVisualState();

    const recordAlgorithm = currentTrainerPair
        ? formatTrainerCommutatorText(getPairContentValue(currentTrainerPair, currentTrainerAlgorithmType))
        : '';

    const nextRecord = {
        id: `trainer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        rawTimeMs,
        penalty: 'ok',
        scramble: currentTrainerScramble,
        pair: currentTrainerPair || '',
        algorithm: recordAlgorithm,
        algorithmType: currentTrainerAlgorithmType,
        createdAt: Date.now()
    };

    saveTrainerRecords([nextRecord, ...trainerRecords]);
    setTrainerStatus('trainer_status_stopped');
    setTrainerTimerDisplay(getTrainerDisplayTime(nextRecord));
    generateTrainerScramble({ silent: true, preserveStatus: true });
}

function toggleTrainerPenalty(penalty) {
    if (!latestTrainerRecordId) return;

    const nextRecords = trainerRecords.map((record) => {
        if (record.id !== latestTrainerRecordId) return record;
        return {
            ...record,
            penalty: record.penalty === penalty ? 'ok' : penalty
        };
    });

    saveTrainerRecords(nextRecords);
    setTrainerStatus('trainer_status_stopped');
}

function toggleTrainerDeleteConfirm() {
    if (!latestTrainerRecordId) return;
    trainerDeleteConfirmArmed = !trainerDeleteConfirmArmed;
    updateTrainerDeleteButtons();
    setTrainerStatus(trainerDeleteConfirmArmed ? 'trainer_status_delete_confirm' : 'trainer_status_stopped');
}

function confirmDeleteLatestTrainerRecord() {
    if (!latestTrainerRecordId) return;
    saveTrainerRecords(trainerRecords.filter((record) => record.id !== latestTrainerRecordId));
    setTrainerStatus(currentTrainerScramble ? 'trainer_status_idle' : 'trainer_status_no_scramble');
}

function handleTrainerKeyDown(event) {
    if (isEditableElement(document.activeElement)) return false;

    if (trainerTimerState === 'running') {
        if (event.repeat) return true;
        event.preventDefault();
        stopTrainerTimer();
        return true;
    }

    if (event.code !== 'Space') return false;

    event.preventDefault();
    if (event.repeat) return true;

    if (trainerTimerState === 'idle') {
        if (!currentTrainerScramble) {
            generateTrainerScramble();
        } else {
            startTrainerTimer();
        }
    }

    return true;
}

function handleTrainerKeyUp(event) {
    if (event.code !== 'Space') return false;
    if (isEditableElement(document.activeElement)) return false;
    return false;
}

function resetTrainerView(options = {}) {
    stopTrainerHold();
    stopTrainerAnimation();
    trainerTimerState = 'idle';
    currentTrainerPair = null;
    currentTrainerScramble = '';

    const scrambleEl = document.getElementById('trainer-scramble');
    const feedbackEl = document.getElementById('trainer-feedback');
    if (scrambleEl) scrambleEl.innerText = t('trainer_scramble_placeholder');
    if (feedbackEl) feedbackEl.innerText = t('trainer_scramble_hint');

    if (options.showNoScramble) {
        setTrainerStatus('trainer_status_no_scramble');
    } else {
        setTrainerStatus('trainer_status_idle');
    }
    if (options.resetTimerDisplay !== false) syncTrainerTimerToLatestRecord();
}

function generateTrainerScramble(options = {}) {
    if (trainerTimerState === 'running') return;
    if (trainerDeleteConfirmArmed) {
        trainerDeleteConfirmArmed = false;
        updateTrainerDeleteButtons();
    }

    resetTrainerTimerState({
        keepStatus: true,
        resetTimerDisplay: options.resetTimerDisplay !== false
    });

    const result = getTrainerCandidatePairs();
    if (result.error) {
        resetTrainerView({ showNoScramble: true, resetTimerDisplay: options.resetTimerDisplay !== false });
        if (!options.silent) alert(t(result.error));
        return;
    }

    const pairMovesMap = {};
    const validPairs = [];
    result.pairs.forEach((pair) => {
        try {
            const moves = getTrainerPairScrambleMoves(pair);
            if (moves.length === 0) return;
            pairMovesMap[pair] = moves;
            validPairs.push(pair);
        } catch (error) {
            // Ignore invalid algorithms so one bad entry does not block all scramble generation.
        }
    });

    if (validPairs.length === 0) {
        resetTrainerView({ showNoScramble: true, resetTimerDisplay: options.resetTimerDisplay !== false });
        if (!options.silent) alert(t('alert_invalid_algorithm_format'));
        return;
    }

    const pair = chooseTrainerPairFromPool(validPairs);
    const scrambleMoves = buildRomanTrainerScrambleMoves(pairMovesMap[pair] || []);

    if (!scrambleMoves || scrambleMoves.length === 0) {
        resetTrainerView({ showNoScramble: true, resetTimerDisplay: options.resetTimerDisplay !== false });
        if (!options.silent) alert(t('alert_invalid_algorithm_format'));
        return;
    }

    currentTrainerPair = pair;
    currentTrainerScramble = scrambleMoves.join(' ');
    lastTrainerPair = pair;

    document.getElementById('trainer-scramble').innerText = currentTrainerScramble;
    document.getElementById('trainer-feedback').innerText = t('trainer_scramble_hint');
    if (options.preserveStatus !== true) setTrainerStatus('trainer_status_idle');
}

function toggleViewMode(mode) {
    currentListViewMode = mode;
    isMatrixMode = isMatrixListView(mode);
    const listBtn = document.getElementById('btn-mode-list');
    const matrixBtn = document.getElementById('btn-mode-matrix');
    const wordBtn = document.getElementById('btn-mode-content-word');
    const formulaBtn = document.getElementById('btn-mode-content-formula');
    const algorithmTypeSwitcher = document.getElementById('algorithm-type-switcher');
    const listControls = document.getElementById('list-mode-controls');
    const formulaHint = document.getElementById('formula-mode-hint');
    const matrixSettings = document.getElementById('matrix-settings');
    const gridArea = document.getElementById('grid-area');
    const formulaArea = document.getElementById('formula-area');
    const matrixArea = document.getElementById('matrix-area');
    const matrixFooter = document.getElementById('matrix-footer');
    const container = document.getElementById('main-container');
    const currentLayout = getCurrentListLayoutMode(mode);
    const currentContentGroup = getCurrentListContentGroup(mode);
    const currentContent = getCurrentListContentMode(mode);

    setActionButtonActive(listBtn, currentLayout === 'list');
    setActionButtonActive(matrixBtn, currentLayout === 'matrix');
    setActionButtonActive(wordBtn, currentContentGroup === 'word');
    setActionButtonActive(formulaBtn, currentContentGroup === 'formula');
    updateAlgorithmTypeButtons();

    if (algorithmTypeSwitcher) {
        algorithmTypeSwitcher.classList.toggle('hidden', currentContentGroup !== 'formula');
    }

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
    } else if (currentContentGroup === 'formula') {
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
    const contentMode = getCurrentListContentMode();
    const formulaDict = getContentDict(contentMode);
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
        textarea.dataset.store = contentMode;
        textarea.rows = 3;
        textarea.placeholder = getAlgorithmPlaceholder(pair, contentMode);

        const stColor = getPairColor(pair, contentMode);
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
    if (matrixWrapper) matrixWrapper.classList.toggle('formula-matrix-mode', isAlgorithmContentMode(contentMode));

    // [修改] 渲染時清空選取
    selectedMatrixPairs.clear();
    updateMatrixToolbar();

    const rows = [];
    const escapeHtmlAttribute = (value = '') => value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const escapeHtmlText = (value = '') => value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

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
            const placeholder = isAlgorithmContentMode(contentMode) ? getAlgorithmPlaceholder(pair, contentMode) : '';
            const inputMarkup = isAlgorithmContentMode(contentMode)
                ? `<textarea class="matrix-input" data-pair="${escapeHtmlAttribute(pair)}" data-store="${escapeHtmlAttribute(contentMode)}" placeholder="${escapeHtmlAttribute(placeholder)}" rows="3">${escapeHtmlText(val)}</textarea>`
                : `<input class="matrix-input" value="${escapeHtmlAttribute(val)}" data-pair="${escapeHtmlAttribute(pair)}" data-store="${escapeHtmlAttribute(contentMode)}">`;

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
        if (statusType === 'gray' && contentMode === 'word') {
            saveStatusData(pair, newData, 'corner');
        }

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
    setMemoryCardFlipped(isMemAnswerShown);
    updateDropdownLabel('mem_start'); updateDropdownLabel('mem_end');
    updateDropdownLabel('trainer_start'); updateDropdownLabel('trainer_end');
    updateMemoryContentModeButtons();
    updateTrainerAlgorithmButtons();
    updateTrainerTypeBadge();
    document.getElementById('trainer-feedback').innerText = t('trainer_scramble_hint');
    if (!currentTrainerScramble) document.getElementById('trainer-scramble').innerText = t('trainer_scramble_placeholder');
    setTrainerStatus(currentTrainerStatusKey);
    renderTrainerRecords();
    toggleViewMode(currentListViewMode);
}

function setMemoryCardFlipped(isFlipped) {
    const memoryCard = document.getElementById('memory-card');
    const hintEl = document.getElementById('mem-hint');
    if (memoryCard) memoryCard.classList.toggle('is-flipped', isFlipped);
    if (hintEl) hintEl.classList.toggle('is-hidden', isFlipped);
}

function updateMemoryAnswerSize(answerEl, answerText = '') {
    if (!answerEl) return;

    const normalizedText = String(answerText ?? '').trim();
    const compactText = normalizedText.replace(/\s+/g, ' ');
    const lineLengths = normalizedText.split('\n').map((line) => line.trim().length);
    const longestLine = lineLengths.length > 0 ? Math.max(...lineLengths) : 0;
    const totalLength = compactText.length;

    answerEl.classList.remove('answer-size-short', 'answer-size-medium', 'answer-size-long', 'answer-size-dense');

    if (longestLine <= 8 && totalLength <= 18) {
        answerEl.classList.add('answer-size-short');
    } else if (longestLine <= 22 && totalLength <= 52) {
        answerEl.classList.add('answer-size-medium');
    } else if (longestLine <= 38 && totalLength <= 90) {
        answerEl.classList.add('answer-size-long');
    } else {
        answerEl.classList.add('answer-size-dense');
    }
}

function setDropdownOpenState(content, isOpen) {
    if (!content) return;
    content.classList.toggle('show', isOpen);
    const wrapper = content.closest('.dropdown-wrapper');
    if (wrapper) wrapper.classList.toggle('is-open', isOpen);
    const toggleButton = wrapper?.querySelector('.dropdown-toggle-btn');
    if (toggleButton) toggleButton.setAttribute('aria-expanded', String(isOpen));
}

function toggleDropdown(id) {
    const content = document.getElementById(`${id}-content`);
    if (!content) return;
    const isShown = content.classList.contains('show');
    closeAllDropdowns();
    if (!isShown) setDropdownOpenState(content, true);
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-content').forEach(el => setDropdownOpenState(el, false));
}

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
        label.className = 'checkbox-chip';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = c;
        input.name = inputName + '_range'; // ex: mem_start_range
        input.checked = true;
        input.onchange = () => {
            updateDropdownLabel(inputName);
            handleRangeSelectionChange(inputName);
        };
        label.appendChild(input);
        label.appendChild(document.createTextNode(c.toUpperCase()));
        container.appendChild(label);
    });
}
function toggleAll(inputName, state) {
    document.querySelectorAll(`input[name="${inputName}_range"]`).forEach(input => input.checked = state);
    updateDropdownLabel(inputName);
    handleRangeSelectionChange(inputName);
}
function getSelectedRanges(inputName) {
    return Array.from(document.querySelectorAll(`input[name="${inputName}_range"]:checked`)).map(i => i.value);
}

function handleRangeSelectionChange(inputName) {
    if (!inputName.startsWith('trainer_')) return;
    generateTrainerScramble({ silent: true, resetTimerDisplay: true });
}

function triggerAction(tabId) {
    if (tabId === 'view-memory') {
        if (isMemAnswerShown) nextMemoryCard(); else toggleMemoryAnswer();
    } else if (tabId === 'view-trainer') {
        generateTrainerScramble();
    }
}

function switchTab(tab) {
    if (tab === currentTab) return;

    closeAllDropdowns();
    const currentIndex = TAB_ORDER.indexOf(currentTab);
    const nextIndex = TAB_ORDER.indexOf(tab);
    const enterClass = nextIndex >= currentIndex ? 'tab-enter-forward' : 'tab-enter-backward';

    document.querySelectorAll('.view-section').forEach(e => e.classList.remove('active', 'tab-enter-forward', 'tab-enter-backward'));
    document.querySelectorAll('.nav-btn').forEach(e => e.classList.remove('active'));
    const nextSection = document.getElementById(`view-${tab}`);
    nextSection.classList.add('active');
    void nextSection.offsetWidth;
    nextSection.classList.add(enterClass);
    const btnIndex = { 'list': 0, 'memory': 1, 'trainer': 2, 'data': 3 };
    document.querySelectorAll('.nav-btn')[btnIndex[tab]].classList.add('active');
    const container = document.getElementById('main-container');
    if (tab === 'list' && isMatrixListView()) container.classList.add('wide-mode'); else container.classList.remove('wide-mode');
    currentTab = tab;
    if (tab === 'list') renderCurrentListView();
    if (tab === 'memory') nextMemoryCard();
    if (tab === 'trainer') {
        generateTrainerScramble({ silent: true });
        applyLanguage();
    }
}

function resetAllColors(targetColor = 'all') {
    if (confirm(t('alert_reset'))) {
        const contentMode = getCurrentListContentMode();
        const statusKey = getStatusStorageKey(contentMode);

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
    const selectedModes = getMemoryStatusTargetModes(getAvailablePairContentModes(
        currentPair,
        getSelectedMemoryContentModes(),
        { includePlaceholder: true }
    ));
    if (selectedModes.length === 0) return;
    selectedModes.forEach((mode) => {
        const currentData = getPairData(currentPair, mode);
        const newData = calculateNextReview(currentData, grade);
        saveStatusData(currentPair, newData, mode);
    });
    nextMemoryCard();
}

function getPairDueDate(pair, contentModes = ['word']) {
    const normalizedModes = normalizeContentModes(contentModes);
    const dueDates = normalizedModes.map((mode) => {
        const status = getPairData(pair, mode);
        if (!status) return 0;

        const dueDate = Number(status.dueDate);
        return Number.isFinite(dueDate) ? dueDate : 0;
    });

    return dueDates.length > 0 ? Math.min(...dueDates) : 0;
}

function getStudyCandidatePool(mode, contentModes = ['word']) {
    const startChars = getSelectedRanges(`${mode}_start`);
    const endChars = getSelectedRanges(`${mode}_end`);
    const normalizedModes = normalizeContentModes(contentModes);
    const contentValueOptions = mode === 'mem' ? { includePlaceholder: true } : {};
    const requireAllModes = mode === 'mem' && normalizedModes.length > 1;
    const now = Date.now();

    if (startChars.length === 0 || endChars.length === 0) return { error: 'alert_sel_range' };

    const candidates = [];

    chars.forEach(start => {
        if (!startChars.includes(start)) return;
        chars.forEach(end => {
            if (!endChars.includes(end)) return;

            const pair = start + end;
            const availableModes = getAvailablePairContentModes(pair, normalizedModes, contentValueOptions);
            if (availableModes.length === 0) return;
            if (requireAllModes && availableModes.length !== normalizedModes.length) return;

            candidates.push({
                pair,
                dueDate: getPairDueDate(pair, availableModes)
            });
        });
    });

    if (candidates.length === 0) {
        return { error: getNoDataErrorKey(normalizedModes) };
    }

    const dueCandidates = candidates.filter((candidate) => candidate.dueDate <= now);
    const activeCandidates = dueCandidates.length > 0 ? dueCandidates : candidates;
    const earliestDueDate = Math.min(...activeCandidates.map((candidate) => candidate.dueDate));
    const pool = activeCandidates
        .filter((candidate) => candidate.dueDate === earliestDueDate)
        .map((candidate) => candidate.pair);

    return {
        pool,
        dueDate: earliestDueDate,
        hasDueCandidates: dueCandidates.length > 0,
        candidates
    };
}


function nextMemoryCard() {
    const result = getStudyCandidatePool('mem', getSelectedMemoryContentModes());
    if (result.error) {
        currentPair = null;
        document.getElementById('mem-q').innerText = '--';
        document.getElementById('mem-a').innerText = '';
        document.getElementById('mem-a').classList.remove('show', 'answer-size-short', 'answer-size-medium', 'answer-size-long', 'answer-size-dense');
        document.getElementById('mem-grading-area').classList.add('hidden');
        setMemoryCardFlipped(false);
        isMemAnswerShown = false;
        alert(t(result.error));
        return;
    }

    let pool = result.pool;
    if (!result.hasDueCandidates && Array.isArray(result.candidates) && recentMemPairs.length > 0) {
        const recentSet = new Set(recentMemPairs.slice(-MEMORY_REPEAT_GAP));
        const eligibleCandidates = result.candidates.filter((candidate) => !recentSet.has(candidate.pair));

        if (eligibleCandidates.length > 0) {
            const earliestEligibleDueDate = Math.min(...eligibleCandidates.map((candidate) => candidate.dueDate));
            pool = eligibleCandidates
                .filter((candidate) => candidate.dueDate === earliestEligibleDueDate)
                .map((candidate) => candidate.pair);
        }
    }

    if (pool.length > 1 && lastMemPair) pool = pool.filter(p => p !== lastMemPair);

    currentPair = pool[Math.floor(Math.random() * pool.length)];
    lastMemPair = currentPair;
    recentMemPairs.push(currentPair);
    if (recentMemPairs.length > MEMORY_REPEAT_GAP) recentMemPairs = recentMemPairs.slice(-MEMORY_REPEAT_GAP);

    document.getElementById('mem-q').innerText = currentPair.toUpperCase();
    document.getElementById('mem-a').classList.remove('show', 'answer-size-short', 'answer-size-medium', 'answer-size-long', 'answer-size-dense');
    document.getElementById('mem-grading-area').classList.add('hidden');
    setMemoryCardFlipped(false);

    isMemAnswerShown = false; applyLanguage();
}

function toggleMemoryAnswer() {
    if (!currentPair || isMemAnswerShown) return;
    const answerEl = document.getElementById('mem-a');
    const answerText = formatMemoryAnswer(currentPair, getSelectedMemoryContentModes());
    answerEl.innerText = answerText;
    updateMemoryAnswerSize(answerEl, answerText);

    answerEl.classList.add('show');
    document.getElementById('mem-grading-area').classList.remove('hidden');
    setMemoryCardFlipped(true);
    isMemAnswerShown = true; applyLanguage();
}

function exportData() {
    const exportType = document.getElementById('export-type').value;
    const dict = getDict();
    const cornerFormulaDict = getFormulaDict('corner');
    const edgeFormulaDict = getFormulaDict('edge');

    if (exportType === 'csv') {
        let csvContent = "\ufeff";
        csvContent += "," + chars.map(escapeCsvCell).join(",") + "\n";
        chars.forEach(rowChar => {
            let row = [escapeCsvCell(rowChar)];
            chars.forEach(colChar => {
                const pair = rowChar + colChar;
                if (rowChar === colChar) {
                    row.push("");
                } else {
                    row.push(escapeCsvCell(dict[pair] || ""));
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
        URL.revokeObjectURL(url);

    } else {
        const statusMap = getStatusMap();
        const cornerFormulaStatusMap = getStatusMap('corner');
        const edgeFormulaStatusMap = getStatusMap('edge');
        const cleanDict = {};
        const cleanCornerFormulaDict = {};
        const cleanEdgeFormulaDict = {};
        const cleanStatus = {};
        const cleanCornerFormulaStatus = {};
        const cleanEdgeFormulaStatus = {};

        chars.forEach(start => {
            chars.forEach(end => {
                const pair = start + end;
                if (dict[pair]) {
                    cleanDict[pair] = dict[pair];
                    if (statusMap[pair]) cleanStatus[pair] = statusMap[pair];
                }
                if (cornerFormulaDict[pair]) {
                    cleanCornerFormulaDict[pair] = cornerFormulaDict[pair];
                    if (cornerFormulaStatusMap[pair]) cleanCornerFormulaStatus[pair] = cornerFormulaStatusMap[pair];
                }
                if (edgeFormulaDict[pair]) {
                    cleanEdgeFormulaDict[pair] = edgeFormulaDict[pair];
                    if (edgeFormulaStatusMap[pair]) cleanEdgeFormulaStatus[pair] = edgeFormulaStatusMap[pair];
                }
            });
        });

        const blob = new Blob([JSON.stringify({
            dict: cleanDict,
            formulaDict: cleanCornerFormulaDict,
            cornerFormulaDict: cleanCornerFormulaDict,
            edgeFormulaDict: cleanEdgeFormulaDict,
            status: cleanStatus,
            formulaStatus: cleanCornerFormulaStatus,
            cornerFormulaStatus: cleanCornerFormulaStatus,
            edgeFormulaStatus: cleanEdgeFormulaStatus,
            trainerRecords,
            chars: chars,
            lang: currentLang
        })], { type: "application/json" });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

function importData() {
    const fileInput = document.getElementById('file-input');
    const f = fileInput.files[0];
    if (!f) return; const r = new FileReader(); r.onload = (e) => {
        try {
            const parsedData = JSON.parse(e.target.result);
            const normalizedData = normalizeBackupPayload(parsedData);

            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedData.dict));
            localStorage.setItem(CORNER_FORMULA_STORAGE_KEY, JSON.stringify(normalizedData.cornerFormulaDict));
            localStorage.setItem(EDGE_FORMULA_STORAGE_KEY, JSON.stringify(normalizedData.edgeFormulaDict));
            localStorage.setItem(STATUS_KEY, JSON.stringify(normalizedData.status));
            localStorage.setItem(CORNER_FORMULA_STATUS_KEY, JSON.stringify(normalizedData.cornerFormulaStatus));
            localStorage.setItem(EDGE_FORMULA_STATUS_KEY, JSON.stringify(normalizedData.edgeFormulaStatus));
            localStorage.setItem(TRAINER_RECORDS_KEY, JSON.stringify(normalizedData.trainerRecords));
            trainerRecords = normalizedData.trainerRecords;
            latestTrainerRecordId = trainerRecords[0]?.id || null;

            if (normalizedData.chars) {
                chars = normalizedData.chars;
                localStorage.setItem(CHARS_KEY, JSON.stringify(chars));
            }

            if (normalizedData.lang) {
                currentLang = normalizedData.lang;
                localStorage.setItem(LANG_KEY, currentLang);
            }

            fileInput.value = '';
            alert(t('alert_import_success'));
            initUI();
            applyLanguage();
            updateLayoutMode();
            renderCurrentListView();
            renderTrainerRecords();
            generateTrainerScramble({ silent: true, resetTimerDisplay: true });
        } catch (err) {
            fileInput.value = '';
            alert(t('alert_import_error'));
        }
    };
    r.readAsText(f);
}
function clearAllData() {
    if (confirm(t('alert_reset'))) {
        clearAppStorageData();
        location.reload();
    }
}
