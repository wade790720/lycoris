// 夢幻風格彼岸花繪製系統
class DreamyFlowerBrushManager {
  constructor() {
    this.brushes = {};
    this.mixedBrushes = {};
    this._initializeDreamyBrushConfigs();
  }

  // 初始化夢幻風格畫刷配置
  _initializeDreamyBrushConfigs() {
    this.brushConfigs = {
      // 淺綠色莖部
      lightGreenStem: {
        count: 10,
        settings: {
          brushColor: () => color(random(110, 130), random(40, 60), random(70, 85)),
          brushAlpha: 1,
          brushNoiseScale: () => random(10, 300),
          brushColorVariant: 0.5,
          brushCanvasSize: 200,
          aspectRatio: 0.2
        }
      },
      // 粉紅色花瓣
      pinkPetal: {
        count: 8,
        settings: {
          brushColor: () => color(random(320, 340), random(50, 70), random(80, 95)),
          brushAlpha: 0.8,
          brushNoiseScale: () => random(10, 50),
          brushColorVariant: 0.6,
          aspectRatio: 0.25,
          brushCanvasSize: 300,
          brushTimeFactor: 0.1
        }
      },
      // 白色花蕊
      whiteStamen: {
        count: 6,
        settings: {
          brushColor: () => color(random(0, 360), random(0, 15), random(85, 100)),
          brushAlpha: 0.9,
          brushNoiseScale: () => random(10, 30),
          brushColorVariant: 0.3,
          aspectRatio: 0.2,
          brushCanvasSize: 200,
          brushTimeFactor: 0.1
        }
      },
      // 淡黃色花心
      lightYellowCenter: {
        count: 5,
        settings: {
          brushColor: () => color(random(50, 70), random(30, 50), random(85, 95)),
          brushAlpha: 1,
          brushNoiseScale: 20,
          brushColorVariant: 0.3,
          aspectRatio: 0.2,
          brushCanvasSize: 300,
          brushTimeFactor: 0.1
        }
      }
    };
  }

  // 生成單一類型的夢幻風格畫刷集合
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

  // 生成混合畫刷
  _generateMixedBrushes(brush1, brush2, count = 5) {
    return Array.from({ length: count }).map(() =>
      mergeBrushHeads(random(brush1), random(brush2))
    );
  }

  // 初始化所有夢幻風格畫刷
  initializeAllBrushes() {
    // 生成基本夢幻色彩畫刷
    this.brushes.lightGreenStem = this._generateBrushSet(this.brushConfigs.lightGreenStem);
    this.brushes.pinkPetal = this._generateBrushSet(this.brushConfigs.pinkPetal);
    this.brushes.whiteStamen = this._generateBrushSet(this.brushConfigs.whiteStamen);
    this.brushes.lightYellowCenter = this._generateBrushSet(this.brushConfigs.lightYellowCenter);

    // 生成夢幻混合畫刷
    this.mixedBrushes.dreamyPetal = this._generateMixedBrushes(this.brushes.pinkPetal, this.brushes.pinkPetal);
    this.mixedBrushes.dreamyStem = this._generateMixedBrushes(this.brushes.lightGreenStem, this.brushes.lightGreenStem);
  }

  // 獲取指定類型的畫刷
  getBrush(type) {
    return this.brushes[type] || [];
  }

  // 獲取混合畫刷
  getMixedBrush(type) {
    return this.mixedBrushes[type] || [];
  }

  // 獲取夢幻風格花瓣畫刷組合
  getDreamyPetalBrushes() {
    return this.mixedBrushes.dreamyPetal;
  }
}

// 夢幻風格花莖生成器
class DreamyFlowerStemGenerator {
  static createStemParticleConfig(pos, plantGrowthDirection, plantDrawingLayer, brushManager) {
    return {
      p: pos.copy(),
      vector: plantGrowthDirection,
      velocityShrinkFactor: 0.995,
      radiusShrinkFactor: 0.995,
      acceleration: createVector(0, -0.01, 0),
      radius: random(15, 25),
      color: color(120, 50, 80), // 淺綠色
      preDelay: 0,
      renderJitter: 3, // 更輕柔的抖動
      lifespan: random(40, 250),
      mainGraphics: plantDrawingLayer.graphics,
      maxSegments: 10,
      brush: random(brushManager.getMixedBrush('dreamyStem')),
      brush2: random(brushManager.getMixedBrush('dreamyStem')),
      renderType: "brushImageLerp",
      speedLimit: 5,
      isBrushRotateFollowVelocity: true,
      endCallback: (_this) => {
        dreamyFlowerGenerator.generateFlower(_this, brushManager);
      },
      tick: (_this) => {
        // 輕柔的搖擺動態效果
        _this.p.x += map(noise(_this.randomId, frameCount / 40), 0, 1, -0.8, 0.8) * 0.8;
        _this.p.y += map(noise(frameCount / 35, _this.randomId, 1000), 0, 1, -0.8, 0.8) * 0.8;
        _this.p.z += map(noise(1000, _this.randomId, frameCount / 40), 0, 1, -0.8, 0.8) * 0.8;
        if (_this.r < 0.01) _this.r = 0;
      }
    };
  }

  static generateStem(pos, brushManager) {
    colorMode(HSB);
    let plantGrowthDirection = Rotation3D.rotateRandom(
      createVector(0, -random(0.9, 1) - 1, 0),
      random(PI / 3) // 更小的隨機角度，更直立
    );
    let plantDrawingLayer = layerSystem.getRandomLayer(0);

    const particleConfig = this.createStemParticleConfig(pos, plantGrowthDirection, plantDrawingLayer, brushManager);
    sceneManager.addParticle(new Particle(particleConfig));
  }
}

// 夢幻風格花朵生成器
class DreamyFlowerGenerator {
  generateFlower(stemParticle, brushManager) {
    const flowerParams = this._calculateFlowerParameters(stemParticle);
    this._generatePetals(stemParticle, flowerParams, brushManager);
    this._generateStamens(stemParticle, flowerParams, brushManager);
  }

  _calculateFlowerParameters(stemParticle) {
    const flowerScale = random(0.5, 0.8) / 2;
    const flowerCenterV = Rotation3D.rotateRandom(stemParticle.vector.copy(), random(PI / 2) * random(0.5, 1));

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
      rotateFactor: random(0.2, 0.8), // 更溫和的旋轉
      delayFlower: 0
    };
  }

  _generatePetals(stemParticle, flowerParams, brushManager) {
    for (let i = 0; i < flowerParams.petalCount; i++) {
      const vc_final = Rotation3D.rotateRandom(
        Rotation3D.rotateAroundAxis(
          flowerParams.vc1_tilted,
          stemParticle.vector,
          flowerParams.startAng + i / flowerParams.petalCount * 2 * PI
        ),
        random(PI / 4) // 更小的隨機變化
      );

      const petalConfig = this._createPetalParticleConfig(
        stemParticle, flowerParams, vc_final, 1.2, 0.995, brushManager
      );

      petalConfig.tick = (_this) => {
        this._applyPetalRotation(_this, flowerParams, vc_final);
      };

      sceneManager.addParticle(new Particle(petalConfig));
    }
  }

  _generateStamens(stemParticle, flowerParams, brushManager) {
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
        stemParticle, flowerParams, vc_final, stamenRadius, brushManager
      );

      sceneManager.addParticle(new Particle(stamenConfig));
    }
  }

  _createPetalParticleConfig(stemParticle, flowerParams, vc_final, vectorMultiplier, shrinkFactor, brushManager) {
    const _r = flowerParams.flowerRadius * flowerParams.flowerScale;
    const brushes = brushManager.getDreamyPetalBrushes();

    return {
      p: stemParticle.p.copy(),
      radius: _r,
      vector: vc_final.copy().normalize().mult(vectorMultiplier),
      radiusShrinkFactor: shrinkFactor,
      lifespan: _r * 2,
      velocityShrinkFactor: 1.02,
      preDelay: flowerParams.delayFlower,
      mainGraphics: stemParticle.mainGraphics,
      color: color(330, 60, 90), // 粉紅色
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

  _createStamenParticleConfig(stemParticle, flowerParams, vc_final, stamenRadius, brushManager) {
    const _r = stamenRadius * flowerParams.flowerScale;
    const brushes = brushManager.getBrush('whiteStamen');

    return {
      p: stemParticle.p.copy(),
      radius: _r,
      vector: vc_final.copy().normalize().mult(-random(2, 3)),
      radiusShrinkFactor: 0.975,
      lifespan: _r * 2,
      velocityShrinkFactor: 1.02,
      preDelay: flowerParams.delayFlower,
      mainGraphics: stemParticle.mainGraphics,
      color: color(0, 10, 95), // 白色
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
        dreamyFlowerEndGenerator.generateFlowerEnd(_this, brushManager);
      }
    };
  }

  _applyPetalRotation(particle, flowerParams, vc_final) {
    let amp = 1 / pow(map(particle.lifespan / particle.originalLive, 1, 0, 3, 0.3), 2) / 12 * flowerParams.rotateFactor;
    particle.vector = rotateVectorInPlane(flowerParams.flowerCenterV, vc_final, particle.vector, amp);
    particle.vector = Rotation3D.rotateY(particle.vector, +sin(frameCount / 6 + particle.randomId + noise(frameCount / 5, particle.randomId)) / 40);
    particle.vector = Rotation3D.rotateZ(particle.vector, +cos(frameCount / 8 + particle.randomId + noise(frameCount / 5, particle.randomId, 50)) / 40);
    particle.vector = Rotation3D.rotateX(particle.vector, +sin(frameCount / 10 + particle.randomId + noise(frameCount / 5, particle.randomId, 500)) / 40);
    particle.vector = Rotation3D.rotateZ(particle.vector, +sin(frameCount / 60 + particle.randomId + noise(frameCount / 60, particle.randomId)) / 40);
  }
}

// 夢幻風格花朵結尾效果生成器
class DreamyFlowerEndGenerator {
  generateFlowerEnd(stamenParticle, brushManager) {
    const pollenRadius = random(4, 8);
    const centerBrushes = brushManager.getBrush('lightYellowCenter');

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
      color: color(60, 40, 90), // 淡黃色
      brush: random(centerBrushes),
      brush2: random(centerBrushes),
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

// 全域夢幻風格實例
const dreamyBrushManager = new DreamyFlowerBrushManager();
const dreamyFlowerGenerator = new DreamyFlowerGenerator();
const dreamyFlowerEndGenerator = new DreamyFlowerEndGenerator();

// 夢幻風格花朵生成主函數
function generateDreamyFlowers() {
  colorMode(HSB);
  
  // 初始化夢幻風格畫刷
  dreamyBrushManager.initializeAllBrushes();
  
  // 生成多朵夢幻風格花
  const flowerCount = 10;
  Array.from({ length: flowerCount }).forEach(() => {
    DreamyFlowerStemGenerator.generateStem(createVector(
      random(-100, 100),
      random(-20, 20) + 300,
      random(-100, 100)
    ), dreamyBrushManager);
  });
}

// 生成單朵夢幻風格花朵
function generateDreamyFlowerPlant(pos) {
  DreamyFlowerStemGenerator.generateStem(pos, dreamyBrushManager);
}