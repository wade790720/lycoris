// 全域變數定義
let overAllTexture;    // 背景紋理
let cnv;               // 主畫布
let mainGraphics;      // 主要縪圖層
let layerSystem, brushSystem;  // 層級系統和筆刷系統
let controls;          // 互動控制
let debugManager;      // 除錯管理器
let sceneManager;      // 場景管理器
let appConfig;         // 應用程式配置
let flowerStyle = 'original'; // 花朵風格：'original', 'gothic', 'ink'

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
  generateFlowersByStyle(flowerStyle);
}

/**
 * 根據指定風格生成花朵
 * @param {string} style - 花朵風格：'original', 'gothic', 'ink', 'twilight'
 */
function generateFlowersByStyle(style) {
  switch(style) {
    case 'gothic':
      generateGothicFlowers();
      break;
    case 'ink':
      generateInkFlowers();
      break;
    case 'twilight':
      generateFlowers({ style: 'twilight' });
      break;
    case 'original':
    default:
      generateFlowers();
      break;
  }
}

function switchFlowerStyle(newStyle) {
  flowerStyle = newStyle;
  sceneManager.clearScene();
  generateFlowersByStyle(flowerStyle);
}

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
 * 支援花朵風格切換和相機控制
 */
function keyPressed() {
  const cameraConfig = appConfig.getCameraConfig();
  
  // 🎨 世界級美學配色切換鍵位（1-8 數字鍵）
  if (key === '1') {
    sceneManager.clearScene();
    generateProvenceLavender();
    console.log('🌿 普羅旺斯薰衣草田 - 法國印象派風情');
  } else if (key === '2') {
    sceneManager.clearScene();
    generateNordicLavender();
    console.log('🌙 北歐極光薰衣草園 - 冰島夢境');
  } else if (key === '3') {
    sceneManager.clearScene();
    generateJapaneseLavender();
    console.log('🌸 日式禪園薰衣草 - 東方美學');
  } else if (key === '4') {
    sceneManager.clearScene();
    generateOceanicLavender();
    console.log('🌊 海洋藝術薰衣草 - Turner風景');
  } else if (key === '5') {
    switchFlowerStyle('twilight');
    console.log('🌆 暮光藍紫風格');
  } else if (key === '6') {
    switchFlowerStyle('gothic');
    console.log('🖤 哥特暗黑風格');
  } else if (key === '7') {
    switchFlowerStyle('ink');
    console.log('🖋️ 中國水墨風格');
  } else if (key === '8') {
    switchFlowerStyle('original');
    console.log('🌺 經典彼岸花風格');
  } else {
    // 其他鍵位交由控制系統處理
    controls.handleKeyPressed({ fov: cameraConfig.fov });
  }
}