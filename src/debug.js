"use strict";

//デバック関係

/**
 * デバックモードに切り替え
 */
function toggleTestMode() {
    isTestMode = !isTestMode;
    console.log("Test mode:", isTestMode ? "ON" : "OFF");
    if (isTestMode) {
        setupTestEnvironment();
    } else {
        resetGame();
    }
}

/**
 * テスト環境をセットアップ
 */
function setupTestEnvironment() {
    // テストボードの状態をメインのボードにコピー
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (y < testBoard.length && x < testBoard[y].length) {
                board[y][x] = testBoard[y][x] ? 1 : 0; // 1ならブロックを配置
            } else {
                board[y][x] = 0;
            }
        }
    }

    // 初期のテストピースを設定
    setNextTestPiece();
}

/**
 * 次のテストピースをセット
 */
function setNextTestPiece() {
    let index = currentTestPieceIndex;
    currentPiece = {
        shape: SHAPES[index],
        color: COLORS[index],
        type: SHAPE_TYPES[index],
        x: Math.floor(COLS / 2) - 2,  // すべてのミノで同じ初期位置
        y: index === 0 ? -1 : 0,      // I ミノのみ1マス上
        rotation: 0, // 0: 0°, 1: 90°, 2: 180°, 3: 270°
    };
    currentTestPieceIndex = (currentTestPieceIndex + 1) % SHAPES.length;
}

/**
 * SRSアニメーションの各ステップを描画
 */
function drawSrsStep(step) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFrame();
    drawGrid();
    drawBoard();

    // 現在のピースを描画
    ctx.globalAlpha = 0.5;
    drawPiece(ctx, step, step.x, step.y+1);
    ctx.globalAlpha = 1;

    // キック情報を描画
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Kick: (${step.kickX}, ${step.kickY})`, 10, 30);
    ctx.fillText(`Success: ${step.success}`, 10, 50);

    // 元の位置を点線で描画
    ctx.strokeStyle = 'red';
    ctx.setLineDash([5, 5]);
    ctx.strokeRect((srsSteps[0].x) * BLOCK_SIZE, (srsSteps[0].y + 1) * BLOCK_SIZE, 
                srsSteps[0].shape[0].length * BLOCK_SIZE, srsSteps[0].shape.length * BLOCK_SIZE);
    ctx.setLineDash([]);
}

/**
 * SRSアニメーションの再生
 */
function animateSrsSteps() {
    isSrsAnimationRunning = true;
    if (currentSrsStep < srsSteps.length) {
        drawSrsStep(srsSteps[currentSrsStep]);
        currentSrsStep++;
        setTimeout(animateSrsSteps, 500); // 0.?秒ごとに次のステップを表示
    } else {
        isSrsAnimationRunning = false;
        currentPiece = srsSteps[srsSteps.length - 1];
        draw(); // 最終的な状態を描画
    }
}