// 核心系統全域變數
let overAllTexture;           // 背景紋理
let cnv;                      // 主畫布
let mainGraphics;             // 主繪圖層
let layerSystem, brushSystem; // 圖層與筆刷系統
let controls;                 // 輸入控制
let debugManager;             // 調試管理
let sceneManager;             // 場景管理
let appConfig;                // 應用配置
// styleManager 由頁面 JS 初始化

// p5.js 預載資源
function preload() {
  overAllTexture = loadImage("assets/canvas-background.jpg");
}

// p5.js 主初始化
function setup() {
  console.log('[STARTUP] Application initialization started');
  
  appConfig = new AppConfig();
  const canvasConfig = appConfig.getCanvasConfig();
  
  console.log('[STARTUP] Canvas configuration loaded:', canvasConfig.width + 'x' + canvasConfig.height);

  // 配置畫布
  pixelDensity(canvasConfig.pixelDensity);
  cnv = createCanvas(canvasConfig.width, canvasConfig.height);
  console.log('[STARTUP] Canvas created successfully');

  initializeApplication();
}

// 初始化應用核心
function initializeApplication() {
  console.log('[STARTUP] Core systems initialization started');
  
  debugManager = new DebugManager();
  debugManager.setEnabled(appConfig.debug);
  console.log('[SYSTEM] DebugManager initialized, debug:', appConfig.debug);
  
  sceneManager = new SceneManager();
  console.log('[SYSTEM] SceneManager initialized');
  
  initializeSystems();
  initializeScene();
  
  console.log('[STARTUP] Application initialization completed');
}

function initializeSystems() {
  console.log('[SYSTEM] Systems initialization started');
  
  mainGraphics = createGraphics(width, height);
  console.log('[SYSTEM] MainGraphics created:', width + 'x' + height);
  
  controls = new Controls();
  console.log('[SYSTEM] Controls system initialized');
  
  brushSystem = new BrushSystem();
  console.log('[SYSTEM] BrushSystem initialized');
  
  layerSystem = new LayerSystem(12, appConfig.debug);
  console.log('[SYSTEM] LayerSystem initialized with', 12, 'layers, debug:', appConfig.debug);
}

function initializeScene() {
  console.log('[LIFECYCLE] Scene initialization started');
  
  sceneManager.initialize();
  console.log('[LIFECYCLE] SceneManager initialized');
  
  // 初始化風格管理器
  if (window.styleManager && typeof window.styleManager.initializeDefault === 'function') {
    window.styleManager.initializeDefault();
    console.log('[LIFECYCLE] StyleManager initialized and default style applied');
  } else {
    console.warn('[ERROR] StyleManager not found or initializeDefault method missing');
  }
  
  console.log('[LIFECYCLE] Scene initialization completed');
}

// 主渲染循環
function draw() {
  const cameraConfig = appConfig.getCameraConfig();

  // 調試預處理
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

  // 設定坐標系
  mainGraphics.push();
  mainGraphics.translate(width, height);

  // 場景更新與渲染
  sceneManager.updateSceneState(debugManager);
  sceneManager.renderParticles(mainGraphics, debugManager, cameraConfig.fov, cameraConfig.zoom);
  sceneManager.applyPostProcessing(mainGraphics, layerSystem, overAllTexture);

  // 調試信息顯示
  debugManager.drawDebugInfo({
    angles: sceneManager.getAngles(),
    camera: { position: sceneManager.getCameraInfo().position, fov: cameraConfig.fov, zoom: cameraConfig.zoom },
    particleCount: sceneManager.getParticleCount()
  });
}

// 鍵盤事件處理
function keyPressed() {
  const cameraConfig = appConfig.getCameraConfig();
  
  // d 鍵：切換 Debug 模式
  if (key === 'd' || key === 'D') {
    const newDebugState = appConfig.toggleDebug();
    debugManager.setEnabled(newDebugState);
    console.log('[SYSTEM] Debug mode toggled:', newDebugState);
  }
  // 風格切換鍵位
  else if (window.styleManager && typeof window.styleManager.handleKeyPressed === 'function') {
    window.styleManager.handleKeyPressed(key, keyCode);
  }
  
  // 其他控制鍵位
  controls.handleKeyPressed({ fov: cameraConfig.fov });
}

// 視窗大小調整
function windowResized() {
  // 清理畫布資源
  if (brushSystem) {
    brushSystem.clear();
  }
  
  // 重建圖層系統
  if (layerSystem) {
    layerSystem.dispose();
    layerSystem = new LayerSystem(12, appConfig.debug);
  }
  
  // 調整畫布大小
  const canvasConfig = appConfig.getCanvasConfig();
  resizeCanvas(canvasConfig.width, canvasConfig.height);
  
  // 重建主繪圖層
  if (mainGraphics) {
    mainGraphics.remove();
    mainGraphics = createGraphics(width, height);
  }
}

// 頁面卸載清理
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
  // 清理定時器
  if (window.styleManager && typeof window.styleManager.stopAutoRotation === 'function') {
    window.styleManager.stopAutoRotation();
  }
});