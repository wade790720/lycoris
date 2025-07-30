class SceneManager {
  constructor() {
    this.particles = [];
    this.angleX = 0;
    this.angleY = 0; 
    this.angleZ = 0;
    this.cameraPosition = null;
    this.targetPosition = null;
    this.autoControl = true;
  }

  initialize() {
    this.cameraPosition = createVector(0, 0, -200);
    this.targetPosition = createVector(0, 0, 0);
    
    const center = { x: width / 2, y: height / 2 };
    this.angleY = map(center.x, 0, width, -PI, PI);
    this.angleX = map(center.y, 0, height, -PI, PI);
    this.angleZ = this.angleY * 0.5;
  }

  updateSceneState(debugManager) {
    const sceneState = {
      angles: { angleX: this.angleX, angleY: this.angleY, angleZ: this.angleZ },
      autoControl: this.autoControl
    };
    
    const updatedState = debugManager.updateSceneState(sceneState);
    this.angleX = updatedState.angles.angleX;
    this.angleY = updatedState.angles.angleY;
    this.angleZ = updatedState.angles.angleZ;
  }

  renderParticles(mainGraphics, debugManager, fov, zoom) {
    mainGraphics.stroke(0);
    mainGraphics.fill(0);

    this.particles = debugManager.processParticles(this.particles);
    
    for (let particle of this.particles) {
      particle.update();
      particle.draw({
        angleX: this.angleX,
        angleY: this.angleY, 
        angleZ: this.angleZ,
        camera: this.cameraPosition,
        fov, zoom
      });
    }
    
    this.particles = this.sortParticles(debugManager);
    mainGraphics.pop();
  }

  sortParticles(debugManager) {
    if (!debugManager.isEnabled) {
      this.particles = this.particles.filter(particle => particle.isAlive);
    }
    
    return this.particles.sort((p1, p2) => {
      let dist1 = p5.Vector.sub(p1.p, this.cameraPosition).magSq();
      let dist2 = p5.Vector.sub(p2.p, this.cameraPosition).magSq();
      return dist2 - dist1;
    });
  }

  applyPostProcessing(mainGraphics, layerSystem, overAllTexture) {
    push();
    drawingContext.globalAlpha = 1;
    background(0);
    mainGraphics.clear();
    mainGraphics.blendMode(BLEND);
    layerSystem.update();
    layerSystem.draw(mainGraphics);
    image(mainGraphics, 0, 0);
    pop();

    push();
    this.applyBlendEffects(mainGraphics);
    this.applyTextureOverlay(overAllTexture);
    pop();
  }

  applyBlendEffects(mainGraphics) {
    rectMode(CORNER);
    blendMode(SCREEN);
    drawingContext.filter = "blur(2px)";
    drawingContext.globalAlpha = 0.25;
    image(mainGraphics, 0, 0);
    
    drawingContext.globalAlpha = 0.25;
    blendMode(BURN);
    image(mainGraphics, 0, 0);
  }

  applyTextureOverlay(overAllTexture) {
    drawingContext.filter = "";
    drawingContext.globalAlpha = 0.6;
    blendMode(MULTIPLY);
    image(overAllTexture, 0, 0, height / 1080 * 1920, height);
  }

  addParticle(particle) {
    this.particles.push(particle);
  }

  getParticleCount() {
    return this.particles.length;
  }

  getAngles() {
    return {
      angleX: this.angleX,
      angleY: this.angleY,
      angleZ: this.angleZ
    };
  }

  getCameraInfo() {
    return {
      position: this.cameraPosition,
      target: this.targetPosition
    };
  }
}