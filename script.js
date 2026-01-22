const CHARS_ZH = ['ㄅ','ㄆ','ㄇ','ㄈ','ㄉ','ㄊ','ㄋ','ㄌ','ㄍ','ㄎ','ㄏ','ㄐ','ㄑ','ㄒ','ㄓ','ㄔ','ㄕ','ㄖ','ㄗ','ㄘ','ㄙ','ㄧ','ㄨ','ㄩ'];
const CHARS_EN = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X'];
let chars = [...CHARS_ZH];
const STORAGE_KEY = 'bld_custom_dict_v3'; const STATUS_KEY = 'bld_status_v1'; const LANG_KEY = 'bld_lang_v1'; const CHARS_KEY = 'bld_chars_v1';
let currentPair = null; let isMemAnswerShown = false; let testStartTime = 0; let isWaitingTestNext = true; let timerInterval = null; let lastMemPair = null; let lastTestPair = null;
let currentLang = localStorage.getItem(LANG_KEY) || 'zh-TW';
let isMatrixMode = false;

const translations = {
    'zh-TW': {
        nav_list: "列表輸入", nav_mem: "記憶翻牌", nav_test: "打字測驗", nav_data: "資料備份",
        lbl_start_char: "開頭代碼：", btn_reset_color: "🔄 重置所有顏色",
        lbl_range: "選擇範圍：", lbl_test_range: "測驗範圍：", btn_next: "下一題 (Space)", btn_start_test: "開始測驗 (Space)", 
        btn_submit: "提交 (Enter)", ph_input: "輸入後按 Enter", title_backup: "資料備份與還原", btn_export: "下載備份", 
        btn_import: "確認匯入", btn_clear_all: "清空所有資料", hint_matrix_edit: "提示：點擊表頭可修改代碼",
        btn_reset_chars: "回復預設", mode_card: "列表模式", mode_matrix: "全表模式", btn_same: "同",
        alert_chars_empty: "輸入不能為空！", alert_reset: "確定重置？", alert_reset_done: "已重置", 
        opt_start: " 開頭", sel_full: "全範圍", sel_none: "未選擇", sel_count: "已選 {n} 個", sel_prefix: "已選：",
        hint_click_flip: "點擊卡片翻牌", fb_empty: "空白跳過", fb_wrong: "不熟", fb_slow: "猶豫", fb_good: "熟練",
        ans_prefix: "答案：", alert_no_data: "請先輸入資料！", alert_sel_range: "請選擇範圍", alert_import_success: "匯入成功", alert_import_error: "格式錯誤"
    },
    'en': {
        nav_list: "List Input", nav_mem: "Flashcards", nav_test: "Typing Test", nav_data: "Backup",
        lbl_start_char: "Start Code:", btn_reset_color: "🔄 Reset Colors",
        lbl_range: "Select Range:", lbl_test_range: "Test Range:", btn_next: "Next (Space)", btn_start_test: "Start Test (Space)",
        btn_submit: "Submit (Enter)", ph_input: "Type & Enter", title_backup: "Backup & Restore", btn_export: "Download Backup",
        btn_import: "Import", btn_clear_all: "Clear All Data", hint_matrix_edit: "Click header to edit code",
        btn_reset_chars: "Reset Default", mode_card: "List Mode", mode_matrix: "Matrix Mode", btn_same: "Same",
        alert_chars_empty: "Cannot be empty!", alert_reset: "Are you sure?", alert_reset_done: "Reset done.",
        opt_start: " Start", sel_full: "All", sel_none: "None", sel_count: "{n} selected", sel_prefix: "Sel: ",
        hint_click_flip: "Click to flip", fb_empty: "Skipped", fb_wrong: "Hard", fb_slow: "Slow", fb_good: "Good",
        ans_prefix: "Ans: ", alert_no_data: "No data!", alert_sel_range: "Select range", alert_import_success: "Success", alert_import_error: "Error"
    }
};

function t(key, params = {}) { let str = translations[currentLang][key] || key; Object.keys(params).forEach(k => { str = str.replace(`{${k}}`, params[k]); }); return str; }
function getDict() { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
function saveDict(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function getStatus() { return JSON.parse(localStorage.getItem(STATUS_KEY)) || {}; }
function saveStatus(pair, status) { const s = getStatus(); s[pair] = status; localStorage.setItem(STATUS_KEY, JSON.stringify(s)); }

function init() {
    const savedChars = localStorage.getItem(CHARS_KEY);
    if (savedChars) chars = JSON.parse(savedChars);
    initUI(); applyLanguage();
    updateLayoutMode();
    
    document.addEventListener('click', function(e) { if (!e.target.closest('.dropdown-wrapper')) { closeAllDropdowns(); } });
    document.getElementById('test-input').addEventListener('keydown', function(e) { if(e.key === 'Enter') { e.stopPropagation(); checkTestAnswer(); } });
    document.addEventListener('keydown', function(e) {
        const activeTab = document.querySelector('.view-section.active').id;
        if (e.code === 'Space' || e.key === 'Enter') {
            if(document.activeElement.tagName === 'INPUT' && !isWaitingTestNext && activeTab === 'view-test') return;
            if(document.activeElement.tagName === 'INPUT' && document.activeElement.id !== 'test-input') return; 
            e.preventDefault(); triggerAction(activeTab);
        }
    });
    renderList();
}

function updateLayoutMode() {
    if(chars.includes('A')) {
        document.body.classList.remove('mode-zh');
        document.body.classList.add('mode-en');
    } else {
        document.body.classList.remove('mode-en');
        document.body.classList.add('mode-zh');
    }
}

function initUI() {
    const listSel = document.getElementById('char-select'); listSel.innerHTML = '';
    chars.forEach(c => { let opt1 = document.createElement('option'); opt1.value = c; opt1.innerText = `${c}`; listSel.appendChild(opt1); });
    renderCheckboxes('mem-range-grid', 'mem'); renderCheckboxes('test-range-grid', 'test');
    updateDropdownLabel('mem'); updateDropdownLabel('test');
}

function toggleViewMode(mode) {
    isMatrixMode = (mode === 'matrix');
    const listBtn = document.getElementById('btn-mode-list');
    const matrixBtn = document.getElementById('btn-mode-matrix');
    const listControls = document.getElementById('list-mode-controls');
    const matrixSettings = document.getElementById('matrix-settings'); 
    const gridArea = document.getElementById('grid-area');
    const matrixArea = document.getElementById('matrix-area');
    const container = document.getElementById('main-container');

    if(isMatrixMode) {
        container.classList.add('wide-mode');
        listBtn.style.borderColor = "#cbd5e1"; listBtn.style.color = "#64748b";
        matrixBtn.style.borderColor = "var(--primary-color)"; matrixBtn.style.color = "var(--primary-color";
        listControls.classList.add('hidden'); matrixSettings.classList.remove('hidden'); 
        gridArea.classList.add('hidden'); matrixArea.classList.remove('hidden');
        renderMatrix();
    } else {
        container.classList.remove('wide-mode');
        matrixBtn.style.borderColor = "#cbd5e1"; matrixBtn.style.color = "#64748b";
        listBtn.style.borderColor = "var(--primary-color)"; listBtn.style.color = "var(--primary-color)";
        listControls.classList.remove('hidden'); matrixSettings.classList.add('hidden'); 
        gridArea.classList.remove('hidden'); matrixArea.classList.add('hidden');
        renderList();
    }
}

function renderList() {
    const startChar = document.getElementById('char-select').value;
    const container = document.getElementById('grid-area');
    const dict = getDict(); const statusMap = getStatus();
    container.innerHTML = ''; 
    chars.forEach((endChar) => {
        if (startChar === endChar) return; 
        const pair = startChar + endChar;
        const div = document.createElement('div'); div.className = 'pair-item';
        div.innerHTML = `<div class="pair-label">${pair}</div>`;
        const input = document.createElement('input'); input.className = 'pair-input';
        const st = statusMap[pair];
        if(st === 'green') input.classList.add('status-green');
        else if(st === 'yellow') input.classList.add('status-yellow');
        else if(st === 'red') input.classList.add('status-red');
        input.value = dict[pair] || "";
        input.oninput = function() { const d = getDict(); d[pair] = this.value.trim(); saveDict(d); };
        div.appendChild(input); container.appendChild(div);
    });
}

function renderMatrix() {
    const table = document.getElementById('full-matrix');
    const dict = getDict();
    const statusMap = getStatus();
    
    let html = '<thead><tr><th></th>';
    chars.forEach((c, index) => {
        html += `<th><input value="${c}" onchange="updateGlobalChar(${index}, this.value)" class="header-input char-idx-${index}"></th>`;
    });
    html += '</tr></thead><tbody>';

    chars.forEach((rowChar, rowIndex) => {
        html += `<tr><th><input value="${rowChar}" onchange="updateGlobalChar(${rowIndex}, this.value)" class="header-input char-idx-${rowIndex}"></th>`;
        chars.forEach((colChar, colIndex) => {
            const pair = rowChar + colChar;
            const st = statusMap[pair];
            let cellClass = '';
            if(st === 'green') cellClass = 'status-green';
            else if(st === 'yellow') cellClass = 'status-yellow';
            else if(st === 'red') cellClass = 'status-red';
            
            if (rowChar === colChar) {
                html += `<td class="cell-diagonal ${cellClass}">
                    <div class="diagonal-wrapper">
                        <input class="matrix-input" value="${dict[pair]||''}" oninput="updateMatrixInput('${pair}', this.value)" onfocus="handleFocus(this)" onblur="handleBlur()">
                        <button class="btn-diagonal-check" onclick="fillSame('${pair}', '${rowChar}', this)">${t('btn_same')}</button>
                    </div>
                </td>`;
            } else {
                html += `<td class="${cellClass}"><input class="matrix-input" value="${dict[pair]||''}" oninput="updateMatrixInput('${pair}', this.value)" onfocus="handleFocus(this)" onblur="handleBlur()"></td>`;
            }
        });
        html += '</tr>';
    });
    html += '</tbody>';
    table.innerHTML = html;
}

window.handleFocus = function(el) {
    const td = el.closest('td'); if(!td) return;
    const tr = td.parentElement; const table = document.getElementById('full-matrix');
    if(!tr || !table) return;
    const colIndex = td.cellIndex; const rowIndex = tr.rowIndex;
    for(let r = 0; r <= rowIndex; r++) { 
        if(table.rows[r] && table.rows[r].cells[colIndex]) table.rows[r].cells[colIndex].classList.add('highlight-guide'); 
    }
    for(let c = 0; c <= colIndex; c++) { 
        if(tr.cells[c]) tr.cells[c].classList.add('highlight-guide'); 
    }
};
window.handleBlur = function() { document.querySelectorAll('.highlight-guide').forEach(el => el.classList.remove('highlight-guide')); };

window.updateGlobalChar = function(index, newValue) {
    const val = newValue.trim(); if (!val) { alert(t('alert_chars_empty')); return; }
    chars[index] = val; localStorage.setItem(CHARS_KEY, JSON.stringify(chars));
    document.querySelectorAll(`.char-idx-${index}`).forEach(inp => inp.value = val);
    initUI(); 
    updateLayoutMode();
};
window.updateMatrixInput = function(pair, val) { const d = getDict(); d[pair] = val.trim(); saveDict(d); };
window.fillSame = function(pair, char, btn) { const d = getDict(); d[pair] = char; saveDict(d); btn.previousElementSibling.value = char; };

function resetDefaultChars() {
    if(confirm(t('alert_reset'))) {
        chars = (currentLang === 'en') ? [...CHARS_EN] : [...CHARS_ZH];
        localStorage.removeItem(CHARS_KEY); initUI(); applyLanguage(); updateLayoutMode(); renderMatrix(); alert(t('alert_reset_done'));
    }
}
function toggleLanguage() {
    currentLang = currentLang === 'zh-TW' ? 'en' : 'zh-TW';
    localStorage.setItem(LANG_KEY, currentLang); applyLanguage();
    if (currentLang === 'en' && JSON.stringify(chars) === JSON.stringify(CHARS_ZH)) {
        if(confirm("Switch to English A-X?")) { chars = [...CHARS_EN]; localStorage.setItem(CHARS_KEY, JSON.stringify(chars)); initUI(); }
    } else if (currentLang === 'zh-TW' && JSON.stringify(chars) === JSON.stringify(CHARS_EN)) {
        if(confirm("切換回注音？")) { chars = [...CHARS_ZH]; localStorage.setItem(CHARS_KEY, JSON.stringify(chars)); initUI(); }
    }
    updateLayoutMode();
    if(isMatrixMode) renderMatrix();
}
function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.getAttribute('data-i18n'); if(translations[currentLang][key]) el.innerText = translations[currentLang][key]; });
    const listSel = document.getElementById('char-select'); const currentVal = listSel.value; listSel.innerHTML = ''; 
    chars.forEach(c => { let opt = document.createElement('option'); opt.value = c; opt.innerText = `${c}${t('opt_start')}`; listSel.appendChild(opt); });
    if(currentVal && chars.includes(currentVal)) listSel.value = currentVal; 
    if(isWaitingTestNext) document.getElementById('test-btn').innerText = t('btn_start_test'); else document.getElementById('test-btn').innerText = t('btn_submit');
    
    // 更新記憶翻牌提示
    if(isMemAnswerShown) document.getElementById('mem-hint').style.visibility = 'hidden'; 
    else document.getElementById('mem-hint').style.visibility = 'visible';

    updateDropdownLabel('mem'); updateDropdownLabel('test');
}

function toggleDropdown(prefix) { const content = document.getElementById(`${prefix}-dropdown-content`); const isShown = content.classList.contains('show'); closeAllDropdowns(); if (!isShown) content.classList.add('show'); }
function closeAllDropdowns() { document.querySelectorAll('.dropdown-content').forEach(el => el.classList.remove('show')); }
function updateDropdownLabel(prefix) { const selected = getSelectedRanges(prefix); const btn = document.getElementById(`${prefix}-dropdown-btn`); if (selected.length === chars.length) btn.innerText = t('sel_full'); else if (selected.length === 0) btn.innerText = t('sel_none'); else btn.innerText = selected.length <= 5 ? `${t('sel_prefix')}${selected.join(', ')}` : t('sel_count', {n: selected.length}); }
function renderCheckboxes(containerId, prefix) { const container = document.getElementById(containerId); container.innerHTML = ''; chars.forEach((c) => { const label = document.createElement('label'); label.style = 'display:flex;align-items:center;'; const input = document.createElement('input'); input.type = 'checkbox'; input.value = c; input.name = prefix + '_range'; input.checked = true; input.onchange = () => updateDropdownLabel(prefix); label.appendChild(input); label.appendChild(document.createTextNode(c)); container.appendChild(label); }); }
function toggleAll(prefix, state) { document.querySelectorAll(`input[name="${prefix}_range"]`).forEach(input => input.checked = state); updateDropdownLabel(prefix); }
function getSelectedRanges(prefix) { return Array.from(document.querySelectorAll(`input[name="${prefix}_range"]:checked`)).map(i => i.value); }
function triggerAction(tabId) { if(tabId === 'view-memory') { if(isMemAnswerShown) nextMemoryCard(); else toggleMemoryAnswer(); } else if(tabId === 'view-test') { if(isWaitingTestNext) startTestQuestion(); } }

function switchTab(tab) { 
    document.querySelectorAll('.view-section').forEach(e => e.classList.remove('active')); 
    document.querySelectorAll('.nav-btn').forEach(e => e.classList.remove('active')); 
    document.getElementById(`view-${tab}`).classList.add('active'); 
    const btnIndex = {'list':0, 'memory':1, 'test':2, 'data':3}; 
    document.querySelectorAll('.nav-btn')[btnIndex[tab]].classList.add('active'); 
    
    const container = document.getElementById('main-container');
    if (tab === 'list' && isMatrixMode) {
        container.classList.add('wide-mode');
    } else {
        container.classList.remove('wide-mode');
    }

    if(timerInterval) clearInterval(timerInterval); 
    if(tab === 'list') { 
        if(isMatrixMode) renderMatrix();
        else renderList(); 
    } 
    if(tab === 'memory') nextMemoryCard(); 
    if(tab === 'test') { 
        document.getElementById('test-feedback').innerText = ''; 
        document.getElementById('test-correct-msg').innerText = ''; 
        isWaitingTestNext = true; applyLanguage(); 
    }
}

function resetAllColors() { 
    if(confirm(t('alert_reset'))) { 
        localStorage.setItem(STATUS_KEY, JSON.stringify({})); 
        if(isMatrixMode) renderMatrix(); 
        else renderList(); 
        alert(t('alert_reset_done')); 
    } 
}

function markMemStatus(status) {
    if (!currentPair) return;
    saveStatus(currentPair, status);
    nextMemoryCard();
}

function nextMemoryCard() {
    const selectedChars = getSelectedRanges('mem'); 
    if(selectedChars.length === 0) { 
        alert(t('alert_sel_range')); 
        return; 
    } 
    
    // Hide grading buttons, show hint
    document.getElementById('mem-grading-area').classList.add('hidden');
    document.getElementById('mem-hint').style.visibility = 'visible';

    let potentialPair; 
    let attempts = 0; 
    do { 
        const randomStartChar = selectedChars[Math.floor(Math.random() * selectedChars.length)]; 
        let randomEndChar = chars[Math.floor(Math.random()*chars.length)]; 
        while(randomStartChar === randomEndChar) { 
            randomEndChar = chars[Math.floor(Math.random()*chars.length)]; 
        } potentialPair = randomStartChar + randomEndChar; attempts++; 
    } while (potentialPair === lastMemPair && attempts < 10); 
    lastMemPair = potentialPair; 
    currentPair = potentialPair; 
    document.getElementById('mem-q').innerText = currentPair; 
    document.getElementById('mem-a').classList.remove('show'); 
    isMemAnswerShown = false; applyLanguage(); 
}

function toggleMemoryAnswer() { 
    if(isMemAnswerShown) return; 
    const word = getDict()[currentPair] || "N/A"; document.getElementById('mem-a').innerText = word; 
    document.getElementById('mem-a').classList.add('show'); 
    
    // Show grading buttons, hide hint
    document.getElementById('mem-grading-area').classList.remove('hidden');
    document.getElementById('mem-hint').style.visibility = 'hidden';

    isMemAnswerShown = true; applyLanguage(); 
}

function startTestQuestion() { 
    const dict = getDict(); 
    const statusMap = getStatus(); 
    const valid = Object.keys(dict).filter(k => dict[k]); 
    if(valid.length === 0) return alert(t('alert_no_data')); 
    const selectedChars = getSelectedRanges('test'); 
    if(selectedChars.length === 0) return alert(t('alert_sel_range')); 
    
    let candidates = valid.filter(p => selectedChars.includes(p[0])); 
    if(candidates.length === 0) return alert(t('alert_no_data')); 

    let pool = candidates; 
    if (candidates.length > 1 && lastTestPair) { 
        pool = candidates.filter(p => p !== lastTestPair); 
    } 

    let untested = []; 
    let learning = []; 
    let mastered = []; 

    pool.forEach(p => { 
        const s = statusMap[p]; 
        if (!s) untested.push(p); 
        else if (s === 'green') mastered.push(p); 
        else learning.push(p); 
    }); 

    let targetGroup = [];
    const rand = Math.random();

    if (untested.length > 0) {
        if (rand < 0.7) targetGroup = untested; 
        else if (rand < 0.9) targetGroup = (learning.length > 0) ? learning : untested; 
        else targetGroup = (mastered.length > 0) ? mastered : ((learning.length > 0) ? learning : untested); 
    } else if (learning.length > 0) {
        if (rand < 0.8) targetGroup = learning; 
        else targetGroup = (mastered.length > 0) ? mastered : learning; 
    } else {
        targetGroup = mastered; 
    }

    currentPair = targetGroup[Math.floor(Math.random() * targetGroup.length)]; 
    lastTestPair = currentPair; 
    
    document.getElementById('test-q').innerText = currentPair; 
    const inp = document.getElementById('test-input'); 
    inp.value = ''; 
    inp.disabled = false; 
    inp.focus(); 
    
    document.getElementById('test-feedback').innerText = ''; 
    document.getElementById('test-correct-msg').innerText = ''; 
    isWaitingTestNext = false; 
    applyLanguage(); 
    
    if(timerInterval) clearInterval(timerInterval); 
    testStartTime = Date.now(); 
    document.getElementById('timer').innerText = "0.0s"; 
    timerInterval = setInterval(() => { 
        document.getElementById('timer').innerText = ((Date.now() - testStartTime) / 1000).toFixed(1) + "s"; 
    }, 100); 
}

function checkTestAnswer() { 
    if(isWaitingTestNext) return; 
    clearInterval(timerInterval); 
    const duration = (Date.now() - testStartTime) / 1000; 
    const val = document.getElementById('test-input').value.trim(); 
    const ans = getDict()[currentPair]; 
    let st = '', msg = ''; 
    if(val === '') { 
        st = 'red'; msg = t('fb_empty'); 
    } else if(val !== ans) { 
        st = 'red'; msg = t('fb_wrong'); 
    } else if(duration > 12) { 
        st = 'red'; msg = t('fb_slow'); 
    } else if(duration > 8) { 
        st = 'yellow'; msg = "OK"; 
    } else { st = 'green'; msg = t('fb_good'); 

    } 
    saveStatus(currentPair, st); 
    document.getElementById('test-feedback').innerText = msg + ` (${duration.toFixed(1)}s)`; 
    document.getElementById('test-correct-msg').innerText = t('ans_prefix') + ans; 
    document.getElementById('test-input').disabled = true; isWaitingTestNext = true; applyLanguage(); 
}

function exportData() { 
    const blob = new Blob([JSON.stringify({ 
        dict: getDict(), status: getStatus(), chars: chars })], {type: "application/json"}); 
        const url = URL.createObjectURL(blob); 
        const a = document.createElement('a'); 
        a.href = url; a.download = `backup_${new Date().toISOString().slice(0,10)}.json`; 
        document.body.appendChild(a); 
        a.click(); document.body.removeChild(a); 
    }
function importData() { 
    const fileInput = document.getElementById('file-input'); 
    const f = fileInput.files[0]; 
    if(!f) return; const r = new FileReader(); r.onload = (e) => { 
        try { const d = JSON.parse(e.target.result); 
            if(d.dict) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d.dict)); 
                localStorage.setItem(STATUS_KEY, JSON.stringify(d.status || {})); 
                if(d.chars) { 
                    chars = d.chars; localStorage.setItem(CHARS_KEY, JSON.stringify(chars)); 
                } 
            } 
            alert(t('alert_import_success')); 
            initUI(); updateLayoutMode(); 
            if(isMatrixMode) renderMatrix(); 
            else renderList(); 
        } catch(err) { 
            alert(t('alert_import_error')); 
        } 
    }; 
    r.readAsText(f); 
}
function clearAllData() { 
    if(confirm(t('alert_reset'))) { 
        localStorage.clear(); location.reload(); 
    } 
}