"use strict";
// ゲームの基本設定
const COLS = 10;
const ROWS = 22;
const VISIBLE_ROWS = 20;
const BLOCK_SIZE = 30;
const MAX_MOVES = 15;

// キャンバス要素
const canvas = document.getElementById('gameBoard');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextPiece');
const nextCtx = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('holdPiece');
const holdCtx = holdCanvas.getContext('2d');
const scoreElement = document.getElementById('score');

// キャンバスサイズ設定
canvas.width = (COLS + 2) * BLOCK_SIZE;
canvas.height = (ROWS + 1) * BLOCK_SIZE + 2;

// テトリミノの形状と色
const SHAPE_TYPES = ["I","O","T","L","J","S","Z"]
const SHAPES = [
[[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]]],  // I
[[[1,1],[1,1]]],                              // O
[[[0,1,0],[1,1,1],[0,0,0]]],                  // T
[[[0,0,1],[1,1,1],[0,0,0]]],                  // L
[[[1,0,0],[1,1,1],[0,0,0]]],                  // J
[[[0,1,1],[1,1,0],[0,0,0]]],                  // S
[[[1,1,0],[0,1,1],[0,0,0]]]                   // Z
];
const COLORS = [
'#00ffff', '#ffff00', '#800080', '#ffa500', '#0000ff', '#00ff00', '#ff0000'
];

// 移動関連の定数
const MOVEMENT = {
DAS: 200,    // Delayed Auto Shift（最初の移動までの遅延時間）
ARR: 25      // Auto Repeat Rate（連続移動の間隔）
};

// レベルごとの落下速度 ms
const LEVEL_SPEEDS = [
800, 650, 500, 370, 250, 150, 100, 80, 60, 40,  // レベル1-10
33.33, 26.67, 20, 16.67, 13.33, 10, 8, 6, 4, 3, // レベル11-20
3, 3, 3, 3, 3, 3, 3, 3, 2, 1        // レベル21-30
];

// レベルごとのインターバル時間を設定（ミリ秒単位）
const LEVEL_INTERVALS = [
500, 500, 500, 400, 400, 300, 300, 200, 200, 100, // レベル1-10
90, 80, 70, 60, 50, 40, 30, 20, 10, 10,    // レベル11-20
10, 10, 10, 10, 10, 10, 10, 10, 10, 1            // レベル21-30
];

// SRS（スーパーローテーションシステム）の設定
const KICK_TABLE_INDEX_MAP={
"01":0, "0-1":1, "11":2, "1-1":3, "21":4, "2-1":5, "31":6, "3-1":7,
}
const KICK_TABLE = {
//0:初期値, R:右回転, 2:2回転, L:左回転
JLSTZ: [
[[0, 0], [-1, 0], [-1,  1], [0, -2], [-1, -2]],//0 > R
[[0, 0], [ 1, 0], [ 1, -1], [0,  2], [ 1,  2]],//R > 0
[[0, 0], [ 1, 0], [ 1, -1], [0,  2], [ 1,  2]],//R > 2
[[0, 0], [-1, 0], [-1,  1], [0, -2], [-1, -2]],//2 > R
[[0, 0], [ 1, 0], [ 1,  1], [0, -2], [ 1, -2]],//2 > L
[[0, 0], [-1, 0], [-1, -1], [0,  2], [-1,  2]],//L > 2
[[0, 0], [-1, 0], [-1, -1], [0,  2], [-1,  2]],//L > 0
[[0, 0], [ 1, 0], [ 1,  1], [0, -2], [ 1, -2]],//0 > L
],
I: [
[[0, 0], [-2, 0], [ 1, 0], [-2, -1], [ 1,  2]],//0 > R
[[0, 0], [ 2, 0], [-1, 0], [ 2,  1], [-1, -2]],//R > 0
[[0, 0], [-1, 0], [ 2, 0], [-1,  2], [ 2, -1]],//R > 2
[[0, 0], [ 1, 0], [-2, 0], [ 1, -2], [-2,  1]],//2 > R
[[0, 0], [ 2, 0], [-1, 0], [ 2,  1], [-1, -2]],//2 > L
[[0, 0], [-2, 0], [ 1, 0], [-2, -1], [ 1,  2]],//L > 2
[[0, 0], [ 1, 0], [-2, 0], [ 1, -2], [-2,  1]],//L > 0
[[0, 0], [-1, 0], [ 2,-0], [-1,  2], [ 2, -1]],//0 > L
],
O: [[[0, 0]], [[0, 0]], [[0, 0]], [[0, 0]]]
};

// スコア関連のグローバル変数
const SCORE = {
BASE: [0, 100, 300, 500, 800],
TSPIN_MINI: [100, 200, 400],
TSPIN: [400, 800, 1200, 1600],
PERFECT_CLEAR: [0, 900, 1500, 2300, 2800],
B2B: {
TETRIS: 1200,
TSPIN_MINI: [100, 300, 600],
TSPIN: [400, 1200, 1800, 2400],
PERFECT_CLEAR_TETRIS: 4400
},
REN: {
MULTIPLIER: 50,
MAX: 1000,
B2B_MULTIPLIER: 75,
B2B_MAX: 1500
}
};

// テストモード用のボード
let testBoard = [
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[1,1,1,1,1,1,1,1,1,0],
[1,1,1,1,1,1,1,1,1,0],
[1,1,1,1,1,1,1,1,1,0],
[1,1,1,1,1,1,1,1,1,0]
];

// ゲームの状態変数
let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let currentPiece;
let nextPieces = [];
let holdPiece = null;
let canHold = true;
let score = 0;
let isGameOver = false;
let isTestMode = false;
let currentTestPieceIndex = 0;
let totalLinesCleared = 0;
let level = 1;
let internalRenCount = 0;  // 内部的なRENカウント
let currentRen = 0;        // 表示用のRENカウント
let lastClearWasTeris = false;
let backToBack = false;
let backToBackCount = 0;
let isIntervalActive = false;
let intervalTimer = 0;

// ゲーム状態
let gameState = {
dropCounter: 0,
dropInterval: 1000,
lastTime: 0
};

// ロック遅延関連
let lockDelay = 500;
let lockTimer = 0;
let moveCounter = 0;

// SRSアニメーション関連
let srsSteps = [];
let currentSrsStep = 0;
let isSrsAnimationRunning = false;

// 7-bag system
let bag = [];

//ゲームロジック関係の関数

/**
 * テトリミノを下に移動させる
 */
function moveDown() {
    currentPiece.y++;
    if (collision(currentPiece)) {
        currentPiece.y--;
        if (lockTimer >= lockDelay || moveCounter >= MAX_MOVES) {
            lockPiece();
            lockTimer = 0;
            moveCounter = 0;
        } else {
            // ロックタイマーをリセットしない
            // 移動カウンターも増やさない
        }
    } else {
        lockTimer = 0; // 衝突していない場合はロックタイマーをリセット
        moveCounter = 0; // 移動カウンターもリセット
    }
}

/**
 * テトリミノをロック（固定）する
 */
function lockPiece() {
    currentPiece.shape[0].forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const boardY = y + currentPiece.y;
                const boardX = x + currentPiece.x;
                if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                    board[boardY][boardX] = COLORS.indexOf(currentPiece.color) + 1;
                }
            }
        });
    });

    const tSpin = isTSpin(currentPiece, board);
    const tSpinMini = isTSpinMini(currentPiece, board, currentPiece.lastKick);

    if (currentPiece.y <= 1) {  // 21段目にミノが設置された直後
        gameOver();
    } else {
        removeLines(tSpin, tSpinMini);
        isIntervalActive = true;
        intervalTimer = calculateIntervalTime();
        resetPiece();
    }
}

/**
 * テトリミノが落下し始めるまでの時間の計算
 */
function calculateIntervalTime() {
    return LEVEL_INTERVALS[Math.min(level - 1, LEVEL_INTERVALS.length - 1)];
}


/**
 * 衝突判定
 * @param {Object} piece - 判定するテトリミノ
 * @returns {boolean} 衝突しているかどうか
 */
function collision(piece) {
    // console.log(piece)
    return piece.shape[0].some((row, dy) => {
        // console.log(row, dy)
        return row.some((value, dx) => {
            let x = piece.x + dx;
            let y = piece.y + dy;
            return (
                value !== 0 &&
                (x < 0 || x >= COLS || y >= ROWS || (y >= 0 && board[y] && board[y][x] !== 0))
            );
        });
    });
}

/**
 * Tスピン判定
 * @param {Object} piece - 判定するテトリミノ
 * @param {Array<Array<number>>} board - ゲームボード
 * @returns {boolean} Tスピンかどうか
 */
function isTSpin(piece, board) {
    if (piece.type !== 'T') return false;
    if (!piece.lastMoveWasRotation) return false;

    const x = piece.x;
    const y = piece.y;

    // Tミノの中心から見た四隅をチェック
    const corners = [
        [x, y],     // 左上
        [x + 2, y], // 右上
        [x, y + 2], // 左下
        [x + 2, y + 2] // 右下
    ];

    let blockedCorners = 0;
    corners.forEach(([cx, cy]) => {
        if (cx < 0 || cx >= COLS || cy >= ROWS || (cy >= 0 && board[cy][cx] !== 0)) {
            blockedCorners++;
        }
    });

    return blockedCorners >= 3;
}

/**
 * Tスピンミニ判定を行う
 * @param {Object} piece - 判定するテトリミノ
 * @param {Array<Array<number>>} board - ゲームボード
 * @param {Array<number>} lastKick - 最後のキック
 * @returns {boolean} Tスピンミニかどうか
 */
function isTSpinMini(piece, board, lastKick) {
    if(isTestMode)console.log("lastKick: "+lastKick);

    const x = piece.x;
    const y = piece.y;

    // Tミノの出っ張りがある方の角2マスをチェック（4パターン）
    let topCorners;
    switch (piece.rotation) {
        case 0: // 上向き
            topCorners = [[x, y], [x + 2, y]];
            break;
        case 1: // 右向き
            topCorners = [[x + 2, y], [x + 2, y + 2]];
            break;
        case 2: // 下向き
            topCorners = [[x, y + 2], [x + 2, y + 2]];
            break;
        case 3: // 左向き
            topCorners = [[x, y], [x, y + 2]];
            break;
    }

    let openTopCorners = 0;
    topCorners.forEach(([cx, cy]) => {
        if (cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS && board[cy][cx] === 0) {
            openTopCorners++;
        }
    });

    // 出っ張りがある方の角2マスのうち1つだけが空いていて、かつ最後のキックが(1,-2)(-1, 2)でない場合にTスピンミニ
    const kickflag = (lastKick && lastKick[0] === 1 && lastKick[1] === -2) || (lastKick && lastKick[0] === -1 && lastKick[1] === 2)
    return openTopCorners === 1 && !kickflag;
}

/**
 * Back-to-Back状態を更新する
 * @param {boolean} isTetris - テトリスかどうか
 * @param {boolean} isTSpin - Tスピンかどうか
 * @param {number} lines - 消去したライン数
 */
function updateBackToBack(isTetris, isTSpin, lines) {
    if (isTetris || isTSpin) {
        if (backToBack) {
            backToBackCount++;
        } else {
            backToBack = true;
            backToBackCount = 0;  // カウントは次回から始まる
        }
    } else if (lines > 0) {
        backToBack = false;
        backToBackCount = 0;
    }
}

/**
 * RENボーナスを計算する
 * @param {number} ren - 現在のREN数
 * @returns {number} ボーナス点数
 */
function calculateRenBonus(ren) {
    // RENが1の時はボーナスなし、2から開始
    if (ren <= 1) return 0;
    if (backToBack && backToBackCount > 0) {
        return Math.min(ren * SCORE.REN.B2B_MULTIPLIER, SCORE.REN.B2B_MAX);
    } else {
        return Math.min(ren * SCORE.REN.MULTIPLIER, SCORE.REN.MAX);
    }
}

/**
* スコアを計算する
* @param {number} lines - 消去したライン数
* @param {boolean} isPerfectClear - パーフェクトクリアかどうか
* @param {boolean} isTetris - テトリスかどうか
* @param {boolean} isTSpin - Tスピンかどうか
* @param {boolean} isTSpinMini - Tスピンミニかどうか
* @returns {number} 計算されたスコア
*/
function calculateScore(lines, isPerfectClear, isTetris, isTSpin, isTSpinMini) {
    let score = SCORE.BASE[lines];

    if (isTSpinMini) {
        score = SCORE.TSPIN_MINI[lines] || score;
    } else if (isTSpin) {
        score = SCORE.TSPIN[lines] || score;
    }

    if (isPerfectClear) {
        score = SCORE.PERFECT_CLEAR[lines] || score;
    }

    if (backToBack && backToBackCount > 0) {
        if (isTetris) {
            score = SCORE.B2B.TETRIS;
        } else if (isTSpinMini) {
            score = SCORE.B2B.TSPIN_MINI[lines] || score;
        } else if (isTSpin) {
            score = SCORE.B2B.TSPIN[lines] || score;
        }

        if (isPerfectClear && lines === 4) {
            score = SCORE.B2B.PERFECT_CLEAR_TETRIS;
        }
    }

    // RENボーナス
    if (internalRenCount > 1) {
        score += calculateRenBonus(internalRenCount - 1);
    }

    return score;
}

/**
 * ラインを削除する
 * @param {boolean} isTSpin - Tスピンかどうか
 * @param {boolean} isTSpinMini - Tスピンミニかどうか
 */
function removeLines(isTSpin, isTSpinMini) {
    let lines = 0;
    let isPerfectClear = true;

    board.forEach((row, y) => {
        if (row.every(value => value !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            lines++;
        } else if (row.some(value => value !== 0)) {
            isPerfectClear = false;
        }
    });

    totalLinesCleared += lines;

    const isTetris = (lines === 4);

    if (lines > 0) {
        updateBackToBack(isTetris, isTSpin);
        score += calculateScore(lines, isPerfectClear, isTetris, isTSpin, isTSpinMini);

        // RENの更新
        internalRenCount++;
        if (internalRenCount > 1) {
            currentRen = internalRenCount - 1;
        }
    } else {
        internalRenCount = 0;
        currentRen = 0;
    }

    updateLevel();
    updateScoreDisplay();
}

/**
 * テトリミノを移動する
 * @param {number} dx - X方向の移動量
 * @param {number} dy - Y方向の移動量
 * @returns {boolean} 移動が成功したかどうか
 */
function move(dx, dy) {
    currentPiece.x += dx;
    currentPiece.y += dy;
    if (collision(currentPiece)) {
        currentPiece.x -= dx;
        currentPiece.y -= dy;
        return false;
    }
    if (dy === 0) {
        moveCounter++;
    }
    lockTimer = 0;
    currentPiece.lastMoveWasRotation = false;
    // console.log(currentPiece.x, currentPiece.y)
    return true;
}

/**
 * テトリミノを回転させる
 * @param {Object} piece - 回転させるテトリミノ
 * @param {number} direction - 回転方向（1: 時計回り, -1: 反時計回り）
 * @returns {Object} 回転後のテトリミノ
 */
function rotate(piece, direction) {
    srsSteps = []; // リセット
    const originalPiece = JSON.parse(JSON.stringify(piece)); // ディープコピー
    const newRotation = (piece.rotation + direction + 4) % 4;
    const rotated = {
        ...piece,
        shape: direction > 0
            ? [piece.shape[0].map((val, index) => piece.shape[0].map(row => row[index]).reverse())]
            : [piece.shape[0].map((val, index) => piece.shape[0].map(row => row[row.length-1-index]))],
        rotation: newRotation
    };

    let kickTable;
    if (piece.type === "I") {
        kickTable = KICK_TABLE.I;
    } else if (piece.type === "O") {
        kickTable = KICK_TABLE.O;
    } else {
        kickTable = KICK_TABLE.JLSTZ;
    }

    let kickIndex = direction > 0 ? piece.rotation : (piece.rotation - 1 + 4) % 4;
    kickIndex=KICK_TABLE_INDEX_MAP[kickIndex+""+direction];
    if(piece.type === "O") kickIndex = 0;

    srsSteps.push({...originalPiece, success: false, kickX: 0, kickY: 0});

    for (let [x, y] of kickTable[kickIndex]) {
        const kickedPiece = {
            ...rotated,
            x: rotated.x + x,
            y: rotated.y - y // yは逆になることに注意
        };
        srsSteps.push({...kickedPiece, success: !collision(kickedPiece), kickX: x, kickY: -y});
        if (!collision(kickedPiece)) {
            kickedPiece.lastMoveWasRotation = true;
            kickedPiece.lastKick = [x, y];  // 最後に適用されたキックを記録
            return kickedPiece;
        }
    }
    srsSteps.push({...piece, success: !collision(piece), kickX: 0, kickY: 0});
    return piece;
}

/**
 * ウォールキックを試行する(SRSに置き換えた為未使用)
 * @param {Object} piece - キックするテトリミノ
 * @param {number} direction - 回転方向
 * @returns {Object|null} キック成功時は新しい位置のテトリミノ、失敗時はnull
 */
function wallKick(piece, direction) {
    const kicks = [
        [0, 0],
        [-1, 0],
        [1, 0],
        [0, -1],
        [-1, -1],
        [1, -1],
        [0, -2],
        [-1, -2],
        [1, -2]
    ];

    for (let [x, y] of kicks) {
        const kickedPiece = {
            ...piece,
            x: piece.x + x,
            y: piece.y + y
        };
        if (!collision(kickedPiece)) {
            moveCounter++;
            lockTimer = 0; // ウォールキック成功時にロックタイマーをリセット
            return kickedPiece;
        }
    }
    return null;
}

/**
 * テトリミノを保持
 */
function hold() {
    if (!canHold) return;

    if (holdPiece) {
        [currentPiece, holdPiece] = [holdPiece, currentPiece];
        currentPiece.x = Math.floor(COLS / 2) - Math.ceil(currentPiece.shape[0].length / 2);
        currentPiece.y = 0;
    } else {
        holdPiece = currentPiece;
        resetPiece();
    }
    canHold = false;
}

/**
 * ハードドロップ(即時落下固定)
 */
function hardDrop() {
    while (!collision(currentPiece)) {
        currentPiece.y++;
    }
    currentPiece.y--;
    lockPiece();
    lockTimer = 0;
    moveCounter = 0;
}

/**
 * 新しいテトリミノをセット
 */
function resetPiece() {
    currentPiece = nextPieces.shift();
    nextPieces.push(getNextPiece());
    canHold = true;
}

/**
 * ゲームオーバー処理
 */
function gameOver() {
    isGameOver = true;
    alert('Game Over! Your score: ' + score);
    initGame();
}

/**
 * レベルの更新
 */
    function updateLevel() {
    const newLevel = Math.floor(totalLinesCleared / 10) + 1;
    if (newLevel > level) {
        changeLevel(newLevel);
    }
}

/**
 * レベルの変更
 * @param {number} level - 現在の時間
 */
function changeLevel(level){
    document.getElementById('level').textContent = level;
    gameState.dropInterval = LEVEL_SPEEDS[Math.min(level, LEVEL_SPEEDS.length)-1];
}

//メインループと初期化

/**
 * ゲームの初期化
 */
function initGame() {
    // ゲーム状態の初期化
    isGameOver = false;
    score = 0;
    level = 1;
    totalLinesCleared = 0;

    // REN関連の初期化
    currentRen = 0;
    internalRenCount = 0;

    // Back-to-Back関連の初期化
    backToBack = false;
    backToBackCount = 0;

    // ボードの初期化
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));

    // ピース関連の初期化
    bag = [];
    currentPiece = getNextPiece();
    nextPieces = [getNextPiece(), getNextPiece(), getNextPiece()];
    holdPiece = null;
    canHold = true;

    // ゲームスピードの初期化
    gameState.dropInterval = LEVEL_SPEEDS[0];

    // UI更新
    scoreElement.textContent = score;
    document.getElementById('level').textContent = level;
    updateScoreDisplay();
}

/**
 * ゲームの更新を行う
 * @param {number} time - 現在の時間
 */
function update(time = 0) {
    const deltaTime = time - gameState.lastTime;
    gameState.lastTime = time;

    if(isIntervalActive){
        intervalTimer -= deltaTime;
        if(intervalTimer <= 0){
            isIntervalActive = false;
        }
    }
    else{
        gameState.dropCounter += deltaTime;
        if (gameState.dropCounter > gameState.dropInterval) {
            if(!isTestMode){
                if (gameState.dropInterval <= 2) {
                    // 超高速落下: ブロックを一気に落下させる
                    while (!collision(currentPiece)) {
                        currentPiece.y++;
                    }
                    currentPiece.y--;
                } else {
                    moveDown();
                }
            }
            gameState.dropCounter = 0;
        }
    }

    if(!isTestMode) {

        currentPiece.y++;
        if (collision(currentPiece)) {
            currentPiece.y--;
            lockTimer += deltaTime;
            if (lockTimer >= lockDelay || moveCounter >= MAX_MOVES) {
                lockPiece();
                lockTimer = 0;
                moveCounter = 0;
            }
        } else {
            currentPiece.y--;
            lockTimer = 0;
            moveCounter = 0;
        }

        // 左右移動の処理
        ['left', 'right'].forEach(direction => {
            if (inputState[direction].pressed) {
                if (inputState[direction].duration === 0) {
                    // 最初の押下時
                    move(direction === 'left' ? -1 : 1, 0);
                }
                
                inputState[direction].duration += deltaTime;
                
                if (inputState[direction].duration >= MOVEMENT.DAS) {
                    const movesSinceDAS = Math.floor((inputState[direction].duration - MOVEMENT.DAS) / MOVEMENT.ARR);
                    if (movesSinceDAS > 0) {
                        move(direction === 'left' ? -1 : 1, 0);
                        inputState[direction].duration = MOVEMENT.DAS + (movesSinceDAS * MOVEMENT.ARR);
                    }
                }
            } else {
                inputState[direction].duration = 0;
            }
        });

        if (inputState.down) {
            moveDown();
        }
        if (inputState.rotateLeft) {
            currentPiece = rotate(currentPiece, -1);
            inputState.rotateLeft = false;
        }
        if (inputState.rotateRight) {
            currentPiece = rotate(currentPiece, 1);
            inputState.rotateRight = false;
        }
        if (inputState.hold) {
            hold();
            inputState.hold = false;
        }
        if (inputState.hardDrop) {
            hardDrop();
            inputState.hardDrop = false;
        }
        if(inputState.testMode) {
            toggleTestMode();
            inputState.testMode = false;
        }
        if(inputState.reload){
            initGame();
            inputState.reload = false;
        }

        updateLevel();
        draw();
    }else{
            // テストモードのロジック
        if (inputState.toggleSrsAnimationMode) {
            inputState.srsAnimationMode = !inputState.srsAnimationMode;
            console.log("SRS Animation Mode:", inputState.srsAnimationMode ? "ON" : "OFF");
            inputState.toggleSrsAnimationMode = false;
        }

        if (inputState.srsAnimation.active && inputState.srsAnimationMode) {
            rotate(currentPiece, inputState.srsAnimation.direction);
            currentSrsStep = 0;
            inputState.srsAnimation.active = false;
            animateSrsSteps();
        } else if (!isSrsAnimationRunning) {
            // SRSアニメーション中でない場合のみ通常の移動を許可
            // 左右移動の処理
            ['left', 'right'].forEach(direction => {
                if (inputState[direction].pressed) {
                    inputState[direction].duration += deltaTime;
                    if (inputState[direction].duration > 500) { // 0.5秒以上押し続けている場合
                        const moveInterval = 1000 / 40; // 秒間20マスの速度
                        const movesToMake = Math.floor(inputState[direction].duration / moveInterval) - Math.floor((inputState[direction].duration - deltaTime) / moveInterval);
                        for (let i = 0; i < movesToMake; i++) {
                            move(direction === 'left' ? -1 : 1, 0);
                        }
                    } else if (inputState[direction].duration <= deltaTime) { // 最初の押下時
                        move(direction === 'left' ? -1 : 1, 0);
                    }
                }
            });
            if (inputState.down) {
                moveDown();
                inputState.down = false;  // 1回の入力で1マス落下
            }
            if (inputState.rotateLeft) {
                currentPiece = rotate(currentPiece, -1);
                inputState.rotateLeft = false;
            }
            if (inputState.rotateRight) {
                currentPiece = rotate(currentPiece, 1);
                inputState.rotateRight = false;
            }
            if (inputState.hardDrop) {
                hardDrop();
                inputState.hardDrop = false;
            }
        }

        if (inputState.nextTestPiece) {
            setNextTestPiece();
            inputState.nextTestPiece = false;
        }

        draw();
    }
    requestAnimationFrame(update);
}

/**
 * 次のテトリミノを取得する
 * @returns {Object} 次のテトリミノ
 */
function getNextPiece() {
    if (bag.length === 0) {
        bag = [0, 1, 2, 3, 4, 5, 6];
        for (let i = bag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [bag[i], bag[j]] = [bag[j], bag[i]];
        }
    }
    const index = bag.pop();
    return {
        shape: SHAPES[index],
        color: COLORS[index],
        type: SHAPE_TYPES[index],
        x: Math.floor(COLS / 2) - 2,  // すべてのミノで同じ初期位置
        y: index === 0 ? -1 : 0,      // I ミノのみ1マス上
        rotation: 0, // 0: 0°, 1: 90°, 2: 180°, 3: 270°
    };
}

initGame();
update();