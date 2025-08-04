class Particle {
  constructor(config = {}) {
    this.state = {
      // 基本屬性配置
      randomId: random(50000),
      mainGraphics: mainGraphics,
      color: color(255),
      charge: random(-5, 5) * random() * random() * random(),
      axis: createVector(random(-100, 100), random(-100, 100), random(-100, 100)).normalize(),

      // 渲染相關配置
      renderType: "brush",
      renderJitter: 2,
      renderJitterFreq: 100,
      p2D: null,
      p2D2: null,
      brush: null,
      maxSegments: 2,
      brushLerpMap: k => k,
      radiusMappingFunc: null,
      isBrushRotateFollowVelocity: true,
      brushAngleNoiseAmplitude: 0.2,
      history: [],

      // 生命週期相關配置
      isAlive: true,
      lifespan: int(random([100, 500])),
      originalLive: 0,
      updateCount: 0,
      tick: null,
      endCallback: null,
      preDelay: 0,

      // 物理運動相關配置
      lastPosition: createVector(0, 0, 0),
      p: createVector(0, 0, 0),
      vector: createVector(0, 0, 0),
      acceleration: createVector(0, 0, 0),
      radius: random(),
      speedLimit: random(5, 100),
      radiusShrinkFactor: 0.995,
      velocityShrinkFactor: 0.995
    };

    // 合併配置
    this.state = { ...this.state, ...config };
    Object.entries(this.state).forEach(([key, value]) => this[key] = value);

    const pathColor = color(this.color);
    pathColor.setAlpha(200);
    this.originalLive = this.lifespan;
    this.pathColor = pathColor;
    
    // 初始化資源管理
    this.resourceManager = getResourceManager();
    this.disposed = false;
    
    // 歷史記錄配置優化
    this.maxHistorySize = 200; // 降低至200(原500)
    this.historyCleanupThreshold = 150; // 達到150時清理至100
  }

  update() {
    if (this.disposed) return;
    
    if (this.preDelay >= 0) {
      this.preDelay--;
      return;
    }
    if (this.lifespan < 0) {
      return;
    }

    this.updateCount++;
    this.lastPosition = this.p.copy();
    this.p.add(this.vector);
    this.vector.add(this.acceleration);
    this.vector.limit(this.radius * this.speedLimit);
    this.vector.mult(this.velocityShrinkFactor);
    this.lifespan -= 1;
    this.radius *= this.radiusShrinkFactor;

    // 記錄當前位置到歷史記錄(優化版)
    let sampleRate = 4; // 提高至 4(降低頻率)
    if ((frameCount + int(this.randomId)) % sampleRate == 0 && this.isAlive) {
      this.history.push(this.p.copy());
    }

    // 批量清理歷史記錄(效率優化)
    if (this.history.length > this.maxHistorySize) {
      // 一次清理多個元素，避免頻繁shift
      const removeCount = this.history.length - this.historyCleanupThreshold;
      this.history.splice(0, removeCount);
    }
    if (this.lifespan == this.originalLive - 1) {
      this.history.push(this.p.copy());
    }
    if (this.radius < 0.1 || this.lifespan < 0) {
      this.history.push(this.p.copy());
      if (this.endCallback) this.endCallback(this);
      this.dispose(); // 自動釋放資源
      this.isAlive = false;
    }

    // 額外呼叫的更新輔助函數
    if (this.tick) this.tick(this);
  }

  draw({ angleX, angleY, angleZ, camera, fov, zoom }) {
    // 如果已釋放或有預設延遲，則不進行繪製
    if (this.disposed || this.preDelay >= 0) return;

    // 取得主要繪圖區域
    let mainGraphics = this.mainGraphics;

    // 開始新的繪圖狀態
    mainGraphics.push();
    mainGraphics.fill(this.color);
    mainGraphics.noStroke();

    // 旋轉粒子位置
    let rotatedP = Rotation3D.rotateY(this.lastPosition, angleY);
    rotatedP = Rotation3D.rotateX(rotatedP, angleX);
    rotatedP = Rotation3D.rotateZ(rotatedP, angleZ);

    // 投影3D點到2D平面
    const p2D = Vector3DUtils.projectTo2D(rotatedP, camera, fov, zoom);
    this.p2D = this.applyRenderJitter(p2D);

    // 旋轉當前粒子位置
    let rotatedP2 = Rotation3D.rotateY(this.p, angleY);
    rotatedP2 = Rotation3D.rotateX(rotatedP2, angleX);
    rotatedP2 = Rotation3D.rotateZ(rotatedP2, angleZ);

    // 投影3D點到2D平面
    const p2D2 = Vector3DUtils.projectTo2D(rotatedP2, camera, fov, zoom);
    this.p2D2 = this.applyRenderJitter(p2D2);

    // 計算當前粒子半徑
    const currentRadius = this.calculateRadius();

    // 計算2D方向角
    const headingAngle2D = this.p2D2.copy().sub(this.p2D).heading();
    const naturalBrushRotation = noise(frameCount / 50, this.randomId) * 5 + frameCount / 100;

    // 只在粒子存活時進行渲染
    if (this.originalLive === this.lifespan) return;

    // 定義渲染方法映射表
    const renderMethods = {
      brushImage: () => this.renderBrushImage(mainGraphics, headingAngle2D, naturalBrushRotation, currentRadius),
      brushImageLerp: () => this.renderBrushImageLerp(mainGraphics, headingAngle2D, naturalBrushRotation, currentRadius),
      brush: () => this.renderBrush(mainGraphics, currentRadius),
      splash: () => this.renderSplash(mainGraphics),
      line: () => this.renderLine(mainGraphics),
      history: () => this.renderHistory(mainGraphics, angleX, angleY, angleZ, camera, fov, zoom),
      default: () => {
        mainGraphics.fill(this.color);
        mainGraphics.circle(this.p2D.x, this.p2D.y, currentRadius);
      }
    };

    // 執行對應的渲染方法,若無對應方法則執行預設渲染
    (renderMethods[this.renderType] || renderMethods.default)();

    // 呼叫額外的繪圖輔助函數
    if (this.draw2D) {
      this.draw2D(this);
    }

    // 結束繪圖狀態
    mainGraphics.pop();
  }

  // 渲染筆刷圖像的共用方法
  #renderBrushCommon(mainGraphics, headingAngle2D, naturalBrushRotation, radius, callback) {
    mainGraphics.imageMode(CENTER);
    for (let i = 0; i < this.maxSegments; i++) {
      const t = i / this.maxSegments;
      const lerpPoint = p5.Vector.lerp(this.p2D, this.p2D2, t);

      mainGraphics.push();
      mainGraphics.translate(lerpPoint.x, lerpPoint.y);

      // 處理筆刷旋轉
      if (this.isBrushRotateFollowVelocity) {
        mainGraphics.rotate(headingAngle2D);
      }
      mainGraphics.rotate(this.brushAngleNoiseAmplitude * naturalBrushRotation);

      // 執行特定的渲染邏輯
      callback();

      mainGraphics.pop();
    }
  }

  // 渲染 brushImage 類型
  renderBrushImage(mainGraphics, headingAngle2D, naturalBrushRotation, radius) {
    this.#renderBrushCommon(
      mainGraphics,
      headingAngle2D,
      naturalBrushRotation,
      radius,
      () => {
        mainGraphics.image(this.brush.getImage(), 0, 0, radius, radius);
      }
    );
  }

  // 渲染 brushImageLerp 類型
  renderBrushImageLerp(mainGraphics, headingAngle2D, naturalBrushRotation, radius) {
    const lerpFactor = this.brushLerpMap(this.lifespan / this.originalLive);

    this.#renderBrushCommon(
      mainGraphics,
      headingAngle2D,
      naturalBrushRotation,
      radius,
      () => {
        // 繪製第一個筆刷
        mainGraphics.drawingContext.globalAlpha = lerpFactor;
        mainGraphics.image(this.brush.getImage(), 0, 0, radius, radius);

        // 如果有第二個筆刷，則進行混合
        if (this.brush2) {
          mainGraphics.drawingContext.globalAlpha = 1 - lerpFactor;
          mainGraphics.image(this.brush2.getImage(), 0, 0, radius, radius);
        }
      }
    );
  }

  // 渲染 brush 類型
  renderBrush(mainGraphics, radius) {
    for (let i = 0; i < this.maxSegments; i++) {
      let lerpPoint = p5.Vector.lerp(this.p2D, this.p2D2, i / this.maxSegments);
      for (let j = 0; j < 3; j++) {
        mainGraphics.stroke(this.color);
        mainGraphics.strokeWeight(radius * 0.8);
        mainGraphics.point(lerpPoint.x + random(random(-1, 1)) * 1.2, lerpPoint.y + random(random(-1, 1)) * 1.2);
      }
    }
  }

  // 渲染 splash 類型
  renderSplash(mainGraphics) {
    for (let i = 0; i < 350; i++) {
      this.color.setAlpha(random(1));
      mainGraphics.stroke(this.color);
      mainGraphics.strokeWeight(random(1.5));

      // splashRadius 是計算濺射效果的隨機半徑 (random radius)
      let splashRadius = (1 - random(random())) * this.radius * 0.5 * random(0.9, 1.1);

      // splashAngle 是濺射效果的隨機角度 (angle)
      let splashAngle = random(TWO_PI);

      // 使用極座標計算濺射效果的位置
      mainGraphics.point(
        this.p2D.x + splashRadius * cos(splashAngle),
        this.p2D.y + splashRadius * sin(splashAngle)
      );
    }
    this.color.setAlpha(1);
  }

  // 渲染 line 類型
  renderLine(mainGraphics) {
    this.color.setAlpha(0.01);
    for (let i = 0; i < 1; i++) {
      mainGraphics.stroke(this.color);
      for (let j = 0; j < 3; j++) {
        mainGraphics.strokeWeight(this.radius * 8);
        mainGraphics.line(this.p2D.x, this.p2D.y, this.p2D2.x, this.p2D2.y);
      }
    }
    this.color.setAlpha(1);
  }

  // 渲染 history 類型
  renderHistory(graphics, rotationX, rotationY, rotationZ, cameraPosition, fieldOfView, zoomLevel) {
    if (!this.history.length) return;

    graphics.push();
    graphics.stroke(typeof this.brush?.color === "object" ? this.brush.color : this.color);
    graphics.strokeWeight(1);
    graphics.noFill();
    graphics.beginShape();

    for (let i = 0; i < this.history.length; i++) {
      const position3D = this.history[i];
      let transformedPosition = Rotation3D.rotateY(position3D, rotationY);
      transformedPosition = Rotation3D.rotateX(transformedPosition, rotationX);
      transformedPosition = Rotation3D.rotateZ(transformedPosition, rotationZ);

      const position2D = Vector3DUtils.projectTo2D(transformedPosition, cameraPosition, fieldOfView, zoomLevel);
      graphics.curveVertex(position2D.x, position2D.y);
    }

    graphics.endShape();
    graphics.pop();
  }

  // 渲染抖動應用函數
  applyRenderJitter(position) {
    let jitteredPosition = position.copy();

    // 為每個座標軸添加柏林雜訊抖動效果
    jitteredPosition.x += map(
      noise(
        position.x / this.renderJitterFreq,
        position.y / this.renderJitterFreq,
        position.z / this.renderJitterFreq
      ),
      0, 1, -1, 1
    ) * this.renderJitter;

    jitteredPosition.y += map(
      noise(
        position.x / this.renderJitterFreq,
        position.y / this.renderJitterFreq,
        position.z / this.renderJitterFreq + 5000
      ),
      0, 1, -1, 1
    ) * this.renderJitter;

    jitteredPosition.z += map(
      noise(
        position.x / this.renderJitterFreq,
        position.y / this.renderJitterFreq,
        position.z / this.renderJitterFreq + 500000
      ),
      0, 1, -1, 1
    ) * this.renderJitter;

    return jitteredPosition;
  }
  // 計算半徑函數
  calculateRadius() {
    let radius = this.radius * (this.radiusMappingFunc ? this.radiusMappingFunc(constrain(this.lifespan / this.originalLive, 0.000001, 1), this) : 1);
    if (isNaN(radius) || radius <= 0) radius = 0.001;

    return radius;
  }
  
  // 釋放粒子資源
  dispose() {
    if (this.disposed) return;
    
    // 清理歷史記錄
    if (this.history && this.history.length > 0) {
      this.history.length = 0; // 最快的清空方式
    }
    
    // 清理向量引用
    this.lastPosition = null;
    this.p = null;
    this.vector = null;
    this.acceleration = null;
    this.axis = null;
    
    // 清理渲染資源
    this.p2D = null;
    this.p2D2 = null;
    this.brush = null;
    this.brush2 = null;
    
    // 清理回調函數
    this.tick = null;
    this.endCallback = null;
    this.draw2D = null;
    
    this.disposed = true;
  }
  
  // 檢查是否已釋放
  get isDisposed() {
    return this.disposed;
  }
}


