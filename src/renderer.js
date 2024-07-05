"use strict";

// 描画関係の関数
/**
 * ゲーム全体の描画を行う
 */
function draw() {
    if(isSrsAnimationRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFrame();
    drawGrid();
    drawBoard();
    drawPiece(ctx, currentPiece, currentPiece.x + 1, currentPiece.y + 1);
    // console.log(currentPiece.x, currentPiece.y)
    drawGhostPiece();
    drawHoldPiece();
    drawNextPieces();
}

/**
 * ゲームボードの枠を描画する
 */
function drawFrame() {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(BLOCK_SIZE, BLOCK_SIZE * 3, COLS * BLOCK_SIZE, VISIBLE_ROWS * BLOCK_SIZE);
}

/**
 * ゲームボードのグリッドを描画する
 */
function drawGrid() {
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE + BLOCK_SIZE, BLOCK_SIZE * 3);
        ctx.lineTo(i * BLOCK_SIZE + BLOCK_SIZE, (VISIBLE_ROWS + 1) * (BLOCK_SIZE * 3));
        ctx.stroke();
    }
    for (let i = 1; i <= VISIBLE_ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(BLOCK_SIZE, i * BLOCK_SIZE + BLOCK_SIZE * 2);
        ctx.lineTo((COLS + 1) * BLOCK_SIZE, i * BLOCK_SIZE + BLOCK_SIZE * 2);
        ctx.stroke();
    }
}

/**
 * ゲームボードの状態を病臥する
 */
function drawBoard() {
    board.forEach((row, y) => {
        if (y >= ROWS - VISIBLE_ROWS) {
            row.forEach((value, x) => {
                if (value > 0) {
                    ctx.fillStyle = COLORS[value - 1];
                    ctx.fillRect((x + 1) * BLOCK_SIZE, (y - (ROWS - VISIBLE_ROWS) + 3) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeStyle = 'black';
                    ctx.strokeRect((x + 1) * BLOCK_SIZE, (y - (ROWS - VISIBLE_ROWS) + 3) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            });
        }
    });
}

/**
 * テトリミノを描画する
 * @param {CanvasRenderingContext2D} context - 描画コンテキスト
 * @param {Object} piece - 描画するテトリミノ
 * @param {number} offsetX - X軸オフセット
 * @param {number} offsetY - Y軸オフセット
 * @param {number} size - サイズ倍率
 */
function drawPiece(context, piece, offsetX, offsetY, size=1.0) {
    if (!piece) return;
    context.fillStyle = piece.color;
    piece.shape[0].forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                const drawX = (x + offsetX) * BLOCK_SIZE * size;
                const drawY = (y + offsetY) * BLOCK_SIZE * size;
                context.fillRect(drawX, drawY, BLOCK_SIZE * size, BLOCK_SIZE * size);
                context.strokeStyle = 'black';
                context.strokeRect(drawX, drawY, BLOCK_SIZE * size, BLOCK_SIZE * size);
            }
        });
    });
}

/**
 * ゴーストピースを描画する
 */
function drawGhostPiece() {
    const ghostPiece = {...currentPiece};
    while (!collision(ghostPiece)) {
        ghostPiece.y++;
    }
    ghostPiece.y--;

    ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
    ghostPiece.shape[0].forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                const drawX = (ghostPiece.x + x + 1) * BLOCK_SIZE;
                const drawY = (ghostPiece.y + y + 1) * BLOCK_SIZE;
                ctx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = 'gray';
                ctx.strokeRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}

/**
 * 次のピースを描画する
 */
function drawNextPieces() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextPieces.forEach((piece, index) => {
        const offsetX = 0.2;
        const offsetY = index * 4 + (4 - piece.shape.length) / 2;
        drawPiece(nextCtx, piece, offsetX, offsetY, 0.8);
    });
}

/**
 * ホールドしているピースを描画する
 */
function drawHoldPiece() {
    holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
    if (holdPiece) {
        const offsetX = 0.1;
        const offsetY = (4 - holdPiece.shape.length) / 2;
        drawPiece(holdCtx, holdPiece, offsetX, offsetY, 0.8);
    }
}

/**
 * スコア表示の更新
 */
function updateScoreDisplay() {
    scoreElement.textContent = score;
    document.getElementById('renCount').textContent = currentRen;
    document.getElementById('level').textContent = level;
    document.getElementById('linesCleared').textContent = totalLinesCleared;
}