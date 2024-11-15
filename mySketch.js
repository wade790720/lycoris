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
  overAllTexture = loadImage("canvas-light-6k.jpg");
}

function setup() {
  pixelDensity(3);
  cnv = createCanvas(1000, 1000);

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
  // brushSystem.updateAllBrushes()
  // if (!debug) {
  //   mouseX = width / 2;
  //   mouseY = height / 2;
  // }
  // if (autoControl){

  // mouseX = map(sin(frameCount/2000),-1,1,0,width)
  // mouseY = map(sin(frameCount/2000),-1,1,0,width)
  // }

  if (debug) {
    layerSystem.clearAllLayer()
    mainGraphics.clear();
  }

  mainGraphics.push();
  mainGraphics.translate(width / 2, height / 2); // Translate origin to the center of the canvas

  // // Map mouseX and mouseY to angles
  // angleY = map(mouseX, 0, width, -PI, PI);
  // angleX = map(mouseY, 0, height, -PI, PI);
  // angleZ = angleY * 0.5; // Optionally add some Z rotation

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
      cameraPosition,
      fov,
      zoom
    });
  }

  // Remove dead particles
  if (!debug) {
    particles = particles.filter(particle => particle.alive);
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

function mouseWheel(event) {
  zoom *= event.delta > 0 ? 1.1 : 0.9; // Adjust the zoom based on mouse wheel scroll
  zoom = constrain(zoom, 0.1, 10); // Constrain zoom to reasonable values
}

function mouseDragged() {
  let deltaX = mouseX - previousMouseX;
  let deltaY = mouseY - previousMouseY;

  if (isDragging) {
    fov += deltaY * 2; // Adjust FOV based on vertical drag distance
    fov = constrain(fov, 50, 1000); // Constrain FOV to reasonable values
  } else if (isPanning) {
    cameraPosition.x -= deltaX * 0.1;
    cameraPosition.y += deltaY * 0.1;
  } else {
    angleY += deltaX * 0.01;
    angleX -= deltaY * 0.01;
  }

  previousMouseX = mouseX;
  previousMouseY = mouseY;
}

function mouseMoved() {
  // autoControl=false
}

function mousePressed() {
  previousMouseX = mouseX;
  previousMouseY = mouseY;
  isDragging = keyIsDown(SHIFT); // Enable FOV adjustment if Shift key is held down
  isPanning = mouseButton === RIGHT; // Enable panning if right mouse button is held down
}

function mouseReleased() {
  isDragging = false;
  isPanning = false;
}

function keyPressed() {
  if (key === ']') {
    fov *= 1.1; // Increase zoom
  } else if (key === '[') {
    fov /= 1.1; // Decrease zoom
  } else if (key === "s") {
    save("240614 Flower of the Other Shore .jpg");
  }
}