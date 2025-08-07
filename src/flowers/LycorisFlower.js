// LycorisFlower - 彼岸花專用類別
// 繼承 FlowerBase，實現彼岸花特有的邏輯

class LycorisFlower extends FlowerBase {
  constructor(styleConfig) {
    // 如果沒有提供配置，使用預設配置
    if (!styleConfig) {
      styleConfig = LycorisFlower._getDefaultConfig();
    }
    super('lycoris', styleConfig);
    // 使用彼岸花專用的畫刷管理器
    this.brushManager = new LycorisBrushManager(this.brushManager.brushConfigs);
  }

  // 靜態方法獲取預設配置
  static _getDefaultConfig() {
    return {
      green: {
        count: 10,
        settings: {
          brushColor: () => color(random(60, 115) + random() * random() * 10,
            random(80, 85) + random() * random() * 10,
            random(10, 60) + random() * random() * 20),
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
          brushColor: () => color(random(0, 10), random(0, 20), random(90, 100)),
          brushAlpha: 1,
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
        count: 15,
        settings: {
          brushColor: () => color(random(350, 10), random(80, 95), random(35, 75)),
          brushAlpha: 0.85,
          brushNoiseScale: () => random(10, 300),
          brushColorVariant: 0.7,
          aspectRatio: 0.4,
          brushCanvasSize: 180,
          brushTimeFactor: 0.08
        }
      }
    };
  }

  // 獲取彼岸花風格配置
  getStyleConfig(styleName = 'default') {
    if (typeof window !== 'undefined' && window.LycorisStyleManager) {
      const styleManager = new window.LycorisStyleManager();
      const styles = styleManager.styles;
      return styles[styleName]?.config || styles.default?.config;
    }
    
    return this.getDefaultConfig();
  }

  // 彼岸花預設配置
  getDefaultConfig() {
    return {
      green: {
        count: 10,
        settings: {
          brushColor: () => color(random(60, 115) + random() * random() * 10,
            random(80, 85) + random() * random() * 10,
            random(10, 60) + random() * random() * 20),
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
          brushColor: () => color(random(0, 10), random(0, 20), random(90, 100)),
          brushAlpha: 1,
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
        count: 15,
        settings: {
          brushColor: () => color(random(350, 10), random(80, 95), random(35, 75)),
          brushAlpha: 0.85,
          brushNoiseScale: () => random(10, 300),
          brushColorVariant: 0.7,
          aspectRatio: 0.4,
          brushCanvasSize: 180,
          brushTimeFactor: 0.08
        }
      }
    };
  }

  // 彼岸花專用花朵生成
  generateFlowers(options = {}) {
    const {
      style = 'default',
      flowerCount = 30,
      position = { x: [-100, 100], y: [-20, 20], z: [-100, 100] },
      customStyle = null,
      scatterMode = true
    } = options;

    colorMode(HSB);

    // 初始化畫刷系統
    const styleConfig = customStyle || this.getStyleConfig(style);
    this.brushManager.updateStyle(styleConfig);
    this.brushManager.initializeAllBrushes();

    const centerX = (position.x[0] + position.x[1]) * 0.618;
    const centerZ = (position.z[0] + position.z[1]) * 0.382;

    if (scatterMode) {
      this._generateScatteredMode(flowerCount, position, centerX, centerZ);
    } else {
      this._generateGridMode(flowerCount, position);
    }
  }

  // 網格模式：規則排列
  _generateGridMode(flowerCount, position) {
    const gridSize = Math.ceil(sqrt(flowerCount));
    const xStep = (position.x[1] - position.x[0]) / (gridSize - 1);
    const zStep = (position.z[1] - position.z[0]) / (gridSize - 1);
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize && (i * gridSize + j) < flowerCount; j++) {
        const plantPos = createVector(
          position.x[0] + i * xStep + random(-xStep * 0.2, xStep * 0.2),
          random(position.y[0], position.y[1]) + 300,
          position.z[0] + j * zStep + random(-zStep * 0.2, zStep * 0.2)
        );
        
        this.generateSinglePlant(plantPos);
      }
    }
  }

  // 散佈模式：使用斐波那契螺旋分布
  _generateScatteredMode(flowerCount, position, centerX, centerZ) {
    Array.from({ length: flowerCount }).forEach((_, i) => {
      const angle = i * 2.399; // 黃金角
      const radius = sqrt(i) * 25;
      
      const layerDepth = (sin(angle * 0.5) + 1) * 0.5;
      const scale = map(layerDepth, 0, 1, 0.6, 1.2);
      
      const plantPos = createVector(
        centerX + cos(angle) * radius,
        random(position.y[0], position.y[1]) + 300 - layerDepth * 60,
        centerZ + sin(angle) * radius
      );
      
      this.generateSinglePlant(plantPos, { 
        depth: layerDepth, 
        scale: scale, 
        focus: layerDepth < 0.7 
      });
    });
  }

  // 生成單株彼岸花植物
  generateSinglePlant(pos) {
    FlowerStemGenerator.generateStem(pos);
  }

  // 實現彼岸花特有的花瓣邏輯
  createSpecificPetals() {
    // 彼岸花特色：細長向外彎曲的花瓣
    return {
      petalCount: int(random(20, 40)),  // 彼岸花特色：20-40片細長花瓣
      vectorMultiplier: 1.2,            // 向外彎曲
      shrinkFactor: 0.995,
      petalShape: 'curved'              // 彎曲形狀
    };
  }
}

// 彼岸花專用畫刷管理器
class LycorisBrushManager extends FlowerBrushManager {
  // 初始化彼岸花特有的混合畫刷
  _generateBasicMixedBrushes() {
    super._generateBasicMixedBrushes();
    
    const colorKeys = Object.keys(this.brushes);
    
    // 彼岸花特色混合
    if (colorKeys.includes('red') && colorKeys.includes('white')) {
      this.mixedBrushes.redWhite = this._generateMixedBrushes(this.brushes.red, this.brushes.white);
    }
    if (colorKeys.includes('red') && colorKeys.includes('black')) {
      this.mixedBrushes.redBlack = this._generateMixedBrushes(this.brushes.red, this.brushes.black);
    }
  }

  // 彼岸花專用花瓣畫刷選擇
  getRandomPetalBrushes() {
    const availableOptions = [];
    
    // 彼岸花特色配色
    if (this.mixedBrushes.redBlack) availableOptions.push(this.mixedBrushes.redBlack);
    if (this.mixedBrushes.redWhite) availableOptions.push(this.mixedBrushes.redWhite);
    if (this.brushes.red) availableOptions.push(this.brushes.red);
    
    if (availableOptions.length === 0) {
      return super.getRandomPetalBrushes();
    }
    
    return random(availableOptions);
  }
}

// 彼岸花專用花朵生成器
class LycorisFlowerGenerator extends BaseFlowerGenerator {
  // 彼岸花特有的花朵參數計算
  _calculateFlowerParameters(stemParticle) {
    const baseParams = super._calculateFlowerParameters(stemParticle);
    
    // 彼岸花特色調整
    const vc1_tilted = p5.Vector.lerp(baseParams.vc1, stemParticle.vector, random(0.3, 0.5)).normalize();
    
    return {
      ...baseParams,
      vc1_tilted,
      petalCount: int(random(20, 40)),  // 彼岸花特色：細長花瓣
      flowerRadius: random(30, 50),
      rotateFactor: random(0.3, 1.2)
    };
  }

  // 彼岸花特有的花瓣生成
  _generatePetals(stemParticle, flowerParams) {
    // 環形排列生成所有花瓣
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

      // 彼岸花花瓣動畫
      petalConfig.tick = (_this) => {
        this._applyPetalRotation(_this, flowerParams, vc_final);
      };

      sceneManager.addParticle(new Particle(petalConfig));
    }
  }

  // 生成花蕊
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
    const brushes = this.brushManager.getRandomPetalBrushes();

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
    const brushes = this.brushManager.getRandomPetalBrushes();

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
        _this.vector = this.rotateVectorInPlane(flowerParams.flowerCenterV, vc_final, _this.vector, amp);
      },
      endCallback: (_this) => {
        flowerEndGenerator.generateFlowerEnd(_this);
      }
    };
  }

  // 應用花瓣旋轉動畫
  _applyPetalRotation(particle, flowerParams, vc_final) {
    let amp = 1 / pow(map(particle.lifespan / particle.originalLive, 1, 0, 3, 0.3), 2) / 10 * flowerParams.rotateFactor;
    particle.vector = this.rotateVectorInPlane(flowerParams.flowerCenterV, vc_final, particle.vector, amp);
    particle.vector = Rotation3D.rotateY(particle.vector, +sin(frameCount / 4 + particle.randomId + noise(frameCount / 3, particle.randomId)) / 30);
    particle.vector = Rotation3D.rotateZ(particle.vector, +cos(frameCount / 6 + particle.randomId + noise(frameCount / 3, particle.randomId, 50)) / 30);
    particle.vector = Rotation3D.rotateX(particle.vector, +sin(frameCount / 7 + particle.randomId + noise(frameCount / 3, particle.randomId, 500)) / 30);
    particle.vector = Rotation3D.rotateZ(particle.vector, +sin(frameCount / 50 + particle.randomId + noise(frameCount / 50, particle.randomId)) / 30);
  }

  // 3D向量旋轉工具函數
  rotateVectorInPlane(v1, v2, v4, ang) {
    let normal = v1.cross(v2).normalize();
    let projection = v4.copy().sub(normal.copy().mult(v4.dot(normal)));
    let cosAng = cos(ang);
    let sinAng = sin(ang);
    let rotatedV4 = projection.copy().mult(cosAng).add(normal.cross(projection).mult(sinAng));
    return rotatedV4;
  }
}

// 便利函數
const generateGothicLycoris = (options = {}) => {
  const lycoris = new LycorisFlower();
  const defaultOptions = {
    flowerCount: 25,
    scatterMode: false,
    style: 'gothic',
    position: { x: [-180, 180], y: [-25, 35], z: [-180, 180] }
  };
  lycoris.generateFlowers({ ...defaultOptions, ...options });
};

const generateInkLycoris = (options = {}) => {
  const lycoris = new LycorisFlower();
  const defaultOptions = {
    flowerCount: 20,
    scatterMode: true,
    style: 'ink',
    position: { x: [-150, 150], y: [-20, 30], z: [-150, 150] }
  };
  lycoris.generateFlowers({ ...defaultOptions, ...options });
};

const generateElegantLycoris = (options = {}) => {
  const lycoris = new LycorisFlower();
  const defaultOptions = {
    flowerCount: 35,
    scatterMode: true,
    style: 'elegant',
    position: { x: [-220, 220], y: [-35, 25], z: [-220, 220] }
  };
  lycoris.generateFlowers({ ...defaultOptions, ...options });
};

// 匯出類別
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LycorisFlower,
    LycorisBrushManager,
    LycorisFlowerGenerator,
    generateGothicLycoris,
    generateInkLycoris,
    generateElegantLycoris
  };
}

if (typeof window !== 'undefined') {
  window.LycorisFlower = LycorisFlower;
  window.LycorisBrushManager = LycorisBrushManager;
  window.LycorisFlowerGenerator = LycorisFlowerGenerator;
  window.generateGothicLycoris = generateGothicLycoris;
  window.generateInkLycoris = generateInkLycoris;
  window.generateElegantLycoris = generateElegantLycoris;
}