let particles = [];
let angleY = 0;
let angleX = 0;
let angleZ = 0;

let fov = 1000; // Initial Field of View
let sphereRadius = 400; // Radius of the sphere
let colors = "cfdbd5-e8eddf-f5cb5c-242423-333533-d8a47f-ef8354-ee4b6a-df3b57-0f7173".split("-").map(a => "#" + a);

let overAllTexture;
let cnv;
let cameraPosition; // Camera position
let targetPosition; // Target position
let zoom = 2.4; // Initial zoom level
let isDragging = false;
let isPanning = false;
let previousMouseX, previousMouseY;
let autoControl = true;
let mainGraphics;
let debug = false;
let layerSystem, brushSystem

let controls;
let debugManager;

function preload() {
  overAllTexture = loadImage("assets/canvas-light-6k.jpg");
}

function setup() {
  pixelDensity(3);
  cnv = createCanvas(1000, 1000);

  // 初始化 DebugManager
  debugManager = new DebugManager();
  
  // 初始化其他系統
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
  cameraPosition = createVector(0, 0, -200);
  targetPosition = createVector(0, 0, 0);
  generateFlowers();

  // 初始化角度
  const center = { x: width / 2, y: height / 2 };
  angleY = map(center.x, 0, width, -PI, PI);
  angleX = map(center.y, 0, height, -PI, PI);
  angleZ = angleY * 0.5;
}

function draw() {
  // 1. 前置處理清除
  debugManager.preRender(layerSystem, mainGraphics);
  
  // 2. 主要渲染準備
  mainGraphics.push();
  mainGraphics.translate(width / 2, height / 2);
  
  // 3. 更新場景狀態
  updateSceneState();
  
  // 4. 渲染粒子
  renderParticles();
  
  // 5. 後處理效果
  applyPostProcessing();
  
  // 6. Debug 資訊
  debugManager.drawDebugInfo({
    angles: { angleX, angleY, angleZ },
    camera: { position: cameraPosition, fov, zoom },
    particleCount: particles.length
  });
}

function updateSceneState() {
  const sceneState = {
    angles: { angleX, angleY, angleZ },
    autoControl
  };
  
  const updatedState = debugManager.updateSceneState(sceneState);
  angleX = updatedState.angles.angleX;
  angleY = updatedState.angles.angleY;
  angleZ = updatedState.angles.angleZ;
}

function renderParticles() {
  mainGraphics.stroke(0);
  mainGraphics.fill(0);

  particles = debugManager.processParticles(particles);
  
  for (let particle of particles) {
    particle.update();
    particle.draw({
      angleX, angleY, angleZ,
      camera: cameraPosition,
      fov, zoom
    });
  }
  
  particles = sortParticles(particles);
  mainGraphics.pop();
}

function sortParticles(particles) {
  if (!debugManager.isEnabled) {
    particles = particles.filter(particle => particle.isAlive);
  }
  
  return particles.sort((p1, p2) => {
    let dist1 = p5.Vector.sub(p1.p, cameraPosition).magSq();
    let dist2 = p5.Vector.sub(p2.p, cameraPosition).magSq();
    return dist2 - dist1;
  });
}

function applyPostProcessing() {
  // 主要渲染
  push();
  drawingContext.globalAlpha = 1;
  background(0);
  mainGraphics.clear();
  mainGraphics.blendMode(BLEND);
  layerSystem.update();
  layerSystem.draw(mainGraphics);
  image(mainGraphics, 0, 0);
  pop();

  // 後處理效果
  push();
  applyBlendEffects();
  applyTextureOverlay();
  pop();
}

function applyBlendEffects() {
  rectMode(CORNER);
  blendMode(SCREEN);
  drawingContext.filter = "blur(2px)";
  drawingContext.globalAlpha = 0.25;
  image(mainGraphics, 0, 0);
  
  drawingContext.globalAlpha = 0.25;
  blendMode(BURN);
  image(mainGraphics, 0, 0);
}

function applyTextureOverlay() {
  drawingContext.filter = "";
  drawingContext.globalAlpha = 0.6;
  blendMode(MULTIPLY);
  image(overAllTexture, 0, 0, height / 1080 * 1920, height);
}

// 滑鼠滾輪控制縮放
function mouseWheel(event) {
  controls.handleMouseWheel(event, { zoom });
}

// 滑鼠拖曳控制視角
function mouseDragged() {
  controls.handleMouseDragged({
    fov,
    cameraPosition,
    angleX,
    angleY
  });
}

// 滑鼠按下時的處理
function mousePressed() {
  controls.handleMousePressed();
}

// 滑鼠放開時的處理
function mouseReleased() {
  controls.handleMouseReleased();
}

// 鍵盤控制
function keyPressed() {
  controls.handleKeyPressed({ fov });
}