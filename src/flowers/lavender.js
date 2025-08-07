// 薰衣草花朵生成系統
// 流程: 風格選擇 → 粒子生成 → 花莖生長 → 花朵經放 → 花蕊生成
// 技術: 3D向量數學、柏林噪聲、粒子系統、回調鏈控制

// 載入基礎類別和薰衣草專用類別
// 注意：這些檔案需要在此檔案之前載入

// Lavender 風格管理器初始化
if (typeof LavenderStyleManager !== 'undefined') {
  if (typeof styleManager === 'undefined' || !styleManager) {
    window.styleManager = new LavenderStyleManager();
    
    // 初始化方法 - 等待 SceneManager 準備完成
    window.styleManager.initializeDefault = function() {
      // 等待 SceneManager 準備完成
      if (typeof sceneManager !== 'undefined') {
        this.switchToStyle('default');
        this.startAutoRotation();
      } else {
      }
    };
    
    // 鍵盤事件處理
    window.styleManager.handleKeyPressed = function(key, keyCode) {
      // 數字鍵 1-8 切換風格
      if (key >= '1' && key <= '8') {
        const number = parseInt(key);
        if (this.switchByNumber(number)) {
          const info = this.getCurrentStyleInfo();
        }
      } 
      // 空格鍵切換輪播
      else if (key === ' ') {
        this.toggleRotation();
        const info = this.getCurrentStyleInfo();
      }
      // 左右方向鍵切換風格
      else if (keyCode === LEFT_ARROW) {
        this.previousStyle();
        const info = this.getCurrentStyleInfo();
      }
      else if (keyCode === RIGHT_ARROW) {
        this.nextStyle();
        const info = this.getCurrentStyleInfo();
      }
    };
  }
}

// 獲取 Lavender 風格配置的函數 - 委託給 LavenderFlower
function getLavenderStyleConfig(styleName = 'default') {
  if (typeof LavenderFlower !== 'undefined') {
    const lavender = new LavenderFlower();
    return lavender.getStyleConfig(styleName);
  }
  
  // 備用配置
  return LavenderFlower._getDefaultConfig();
}

// 薰衣草實例和畫刷管理器
let lavenderFlower = null;
let brushManager = null;

// 初始化函數
function initializeLavender() {
  if (typeof LavenderFlower !== 'undefined') {
    lavenderFlower = new LavenderFlower();
    brushManager = lavenderFlower.brushManager;
  } else {
    console.warn('[SYSTEM] LavenderFlower class not found');
  }
}

// 確保 StyleManager 初始化完成後再初始化 Lavender
function waitForStyleManagerThenInitialize() {
  if (typeof window !== 'undefined' && window.styleManager) {
    initializeLavender();
  } else {
    setTimeout(waitForStyleManagerThenInitialize, 50);
  }
}

// 開始初始化程序
waitForStyleManagerThenInitialize();

// 【入口函數】主要花朵生成函數
function generateFlowers(options = {}) {
  if (!lavenderFlower) {
    initializeLavender();
    if (!lavenderFlower) {
      console.error('[SYSTEM] Failed to initialize LavenderFlower');
      return;
    }
  }
  lavenderFlower.generateFlowers(options);
}

// 3D向量數學工具函數 - 處理複雜的向量旋轉運算
function rotateVectorInPlane(v1, v2, v4, ang) {
  // 計算兩個向量定義的平面的法向量
  let normal = v1.cross(v2).normalize();

  // 將目標向量投影到該平面上
  let projection = v4.copy().sub(normal.copy().mult(v4.dot(normal)));

  // 使用羅德里格旋轉公式進行平面內旋轉
  let cosAng = cos(ang);
  let sinAng = sin(ang);
  let rotatedV4 = projection.copy().mult(cosAng).add(normal.cross(projection).mult(sinAng));

  return rotatedV4;
}

// 生成單株植物 - 委託給 FlowerStemGenerator
function generateFlowerPlant(pos, layerInfo = { depth: 0.5, scale: 1.0, focus: true }) {
  const plantConfig = {
    position: pos,
    scale: layerInfo.scale,
    focusLevel: layerInfo.focus ? 1.0 : map(layerInfo.depth, 0, 1, 0.8, 0.3),
    curveIntensity: map(layerInfo.depth, 0, 1, 1.5, 0.8),
    colorSaturation: map(layerInfo.depth, 0, 1, 1.0, 0.6)
  };
  
  FlowerStemGenerator.generateStem(pos, plantConfig);
}

// 【步驟4】花莖生成器 - 專門負責生成花朵植物的莖部
// 這是植物生長的第一階段：從根部向上長出花莖
class FlowerStemGenerator {
  // 創建世界級花莖粒子配置 - 融入S曲線和動態美學
  static createStemParticleConfig(pos, plantGrowthDirection, plantDrawingLayer, plantConfig = {}) {
    const scale = plantConfig.scale || 1.0;
    const curveIntensity = plantConfig.curveIntensity || 1.0;
    
    return {
      p: pos.copy(),                        // 起始位置
      vector: plantGrowthDirection,         // 生長方向向量
      velocityShrinkFactor: 0.998,          // 速度衰減係數
      radiusShrinkFactor: 0.997,            // 半徑衰減係數
      acceleration: createVector(0, -0.005, 0), // 重力加速度
      radius: random(15, 25) * scale,       // 根據景深調整粗細
      color: color(100, 100, 100),          // 莖部顏色
      preDelay: 0,                          // 延遲時間
      renderJitter: 3 / scale,              // 遠景減少抖動
      lifespan: random(30, 200) * scale,    // 根據景深調整長度
      mainGraphics: plantDrawingLayer.graphics,
      maxSegments: Math.ceil(12 * scale),   // 景深影響細節度
      brush: random(brushManager.getMixedBrush('plant')),
      brush2: random(brushManager.getMixedBrush('plant')),
      renderType: "brushImageLerp",
      speedLimit: 3,
      isBrushRotateFollowVelocity: true,
      plantConfig: plantConfig,             // 傳遞構圖配置
      curvePhase: random(TWO_PI),           // S曲線相位
      curveAmplitude: curveIntensity * random(0.3, 0.8), // S曲線幅度

      // 花莖生長完畢時生成花穗
      endCallback: (_this) => {
        const spikeCount = int(random(8, 15));
        const totalStemLength = _this.originalLive;

        for (let i = 0; i < spikeCount; i++) {
          const progressRatio = i / Math.max(spikeCount - 1, 1);
          const stemProgress = 0.6 + progressRatio * 0.4;
          const heightOffset = totalStemLength * (1 - stemProgress);
          const randomOffset = random(-0.02, 0.02) * totalStemLength;

          const stemDirection = _this.vector.copy().normalize();
          const offsetPosition = stemDirection.copy().mult(heightOffset + randomOffset);

          const offsetParticle = {
            ..._this,
            p: _this.p.copy().add(offsetPosition)
          };

          setTimeout(() => {
            flowerGenerator.generateFlower(offsetParticle);
          }, i * 60 + random(-15, 15));
        }
      },

      // S曲線生長和風動效果
      tick: (_this) => {
        const progress = 1 - (_this.lifespan / _this.originalLive);
        const sCurveOffset = sin(_this.curvePhase + progress * PI) * _this.curveAmplitude;
        
        _this.vector.x += sCurveOffset * 0.02;
        _this.vector.z += cos(_this.curvePhase + progress * PI) * _this.curveAmplitude * 0.01;
        
        const windStrength = plantConfig.scale || 1.0;
        _this.p.x += map(noise(_this.randomId, frameCount / 40), 0, 1, -0.8, 0.8) * windStrength;
        _this.p.y += map(noise(frameCount / 60, _this.randomId, 1500), 0, 1, -0.2, 0.2) * 0.3;
        _this.p.z += map(noise(1500, _this.randomId, frameCount / 45), 0, 1, -0.8, 0.8) * windStrength;
        
        const groupWave = sin(frameCount / 30 + _this.p.x * 0.01) * 0.3;
        _this.p.x += groupWave;
        
        if (_this.r < 0.01) _this.r = 0;
      }
    };
  }

  // 生成花莖
  static generateStem(pos, plantConfig = {}) {
    colorMode(HSB);

    // 計算植物生長方向
    let plantGrowthDirection = Rotation3D.rotateRandom(
      createVector(0, -random(0.9, 1) - 1, 0),
      random(radians(35))
    );

    // 選擇繪製圖層
    let plantDrawingLayer = layerSystem.getRandomLayer(0);

    // 創建花莖粒子配置並加入場景
    const particleConfig = this.createStemParticleConfig(pos, plantGrowthDirection, plantDrawingLayer, plantConfig);
    sceneManager.addParticle(new Particle(particleConfig));
  }
}


// 花朵生成器適配器 - 委託給 LavenderFlowerGenerator
class FlowerGenerator {
  constructor() {
    // 延遲初始化真正的生成器
    this.actualGenerator = null;
  }

  // 確保真正的生成器已初始化
  _ensureGenerator() {
    if (!this.actualGenerator && typeof LavenderFlowerGenerator !== 'undefined' && brushManager) {
      this.actualGenerator = new LavenderFlowerGenerator(brushManager);
    }
  }

  // 生成花朵 - 委託給真正的生成器
  generateFlower(stemParticle) {
    this._ensureGenerator();
    if (this.actualGenerator) {
      this.actualGenerator.generateFlower(stemParticle);
    } else {
      console.warn('[SYSTEM] LavenderFlowerGenerator not available');
    }
  }
}

// 全域花朵生成器實例
const flowerGenerator = new FlowerGenerator();



// 匯出主要函數和類別供外部使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateFlowers,
    getLavenderStyleConfig,
    FlowerStemGenerator
  };
}

if (typeof window !== 'undefined') {
  window.FlowerStemGenerator = FlowerStemGenerator;
}