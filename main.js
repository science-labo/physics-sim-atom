// ゲームの状態管理
let score = 0;
let placedElements = new Set();
let draggedElement = null;

// 音声コンテキストの作成（効果音用）
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext = null;

// オーディオコンテキストの初期化
function initAudioContext() {
    if (!audioContext) {
        audioContext = new AudioContext();
    }
}

// 正解時の効果音を再生
function playSuccessSound() {
    initAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 523.25; // C5
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// 完了時の効果音を再生
function playCompletionSound() {
    initAudioContext();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((freq, index) => {
        setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
        }, index * 150);
    });
}

// 元素ブロックを生成
function createElementBlocks() {
    const container = document.getElementById('elementsContainer');
    container.innerHTML = '';
    
    // 元素をシャッフル
    const shuffledElements = [...elementsData].sort(() => Math.random() - 0.5);
    
    shuffledElements.forEach(element => {
        const block = document.createElement('div');
        block.className = 'element-block';
        block.draggable = true;
        block.dataset.number = element.number;
        
        block.innerHTML = `
            <div class="element-number">${element.number}</div>
            <div class="element-symbol">${element.symbol}</div>
            <div class="element-name">${element.name}</div>
        `;
        
        // ドラッグイベントリスナー
        block.addEventListener('dragstart', handleDragStart);
        block.addEventListener('dragend', handleDragEnd);
        
        // タッチイベント対応（モバイル）
        block.addEventListener('touchstart', handleTouchStart, { passive: false });
        block.addEventListener('touchmove', handleTouchMove, { passive: false });
        block.addEventListener('touchend', handleTouchEnd);
        
        container.appendChild(block);
    });
}

// ドラッグ開始
function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

// ドラッグ終了
function handleDragEnd(e) {
    this.classList.remove('dragging');
}

// スロットにドラッグオーバー
function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
    return false;
}

// スロットからドラッグアウト
function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

// スロットにドロップ
function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    this.classList.remove('drag-over');
    
    const slotNumber = parseInt(this.dataset.number);
    const elementNumber = parseInt(draggedElement.dataset.number);
    
    // 正しい位置かチェック
    if (slotNumber === elementNumber && !placedElements.has(elementNumber)) {
        // 正解
        this.innerHTML = draggedElement.innerHTML;
        this.classList.add('correct');
        draggedElement.classList.add('placed');
        placedElements.add(elementNumber);
        
        score++;
        updateScore();
        playSuccessSound();
        
        // 全て完了したかチェック
        if (score === 20) {
            setTimeout(() => {
                showCompletionMessage();
                playCompletionSound();
            }, 500);
        }
    }
    
    return false;
}

// スコアを更新
function updateScore() {
    document.getElementById('score').textContent = score;
}

// 完了メッセージを表示
function showCompletionMessage() {
    document.getElementById('completionMessage').classList.add('show');
}

// 完了メッセージを非表示
function hideCompletionMessage() {
    document.getElementById('completionMessage').classList.remove('show');
}

// ゲームをリセット
function resetGame() {
    score = 0;
    placedElements.clear();
    updateScore();
    hideCompletionMessage();
    
    // スロットをクリア
    const slots = document.querySelectorAll('.element-slot');
    slots.forEach(slot => {
        slot.innerHTML = '';
        slot.classList.remove('correct');
    });
    
    // 元素ブロックを再生成
    createElementBlocks();
}

// タッチイベント用の変数
let touchElement = null;
let touchClone = null;
let touchStartX = 0;
let touchStartY = 0;

// タッチスタート
function handleTouchStart(e) {
    e.preventDefault();
    touchElement = this;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    // クローンを作成
    touchClone = this.cloneNode(true);
    touchClone.style.position = 'fixed';
    touchClone.style.zIndex = '1000';
    touchClone.style.opacity = '0.8';
    touchClone.style.pointerEvents = 'none';
    touchClone.style.left = touch.clientX - this.offsetWidth / 2 + 'px';
    touchClone.style.top = touch.clientY - this.offsetHeight / 2 + 'px';
    touchClone.style.width = this.offsetWidth + 'px';
    document.body.appendChild(touchClone);
    
    this.style.opacity = '0.3';
}

// タッチムーブ
function handleTouchMove(e) {
    e.preventDefault();
    if (!touchClone) return;
    
    const touch = e.touches[0];
    touchClone.style.left = touch.clientX - touchClone.offsetWidth / 2 + 'px';
    touchClone.style.top = touch.clientY - touchClone.offsetHeight / 2 + 'px';
}

// タッチエンド
function handleTouchEnd(e) {
    e.preventDefault();
    if (!touchClone) return;
    
    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // クローンを削除
    document.body.removeChild(touchClone);
    touchClone = null;
    this.style.opacity = '1';
    
    // ドロップ先がスロットか判定
    if (dropTarget && dropTarget.classList.contains('element-slot')) {
        const slotNumber = parseInt(dropTarget.dataset.number);
        const elementNumber = parseInt(touchElement.dataset.number);
        
        if (slotNumber === elementNumber && !placedElements.has(elementNumber)) {
            // 正解
            dropTarget.innerHTML = touchElement.innerHTML;
            dropTarget.classList.add('correct');
            touchElement.classList.add('placed');
            placedElements.add(elementNumber);
            
            score++;
            updateScore();
            playSuccessSound();
            
            // 全て完了したかチェック
            if (score === 20) {
                setTimeout(() => {
                    showCompletionMessage();
                    playCompletionSound();
                }, 500);
            }
        }
    }
    
    touchElement = null;
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // 元素ブロックを生成
    createElementBlocks();
    
    // スロットにイベントリスナーを追加
    const slots = document.querySelectorAll('.element-slot');
    slots.forEach(slot => {
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('dragleave', handleDragLeave);
        slot.addEventListener('drop', handleDrop);
    });
    
    // リセットボタン
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    
    // もう一度遊ぶボタン
    document.getElementById('playAgainBtn').addEventListener('click', resetGame);
    
    // オーディオコンテキストの初期化（ユーザーインタラクション後）
    document.body.addEventListener('click', initAudioContext, { once: true });
    document.body.addEventListener('touchstart', initAudioContext, { once: true });
});
