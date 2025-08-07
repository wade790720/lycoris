// LavenderFlower - 薰衣草專用類別
// 繼承 FlowerBase，實現薰衣草特有的邏輯

class LavenderFlower extends FlowerBase {
  constructor(styleConfig) {
    // 如果沒有提供配置，使用預設配置
    if (!styleConfig) {
      styleConfig = LavenderFlower._getDefaultConfig();
    }
    super('lavender', styleConfig);
    // 使用薰衣草專用的畫刷管理器
    this.brushManager = new LavenderBrushManager(this.brushManager.brushConfigs);
  }

  // 靜態方法獲取預設配置
  static _getDefaultConfig() {
    return {
      green: {
        count: 6,
        settings: {
          brushColor: () => color(random(140, 160), random(35, 55), random(20, 35)),
          brushAlpha: 1,
          brushNoiseScale: () => random(30, 150),
          brushColorVariant: 0.4,
          brushCanvasSize: 160,
          aspectRatio: 0.12
        }
      },
      purple: {
        count: 8,
        settings: {
          brushColor: () => color(random(265, 280), random(45, 65), random(35, 55)),
          brushAlpha: 0.85,
          brushNoiseScale: () => random(15, 70),
          brushColorVariant: 0.3,
          aspectRatio: 0.5,
          brushCanvasSize: 120,
          brushTimeFactor: 0.08
        }
      },
      black: {
        count: 5,
        settings: {
          brushColor: () => color(random(0, 30), random(90, 100), random(5, 25)),
          brushAlpha: 1,
          brushNoiseScale: () => random(15, 200),
          brushColorVariant: 0.5,
          brushCanvasSize: 180,
          aspectRatio: 0.09,
          brushTimeFactor: 0.15
        }
      },
      white: {
        count: 2,
        settings: {
          brushColor: () => color(random(0, 10), random(0, 20), random(90, 100)),
          brushAlpha: 0.3,
          brushNoiseScale: () => random(100, 500),
          brushColorVariant: 0.5,
          aspectRatio: 0.7,
          brushCanvasSize: 50,
          brushTimeFactor: 0.1
        }
      }
    };
  }

  // 獲取薰衣草風格配置
  getStyleConfig(styleName = 'default') {
    if (typeof window !== 'undefined' && window.LavenderStyleManager) {
      const styleManager = new window.LavenderStyleManager();
      const styles = styleManager.styles;
      return styles[styleName]?.config || styles.default?.config;
    }
    
    return this.getDefaultConfig();
  }

  // 薰衣草預設配置
  getDefaultConfig() {
    return {
      green: {
        count: 6,
        settings: {
          brushColor: () => color(random(140, 160), random(35, 55), random(20, 35)),
          brushAlpha: 1,
          brushNoiseScale: () => random(30, 150),
          brushColorVariant: 0.4,
          brushCanvasSize: 160,
          aspectRatio: 0.12
        }
      },
      purple: {
        count: 8,
        settings: {
          brushColor: () => color(random(265, 280), random(45, 65), random(35, 55)),
          brushAlpha: 0.85,
          brushNoiseScale: () => random(15, 70),
          brushColorVariant: 0.3,
          aspectRatio: 0.5,
          brushCanvasSize: 120,
          brushTimeFactor: 0.08
        }
      },
      black: {
        count: 5,
        settings: {
          brushColor: () => color(random(0, 30), random(90, 100), random(5, 25)),
          brushAlpha: 1,
          brushNoiseScale: () => random(15, 200),
          brushColorVariant: 0.5,
          brushCanvasSize: 180,
          aspectRatio: 0.09,
          brushTimeFactor: 0.15
        }
      },
      white: {
        count: 2,
        settings: {
          brushColor: () => color(random(0, 10), random(0, 20), random(90, 100)),
          brushAlpha: 0.3,
          brushNoiseScale: () => random(100, 500),
          brushColorVariant: 0.5,
          aspectRatio: 0.7,
          brushCanvasSize: 50,
          brushTimeFactor: 0.1
        }
      }
    };
  }

  // 薰衣草專用花朵生成 - 支援叢生模式和世界級構圖
  generateFlowers(options = {}) {
    const {
      style = 'default',
      flowerCount = 40,
      position = { x: [-100, 100], y: [-20, 20], z: [-100, 100] },
      customStyle = null,
      clusterMode = false
    } = options;

    colorMode(HSB);

    // 初始化畫刷系統
    const styleConfig = customStyle || this.getStyleConfig(style);
    this.brushManager.updateStyle(styleConfig);
    this.brushManager.initializeAllBrushes();

    // 世界級三層景深佈局
    const goldenRatio = 1.618;
    const centerX = (position.x[0] + position.x[1]) * 0.618;
    const centerZ = (position.z[0] + position.z[1]) * 0.382;
    
    if (clusterMode) {
      this._generateClusterMode(flowerCount, position, centerX, centerZ);
    } else {
      this._generateScatteredMode(flowerCount, position, centerX, centerZ);
    }
  }

  // 叢生模式：前景、中景、遠景三層分布
  _generateClusterMode(flowerCount, position, centerX, centerZ) {
    const layers = [
      { depth: 0.2, count: Math.ceil(flowerCount * 0.3), scale: 1.2, focus: true },
      { depth: 0.5, count: Math.ceil(flowerCount * 0.5), scale: 1.0, focus: true },
      { depth: 0.8, count: Math.ceil(flowerCount * 0.2), scale: 0.7, focus: false }
    ];

    layers.forEach((layer, layerIndex) => {
      const clusterCount = Math.ceil(layer.count / 4);
      
      Array.from({ length: clusterCount }).forEach((_, clusterIndex) => {
        const angle = clusterIndex * 2.399; // 黃金角137.5度
        const radius = sqrt(clusterIndex) * 80;
        
        const clusterCenter = createVector(
          centerX + cos(angle) * radius * layer.depth,
          random(position.y[0], position.y[1]) + 300 - layerIndex * 50,
          centerZ + sin(angle) * radius * layer.depth
        );

        const plantsInCluster = random(2, 6);
        Array.from({ length: plantsInCluster }).forEach(() => {
          const offset = createVector(
            random(-30, 30) * layer.scale,
            random(-10, 10),
            random(-30, 30) * layer.scale
          );
          this.generateSinglePlant(clusterCenter.copy().add(offset), layer);
        });
      });
    });
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

  // 生成單株薰衣草植物
  generateSinglePlant(pos, layerInfo = { depth: 0.5, scale: 1.0, focus: true }) {
    const plantConfig = {
      position: pos,
      scale: layerInfo.scale,
      focusLevel: layerInfo.focus ? 1.0 : map(layerInfo.depth, 0, 1, 0.8, 0.3),
      curveIntensity: map(layerInfo.depth, 0, 1, 1.5, 0.8),
      colorSaturation: map(layerInfo.depth, 0, 1, 1.0, 0.6)
    };
    
    FlowerStemGenerator.generateStem(pos, plantConfig);
  }

  // 實現薰衣草特有的花瓣邏輯
  createSpecificPetals() {
    // 薰衣草特色：密集向上內彎的花穗
    return {
      petalCount: int(random(12, 24)),  // 薰衣草花穗：12-24片密集花瓣
      vectorMultiplier: -0.8,           // 向內彎曲
      shrinkFactor: 0.995,
      petalShape: 'inward'              // 內彎形狀
    };
  }
}

// 薰衣草專用畫刷管理器
class LavenderBrushManager extends FlowerBrushManager {
  // 初始化薰衣草特有的混合畫刷
  _generateBasicMixedBrushes() {
    super._generateBasicMixedBrushes();
    
    const colorKeys = Object.keys(this.brushes);
    
    // 薰衣草特色混合
    if (colorKeys.includes('purple') && colorKeys.includes('white')) {
      this.mixedBrushes.purpleWhite = this._generateMixedBrushes(this.brushes.purple, this.brushes.white);
    }
    if (colorKeys.includes('purple') && (colorKeys.includes('black') || colorKeys.includes('shadow'))) {
      const darkColor = this.brushes.black || this.brushes.shadow;
      this.mixedBrushes.purpleDark = this._generateMixedBrushes(this.brushes.purple, darkColor);
    }
    
    // 日式風格特殊混合
    if (colorKeys.includes('sakura') && colorKeys.includes('purple')) {
      this.mixedBrushes.sakuraPurple = this._generateMixedBrushes(this.brushes.sakura, this.brushes.purple);
    }
    if (colorKeys.includes('gold') && colorKeys.includes('white')) {
      this.mixedBrushes.goldWhite = this._generateMixedBrushes(this.brushes.gold, this.brushes.white);
    }
    
    // 海洋風格特殊混合
    if (colorKeys.includes('deepBlue') && colorKeys.includes('turquoise')) {
      this.mixedBrushes.oceanBlend = this._generateMixedBrushes(this.brushes.deepBlue, this.brushes.turquoise);
    }
  }

  // 薰衣草專用花瓣畫刷選擇
  getRandomPetalBrushes() {
    const availableOptions = [];
    
    // 基本色彩選項
    if (this.brushes.purple) availableOptions.push(this.brushes.purple);
    if (this.brushes.white) availableOptions.push(this.brushes.white);
    if (this.brushes.sakura) availableOptions.push(this.brushes.sakura);
    if (this.brushes.lightBlue) availableOptions.push(this.brushes.lightBlue);
    if (this.brushes.turquoise) availableOptions.push(this.brushes.turquoise);
    if (this.brushes.celadon) availableOptions.push(this.brushes.celadon);
    if (this.brushes.deepBlue) availableOptions.push(this.brushes.deepBlue);
    
    // 混合色彩選項
    if (this.mixedBrushes.purpleWhite) availableOptions.push(this.mixedBrushes.purpleWhite);
    if (this.mixedBrushes.sakuraPurple) availableOptions.push(this.mixedBrushes.sakuraPurple);
    if (this.mixedBrushes.oceanBlend) availableOptions.push(this.mixedBrushes.oceanBlend);
    if (this.mixedBrushes.goldWhite) availableOptions.push(this.mixedBrushes.goldWhite);
    
    // 如果沒有找到合適的選項，回退到基本配色
    if (availableOptions.length === 0) {
      return this.brushes.purple || this.brushes.white || [];
    }
    
    return random(availableOptions);
  }
}

// 薰衣草專用花朵生成器
class LavenderFlowerGenerator extends BaseFlowerGenerator {
  // 薰衣草特有的花朵參數計算
  _calculateFlowerParameters(stemParticle) {
    const baseParams = super._calculateFlowerParameters(stemParticle);
    
    // 薰衣草特色調整：花穗向上且內彎
    const vc1_tilted = p5.Vector.lerp(baseParams.vc1, stemParticle.vector, random(-0.4, -0.2)).normalize();
    
    return {
      ...baseParams,
      vc1_tilted,
      petalCount: int(random(12, 24)),  // 薰衣草花穗：密集花瓣
      flowerRadius: random(15, 35),     // 較小半徑，更密集
      rotateFactor: random(0.2, 0.6)    // 較穩定的旋轉
    };
  }

  // 薰衣草特有的花瓣生成
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
        stemParticle, flowerParams, vc_final, -0.8, 0.995  // 向內彎曲
      );

      // 薰衣草花瓣動畫
      petalConfig.tick = (_this) => {
        this._applyPetalRotation(_this, flowerParams, vc_final);
      };

      sceneManager.addParticle(new Particle(petalConfig));
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
      lifespan: _r * 1.8,
      velocityShrinkFactor: 1.015,
      preDelay: flowerParams.delayFlower,
      mainGraphics: stemParticle.mainGraphics,
      color: color(0, 100, 100),
      brush: random(brushes),
      brush2: random(brushes),
      brushLerpMap: k => easeOutQuad(k),
      maxSegments: 8,
      renderType: "brushImageLerp",
      renderJitter: 1,
      brushAngleNoiseAmplitude: 0.1,
      radiusMappingFunc: (p) => {
        let _p = easeOutSine(easeOutSine(easeOutSine(p))) + noise(stemParticle.randomId, stemParticle.lifespan / 15) / 15;
        let rr = sqrt(1 - pow(map(_p, 0, 1, -1, 1), 2)) * 1.2;
        return rr;
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
const generateProvenceLavender = (options = {}) => {
  const lavender = new LavenderFlower();
  const defaultOptions = {
    flowerCount: 5,
    clusterMode: true,
    style: 'provence',
    position: { x: [-250, 250], y: [-40, 30], z: [-250, 250] }
  };
  lavender.generateFlowers({ ...defaultOptions, ...options });
};

const generateNordicLavender = (options = {}) => {
  const lavender = new LavenderFlower();
  const defaultOptions = {
    flowerCount: 5,
    clusterMode: true,
    style: 'nordic',
    position: { x: [-200, 200], y: [-30, 40], z: [-200, 200] }
  };
  lavender.generateFlowers({ ...defaultOptions, ...options });
};

const generateJapaneseLavender = (options = {}) => {
  const lavender = new LavenderFlower();
  const defaultOptions = {
    flowerCount: 5,
    clusterMode: false,
    style: 'japanese',
    position: { x: [-180, 180], y: [-25, 35], z: [-180, 180] }
  };
  lavender.generateFlowers({ ...defaultOptions, ...options });
};

const generateOceanicLavender = (options = {}) => {
  const lavender = new LavenderFlower();
  const defaultOptions = {
    flowerCount: 5,
    clusterMode: true,
    style: 'oceanic',
    position: { x: [-220, 220], y: [-35, 25], z: [-220, 220] }
  };
  lavender.generateFlowers({ ...defaultOptions, ...options });
};

// 匯出類別
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LavenderFlower,
    LavenderBrushManager,
    LavenderFlowerGenerator,
    generateProvenceLavender,
    generateNordicLavender,
    generateJapaneseLavender,
    generateOceanicLavender
  };
}

if (typeof window !== 'undefined') {
  window.LavenderFlower = LavenderFlower;
  window.LavenderBrushManager = LavenderBrushManager;
  window.LavenderFlowerGenerator = LavenderFlowerGenerator;
  window.generateProvenceLavender = generateProvenceLavender;
  window.generateNordicLavender = generateNordicLavender;
  window.generateJapaneseLavender = generateJapaneseLavender;
  window.generateOceanicLavender = generateOceanicLavender;
}