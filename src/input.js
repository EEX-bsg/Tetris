"use strict";
// 入力状態
let inputState = {
    left: { pressed: false, duration: 0 },
    right: { pressed: false, duration: 0 },
    down: false,
    rotateLeft: false,
    rotateRight: false,
    hold: false,
    hardDrop: false,
    testMode: false,
    nextTestPiece: false,
    srsAnimation: {
        active: false,
        direction: 0
    },
    srsAnimationMode: false,  // SRSアニメーションモードの状態を追加
    toggleSrsAnimationMode: false,  // SRSアニメーションモード切り替えフラグ
    reload: false,
};

let lastResetTime = 0;
const resetCooldown = 1000;

document.addEventListener('keydown', event => {
    if (isAnimating) return;

        if (isGameOver) {
            if (event.code === 'KeyR' || event.code === 'Space' || event.code === 'Escape') {
                resetGame();
            }
            return;
    }
    if (isGameInitialized && !isGameStarted) {
        startGame();
        return;
    }
    if (!isTestMode) {
        switch (event.keyCode) {
            case 37: // 左矢印
                inputState.left.pressed = true;
                break;
            case 39: // 右矢印
                inputState.right.pressed = true;
                break;
            case 40: // 下矢印
                inputState.down = true;
                break;
            case 90: // Zキー（反時計回りに回転）
                inputState.rotateLeft = true;
                break;
            case 88: // Xキー（時計回りに回転）
                inputState.rotateRight = true;
                break;
            case 67: // Cキー（ホールド）
                inputState.hold = true;
                break;
            case 32: // スペースキー（ハードドロップ）
                inputState.hardDrop = true;
                break;
            case 82: //Rキー(リロード)
                inputState.reload = true;
                break;
        }
    } else {
        switch (event.keyCode) {
            case 37: // 左矢印
            case 39: // 右矢印
                inputState[event.keyCode === 37 ? 'left' : 'right'].pressed = true;
                break;
            case 40: // 下矢印
                inputState.down = true;
                break;
            case 90: // Zキー（反時計回りに回転）
                if (inputState.srsAnimationMode && !isSrsAnimationRunning) {
                    inputState.srsAnimation.active = true;
                    inputState.srsAnimation.direction = -1;
                } else if (!inputState.srsAnimationMode) {
                    inputState.rotateLeft = true;
                }
                break;
            case 88: // Xキー（時計回りに回転）
                if (inputState.srsAnimationMode && !isSrsAnimationRunning) {
                    inputState.srsAnimation.active = true;
                    inputState.srsAnimation.direction = 1;
                } else if (!inputState.srsAnimationMode) {
                    inputState.rotateRight = true;
                }
                break;
            case 32: // スペースキー（ハードドロップ）
                inputState.hardDrop = true;
                break;
            case 89: // Yキー（次のテストピース）
                inputState.nextTestPiece = true;
                break;
            case 65: // Aキー（SRSアニメーションモード切り替え）
                inputState.toggleSrsAnimationMode = true;
                break;
        }
    }
    if (event.keyCode === 80) { // Pキー（テストモード切り替え）
        inputState.testMode = true;
    }
});

document.addEventListener('keyup', event => {
    switch (event.keyCode) {
        case 37: // 左矢印
            inputState.left.pressed = false;
            inputState.left.duration = 0;
            break;
        case 39: // 右矢印
            inputState.right.pressed = false;
            inputState.right.duration = 0;
            break;
        case 40: // 下矢印
            inputState.down = false;
            break;
    }
});

/**
 * リトライボタンのクリックイベントを設定する
 */
function setupRetryButton() {
    const retryButton = document.getElementById('retryButton');
    retryButton.addEventListener('click', () => {
        if (isAnimating) return;
        resetGame();
    });
}

// 既存のイベントリスナー設定の中に以下を追加
setupRetryButton();