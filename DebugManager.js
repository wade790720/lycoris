class DebugManager {
  constructor() {
    this.isEnabled = false;
    this.autoControl = true;
  }

  preRender(layerSystem, mainGraphics) {
    if (!this.isEnabled) return;
    
    layerSystem.clearAllLayer();
    mainGraphics.clear();
    Graphics3D.drawAxes();
  }

  updateSceneState(state) {
    if (!this.isEnabled) return state;
    
    if (this.autoControl) {
      return {
        angles: {
          x: PI / 4,
          y: frameCount / 100,
          z: sin(state.angles.y) / 5
        }
      };
    }
    
    return {
      angles: {
        x: PI / 8,
        y: state.angles.y,
        z: state.angles.z
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