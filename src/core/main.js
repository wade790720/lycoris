let overAllTexture;
let cnv;
let mainGraphics;
let layerSystem, brushSystem;
let controls;
let debugManager;
let sceneManager;
let appConfig;
let flowerStyle = 'gothic'; // 'original', 'gothic', 'dreamy'

function preload() {
  overAllTexture = loadImage("assets/canvas-background.jpg");
}

function setup() {
  appConfig = new AppConfig();
  
  const canvasConfig = appConfig.getCanvasConfig();

  pixelDensity(canvasConfig.pixelDensity);
  cnv = createCanvas(canvasConfig.width, canvasConfig.height);

  initializeApplication();
}

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

function generateFlowersByStyle(style) {
  switch(style) {
    case 'gothic':
      generateGothicFlowers();
      break;
    case 'dreamy':
      generateDreamyFlowers();
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

function draw() {
  const cameraConfig = appConfig.getCameraConfig();

  debugManager.preRender(layerSystem, mainGraphics);

  mainGraphics.push();
  mainGraphics.translate(width, height);

  sceneManager.updateSceneState(debugManager);
  sceneManager.renderParticles(mainGraphics, debugManager, cameraConfig.fov, cameraConfig.zoom);
  sceneManager.applyPostProcessing(mainGraphics, layerSystem, overAllTexture);

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

function keyPressed() {
  const cameraConfig = appConfig.getCameraConfig();
  
  // 風格切換鍵位
  if (key === '1') {
    switchFlowerStyle('original');
    console.log('切換到原始風格');
  } else if (key === '2') {
    switchFlowerStyle('gothic');
    console.log('切換到哥特風格');
  } else if (key === '3') {
    switchFlowerStyle('dreamy');
    console.log('切換到夢幻風格');
  } else {
    controls.handleKeyPressed({ fov: cameraConfig.fov });
  }
}