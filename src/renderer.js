"use strict";

//エフェクト
const HARD_DROP_EFFECT_LIFETIME = 3;

let hardDropEffect = null;
let hardDropEffectLifeTime = HARD_DROP_EFFECT_LIFETIME;

// 描画関係の関数
/**
 * ゲーム全体の描画を行う
 */
function draw() {
    const currentColor = getCurrentColor();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(3, BLOCK_SIZE * 3, COLS * BLOCK_SIZE, VISIBLE_ROWS * BLOCK_SIZE);
    drawGrid();
    drawBoard();
    drawFrame(currentColor);

    if (isGameStarted) {
        if(!isGameOver) drawGhostPiece();
        drawPiece(ctx, currentPiece, currentPiece.x, currentPiece.y + 1);
        if(!isGameOver) drawGhostPieceCrosses();
        drawHoldPiece();
        drawNextPieces();

        // ハードドロップエフェクトの描画
        if (hardDropEffect) {
            hardDropEffect();
        }
    } else {
        // ゲーム開始前の表示
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press any key to start', canvas.width / 2, canvas.height / 2);
        drawHoldPiece();
        drawNextPieces();
        updateScoreDisplay();
    }

    // CSSで制御される要素の色を更新
    document.getElementById('holdContainer').style.borderColor = currentColor;
    document.getElementById('nextContainer').style.borderColor = currentColor;
    const headers = document.querySelectorAll('.header');
    headers.forEach(header => {
        header.style.backgroundColor = currentColor;
        header.style.color = colorTransitionProgress > 0.5 ? 'white' : 'black';
    });
}


/**
 * ゲームボードの枠を描画する
 * @param {string} color - 枠線の色
 */
function drawFrame(color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(1.5, BLOCK_SIZE * 3);
    ctx.lineTo(1.5, (VISIBLE_ROWS + 3) * BLOCK_SIZE);
    ctx.lineTo(canvas.width - 1.5, (VISIBLE_ROWS + 3) * BLOCK_SIZE);
    ctx.lineTo(canvas.width - 1.5, BLOCK_SIZE * 3);
    ctx.stroke();
}

/**
 * ゲームボードのグリッドを描画する
 */
function drawGrid() {
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE + 3, BLOCK_SIZE * 3);
        ctx.lineTo(i * BLOCK_SIZE + 3, (VISIBLE_ROWS + 3) * BLOCK_SIZE);
        ctx.stroke();
    }
    for (let i = 1; i <= VISIBLE_ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(3, i * BLOCK_SIZE + BLOCK_SIZE * 2);
        ctx.lineTo(COLS * BLOCK_SIZE + 3, i * BLOCK_SIZE + BLOCK_SIZE * 2);
        ctx.stroke();
    }
}

/**
 * ゲームボードの状態を描画する
 */
function drawBoard() {
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                drawBlock(ctx, x, y - (ROWS - VISIBLE_ROWS) + 3, COLORS[value - 1]);
            }
        });
    });
}

/**
 * 個々のブロックを描画する
 * @param {CanvasRenderingContext2D} context - 描画コンテキスト
 * @param {number} x - ブロックのX座標
 * @param {number} y - ブロックのY座標
 * @param {string} color - ブロックの色
 * @param {number} size - ブロックのサイズ倍率（デフォルト: 1.0）
 */
function drawBlock(context, x, y, color, size = 1.0) {
    const drawX = x * BLOCK_SIZE * size + (context === ctx ? 3 : 0);
    const drawY = y * BLOCK_SIZE * size;
    const blockSize = BLOCK_SIZE * size;

    // クリッピングパスを設定
    context.save();
    context.beginPath();
    context.rect(drawX, drawY, blockSize, blockSize);
    context.clip();

    // グラデーションの作成
    const gradient = context.createRadialGradient(
        drawX + blockSize / 2, drawY + blockSize / 2, 0,
        drawX + blockSize / 2, drawY + blockSize / 2, blockSize / 2
    );
    gradient.addColorStop(0.2, lightenColor(color, 60));
    gradient.addColorStop(0.5, lightenColor(color, 30));
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, darkenColor(color, 20));

    // ブロックの描画
    context.fillStyle = gradient;
    context.fillRect(drawX, drawY, blockSize, blockSize);

    // 光沢効果
    context.fillStyle = 'rgba(255, 255, 255, 0.15)';
    context.beginPath();
    context.moveTo(drawX, drawY);
    context.lineTo(drawX + blockSize / 3, drawY);
    context.lineTo(drawX, drawY + blockSize / 3);
    context.fill();
    context.beginPath();
    context.moveTo(drawX + blockSize, drawY + blockSize);
    context.lineTo(drawX + blockSize*2 / 3, drawY + blockSize);
    context.lineTo(drawX + blockSize, drawY + blockSize*2 / 3);
    context.fill();

    // 枠線
    context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    context.strokeRect(drawX, drawY, blockSize, blockSize);

    context.restore();
}

/**
 * テトリミノを描画する
 * @param {CanvasRenderingContext2D} context - 描画コンテキスト
 * @param {Object} piece - 描画するテトリミノ
 * @param {number} offsetX - X軸オフセット
 * @param {number} offsetY - Y軸オフセット
 * @param {number} size - サイズ倍率
 */
function drawPiece(context, piece, offsetX, offsetY, size = 1.0) {
    if (!piece) return;
    piece.shape[0].forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                drawBlock(context, x + offsetX, y + offsetY, piece.color, size);
            }
        });
    });
}

/**
 * ゴーストピースを描画する。
 */
function drawGhostPiece() {
    const ghostPiece = {...currentPiece};
    while (!collision(ghostPiece)) {
        ghostPiece.y++;
    }
    ghostPiece.y--;

    ghostPiece.shape[0].forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                const boardRow = ghostPiece.y + y;
                const boardCol = ghostPiece.x + x;
                const drawX = (ghostPiece.x + x) * BLOCK_SIZE + 3;
                const drawY = (ghostPiece.y + y + 1) * BLOCK_SIZE;

                const isInDanger = isInDangerZone(boardRow, boardCol);

                ctx.fillStyle = isInDanger ? 'rgba(255, 0, 0, 0.3)' : 'rgba(128, 128, 128, 0.5)';
                ctx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = isInDanger ? 'rgba(255, 0, 0, 0.5)' : 'rgba(128, 128, 128, 0.5)';
                ctx.strokeRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}

/**
 * ゴーストピースがdangerzoneの時バツマークを描く
 */
function drawGhostPieceCrosses() {
    const ghostPiece = {...currentPiece};
    while (!collision(ghostPiece)) {
        ghostPiece.y++;
    }
    ghostPiece.y--;

    ghostPiece.shape[0].forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                const boardRow = ghostPiece.y + y;
                const boardCol = ghostPiece.x + x;
                if (isInDangerZone(boardRow, boardCol)) {
                    const drawX = (ghostPiece.x + x) * BLOCK_SIZE + 3;
                    const drawY = (ghostPiece.y + y + 1) * BLOCK_SIZE;

                    // バツ印を描画
                    ctx.beginPath();
                    ctx.moveTo(drawX, drawY);
                    ctx.lineTo(drawX + BLOCK_SIZE, drawY + BLOCK_SIZE);
                    ctx.moveTo(drawX + BLOCK_SIZE, drawY);
                    ctx.lineTo(drawX, drawY + BLOCK_SIZE);
                    ctx.strokeStyle = '#660000';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                    ctx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        });
    });
}

/**
 * 次のピースを描画する
 */
function drawNextPieces() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextCtx.fillStyle = 'black';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextPieces.forEach((piece, index) => {
        const scale = 0.8;
        const offsetX = (nextCanvas.width - piece.shape[0][0].length * BLOCK_SIZE * scale) / 2 / BLOCK_SIZE / scale;
        const offsetY = index * 4 + (4 - piece.shape[0].length * scale) / 2 / scale;
        drawPiece(nextCtx, piece, offsetX, offsetY, scale);
    });
}

/**
 * ホールドしているピースを描画する
 */
function drawHoldPiece() {
    holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
    holdCtx.fillStyle = 'black';
    holdCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
    if (holdPiece) {
        const scale = 0.8;
        const offsetX = (holdCanvas.width - holdPiece.shape[0][0].length * BLOCK_SIZE * scale) / 2 / BLOCK_SIZE / scale;
        const offsetY = (holdCanvas.height + 20 - holdPiece.shape[0].length * BLOCK_SIZE * scale) / 2 / BLOCK_SIZE / scale;
        drawPiece(holdCtx, holdPiece, offsetX, offsetY, scale);
    }
}

/**
 * スコア表示の更新
 */
function updateScoreDisplay() {
    scoreElement.textContent = score;
    // document.getElementById('renCount').textContent = currentRen;
    document.getElementById('level').textContent = level;
    document.getElementById('linesCleared').textContent = totalLinesCleared;
}

/**
 * 色を指定されたパーセンテージだけ暗くする
 * @param {string} color - 元の色（16進数形式）
 * @param {number} percent - 暗くする割合（%）
 * @returns {string} 暗くした色（16進数形式）
 */
function darkenColor(color, percent) {
    const num = parseInt(color.replace("#",""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) - amt,
    G = (num >> 8 & 0x00FF) - amt,
    B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

/**
 * 色を指定されたパーセンテージだけ明るくする
 * @param {string} color - 元の色（16進数形式）
 * @param {number} percent - 明るくする割合（%）
 * @returns {string} 明るくした色（16進数形式）
 */
function lightenColor(color, percent) {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * ハードドロップのトレイルエフェクトを描画する
 * @param {Object} piece - 現在のテトロミノ
 * @param {number} startY - 開始Y座標
 * @param {number} endY - 終了Y座標
 */
function drawHardDropTrail(piece, startY, endY) {
    const rowArray = getPieceProjection(piece);
    let opacity = 0.01;
    startY += 2;
    if(startY > endY) return;

    piece.shape[0].forEach((row, pieceY) => {
        row.forEach((value, pieceX) => {
            if (value !== 0) {
                ctx.fillStyle = `rgba(255, 255, 180, ${opacity})`;
                const drawX = (piece.x + pieceX) * BLOCK_SIZE + 3;
                const drawY = (startY + pieceY + 1) * BLOCK_SIZE;
                ctx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });

    for (let y = startY+1; y <= endY+1; y++) {
        opacity += 0.02;
        rowArray.forEach((value, pieceX) => {
            if (value !== 0) {
                ctx.fillStyle = `rgba(255, 255, 180, ${opacity})`;
                const drawX = (piece.x + pieceX) * BLOCK_SIZE + 3;
                const drawY = (y + 1) * BLOCK_SIZE;
                ctx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    }
}

/**
 * テトリミノの水平面に対する射影を返す
 * @param {Object} piece - テトリミノのピースオブジェクト
 * @returns {Array<number>} 射影を表す配列
 */
function getPieceProjection(piece) {
    const shape = piece.shape[0];
    const width = shape[0].length;
    const height = shape.length;
    const projection = new Array(width).fill(0);

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (shape[y][x] !== 0) {
                projection[x] = 1;
                break;
            }
        }
    }

    return projection;
}