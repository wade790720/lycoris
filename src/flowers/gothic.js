// 哥特風格花朵繪製相關的畫刷管理器
class GothicFlowerBrushManager {
  constructor() {
    this.brushes = {};
    this.mixedBrushes = {};
    this._initializeBrushConfigs();
  }

  // 初始化哥特風格畫刷配置 - 深紫莖、深紅黑花瓣、暗金花蕊、深橙花心
  _initializeBrushConfigs() {
    this.brushConfigs = {
      green: {
        count: 10,
        settings: {
          // 深紫色莖部
          brushColor: () => color(random(280, 300), random(60, 80), random(25, 45)),
          brushAlpha: 1,
          brushNoiseScale: () => random(10, 300),
          brushColorVariant: 0.6,
          brushCanvasSize: 200,
          aspectRatio: 0.2
        }
      },
      white: {
        count: 5,
        settings: {
          // 暗金色花蕊
          brushColor: () => color(random(40, 50), random(70, 85), random(40, 60)),
          brushAlpha: 0.8,
          brushNoiseScale: () => random(10, 500),
          brushColorVariant: 0.5,
          aspectRatio: 0.3,
          brushCanvasSize: 200,
          brushTimeFactor: 0.1
        }
      },
      black: {
        count: 5,
        settings: {
          // 深紅近黑花瓣 (用於混合)
          brushColor: () => color(random(350, 10), random(80, 95), random(10, 25)),
          brushAlpha: 0.9,
          brushNoiseScale: () => random(10, 500),
          brushColorVariant: 0.8,
          aspectRatio: 0.2,
          brushCanvasSize: 200,
          brushTimeFactor: 0.1
        }
      },
      red: {
        count: 5,
        settings: {
          // 深紅近黑花瓣
          brushColor: () => color(random(350, 10), random(80, 95), random(15, 35)),
          brushAlpha: 0.9,
          brushNoiseScale: () => random(10, 50),
          brushColorVariant: 0.8,
          aspectRatio: 0.25,
          brushCanvasSize: 300,
          brushTimeFactor: 0.1
        }
      },
      yellow: {
        count: 5,
        settings: {
          // 深橙色花心
          brushColor: () => color(random(20, 35), random(85, 95), random(50, 70)),
          brushAlpha: 1,
          brushNoiseScale: 20,
          brushColorVariant: 0.4,
          aspectRatio: 0.2,
          brushCanvasSize: 300,
          brushTimeFactor: 0.1
        }
      }
    };
  }

  // 生成單一類型的畫刷集合
  _generateBrushSet(config) {
    return Array.from({ length: config.count }).map(() => {
      const settings = { ...config.settings };
      if (typeof settings.brushColor === 'function') {
        settings.brushColor = settings.brushColor();
      }
      if (typeof settings.brushNoiseScale === 'function') {
        settings.brushNoiseScale = settings.brushNoiseScale();
      }
      return generateBrushHead(settings);
    });
  }

  // 生成混合畫刷 - 將兩種畫刷類型混合產生新的效果
  _generateMixedBrushes(brush1, brush2, count = 5) {
    return Array.from({ length: count }).map(() =>
      mergeBrushHeads(random(brush1), random(brush2))
    );
  }

  // 初始化所有畫刷
  initializeAllBrushes() {
    // 生成基本色彩畫刷
    this.brushes.green = this._generateBrushSet(this.brushConfigs.green);
    this.brushes.white = this._generateBrushSet(this.brushConfigs.white);
    this.brushes.black = this._generateBrushSet(this.brushConfigs.black);
    this.brushes.red = this._generateBrushSet(this.brushConfigs.red);
    this.brushes.yellow = this._generateBrushSet(this.brushConfigs.yellow);

    // 生成混合效果畫刷
    this.mixedBrushes.redWhite = this._generateMixedBrushes(this.brushes.red, this.brushes.white);
    this.mixedBrushes.redBlack = this._generateMixedBrushes(this.brushes.red, this.brushes.black);
    this.mixedBrushes.plant = this._generateMixedBrushes(this.brushes.green, this.brushes.green);
  }

  // 獲取指定類型的畫刷
  getBrush(type) {
    return this.brushes[type] || [];
  }

  // 獲取混合畫刷
  getMixedBrush(type) {
    return this.mixedBrushes[type] || [];
  }

  // 獲取隨機花瓣畫刷組合
  getRandomPetalBrushes() {
    return random([this.mixedBrushes.redBlack, this.mixedBrushes.redWhite, this.brushes.red]);
  }
}

// 全域哥特風格畫刷管理器實例
const gothicBrushManager = new GothicFlowerBrushManager();

// 哥特風格花朵生成函數 - 使用原本的結構，只替換畫刷管理器
function generateGothicFlowers() {
  colorMode(HSB);

  // 初始化哥特風格畫刷
  gothicBrushManager.initializeAllBrushes();

  // 生成多朵花
  const flowerCount = 10;
  Array.from({ length: flowerCount }).forEach(() => {
    generateGothicFlowerPlant(createVector(
      random(-100, 100),
      random(-20, 20) + 300,
      random(-100, 100)
    ));
  });
}

// 哥特風格花莖生成器 - 使用原本的邏輯，替換畫刷
class GothicFlowerStemGenerator {
  // 創建花莖粒子的基本屬性配置
  static createStemParticleConfig(pos, plantGrowthDirection, plantDrawingLayer) {
    return {
      p: pos.copy(),
      vector: plantGrowthDirection,
      velocityShrinkFactor: 0.995,
      radiusShrinkFactor: 0.995,
      acceleration: createVector(0, -0.01, 0),
      radius: random(15, 25),
      color: color(100, 100, 100),
      preDelay: 0,
      renderJitter: 5,
      lifespan: random(40, 250),
      mainGraphics: plantDrawingLayer.graphics,
      maxSegments: 10,
      brush: random(gothicBrushManager.getMixedBrush('plant')),
      brush2: random(gothicBrushManager.getMixedBrush('plant')),
      renderType: "brushImageLerp",
      speedLimit: 5,
      isBrushRotateFollowVelocity: true,
      endCallback: (_this) => {
        gothicFlowerGenerator.generateFlower(_this);
      },
      tick: (_this) => {
        // 添加自然的搖擺動態效果 - 模擬風吹的感覺
        _this.p.x += map(noise(_this.randomId, frameCount / 30), 0, 1, -1, 1) * 1.1;
        _this.p.y += map(noise(frameCount / 30, _this.randomId, 1000), 0, 1, -1, 1) * 1.1;
        _this.p.z += map(noise(1000, _this.randomId, frameCount / 30), 0, 1, -1, 1) * 1.1;
        if (_this.r < 0.01) _this.r = 0;
      }
    };
  }

  // 生成花莖主體
  static generateStem(pos) {
    colorMode(HSB);
    // 計算植物生長方向 - 略微隨機偏移以產生自然效果
    let plantGrowthDirection = Rotation3D.rotateRandom(
      createVector(0, -random(0.9, 1) - 1, 0),
      random(PI / 2)
    );
    let plantDrawingLayer = layerSystem.getRandomLayer(0);

    const particleConfig = this.createStemParticleConfig(pos, plantGrowthDirection, plantDrawingLayer);
    sceneManager.addParticle(new Particle(particleConfig));
  }
}

// 生成花朵植物 - 簡化後只負責調用花莖生成器
function generateGothicFlowerPlant(pos) {
  GothicFlowerStemGenerator.generateStem(pos);
}

// 哥特風格花朵生成器 - 使用原本的邏輯，替換畫刷
class GothicFlowerGenerator {
  // 生成花朵的主要函數
  generateFlower(stemParticle) {
    console.log(stemParticle);

    // 花朵基本參數設定
    const flowerParams = this._calculateFlowerParameters(stemParticle);

    // 生成花瓣層
    this._generatePetals(stemParticle, flowerParams);

    // 生成花蕊層
    this._generateStamens(stemParticle, flowerParams);
  }

  // 計算花朵的基本參數 - 將複雜的數學運算集中管理
  _calculateFlowerParameters(stemParticle) {
    const flowerScale = random(0.5, 0.8) / 2;
    const flowerCenterV = Rotation3D.rotateRandom(stemParticle.vector.copy(), random(PI / 2) * random(0.5, 1));

    // 計算花瓣的基準向量
    const vc1 = stemParticle.vector.cross(createVector(1, 0, -stemParticle.vector.x / stemParticle.vector.z)).normalize();
    const vc1_tilted = p5.Vector.lerp(vc1, stemParticle.vector, random(0.3, 0.5)).normalize();

    return {
      flowerScale,
      flowerCenterV,
      vc1,
      vc1_tilted,
      petalCount: int(random(20, 40)),
      flowerRadius: random(30, 50),
      startAng: random(PI),
      rotateFactor: random(0.3, 1.2),
      delayFlower: 0
    };
  }

  // 生成花瓣 - 外層較大的花瓣
  _generatePetals(stemParticle, flowerParams) {
    for (let i = 0; i < flowerParams.petalCount; i++) {
      const vc_final = Rotation3D.rotateRandom(
        Rotation3D.rotateAroundAxis(
          flowerParams.vc1_tilted,
          stemParticle.vector,
          flowerParams.startAng + i / flowerParams.petalCount * 2 * PI
        ),
        random(PI / 3)
      );

      const petalConfig = this._createPetalParticleConfig(
        stemParticle, flowerParams, vc_final, 1.2, 0.995
      );

      // 添加花瓣特有的動態旋轉效果
      petalConfig.tick = (_this) => {
        this._applyPetalRotation(_this, flowerParams, vc_final);
      };

      sceneManager.addParticle(new Particle(petalConfig));
    }
  }

  // 生成花蕊 - 內層較細長的結構
  _generateStamens(stemParticle, flowerParams) {
    const stamenRadius = random(30, 40);
    const stamenCount = random(35, 40);

    for (let i = 0; i < stamenCount; i++) {
      const vc1_tilted = p5.Vector.lerp(flowerParams.vc1, stemParticle.vector, -random(0.00, 0.21)).normalize();
      const vc_final = Rotation3D.rotateAroundAxis(
        vc1_tilted,
        stemParticle.vector,
        flowerParams.startAng + i / stamenCount * 2 * PI
      );

      const stamenConfig = this._createStamenParticleConfig(
        stemParticle, flowerParams, vc_final, stamenRadius
      );

      sceneManager.addParticle(new Particle(stamenConfig));
    }
  }

  // 創建花瓣粒子配置
  _createPetalParticleConfig(stemParticle, flowerParams, vc_final, vectorMultiplier, shrinkFactor) {
    const _r = flowerParams.flowerRadius * flowerParams.flowerScale;
    const brushes = gothicBrushManager.getRandomPetalBrushes();

    return {
      p: stemParticle.p.copy(),
      radius: _r,
      vector: vc_final.copy().normalize().mult(vectorMultiplier),
      radiusShrinkFactor: shrinkFactor,
      lifespan: _r * 2,
      velocityShrinkFactor: 1.02,
      preDelay: flowerParams.delayFlower,
      mainGraphics: stemParticle.mainGraphics,
      color: color(0, 100, 100),
      brush: random(brushes),
      brush2: random(brushes),
      brushLerpMap: k => k,
      maxSegments: 5,
      renderType: "brushImageLerp",
      radiusMappingFunc: (p) => {
        let _p = easeOutSine(easeOutSine(p)) + noise(stemParticle.randomId, stemParticle.lifespan / 10) / 10;
        let rr = sqrt(1 - pow(map(_p, 0, 1, -1, 1), 2)) * 1.4;
        return rr;
      }
    };
  }

  // 創建花蕊粒子配置
  _createStamenParticleConfig(stemParticle, flowerParams, vc_final, stamenRadius) {
    const _r = stamenRadius * flowerParams.flowerScale;
    const brushes = gothicBrushManager.getRandomPetalBrushes();

    return {
      p: stemParticle.p.copy(),
      radius: _r,
      vector: vc_final.copy().normalize().mult(-random(2, 3)),
      radiusShrinkFactor: 0.975,
      lifespan: _r * 2,
      velocityShrinkFactor: 1.02,
      preDelay: flowerParams.delayFlower,
      mainGraphics: stemParticle.mainGraphics,
      color: color(0, 0, 100),
      brush: random(brushes),
      brush2: random(brushes),
      brushLerpMap: k => k,
      maxSegments: 8,
      renderType: "brushImageLerp",
      tick: (_this) => {
        let amp = 1 / pow(map(_this.lifespan / _this.originalLive, 1, 0, 3, 0.3), 2) / 5 * flowerParams.rotateFactor / 5;
        _this.vector = rotateVectorInPlane(flowerParams.flowerCenterV, vc_final, _this.vector, amp);
      },
      endCallback: (_this) => {
        gothicFlowerEndGenerator.generateFlowerEnd(_this);
      }
    };
  }

  // 應用花瓣的複雜旋轉動畫 - 模擬花瓣在風中的搖擺
  _applyPetalRotation(particle, flowerParams, vc_final) {
    let amp = 1 / pow(map(particle.lifespan / particle.originalLive, 1, 0, 3, 0.3), 2) / 10 * flowerParams.rotateFactor;
    particle.vector = rotateVectorInPlane(flowerParams.flowerCenterV, vc_final, particle.vector, amp);
    particle.vector = Rotation3D.rotateY(particle.vector, +sin(frameCount / 4 + particle.randomId + noise(frameCount / 3, particle.randomId)) / 30);
    particle.vector = Rotation3D.rotateZ(particle.vector, +cos(frameCount / 6 + particle.randomId + noise(frameCount / 3, particle.randomId, 50)) / 30);
    particle.vector = Rotation3D.rotateX(particle.vector, +sin(frameCount / 7 + particle.randomId + noise(frameCount / 3, particle.randomId, 500)) / 30);
    particle.vector = Rotation3D.rotateZ(particle.vector, +sin(frameCount / 50 + particle.randomId + noise(frameCount / 50, particle.randomId)) / 30);
  }
}

// 全域花朵生成器實例
const gothicFlowerGenerator = new GothicFlowerGenerator();

// 花朵結尾效果生成器 - 負責花蕊末端的深橙色花粉效果
class GothicFlowerEndGenerator {
  generateFlowerEnd(stamenParticle) {
    const pollenRadius = random(4, 8);
    const orangeBrushes = gothicBrushManager.getBrush('yellow');

    const pollenConfig = {
      p: stamenParticle.p.copy(),
      radius: pollenRadius,
      vector: Rotation3D.rotateRandom(
        stamenParticle.vector.copy().normalize().mult(random(0.8, 1)),
        random(-1, 1) * PI
      ),
      radiusShrinkFactor: 0.98,
      lifespan: pollenRadius * 2.5,
      velocityShrinkFactor: 0.9,
      preDelay: 0,
      mainGraphics: stamenParticle.mainGraphics,
      color: color(50, 100, 100),
      brush: random(orangeBrushes),
      brush2: random(orangeBrushes),
      brushLerpMap: k => k,
      maxSegments: 5,
      renderType: "brushImageLerp",
      radiusMappingFunc: (p) => {
        let _p = easeInOutQuad(p);
        let rr = sqrt(1 - pow(map(_p, 0, 1, -1, 1), 2));
        return rr;
      }
    };

    sceneManager.addParticle(new Particle(pollenConfig));
  }
}

// 全域花朵結尾效果生成器實例
const gothicFlowerEndGenerator = new GothicFlowerEndGenerator();