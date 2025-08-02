class DebugManager {
  constructor() {
    this.isEnabled = false;
    this.autoControl = true;
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  toggleEnabled() {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  preRender(layerSystem, mainGraphics, sceneState = {}) {
    if (!this.isEnabled) return;
    
    layerSystem.clearAllLayer();
    mainGraphics.clear();
    
    // 從場景狀態中取得角度和相機資訊
    const angles = sceneState.angles || { angleX: 0, angleY: 0, angleZ: 0 };
    const camera = sceneState.camera || { position: createVector(0, 0, -200), fov: 1000, zoom: 1 };
    
    Graphics3D.drawAxes(
      angles.angleX, 
      angles.angleY, 
      angles.angleZ, 
      camera.position, 
      camera.fov, 
      camera.zoom
    );
  }

  updateSceneState(state) {
    if (!this.isEnabled) return state;
    
    if (this.autoControl) {
      return {
        angles: {
          angleX: PI / 4,
          angleY: frameCount / 100,
          angleZ: sin(state.angles.angleY) / 5
        }
      };
    }
    
    return {
      angles: {
        angleX: PI / 8,
        angleY: state.angles.angleY,
        angleZ: state.angles.angleZ
      }
    };
  }

  processParticles(particles) {
    if (!this.isEnabled) return particles;
    
    particles.forEach(particle => {
      particle.renderType = "history";
    });
    return particles;
  }

  drawDebugInfo(state) {
    if (!this.isEnabled) return;
    
    noStroke();
    Graphics3D.drawCrosshair(mouseX, mouseY);
    fill(255);
    
    const debugInfo = [
      state.angles.angleX,
      state.angles.angleY,
      state.angles.angleZ,
      state.camera.position,
      state.camera.fov,
      state.camera.zoom,
      "Count:" + state.particleCount,
      "Time: " + frameCount
    ].join("\n");
    
    text(debugInfo, 0, 10);
  }
}