/**
 * 場景管理器
 * 負責管理 3D 場景中的粒子系統、相機控制和渲染後處理
 */
class SceneManager {
  constructor() {
    // 粒子系統列表
    this.particles = [];
    // 3D 旋轉角度控制
    this.angleX = 0;
    this.angleY = 0; 
    this.angleZ = 0;
    // 相機位置
    this.cameraPosition = null;
  }

  /**
   * 初始化場景參數
   */
  initialize() {
    // 設定初始相機位置（往後退 200 單位）
    this.cameraPosition = createVector(0, 0, -200);
    
    // 根據螢幕中心計算初始旋轉角度
    const center = { x: width / 2, y: height / 2 };
    this.angleY = map(center.x, 0, width, -PI, PI);
    this.angleX = map(center.y, 0, height, -PI, PI);
    this.angleZ = this.angleY * 0.5;
  }

  updateSceneState(debugManager) {
    const sceneState = {
      angles: { angleX: this.angleX, angleY: this.angleY, angleZ: this.angleZ }
    };
    
    const updatedState = debugManager.updateSceneState(sceneState);
    this.angleX = updatedState.angles.angleX;
    this.angleY = updatedState.angles.angleY;
    this.angleZ = updatedState.angles.angleZ;
  }

  /**
   * 渲染所有粒子
   * @param {Object} mainGraphics - 主要縪圖層
   * @param {Object} debugManager - 除錯管理器
   * @param {number} fov - 相機視野
   * @param {number} zoom - 縮放倍數
   */
  renderParticles(mainGraphics, debugManager, fov, zoom) {
    mainGraphics.stroke(0);
    mainGraphics.fill(0);

    // 透過除錯管理器處理粒子
    this.particles = debugManager.processParticles(this.particles);
    
    // 更新並縪製所有粒子
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
    
    // 按距離排序粒子（從遠到近）
    this.particles = this.sortParticles(debugManager);
    mainGraphics.pop();
  }

  /**
   * 按距離排序粒子，實現正確的深度緩衝
   * @param {Object} debugManager - 除錯管理器
   * @returns {Array} 排序後的粒子陣列
   */
  sortParticles(debugManager) {
    // 在非除錯模式下移除死亡粒子
    if (!debugManager.isEnabled) {
      this.particles = this.particles.filter(particle => particle.isAlive);
    }
    
    // 按距離排序（遠到近）實現 Z-buffer 效果
    return this.particles.sort((p1, p2) => {
      let dist1 = p5.Vector.sub(p1.p, this.cameraPosition).magSq();
      let dist2 = p5.Vector.sub(p2.p, this.cameraPosition).magSq();
      return dist2 - dist1;
    });
  }

  /**
   * 應用渲染後處理效果
   * 包括層級系統、混合效果和紋理叠加
   */
  applyPostProcessing(mainGraphics, layerSystem, overAllTexture) {
    // 第一階段：基本渲染和層級系統
    push();
    drawingContext.globalAlpha = 1;
    background(0);
    mainGraphics.clear();
    mainGraphics.blendMode(BLEND);
    layerSystem.update();
    layerSystem.draw(mainGraphics);
    image(mainGraphics, 0, 0);
    pop();

    // 第二階段：混合效果和紋理叠加
    push();
    this.applyBlendEffects(mainGraphics);
    this.applyTextureOverlay(overAllTexture);
    pop();
  }

  /**
   * 應用混合效果：網幕混合和燃燒混合
   */
  applyBlendEffects(mainGraphics) {
    rectMode(CORNER);
    // 網幕混合模式：增加亮度，產生發光效果
    blendMode(SCREEN);
    drawingContext.filter = "blur(2px)";  // 模糊效果
    drawingContext.globalAlpha = 0.25;
    image(mainGraphics, 0, 0);
    
    // 燃燒混合模式：加深陰影和對比
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

  clearScene() {
    this.particles = [];
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
      position: this.cameraPosition
    };
  }
}