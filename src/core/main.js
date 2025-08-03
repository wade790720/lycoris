// 全域變數定義
let overAllTexture;    // 背景紋理
let cnv;               // 主畫布
let mainGraphics;      // 主要縪圖層
let layerSystem, brushSystem;  // 層級系統和筆刷系統
let controls;          // 互動控制
let debugManager;      // 除錯管理器
let sceneManager;      // 場景管理器
let appConfig;         // 應用程式配置
// styleManager 統一風格管理器 - 由各頁面 js 文件初始化

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
  debugManager.setEnabled(appConfig.debug);
  sceneManager = new SceneManager();
  
  initializeSystems();
  initializeScene();
}

function initializeSystems() {
  mainGraphics = createGraphics(width, height);
  controls = new Controls();
  brushSystem = new BrushSystem();
  layerSystem = new LayerSystem(12, appConfig.debug); // 使用 AppConfig 的 debug 設定
}

function initializeScene() {
  sceneManager.initialize();
  
  // 風格管理器的具體初始化由各頁面的 js 文件負責
  if (window.styleManager && typeof window.styleManager.initializeDefault === 'function') {
    window.styleManager.initializeDefault();
  }
}

// 原有的風格切換函數已由 StyleManager 統一管理

/**
 * p5.js 主要渲染迴圈
 * 每幀執行一次，負責更新和縪製整個場景
 */
function draw() {
  const cameraConfig = appConfig.getCameraConfig();

  // 除錯管理器預處理 - 傳遞場景狀態
  const angles = sceneManager.getAngles();
  const cameraInfo = sceneManager.getCameraInfo();
  debugManager.preRender(layerSystem, mainGraphics, {
    angles: angles,
    camera: { 
      position: cameraInfo.position, 
      fov: cameraConfig.fov, 
      zoom: cameraConfig.zoom 
    }
  });

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

/**
 * 處理鍵盤按下事件
 * 核心系統鍵位處理
 */
function keyPressed() {
  const cameraConfig = appConfig.getCameraConfig();
  
  // d 鍵：切換 Debug 模式
  if (key === 'd' || key === 'D') {
    const newDebugState = appConfig.toggleDebug();
    debugManager.setEnabled(newDebugState);
    console.log(`🔧 Debug 模式: ${newDebugState ? '開啟' : '關閉'}`);
  }
  // 風格管理器鍵位處理（如果存在）
  else if (window.styleManager && typeof window.styleManager.handleKeyPressed === 'function') {
    window.styleManager.handleKeyPressed(key, keyCode);
  }
  
  // 控制系統鍵位處理（包含存檔功能）
  controls.handleKeyPressed({ fov: cameraConfig.fov });
}

/**
 * 處理視窗大小變更
 */
function windowResized() {
  // 清理舊的 canvas 資源
  if (brushSystem) {
    brushSystem.clear();
  }
  
  // 清理圖層系統
  if (layerSystem) {
    layerSystem.dispose();
    layerSystem = new LayerSystem(12, appConfig.debug);
  }
  
  // 重新調整畫布大小
  const canvasConfig = appConfig.getCanvasConfig();
  resizeCanvas(canvasConfig.width, canvasConfig.height);
  
  // 重新初始化主要圖形層
  if (mainGraphics) {
    mainGraphics.remove();
    mainGraphics = createGraphics(width, height);
  }
}

/**
 * 頁面卸載時清理資源
 */
window.addEventListener('beforeunload', () => {
  if (brushSystem) {
    brushSystem.dispose();
  }
  if (layerSystem) {
    layerSystem.dispose();
  }
  if (mainGraphics) {
    mainGraphics.remove();
  }
  // 清理風格管理器的定時器
  if (window.styleManager && typeof window.styleManager.stopAutoRotation === 'function') {
    window.styleManager.stopAutoRotation();
  }
});