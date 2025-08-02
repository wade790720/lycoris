// 全域變數定義
let overAllTexture;    // 背景紋理
let cnv;               // 主畫布
let mainGraphics;      // 主要縪圖層
let layerSystem, brushSystem;  // 層級系統和筆刷系統
let controls;          // 互動控制
let debugManager;      // 除錯管理器
let sceneManager;      // 場景管理器
let appConfig;         // 應用程式配置
let styleManager;      // 統一風格管理器

/**
 * p5.js 預載函數
 * 在程式開始前載入必要的資源
 */
function preload() {
  overAllTexture = loadImage("assets/canvas-background.jpg");
}

/**
 * p5.js 初始化函數
 * 設定畫布、初始化系統和場景
 */
function setup() {
  appConfig = new AppConfig();
  
  const canvasConfig = appConfig.getCanvasConfig();

  // 設定高像素密度和畫布大小
  pixelDensity(canvasConfig.pixelDensity);
  cnv = createCanvas(canvasConfig.width, canvasConfig.height);

  initializeApplication();
}

/**
 * 初始化應用程式的核心系統
 */
function initializeApplication() {
  debugManager = new DebugManager();
  sceneManager = new SceneManager();
  
  // 根據頁面類型初始化對應的風格管理器
  if (typeof LycorisStyleManager !== 'undefined') {
    // index.html - 使用 Lycoris 風格管理器
    styleManager = new LycorisStyleManager();
    console.log('🌺 載入 Lycoris 風格管理器');
  } else if (typeof LavenderStyleManager !== 'undefined') {
    // lavender.html - 使用 Lavender 風格管理器  
    styleManager = new LavenderStyleManager();
    console.log('🌿 載入 Lavender 風格管理器');
  } else {
    console.error('❌ 找不到對應的風格管理器');
    return;
  }

  initializeSystems();
  initializeScene();
}

function initializeSystems() {
  mainGraphics = createGraphics(width, height);
  controls = new Controls();
  brushSystem = new BrushSystem();
  layerSystem = new LayerSystem(10, false);
}

function initializeScene() {
  sceneManager.initialize();
  
  // 根據風格管理器類型初始化預設風格
  if (styleManager) {
    // 根據管理器類型決定預設風格
    const defaultStyle = styleManager.constructor.name === 'LycorisStyleManager' ? 'original' : 'default';
    styleManager.switchToStyle(defaultStyle);
    styleManager.startAutoRotation();
  }
}

// 原有的風格切換函數已由 StyleManager 統一管理

/**
 * p5.js 主要渲染迴圈
 * 每幀執行一次，負責更新和縪製整個場景
 */
function draw() {
  const cameraConfig = appConfig.getCameraConfig();

  // 除錯管理器預處理
  debugManager.preRender(layerSystem, mainGraphics);

  // 設定縪圖坐標系統
  mainGraphics.push();
  mainGraphics.translate(width, height);

  // 更新場景狀態並渲染粒子
  sceneManager.updateSceneState(debugManager);
  sceneManager.renderParticles(mainGraphics, debugManager, cameraConfig.fov, cameraConfig.zoom);
  sceneManager.applyPostProcessing(mainGraphics, layerSystem, overAllTexture);

  // 顯示除錯資訊
  debugManager.drawDebugInfo({
    angles: sceneManager.getAngles(),
    camera: { position: sceneManager.getCameraInfo().position, fov: cameraConfig.fov, zoom: cameraConfig.zoom },
    particleCount: sceneManager.getParticleCount()
  });
}


function mouseWheel(event) {
  const cameraConfig = appConfig.getCameraConfig();
  controls.handleMouseWheel(event, { zoom: cameraConfig.zoom });
}

function mouseDragged() {
  const cameraConfig = appConfig.getCameraConfig();
  const cameraInfo = sceneManager.getCameraInfo();
  const angles = sceneManager.getAngles();

  controls.handleMouseDragged({
    fov: cameraConfig.fov,
    cameraPosition: cameraInfo.position,
    angleX: angles.angleX,
    angleY: angles.angleY
  });
}

function mousePressed() {
  controls.handleMousePressed();
}

function mouseReleased() {
  controls.handleMouseReleased();
}

/**
 * 處理鍵盤按下事件
 * 支援花朵風格切換、輪播控制和相機控制
 */
function keyPressed() {
  const cameraConfig = appConfig.getCameraConfig();
  
  // 🎨 統一風格切換鍵位（1-8 數字鍵）
  if (key >= '1' && key <= '8') {
    const number = parseInt(key);
    if (styleManager.switchByNumber(number)) {
      const info = styleManager.getCurrentStyleInfo();
      console.log(`🎨 切換風格: ${info.displayName}`);
    }
  } 
  // 空格鍵：暫停/恢復自動輪播
  else if (key === ' ') {
    styleManager.toggleRotation();
    const info = styleManager.getCurrentStyleInfo();
    console.log(`${info.isRotating ? '▶️ 恢復' : '⏸️ 暫停'}自動輪播`);
  }
  // 左右方向鍵：手動切換風格
  else if (keyCode === LEFT_ARROW) {
    styleManager.previousStyle();
    const info = styleManager.getCurrentStyleInfo();
    console.log(`⬅️ 上一個風格: ${info.displayName}`);
  }
  else if (keyCode === RIGHT_ARROW) {
    styleManager.nextStyle();
    const info = styleManager.getCurrentStyleInfo();
    console.log(`➡️ 下一個風格: ${info.displayName}`);
  }
  else {
    // 其他鍵位交由控制系統處理
    controls.handleKeyPressed({ fov: cameraConfig.fov });
  }
}