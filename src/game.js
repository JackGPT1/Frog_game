// ============================================================
// Keroro Runner - Version 1
// 一個簡單的 2D 平台跳躍遊戲
// ============================================================

// ========================
// 1. 遊戲常數
// ========================
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

// 物理常數
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const MOVE_SPEED = 5;
const FRICTION = 0.85;
const MAX_FALL_SPEED = 15;

// 關卡尺寸
const LEVEL_WIDTH = 3200;
const LEVEL_HEIGHT = CANVAS_HEIGHT;

// 顏色
const COLORS = {
  sky: '#87CEEB',
  ground: '#8B4513',
  groundTop: '#228B22',
  platform: '#A0522D',
  platformTop: '#228B22',
  spike: '#FF4444',
  spikeBase: '#CC0000',
  finish: '#FFD700',
  finishPole: '#8B4513',
  player: '#4CAF50',
  playerDark: '#388E3C',
  playerHat: '#FFC107',
  playerStar: '#F44336',
  playerEye: '#FFFFFF',
  playerPupil: '#000000',
  cloud: 'rgba(255, 255, 255, 0.8)',
  text: '#333333',
  textLight: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

// ========================
// 2. 關卡資料
// ========================
function createLevel() {
  return {
    // 地面平台
    platforms: [
      // 地面段落
      { x: 0, y: 450, width: 500, height: 50, isGround: true },
      { x: 600, y: 450, width: 400, height: 50, isGround: true },
      { x: 1100, y: 450, width: 300, height: 50, isGround: true },
      { x: 1500, y: 450, width: 500, height: 50, isGround: true },
      { x: 2100, y: 450, width: 400, height: 50, isGround: true },
      { x: 2600, y: 450, width: 600, height: 50, isGround: true },

      // 浮空平台
      { x: 250, y: 340, width: 120, height: 20, isGround: false },
      { x: 450, y: 280, width: 100, height: 20, isGround: false },
      { x: 700, y: 350, width: 130, height: 20, isGround: false },
      { x: 950, y: 300, width: 100, height: 20, isGround: false },
      { x: 1200, y: 340, width: 120, height: 20, isGround: false },
      { x: 1400, y: 280, width: 100, height: 20, isGround: false },
      { x: 1700, y: 350, width: 130, height: 20, isGround: false },
      { x: 1900, y: 280, width: 100, height: 20, isGround: false },
      { x: 2200, y: 340, width: 120, height: 20, isGround: false },
      { x: 2450, y: 280, width: 100, height: 20, isGround: false },
      { x: 2800, y: 350, width: 130, height: 20, isGround: false },
    ],

    // 尖刺障礙物
    obstacles: [
      { x: 350, y: 430, width: 30, height: 20 },
      { x: 750, y: 430, width: 30, height: 20 },
      { x: 1200, y: 430, width: 30, height: 20 },
      { x: 1650, y: 430, width: 30, height: 20 },
      { x: 1800, y: 430, width: 30, height: 20 },
      { x: 2250, y: 430, width: 30, height: 20 },
      { x: 2750, y: 430, width: 30, height: 20 },
    ],

    // 終點位置
    finish: { x: 3050, y: 370, width: 40, height: 80 },

    // 裝飾用雲朵
    clouds: [
      { x: 100, y: 60, width: 80, height: 40 },
      { x: 400, y: 90, width: 100, height: 50 },
      { x: 800, y: 50, width: 70, height: 35 },
      { x: 1200, y: 80, width: 90, height: 45 },
      { x: 1600, y: 60, width: 80, height: 40 },
      { x: 2000, y: 100, width: 100, height: 50 },
      { x: 2400, y: 70, width: 70, height: 35 },
      { x: 2800, y: 90, width: 90, height: 45 },
    ],
  };
}

// ========================
// 3. 遊戲狀態
// ========================
function createGameState() {
  return {
    state: 'start', // 'start' | 'playing' | 'paused' | 'gameover' | 'win'
    timer: 0,
    score: 0,
    startTime: 0,
    pauseStartedAt: 0,
    totalPausedTime: 0,
    frameCount: 0,
  };
}

// ========================
// 4. 玩家物件
// ========================
function createPlayer() {
  return {
    x: 80,
    y: 400,
    width: 30,
    height: 38,
    vx: 0,
    vy: 0,
    isOnGround: false,
    facingRight: true,
  };
}

// ========================
// 5. 攝影機
// ========================
function createCamera() {
  return {
    x: 0,
    y: 0,
  };
}

// ========================
// 6. 輸入處理
// ========================
function createInput() {
  return {
    left: false,
    right: false,
    up: false,
    jumpPressed: false, // 用於偵測「剛按下」的瞬間
  };
}

// ========================
// 7. 碰撞偵測
// ========================

// AABB 碰撞偵測：兩個矩形是否重疊
function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// ========================
// 8. 遊戲更新邏輯
// ========================

function updatePlayer(player, input, level) {
  // --- 水平移動 ---
  if (input.left) {
    player.vx = -MOVE_SPEED;
    player.facingRight = false;
  } else if (input.right) {
    player.vx = MOVE_SPEED;
    player.facingRight = true;
  } else {
    // 沒有按鍵時，施加摩擦力讓角色減速
    player.vx *= FRICTION;
    // 速度太小就歸零（避免無限滑動）
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
  }

  // --- 跳躍 ---
  if (input.up && player.isOnGround) {
    player.vy = JUMP_FORCE;
    player.isOnGround = false;
  }

  // --- 重力 ---
  player.vy += GRAVITY;
  if (player.vy > MAX_FALL_SPEED) {
    player.vy = MAX_FALL_SPEED;
  }

  // --- 更新位置 ---
  player.x += player.vx;
  player.y += player.vy;

  // --- 關卡邊界限制 ---
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > LEVEL_WIDTH) {
    player.x = LEVEL_WIDTH - player.width;
  }

  // --- 平台碰撞 ---
  player.isOnGround = false;
  for (const platform of level.platforms) {
    // 單向平台碰撞邏輯：
    // 只在玩家「正在下落」且「玩家的底部在平台頂部附近」時才碰撞
    const playerBottom = player.y + player.height;
    const prevBottom = playerBottom - player.vy;

    if (
      player.vy >= 0 && // 正在下落（vy >= 0 表示向下）
      prevBottom <= platform.y + 2 && // 上一幀底部在平台頂部或之上
      playerBottom >= platform.y && // 這一幀底部已經進入平台
      player.x + player.width > platform.x && // 水平方向有重疊
      player.x < platform.x + platform.width
    ) {
      // 碰撞！把玩家推到平台上
      player.y = platform.y - player.height;
      player.vy = 0;
      player.isOnGround = true;
    }
  }

  // --- 掉出畫面 = 死亡 ---
  if (player.y > LEVEL_HEIGHT + 50) {
    return 'dead';
  }

  return 'alive';
}

function checkObstacleCollision(player, level) {
  for (const obstacle of level.obstacles) {
    // 稍微縮小碰撞箱，讓判定更寬容
    const playerHitbox = {
      x: player.x + 4,
      y: player.y + 4,
      width: player.width - 8,
      height: player.height - 4,
    };
    if (rectsOverlap(playerHitbox, obstacle)) {
      return true;
    }
  }
  return false;
}

function checkFinishCollision(player, level) {
  return rectsOverlap(player, level.finish);
}

function updateCamera(camera, player) {
  // 讓玩家保持在畫面左側 1/3 處
  const targetX = player.x - CANVAS_WIDTH / 3;

  // 平滑跟隨
  camera.x += (targetX - camera.x) * 0.1;

  // 限制邊界
  if (camera.x < 0) camera.x = 0;
  if (camera.x > LEVEL_WIDTH - CANVAS_WIDTH) {
    camera.x = LEVEL_WIDTH - CANVAS_WIDTH;
  }
}

// ========================
// 9. 繪圖函式
// ========================

function drawBackground(ctx, camera, level) {
  // 天空漸層
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#4FC3F7');
  gradient.addColorStop(1, '#B3E5FC');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 雲朵（視差效果：移動速度比攝影機慢）
  ctx.fillStyle = COLORS.cloud;
  for (const cloud of level.clouds) {
    const cloudX = cloud.x - camera.x * 0.3; // 視差滾動
    // 讓雲朵循環顯示
    const wrappedX = ((cloudX % (CANVAS_WIDTH + 200)) + CANVAS_WIDTH + 200) % (CANVAS_WIDTH + 200) - 100;
    drawCloud(ctx, wrappedX, cloud.y, cloud.width, cloud.height);
  }
}

function drawCloud(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.arc(x + w * 0.3, y + h * 0.6, h * 0.4, 0, Math.PI * 2);
  ctx.arc(x + w * 0.5, y + h * 0.3, h * 0.5, 0, Math.PI * 2);
  ctx.arc(x + w * 0.7, y + h * 0.5, h * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatforms(ctx, camera, level) {
  for (const platform of level.platforms) {
    const drawX = platform.x - camera.x;

    // 不繪製畫面外的平台
    if (drawX + platform.width < 0 || drawX > CANVAS_WIDTH) continue;

    if (platform.isGround) {
      // 地面：棕色 + 綠色頂部
      ctx.fillStyle = COLORS.ground;
      ctx.fillRect(drawX, platform.y, platform.width, platform.height);
      ctx.fillStyle = COLORS.groundTop;
      ctx.fillRect(drawX, platform.y, platform.width, 6);
    } else {
      // 浮空平台
      ctx.fillStyle = COLORS.platform;
      ctx.fillRect(drawX, platform.y, platform.width, platform.height);
      ctx.fillStyle = COLORS.platformTop;
      ctx.fillRect(drawX, platform.y, platform.width, 4);

      // 平台底部陰影
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(drawX, platform.y + platform.height - 3, platform.width, 3);
    }
  }
}

function drawObstacles(ctx, camera, level) {
  for (const obstacle of level.obstacles) {
    const drawX = obstacle.x - camera.x;

    // 不繪製畫面外的障礙物
    if (drawX + obstacle.width < 0 || drawX > CANVAS_WIDTH) continue;

    // 畫尖刺（三角形）
    ctx.fillStyle = COLORS.spike;
    ctx.beginPath();
    ctx.moveTo(drawX, obstacle.y + obstacle.height);
    ctx.lineTo(drawX + obstacle.width / 2, obstacle.y);
    ctx.lineTo(drawX + obstacle.width, obstacle.y + obstacle.height);
    ctx.closePath();
    ctx.fill();

    // 尖刺底座
    ctx.fillStyle = COLORS.spikeBase;
    ctx.fillRect(drawX - 2, obstacle.y + obstacle.height - 4, obstacle.width + 4, 4);
  }
}

function drawFinish(ctx, camera, level, frameCount) {
  const flag = level.finish;
  const drawX = flag.x - camera.x;

  // 不繪製畫面外的終點
  if (drawX + flag.width < 0 || drawX > CANVAS_WIDTH) return;

  // 旗桿
  ctx.fillStyle = COLORS.finishPole;
  ctx.fillRect(drawX + 5, flag.y, 6, flag.height);

  // 旗幟（有飄動效果）
  const wave = Math.sin(frameCount * 0.05) * 3;
  ctx.fillStyle = COLORS.finish;
  ctx.beginPath();
  ctx.moveTo(drawX + 11, flag.y + 5);
  ctx.lineTo(drawX + 40 + wave, flag.y + 15);
  ctx.lineTo(drawX + 11, flag.y + 30);
  ctx.closePath();
  ctx.fill();

  // 旗幟上的星星
  ctx.fillStyle = COLORS.playerStar;
  ctx.font = '14px Arial';
  ctx.fillText('★', drawX + 18 + wave * 0.5, flag.y + 22);

  // 底座
  ctx.fillStyle = '#666';
  ctx.fillRect(drawX, flag.y + flag.height - 5, 16, 5);
}

function drawPlayer(ctx, camera, player, frameCount) {
  const drawX = player.x - camera.x;
  const drawY = player.y;

  ctx.save();

  // 如果面向左邊，翻轉繪圖
  if (!player.facingRight) {
    ctx.translate(drawX + player.width, 0);
    ctx.scale(-1, 1);
    ctx.translate(0, 0);
  } else {
    ctx.translate(drawX, 0);
  }

  // --- 身體（綠色橢圓）---
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.ellipse(player.width / 2, drawY + 26, 11, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- 頭部（綠色圓形）---
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(player.width / 2, drawY + 10, 12, 0, Math.PI * 2);
  ctx.fill();

  // --- 帽子（黃色半圓）---
  ctx.fillStyle = COLORS.playerHat;
  ctx.beginPath();
  ctx.arc(player.width / 2, drawY + 5, 9, Math.PI, 0);
  ctx.fill();

  // --- 星星（紅色）---
  ctx.fillStyle = COLORS.playerStar;
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('★', player.width / 2, drawY + 5);

  // --- 眼睛 ---
  ctx.fillStyle = COLORS.playerEye;
  ctx.beginPath();
  ctx.arc(player.width / 2 - 4, drawY + 10, 3.5, 0, Math.PI * 2);
  ctx.arc(player.width / 2 + 4, drawY + 10, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // --- 瞳孔 ---
  ctx.fillStyle = COLORS.playerPupil;
  const pupilOffset = player.facingRight ? 1 : -1;
  ctx.beginPath();
  ctx.arc(player.width / 2 - 4 + pupilOffset, drawY + 10, 1.5, 0, Math.PI * 2);
  ctx.arc(player.width / 2 + 4 + pupilOffset, drawY + 10, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // --- 嘴巴（微笑）---
  ctx.strokeStyle = COLORS.playerDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(player.width / 2, drawY + 15, 4, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // --- 腳（走路動畫）---
  ctx.fillStyle = COLORS.playerDark;
  if (player.isOnGround && Math.abs(player.vx) > 0.5) {
    // 走路時腳交替
    const legAnim = Math.sin(frameCount * 0.3) * 3;
    ctx.fillRect(player.width / 2 - 7, drawY + 34 + legAnim, 5, 5);
    ctx.fillRect(player.width / 2 + 2, drawY + 34 - legAnim, 5, 5);
  } else {
    ctx.fillRect(player.width / 2 - 7, drawY + 34, 5, 5);
    ctx.fillRect(player.width / 2 + 2, drawY + 34, 5, 5);
  }

  ctx.restore();
}

function drawHUD(ctx, gameState) {
  // 計時器
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(10, 10, 160, 35);
  ctx.fillStyle = COLORS.textLight;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  const timeStr = (gameState.timer / 1000).toFixed(1);
  ctx.fillText(`⏱ 時間: ${timeStr}s`, 20, 33);

  // 分數
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(CANVAS_WIDTH - 170, 10, 160, 35);
  ctx.fillStyle = COLORS.textLight;
  ctx.textAlign = 'right';
  ctx.fillText(`⭐ 分數: ${gameState.score}`, CANVAS_WIDTH - 20, 33);
}

function drawPauseButton(ctx, gameState) {
  if (gameState.state !== 'playing' && gameState.state !== 'paused') return;

  const buttonWidth = 120;
  const buttonHeight = 40;
  const buttonX = CANVAS_WIDTH - buttonWidth - 20;
  const buttonY = 60;

  ctx.fillStyle =
    gameState.state === 'paused'
      ? 'rgba(34, 197, 94, 0.95)'
      : 'rgba(30, 41, 59, 0.95)';
  ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 2;
  ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

  ctx.fillStyle = COLORS.textLight;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(
    gameState.state === 'paused' ? '▶ 繼續' : '⏸ 暫停',
    buttonX + buttonWidth / 2,
    buttonY + 26
  );
}

function isPauseButtonClicked(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / rect.width;
  const scaleY = CANVAS_HEIGHT / rect.height;
  const mouseX = (event.clientX - rect.left) * scaleX;
  const mouseY = (event.clientY - rect.top) * scaleY;

  const buttonWidth = 120;
  const buttonHeight = 40;
  const buttonX = CANVAS_WIDTH - buttonWidth - 20;
  const buttonY = 60;

  return (
    mouseX >= buttonX &&
    mouseX <= buttonX + buttonWidth &&
    mouseY >= buttonY &&
    mouseY <= buttonY + buttonHeight
  );
}

function drawOverlay(ctx, title, subtitle, instruction) {
  // 半透明黑色遮罩
  ctx.fillStyle = COLORS.overlay;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 標題
  ctx.fillStyle = COLORS.textLight;
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(title, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

  // 副標題
  ctx.font = '20px Arial';
  ctx.fillText(subtitle, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

  // 操作提示
  ctx.font = '16px Arial';
  ctx.fillStyle = '#AAAAAA';
  ctx.fillText(instruction, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

// ========================
// 10. 主遊戲初始化
// ========================

export function initGame(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // 遊戲物件
  let level = createLevel();
  let player = createPlayer();
  let camera = createCamera();
  let input = createInput();
  let gameState = createGameState();

  // 動畫 ID（用於取消）
  let animFrameId = null;

  // --- 鍵盤事件 ---
  function handleKeyDown(e) {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        input.left = true;
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'KeyD':
        input.right = true;
        e.preventDefault();
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        if (!input.up) {
          input.jumpPressed = true;
        }
        input.up = true;
        e.preventDefault();
        break;
        case 'KeyP':
      case 'Escape':
        if (gameState.state === 'playing') {
          pauseGame();
        } else if (gameState.state === 'paused') {
          resumeGame();
        }
        e.preventDefault();
        break;
      case 'Enter':
        if (gameState.state === 'start' || gameState.state === 'gameover' || gameState.state === 'win') {
          startGame();
        }
        e.preventDefault();
        break;
    }
  }

  function handleKeyUp(e) {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        input.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        input.right = false;
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        input.up = false;
        break;
    }
  }

  // 註冊事件
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  // --- 遊戲狀態切換 ---
  function startGame() {
    level = createLevel();
    player = createPlayer();
    camera = createCamera();
    gameState.state = 'playing';
    gameState.timer = 0;
    gameState.score = 0;
    gameState.startTime = performance.now();
    gameState.pauseStartedAt = 0;
    gameState.totalPausedTime = 0;
    gameState.frameCount = 0;
  }

  function pauseGame() {
    if (gameState.state !== 'playing') return;

    gameState.state = 'paused';
    gameState.pauseStartedAt = performance.now();

    // 避免暫停前正在按住的方向／跳躍鍵在繼續後立即生效
    input.left = false;
    input.right = false;
    input.up = false;
    input.jumpPressed = false;
  }

  function resumeGame() {
    if (gameState.state !== 'paused') return;

    const now = performance.now();
    gameState.totalPausedTime += now - gameState.pauseStartedAt;
    gameState.pauseStartedAt = 0;
    gameState.state = 'playing';
  }

  function gameOver() {
    gameState.state = 'gameover';
    gameState.score = 0;
  }

  function winGame() {
    gameState.state = 'win';
    // 分數計算：時間越短分數越高
    const timeInSeconds = gameState.timer / 1000;
    gameState.score = Math.max(0, Math.floor(10000 - timeInSeconds * 100));
  }

  // --- 主遊戲迴圈 ---
  function gameLoop() {
    if (gameState.state !== 'paused') {
      gameState.frameCount++;
    }

    // 1. 更新
    if (gameState.state === 'playing') {
      // 更新計時器（扣除所有暫停時間）
      gameState.timer = Math.max(
        0,
        performance.now() - gameState.startTime - gameState.totalPausedTime
      );

      // 更新玩家
      const status = updatePlayer(player, input, level);

      // 檢查死亡
      if (status === 'dead') {
        gameOver();
      }

      // 檢查尖刺碰撞
      if (gameState.state === 'playing' && checkObstacleCollision(player, level)) {
        gameOver();
      }

      // 檢查通關
      if (gameState.state === 'playing' && checkFinishCollision(player, level)) {
        winGame();
      }

      // 更新攝影機
      updateCamera(camera, player);
    }

    // 2. 繪圖
    // 清空畫布
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 繪製背景
    drawBackground(ctx, camera, level);

    // 繪製平台
    drawPlatforms(ctx, camera, level);

    // 繪製障礙物
    drawObstacles(ctx, camera, level);

    // 繪製終點
    drawFinish(ctx, camera, level, gameState.frameCount);

    // 繪製玩家
    drawPlayer(ctx, camera, player, gameState.frameCount);

    // 繪製 HUD
    if (gameState.state === 'playing' || gameState.state === 'paused') {
      drawHUD(ctx, gameState);
    }

    // 3. 繪製覆蓋層（根據狀態）
    if (gameState.state === 'start') {
      drawOverlay(
        ctx,
        '🐸 Keroro Runner',
        '幫助小青蛙到達終點旗幟！',
        '按 Enter 或點擊畫面開始遊戲'
      );
      // 操作說明
      ctx.fillStyle = '#CCCCCC';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('← → 或 A D 移動 ｜ ↑ 或 W 或空白鍵 跳躍', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 85);
    }

    if (gameState.state === 'gameover') {
      drawOverlay(
        ctx,
        '💀 Game Over',
        '你被尖刺刺到了！',
        '按 Enter 或點擊畫面重新開始'
      );
    }

    if (gameState.state === 'win') {
      const timeStr = (gameState.timer / 1000).toFixed(1);
      drawOverlay(
        ctx,
        '🎉 通關！',
        `用時 ${timeStr} 秒 ｜ 分數 ${gameState.score}`,
        '按 Enter 或點擊畫面再玩一次'
      );
    }

    if (gameState.state === 'paused') {
      const timeStr = (gameState.timer / 1000).toFixed(1);
      drawOverlay(
        ctx,
        '⏸ 已暫停',
        `目前時間 ${timeStr} 秒`,
        '點擊「▶ 繼續」或按 P / Esc 繼續遊戲'
      );
    }

    // 暫停／繼續按鈕要最後繪製，確保暫停遮罩不會蓋住按鈕
    drawPauseButton(ctx, gameState);

    // 4. 下一幀
    animFrameId = requestAnimationFrame(gameLoop);
  }

  // --- 點擊事件（用於開始/重新開始）---
  function handleClick(event) {
    if (gameState.state === 'playing' && isPauseButtonClicked(event)) {
      pauseGame();
      return;
    }

    if (gameState.state === 'paused' && isPauseButtonClicked(event)) {
      resumeGame();
      return;
    }

    if (gameState.state === 'start' || gameState.state === 'gameover' || gameState.state === 'win') {
      startGame();
    }
  }
  canvas.addEventListener('click', handleClick);

  // --- 啟動遊戲 ---
  gameLoop();

  // --- 清理函式（供 React useEffect 使用）---
  return function cleanup() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
    }
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    canvas.removeEventListener('click', handleClick);
  };
}
