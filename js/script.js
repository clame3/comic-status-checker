// --- 共通要素 ---
const projectTitle = document.getElementById('project-title');
const mainPlot = document.getElementById('main-plot');
const deadlineDateInput = document.getElementById('deadline-date');
const daysLeftDisplay = document.getElementById('days-left');
const gridContainer = document.getElementById('grid-container');

const STORAGE_KEY = 'manga-app-v3-combined';
const TASKS = ['プロット', 'ネーム', '下書き', 'ペン入れ', '仕上げ'];

// データ読み込み
let savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify({
    title: "新刊ネーム",
    plot: "",
    pages: ["", "", "", ""], // 初期4ページ
    deadlineDate: "",
    gantt: {
        'プロット': {start: '', end: ''},
        'ネーム': {start: '', end: ''},
        '下書き': {start: '', end: ''},
        'ペン入れ': {start: '', end: ''},
        '仕上げ': {start: '', end: ''}
    }
}));

/* --- JSONインポート機能の強化版 --- */
document.getElementById('json-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            
            // 1. 基本データの復元
            if (importedData.title) {
                localStorage.setItem('manga_project_title', importedData.title);
            }
            if (importedData.deadlineDate) {
                localStorage.setItem('manga_deadline', importedData.deadlineDate);
            }
            if (importedData.plot) {
                localStorage.setItem('manga_plot_text', importedData.plot);
            }

            // 2. ページ内容と感情データの統合
            // JSONの pages 配列を元に、新しい内部用データ構造を作ります
            const combinedPages = importedData.pages.map((content, index) => {
                const pageNum = index + 1;
                return {
                    content: content,
                    // emotions オブジェクトから該当するキーの感情を取得
                    emotion: importedData.emotions && importedData.emotions[pageNum] 
                             ? importedData.emotions[pageNum] 
                             : ""
                };
            });

            // 統合したデータを保存
            localStorage.setItem('manga_progress_data', JSON.stringify(combinedPages));

            alert("データを読み込みました！");
            location.reload(); // 再描画

        } catch (err) {
            console.error(err);
            alert("JSONの読み込みに失敗しました。形式を確認してください。");
        }
    };
    reader.readAsText(file);
});

function init() {
    projectTitle.value = savedData.title;
    mainPlot.value = savedData.plot;
    deadlineDateInput.value = savedData.deadlineDate;
    updateCountdown();
    renderPages();
}

// --- モード切替 ---
function switchMode(mode) {
    const editView = document.getElementById('edit-view');
    const ganttView = document.getElementById('gantt-view');
    const tEdit = document.getElementById('tab-edit');
    const tGantt = document.getElementById('tab-gantt');

    if (mode === 'edit') {
        editView.classList.remove('hidden'); 
        ganttView.classList.add('hidden'); 
        ganttView.classList.remove('flex');
        
        // --- タブの見た目を切り替え ---
        tEdit.classList.add('border-blue-600', 'text-blue-600');
        tEdit.classList.remove('border-transparent', 'text-gray-500');
        tGantt.classList.remove('border-blue-600', 'text-blue-600');
        tGantt.classList.add('border-transparent', 'text-gray-500');
    } else {
        editView.classList.add('hidden'); 
        ganttView.classList.remove('hidden'); 
        ganttView.classList.add('flex');
        
        // --- タブの見た目を切り替え ---
        tGantt.classList.add('border-blue-600', 'text-blue-600');
        tGantt.classList.remove('border-transparent', 'text-gray-500');
        tEdit.classList.remove('border-blue-600', 'text-blue-600');
        tEdit.classList.add('border-transparent', 'text-gray-500');
        
        renderGantt();
        updateGanttCountdown(); // 締切表示を更新
    }
}

//感情（色ラベル）を更新する関数
function updateEmotion(taskId, emotionClass) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.emotion = emotionClass;
        saveTasks();
        renderTasks();
    }
}

// 感情（色）を更新する関数
function updateEmotion(id, emotion) {
    // tasksが未定義、または空の場合は何もしない
    if (!window.tasks) return; 
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.emotion = emotion;
        if (typeof saveTasks === 'function') saveTasks();
        renderTasks();
    }
}


// --- ページ構成の描画 ---
// --- ページ構成の描画（感情ボタン統合版） ---
function renderPages() {
    const gridContainer = document.getElementById('grid-container');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    savedData.pages.forEach((content, i) => {
        const pageNum = i + 1;
        // 保存データに感情(emotion)がない場合の初期化
        if (!savedData.emotions) savedData.emotions = {};
        const currentEmotion = savedData.emotions[i] || '';

        const card = document.createElement('div');
        // task-cardクラスと感情クラスを付与
        card.className = `page-card flex flex-col items-center w-full px-1 relative group task-card ${currentEmotion}`;
        
        card.innerHTML = `
            <div class="aspect-[257/364] w-full bg-white shadow-sm border border-gray-200 rounded-sm p-4 genkou-paper relative hover:shadow-md transition-shadow flex flex-col">
                <div class="status-bar"></div>
                
                <div class="safety-line pointer-events-none"></div>
                
                <div class="absolute top-1 left-2 z-30">
                    <span class="text-[10px] font-bold text-gray-300 ml-2">P.${pageNum}</span>
                </div>

                <div class="emotion-selector absolute bottom-2 right-2 flex gap-1.5 bg-gray-100/90 rounded-full px-2 py-1 shadow-inner z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span onclick="updatePageEmotion(${i}, '')" title="リセット" class="reset-dot"></span>
                    <span onclick="updatePageEmotion(${i}, 'peak')" title="盛り上がり" class="cursor-pointer hover:scale-125 transition-transform text-base">🔴</span>
                    <span onclick="updatePageEmotion(${i}, 'daily')" title="日常" class="cursor-pointer hover:scale-125 transition-transform text-base">🟢</span>
                    <span onclick="updatePageEmotion(${i}, 'emotional')" title="エモい" class="cursor-pointer hover:scale-125 transition-transform text-base">🟣</span>
                    <span onclick="updatePageEmotion(${i}, 'sad')" title="切ない" class="cursor-pointer hover:scale-125 transition-transform text-base">🔵</span>
                </div>
                
                <button onclick="addFrame(${i})" class="absolute top-1 right-2 bg-blue-100 text-blue-600 rounded px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-30 text-[9px] font-bold hover:bg-blue-200">+コマ追加</button>
                
                <button onclick="removePage(${i})" class="absolute -top-1 -right-1 ...">×</button>
                
                <textarea class="page-content w-full flex-1 focus:outline-none resize-none z-10 bg-transparent mt-4 mb-8" placeholder="内容...">${content}</textarea>
            </div>
        `;
        
        const textarea = card.querySelector('textarea');
        const autoResize = (el) => {
            el.style.height = 'auto'; 
            el.style.height = el.scrollHeight + 'px';
        };

        textarea.addEventListener('input', (e) => { 
            autoResize(e.target);
            savedData.pages[i] = e.target.value; 
            saveAll(); 
        });

        gridContainer.appendChild(card);
        setTimeout(() => autoResize(textarea), 0);
    });
}

// 感情を更新する新しい関数
function updatePageEmotion(pageIndex, emotionClass) {
    if (!savedData.emotions) savedData.emotions = {};
    savedData.emotions[pageIndex] = emotionClass;
    saveAll();
    renderPages(); // 再描画して色を反映
}

function createPageCard(index, content = "") {
    const pageNum = index + 1;
    const isRight = pageNum % 2 !== 0;
    const card = document.createElement('div');
    card.className = `page-card flex flex-col items-center w-full px-1 relative group ${pageNum === 1 ? 'col-start-2' : ''}`;
    card.innerHTML = `
        <div class="aspect-[257/364] w-full bg-white shadow-sm border border-gray-200 rounded-sm p-[5%] genkou-paper relative">
            <div class="safety-line pointer-events-none"></div>
            <div class="absolute top-1 ${isRight ? 'right-2' : 'left-2'} text-[10px] font-bold text-gray-300">P.${pageNum}</div>
            <button onclick="removePage(${index})" class="absolute -top-2 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 text-xs">×</button>
            <textarea class="page-content relative w-full h-full bg-transparent text-[10px] md:text-sm text-gray-800 p-1 focus:outline-none resize-none leading-tight z-10" placeholder="内容...">${content}</textarea>
        </div>
    `;
    card.querySelector('textarea').addEventListener('input', (e) => {
        savedData.pages[index] = e.target.value;
        saveAll();
    });
    return card;
}

function addNewPage() {
    savedData.pages.push("");
    renderPages();
    saveAll();
}

function removePage(index) {
    if (!confirm(`P.${index + 1} を削除しますか？`)) return;
    savedData.pages.splice(index, 1);
    renderPages();
    saveAll();
}

// --- ガントチャートのカラー設定 ---
const TASK_COLORS = {
    'プロット': 'bg-blue-500',
    'ネーム': 'bg-purple-500',
    '下書き': 'bg-green-500',
    'ペン入れ': 'bg-yellow-500',
    '仕上げ': 'bg-pink-500'
};

function renderGantt() {
    const inputContainer = document.getElementById('gantt-inputs');
    const chartGrid = document.getElementById('gantt-grid');
    
    // 工程入力専用のラッパーを取得または作成
    let taskInputWrapper = document.getElementById('task-input-wrapper');
    if (!taskInputWrapper) {
        taskInputWrapper = document.createElement('div');
        taskInputWrapper.id = 'task-input-wrapper';
        taskInputWrapper.className = 'space-y-3 pb-10'; // 下部に余白を追加
        inputContainer.appendChild(taskInputWrapper);
    }
    taskInputWrapper.innerHTML = ''; 
    chartGrid.innerHTML = ''; 

    // 1. 工程入力欄の生成（高さをしっかり確保）
    TASKS.forEach(task => {
        const div = document.createElement('div');
        div.className = "p-3 bg-white rounded border border-gray-200 shadow-sm text-xs";
        div.innerHTML = `
            <div class="font-bold text-gray-700 mb-2 border-b pb-1 flex justify-between">
                <span>${task}</span>
            </div>
            <div class="grid grid-cols-1 gap-2">
                <div class="flex items-center justify-between">
                    <label class="text-[9px] text-gray-400 font-bold w-10">START</label>
                    <input type="date" value="${savedData.gantt[task].start}" 
                        onchange="updateGanttData('${task}','start',this.value)" 
                        class="flex-1 border rounded px-1 py-1 text-[11px] focus:border-blue-400 focus:outline-none">
                </div>
                <div class="flex items-center justify-between">
                    <label class="text-[9px] text-gray-400 font-bold w-10">END</label>
                    <input type="date" value="${savedData.gantt[task].end}" 
                        onchange="updateGanttData('${task}','end',this.value)" 
                        class="flex-1 border rounded px-1 py-1 text-[11px] focus:border-blue-400 focus:outline-none">
                </div>
            </div>`;
        taskInputWrapper.appendChild(div);
    });

    // --- カレンダー描画ロジック ---
    let firstDate = new Date();
    let hasDate = false;
    TASKS.forEach(task => {
        if (savedData.gantt[task].start) {
            const d = new Date(savedData.gantt[task].start);
            if (!hasDate || d < firstDate) { firstDate = new Date(d); hasDate = true; }
        }
    });

    const startDate = new Date(firstDate);
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0,0,0,0);

    const dayWidth = 30;
    const totalDays = 185; 
    chartGrid.style.width = `${totalDays * dayWidth}px`;
    chartGrid.style.height = `${TASKS.length * 45 + 120}px`;

    for (let i = 0; i < totalDays; i++) {
        const d = new Date(startDate); d.setDate(startDate.getDate() + i);
        const leftPos = i * dayWidth;

        // 垂直ガイド線
        const dayLine = document.createElement('div');
        dayLine.className = "absolute top-0 bottom-0 border-l border-gray-100 pointer-events-none";
        dayLine.style.left = `${leftPos}px`;
        chartGrid.appendChild(dayLine);

        // 日付ラベル
        const dateLabel = document.createElement('div');
        dateLabel.className = "absolute top-8 text-[9px] text-gray-400 w-[30px] text-center pointer-events-none";
        dateLabel.style.left = `${leftPos}px`;
        dateLabel.textContent = d.getDate();
        chartGrid.appendChild(dateLabel);

        // 月ラベル
        if (d.getDate() === 1 || i === 0) {
            const mLabel = document.createElement('div');
            mLabel.className = "absolute top-0 border-l-2 border-blue-400 pl-1 text-[10px] font-bold text-blue-600 h-full z-0";
            mLabel.style.left = `${leftPos}px`;
            mLabel.innerHTML = `<span class="sticky top-0 bg-white px-1 shadow-sm border border-blue-100 rounded">${d.getFullYear()}/${d.getMonth()+1}月</span>`;
            chartGrid.appendChild(mLabel);
        }

        // 今日ライン
        if (d.toDateString() === new Date().toDateString()) {
            const todayLine = document.createElement('div');
            todayLine.className = "absolute top-0 bottom-0 border-l-2 border-red-500 z-30 pointer-events-none";
            todayLine.style.left = `${leftPos}px`;
            chartGrid.appendChild(todayLine);
        }

        // イベント（マイルストーン）
        const evDateStr = document.getElementById('event-date').value;
        const evNameStr = document.getElementById('event-name').value;
        if (evDateStr && d.toDateString() === new Date(evDateStr).toDateString()) {
            const evLine = document.createElement('div');
            evLine.className = "absolute top-0 bottom-0 border-l-4 border-red-600 z-40 pointer-events-none shadow-[2px_0_5px_rgba(220,38,38,0.2)]";
            evLine.style.left = `${leftPos}px`;
            const evTag = document.createElement('div');
            evTag.className = "absolute top-16 left-1 bg-red-600 text-white text-[10px] px-2 py-0.5 font-bold rounded shadow-lg whitespace-nowrap";
            evTag.innerHTML = `🚩 ${evNameStr || 'EVENT'}`;
            evLine.appendChild(evTag);
            chartGrid.appendChild(evLine);
        }
    }

    // 4. カラーバー描画（座標計算のズレを完全に排除した決定版）
    TASKS.forEach((task, idx) => {
        const t = savedData.gantt[task];
        if (t.start && t.end) {
            const s = new Date(t.start); const e = new Date(t.end);
            const startPos = Math.floor((s - startDate) / 86400000);
            const duration = Math.floor((e - s) / 86400000) + 1;
            
            const bar = document.createElement('div');
            const colorClass = TASK_COLORS[task] || 'bg-gray-500';
            
            bar.className = `absolute ${colorClass} h-8 rounded flex items-center px-2 text-[10px] text-white font-bold shadow-sm z-20 whitespace-nowrap select-none cursor-grab active:cursor-grabbing`;
            bar.style.touchAction = 'none'; 
            bar.style.top = `${idx * 45 + 55}px`; 
            bar.style.left = `${startPos * dayWidth}px`; 
            bar.style.width = `${duration * dayWidth}px`;
            bar.textContent = task; 

            const resizer = document.createElement('div');
            resizer.className = "absolute right-0 top-0 h-full w-4 cursor-ew-resize hover:bg-white/30 transition-colors rounded-r z-30";
            bar.appendChild(resizer);

            bar.onpointerdown = function(e) {
                const isResizing = (e.target === resizer);
                const startX = e.pageX;
                const initialLeft = startPos * dayWidth;
                const initialWidth = duration * dayWidth;
                
                bar.setPointerCapture(e.pointerId);
                bar.classList.add('opacity-70', 'z-50', 'shadow-lg');

                // ドラッグ中の「移動日数」を保持する変数
                let daysDiff = 0;
                let widthDiff = 0;

                function onPointerMove(e) {
                    const dx = e.pageX - startX;
                    
                    if (isResizing) {
                        // 1日(30px)単位で計算
                        widthDiff = Math.round(dx / dayWidth);
                        const newWidth = Math.max(1, duration + widthDiff) * dayWidth;
                        bar.style.width = newWidth + 'px';
                    } else {
                        // 1日(30px)単位で計算
                        daysDiff = Math.round(dx / dayWidth);
                        const newLeft = (startPos + daysDiff) * dayWidth;
                        // 左端(0)より前には行かない
                        bar.style.left = Math.max(0, newLeft) + 'px';
                    }
                }

                function onPointerUp(e) {
                    bar.releasePointerCapture(e.pointerId);
                    bar.classList.remove('opacity-70', 'z-50', 'shadow-lg');
                    
                    document.removeEventListener('pointermove', onPointerMove);
                    document.removeEventListener('pointerup', onPointerUp);

                    // --- データの確定保存 ---
                    if (isResizing) {
                        // 期間（終了日）だけを更新
                        const finalDuration = Math.max(1, duration + widthDiff);
                        const newEnd = new Date(s);
                        newEnd.setDate(s.getDate() + (finalDuration - 1));
                        savedData.gantt[task].end = newEnd.toISOString().split('T')[0];
                    } else {
                        // 開始日と終了日を移動日数分だけずらす
                        const newStart = new Date(s);
                        newStart.setDate(s.getDate() + daysDiff);
                        const newEnd = new Date(e);
                        newEnd.setDate(e.getDate() + daysDiff);

                        savedData.gantt[task].start = newStart.toISOString().split('T')[0];
                        savedData.gantt[task].end = newEnd.toISOString().split('T')[0];
                    }
                    
                    saveAll();
                    renderGantt(); // 画面をリフレッシュして位置を確定
                }

                document.addEventListener('pointermove', onPointerMove);
                document.addEventListener('pointerup', onPointerUp);
            };
            bar.ondragstart = () => false;
            chartGrid.appendChild(bar);
        }
    });
}

function updateGanttData(task, type, value) {
    savedData.gantt[task][type] = value;
    saveAll();
    renderGantt();
}

// --- 共通処理 ---
function updateCountdown() {
    if (!deadlineDateInput.value) return;
    const diff = new Date(deadlineDateInput.value) - new Date().setHours(0,0,0,0);
    daysLeftDisplay.textContent = Math.ceil(diff / (1000 * 60 * 60 * 24));
    saveAll();
}

function saveAll() {
    savedData.title = projectTitle.value;
    savedData.plot = mainPlot.value;
    savedData.deadlineDate = deadlineDateInput.value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
}

function exportData() {
    const blob = new Blob([JSON.stringify(savedData, null, 2)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${savedData.title}_data.json`;
    a.click();
}

function addFrame(index) {
    const textareas = document.querySelectorAll('.page-content');
    const target = textareas[index];
    const currentText = target.value;
    
    // 現在のテキストから「○コマ目」がいくつあるか数えて次の番号を決める
    const frameCount = (currentText.match(/\d+コマ目/g) || []).length;
    const nextNum = frameCount + 1;
    
    const newText = currentText + (currentText ? "\n" : "") + nextNum + "コマ目：";
    
    // データ保存と反映
    savedData.pages[index] = newText;
    target.value = newText;
    saveAll();
}

// イベント
deadlineDateInput.addEventListener('change', updateCountdown);
projectTitle.addEventListener('input', saveAll);
mainPlot.addEventListener('input', saveAll);

init();

