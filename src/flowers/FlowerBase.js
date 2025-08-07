// FlowerBase - 花朵系統基礎類別
// 提供所有花朵類型的通用功能和介面

class FlowerBase {
  constructor(flowerType, styleConfig) {
    this.flowerType = flowerType;
    this.brushManager = new FlowerBrushManager(styleConfig);
  }

  // 主要花朵生成函數 - 子類別可以重寫
  generateFlowers(options = {}) {
    const {
      style = 'default',
      flowerCount = 10,
      position = { x: [-100, 100], y: [-20, 20], z: [-100, 100] },
      customStyle = null
    } = options;

    colorMode(HSB);

    // 初始化畫刷系統
    const styleConfig = customStyle || this.getStyleConfig(style);
    this.brushManager.updateStyle(styleConfig);
    this.brushManager.initializeAllBrushes();

    // 批量生成植物
    Array.from({ length: flowerCount }).forEach(() => {
      this.generateSinglePlant(createVector(
        random(position.x[0], position.x[1]),
        random(position.y[0], position.y[1]) + 300,
        random(position.z[0], position.z[1])
      ));
    });
  }

  // 生成單株植物 - 子類別必須實現
  generateSinglePlant(pos) {
    throw new Error('generateSinglePlant must be implemented by subclass');
  }

  // 獲取風格配置 - 子類別必須實現
  getStyleConfig(styleName) {
    throw new Error('getStyleConfig must be implemented by subclass');
  }

  // 創建特定花瓣 - 子類別必須實現
  createSpecificPetals() {
    throw new Error('createSpecificPetals must be implemented by subclass');
  }

  // 3D向量旋轉工具函數 - 通用功能
  rotateVectorInPlane(v1, v2, v4, ang) {
    let normal = v1.cross(v2).normalize();
    let projection = v4.copy().sub(normal.copy().mult(v4.dot(normal)));
    let cosAng = cos(ang);
    let sinAng = sin(ang);
    let rotatedV4 = projection.copy().mult(cosAng).add(normal.cross(projection).mult(sinAng));
    return rotatedV4;
  }

  // 通用花瓣動畫效果
  applyPetalRotation(particle, flowerParams, vc_final) {
    let amp = 1 / pow(map(particle.lifespan / particle.originalLive, 1, 0, 3, 0.3), 2) / 10 * flowerParams.rotateFactor;
    particle.vector = this.rotateVectorInPlane(flowerParams.flowerCenterV, vc_final, particle.vector, amp);
    particle.vector = Rotation3D.rotateY(particle.vector, +sin(frameCount / 4 + particle.randomId + noise(frameCount / 3, particle.randomId)) / 30);
    particle.vector = Rotation3D.rotateZ(particle.vector, +cos(frameCount / 6 + particle.randomId + noise(frameCount / 3, particle.randomId, 50)) / 30);
    particle.vector = Rotation3D.rotateX(particle.vector, +sin(frameCount / 7 + particle.randomId + noise(frameCount / 3, particle.randomId, 500)) / 30);
    particle.vector = Rotation3D.rotateZ(particle.vector, +sin(frameCount / 50 + particle.randomId + noise(frameCount / 50, particle.randomId)) / 30);
  }
}

// 通用花朵畫刷管理器基礎類別
class FlowerBrushManager {
  constructor(styleConfig = {}) {
    this.brushes = {};
    this.mixedBrushes = {};
    this.brushConfigs = styleConfig;
  }

  // 更新風格配置
  updateStyle(styleConfig) {
    this.brushConfigs = styleConfig;
    this.brushes = {};
    this.mixedBrushes = {};
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
      // 使用 BrushSystem 創建畫刷
      if (typeof brushSystem !== 'undefined' && brushSystem.createBrush) {
        return brushSystem.createBrush(settings);
      } else {
        console.warn('[ERROR] BrushSystem not available, cannot create brush');
        return null;
      }
    });
  }

  // 生成混合畫刷
  _generateMixedBrushes(brush1, brush2, count = 5) {
    return Array.from({ length: count }).map(() =>
      mergeBrushHeads(random(brush1), random(brush2))
    );
  }

  // 初始化所有畫刷 - 基礎版本，子類別可以擴展
  initializeAllBrushes() {
    // 清空現有畫刷
    this.brushes = {};
    this.mixedBrushes = {};
    
    // 動態生成所有配置中的色彩組
    Object.keys(this.brushConfigs).forEach(colorKey => {
      if (this.brushConfigs[colorKey] && this.brushConfigs[colorKey].count) {
        this.brushes[colorKey] = this._generateBrushSet(this.brushConfigs[colorKey]);
      }
    });

    // 生成基本混合效果
    this._generateBasicMixedBrushes();
  }

  // 生成基本混合效果 - 子類別可以重寫
  _generateBasicMixedBrushes() {
    const colorKeys = Object.keys(this.brushes);
    if (colorKeys.includes('green')) {
      this.mixedBrushes.plant = this._generateMixedBrushes(this.brushes.green, this.brushes.green);
    }
  }

  // 獲取指定類型的畫刷
  getBrush(type) {
    return this.brushes[type] || [];
  }

  // 獲取混合畫刷
  getMixedBrush(type) {
    return this.mixedBrushes[type] || [];
  }

  // 獲取隨機花瓣畫刷組合 - 基礎版本，子類別可以重寫
  getRandomPetalBrushes() {
    const availableOptions = [];
    
    // 基本色彩選項
    Object.keys(this.brushes).forEach(key => {
      if (this.brushes[key] && this.brushes[key].length > 0) {
        availableOptions.push(this.brushes[key]);
      }
    });
    
    // 混合色彩選項
    Object.keys(this.mixedBrushes).forEach(key => {
      if (this.mixedBrushes[key] && this.mixedBrushes[key].length > 0) {
        availableOptions.push(this.mixedBrushes[key]);
      }
    });
    
    if (availableOptions.length === 0) {
      return [];
    }
    
    return random(availableOptions);
  }
}

// 通用花朵生成器基礎類別
class BaseFlowerGenerator {
  constructor(brushManager) {
    this.brushManager = brushManager;
  }

  // 生成花朵 - 基礎結構，子類別可以重寫
  generateFlower(stemParticle) {
    const flowerParams = this._calculateFlowerParameters(stemParticle);
    this._generatePetals(stemParticle, flowerParams);
  }

  // 計算花朵參數 - 基礎版本，子類別可以重寫
  _calculateFlowerParameters(stemParticle) {
    return {
      flowerScale: random(0.5, 0.8) / 2,
      flowerCenterV: Rotation3D.rotateRandom(stemParticle.vector.copy(), random(PI / 2) * random(0.5, 1)),
      vc1: stemParticle.vector.cross(createVector(1, 0, -stemParticle.vector.x / stemParticle.vector.z)).normalize(),
      petalCount: int(random(15, 30)),
      flowerRadius: random(25, 45),
      startAng: random(PI),
      rotateFactor: random(0.3, 1.2),
      delayFlower: 0
    };
  }

  // 生成花瓣 - 基礎版本，子類別可以重寫
  _generatePetals(stemParticle, flowerParams) {
    // 基礎花瓣生成邏輯
    console.log('Basic petal generation - should be overridden by subclass');
  }
}

// 匯出類別
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FlowerBase,
    FlowerBrushManager,
    BaseFlowerGenerator
  };
}

if (typeof window !== 'undefined') {
  window.FlowerBase = FlowerBase;
  window.FlowerBrushManager = FlowerBrushManager;
  window.BaseFlowerGenerator = BaseFlowerGenerator;
}