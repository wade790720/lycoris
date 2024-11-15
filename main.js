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

function preload() {
  overAllTexture = loadImage("assets/canvas-light-6k.jpg");
}

function setup() {
  pixelDensity(3);
  cnv = createCanvas(windowWidth, windowHeight);

  mainGraphics = createGraphics(width, height);

  brushSystem = new BrushSystem()
  layerSystem = new LayerSystem(10, false)

  cameraPosition = createVector(0, 0, -200); // Default camera position
  targetPosition = createVector(0, 0, 0); // Default target position
  generateFlowers();

  mainGraphics.background("#111");
  background(10);
  mouseX = width / 2;
  mouseY = height / 2;

  // Map mouseX and mouseY to angles
  angleY = map(mouseX, 0, width, -PI, PI);
  angleX = map(mouseY, 0, height, -PI, PI);
  angleZ = angleY * 0.5; // Optionally add some Z rotation
}

function draw() {
  if (debug) {
    layerSystem.clearAllLayer()
    mainGraphics.clear();
  }

  mainGraphics.push();
  mainGraphics.translate(width / 2, height / 2); // Translate origin to the center of the canvas


  if (debug && autoControl) {
    angleX = PI / 4
    angleY = frameCount / 100;
    angleZ = sin(angleY) / 5
  } else {

    angleX = PI / 8
  }


  if (debug) {
    drawAxes();
  }

  mainGraphics.stroke(0);
  mainGraphics.fill(0);

  for (let particle of particles) {
    if (debug) {
      particle.renderType = "history";
    }
    particle.update();
    particle.draw({
      angleX,
      angleY,
      angleZ,
      camera: cameraPosition, 
      fov,
      zoom
    });
  }

//   angleX, angleY, angleZ, camera, fov, zoom 

  // Remove dead particles
  if (!debug) {
    particles = particles.filter(particle => particle.isAlive);
  }

  // Sort particles by distance to the camera
  particles = particles.sort((p1, p2) => {
    // Calculate the squared distance from the camera for each particle
    let dist1 = p5.Vector.sub(p1.p, cameraPosition).magSq();
    let dist2 = p5.Vector.sub(p2.p, cameraPosition).magSq();

    // Sort in descending order (farthest first) for proper rendering order
    return dist2 - dist1;
  });

  mainGraphics.pop();

  push()

  drawingContext.globalAlpha = 1;
  background(0)
  mainGraphics.clear()
  mainGraphics.blendMode(BLEND)
  layerSystem.update()
  layerSystem.draw(mainGraphics)
  image(mainGraphics, 0, 0);
  pop()

  push();
  rectMode(CORNER);
  blendMode(SCREEN);
  drawingContext.filter = "blur(2px)"
  drawingContext.globalAlpha = 0.25;
  image(mainGraphics, 0, 0);
  drawingContext.globalAlpha = 0.25;
  blendMode(BURN);
  image(mainGraphics, 0, 0);

  drawingContext.filter = ""
  drawingContext.globalAlpha = 0.6;
  blendMode(MULTIPLY);
  image(overAllTexture, 0, 0, height / 1080 * 1920, height);
  pop();

  if (debug) {
    noStroke()
    drawCrosshair(mouseX, mouseY);
    fill(255);
    text([angleX, angleY, angleZ, cameraPosition, fov, zoom, "Count:" + particles.length, "Time: " + frameCount].join("\n"), 0, 10);
  }

}


/**
 * 滑鼠控制相關功能
 */

// 滑鼠滾輪控制縮放
function mouseWheel(event) {
  const ZOOM_FACTOR = 1.1;
  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 10;

  // 根據滾輪方向調整縮放
  zoom *= event.delta > 0 ? ZOOM_FACTOR : 1/ZOOM_FACTOR;
  
  // 限制縮放範圍
  zoom = constrain(zoom, MIN_ZOOM, MAX_ZOOM);
}

// 滑鼠拖曳控制視角
function mouseDragged() {
  const FOV_SENSITIVITY = 2;      // FOV 調整靈敏度
  const PAN_SENSITIVITY = 0.1;    // 平移靈敏度  
  const ROTATION_SENSITIVITY = 0.01; // 旋轉靈敏度

  // 計算滑鼠移動距離
  let deltaX = mouseX - previousMouseX;
  let deltaY = mouseY - previousMouseY;

  if (isDragging) {
    // Shift + 拖曳: 調整視野範圍(FOV)
    fov += deltaY * FOV_SENSITIVITY;
    fov = constrain(fov, 50, 1000);
  } 
  else if (isPanning) {
    // 右鍵拖曳: 平移視角
    cameraPosition.x -= deltaX * PAN_SENSITIVITY;
    cameraPosition.y += deltaY * PAN_SENSITIVITY;
  } 
  else {
    // 一般拖曳: 旋轉視角
    angleY += deltaX * ROTATION_SENSITIVITY; // 水平旋轉
    angleX -= deltaY * ROTATION_SENSITIVITY; // 垂直旋轉
  }

  // 更新滑鼠位置
  updatePreviousMousePosition();
}

// 更新前一幀的滑鼠位置
function updatePreviousMousePosition() {
  previousMouseX = mouseX;
  previousMouseY = mouseY;
}

// 滑鼠按下時的處理
function mousePressed() {
  updatePreviousMousePosition();
  
  // 檢查特殊按鍵狀態
  isDragging = keyIsDown(SHIFT);  // Shift 鍵狀態
  isPanning = mouseButton === RIGHT; // 右鍵狀態
}

// 滑鼠放開時的處理
function mouseReleased() {
  // 重置拖曳狀態
  isDragging = false;
  isPanning = false;
}

// 鍵盤控制
function keyPressed() {
  // 定義快捷鍵映射
  const KEY_ACTIONS = {
    ']': () => adjustFOV(1.1),
    '}': () => adjustFOV(1.1), 
    '[': () => adjustFOV(1/1.1),
    '{': () => adjustFOV(1/1.1),
    's': downloadJPEG,
    'r': resetFOV
  };

  // 執行對應的動作
  const action = KEY_ACTIONS[key];
  if (action) {
    action();
  }
}

// 調整視野範圍
function adjustFOV(factor) {
  fov = constrain(fov * factor, 50, 1000);
}

// 儲存畫布
function downloadJPEG() {
  const timestamp = new Date().toISOString()
    .slice(0,19)
    .replace(/[-:]/g,'');
  save(`Lycoris_${timestamp}.jpg`);
}

// 重置視野範圍
function resetFOV() {
  fov = 500;
}