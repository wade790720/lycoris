// 彼岸花生成系統
// 流程: 風格選擇 → 粒子生成 → 花莖生長 → 花朵經放 → 花蕊生成 → 花粉效果
// 技術: 3D向量數學、柏林噪聲、粒子系統、回調鏈控制

// 載入基礎類別和彼岸花專用類別
// 注意：這些檔案需要在此檔案之前載入

// Lycoris 風格管理器初始化
if (typeof LycorisStyleManager !== 'undefined') {
  if (typeof styleManager === 'undefined' || !styleManager) {
    window.styleManager = new LycorisStyleManager();
    console.log('[SYSTEM] LycorisStyleManager loaded and registered');
    
    // 添加初始化方法
    window.styleManager.initializeDefault = function() {
      this.switchToStyle('default');
      this.startAutoRotation();
      console.log('[LIFECYCLE] LycorisStyleManager initialized with default style and auto-rotation enabled');
    };
    
    // 添加鍵盤事件處理方法
    window.styleManager.handleKeyPressed = function(key, keyCode) {
      // 🎨 統一風格切換鍵位（1-8 數字鍵）
      if (key >= '1' && key <= '8') {
        const number = parseInt(key);
        if (this.switchByNumber(number)) {
          const info = this.getCurrentStyleInfo();
          console.log('[LIFECYCLE] Style switched by number key', number, ':', info.displayName);
        }
      } 
      // 空格鍵：暫停/恢復自動輪播
      else if (key === ' ') {
        this.toggleRotation();
        const info = this.getCurrentStyleInfo();
        console.log('[LIFECYCLE] Auto-rotation toggled:', info.isRotating ? 'resumed' : 'paused', '- current style:', info.displayName);
      }
      // 左右方向鍵：手動切換風格
      else if (keyCode === LEFT_ARROW) {
        this.previousStyle();
        const info = this.getCurrentStyleInfo();
        console.log('[LIFECYCLE] Style switched to previous:', info.displayName);
      }
      else if (keyCode === RIGHT_ARROW) {
        this.nextStyle();
        const info = this.getCurrentStyleInfo();
        console.log('[LIFECYCLE] Style switched to next:', info.displayName);
      }
    };
  }
}

// 獲取彼岸花風格配置 - 委託給 LycorisFlower
function getLycorisStyleConfig(styleName = 'default') {
  if (typeof LycorisFlower !== 'undefined') {
    const lycoris = new LycorisFlower();
    return lycoris.getStyleConfig(styleName);
  }
  
  return LycorisFlower._getDefaultConfig();
}

// 彼岸花實例和畫刷管理器
let lycorisFlower = null;
let brushManager = null;

// 初始化函數
function initializeLycoris() {
  if (typeof LycorisFlower !== 'undefined') {
    lycorisFlower = new LycorisFlower();
    brushManager = lycorisFlower.brushManager;
    console.log('[SYSTEM] LycorisFlower initialized');
  } else {
    console.warn('[SYSTEM] LycorisFlower class not found');
  }
}

// 確保 StyleManager 初始化完成後再初始化 Lycoris
function waitForStyleManagerThenInitialize() {
  if (typeof window !== 'undefined' && window.styleManager) {
    initializeLycoris();
  } else {
    setTimeout(waitForStyleManagerThenInitialize, 50);
  }
}

// 開始初始化程序
waitForStyleManagerThenInitialize();

// 主花朵生成函數
function generateFlowers(options = {}) {
  if (!lycorisFlower) {
    initializeLycoris();
    if (!lycorisFlower) {
      console.error('[SYSTEM] Failed to initialize LycorisFlower');
      return;
    }
  }
  lycorisFlower.generateFlowers(options);
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
function generateFlowerPlant(pos) {
  FlowerStemGenerator.generateStem(pos);
}

// 花莖生成器
class FlowerStemGenerator {
  // 創建花莖粒子配置
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
      brush: random(brushManager.getMixedBrush('plant')),
      brush2: random(brushManager.getMixedBrush('plant')),
      renderType: "brushImageLerp",
      speedLimit: 5,
      isBrushRotateFollowVelocity: true,

      // 花莖生長完畢時生成花朵
      endCallback: (_this) => {
        flowerGenerator.generateFlower(_this);
      },

      // 風動效果
      tick: (_this) => {
        _this.p.x += map(noise(_this.randomId, frameCount / 30), 0, 1, -1, 1) * 1.1;
        _this.p.y += map(noise(frameCount / 30, _this.randomId, 1000), 0, 1, -1, 1) * 1.1;
        _this.p.z += map(noise(1000, _this.randomId, frameCount / 30), 0, 1, -1, 1) * 1.1;
        if (_this.r < 0.01) _this.r = 0;
      }
    };
  }

  // 生成花莖
  static generateStem(pos) {
    colorMode(HSB);

    // 計算植物生長方向
    let plantGrowthDirection = Rotation3D.rotateRandom(
      createVector(0, -random(0.9, 1) - 1, 0),
      random(PI / 2)
    );

    // 選擇繪製圖層
    let plantDrawingLayer = layerSystem.getRandomLayer(0);

    // 創建花莖粒子配置並加入場景
    const particleConfig = this.createStemParticleConfig(pos, plantGrowthDirection, plantDrawingLayer);
    sceneManager.addParticle(new Particle(particleConfig));
  }
}


// 花朵生成器適配器 - 委託給 LycorisFlowerGenerator
class FlowerGenerator {
  constructor() {
    // 延遲初始化真正的生成器
    this.actualGenerator = null;
  }

  // 確保真正的生成器已初始化
  _ensureGenerator() {
    if (!this.actualGenerator && typeof LycorisFlowerGenerator !== 'undefined' && brushManager) {
      this.actualGenerator = new LycorisFlowerGenerator(brushManager);
    }
  }

  // 生成花朵
  generateFlower(stemParticle) {
    this._ensureGenerator();
    if (this.actualGenerator) {
      this.actualGenerator.generateFlower(stemParticle);
      this.actualGenerator._generateStamens(stemParticle, 
        this.actualGenerator._calculateFlowerParameters(stemParticle));
    } else {
      console.warn('[SYSTEM] LycorisFlowerGenerator not available');
    }
  }
}

// 全域花朵生成器實例
const flowerGenerator = new FlowerGenerator();

// 花朵結尾效果生成器
class FlowerEndGenerator {
  generateFlowerEnd(stamenParticle) {
    const pollenRadius = random(4, 8);
    const yellowBrushes = brushManager.getBrush('yellow');

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
      brush: random(yellowBrushes),
      brush2: random(yellowBrushes),
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
const flowerEndGenerator = new FlowerEndGenerator();


// 匯出主要函數和類別供外部使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateFlowers,
    getLycorisStyleConfig,
    FlowerStemGenerator,
    FlowerEndGenerator
  };
}

if (typeof window !== 'undefined') {
  window.FlowerStemGenerator = FlowerStemGenerator;
  window.FlowerEndGenerator = FlowerEndGenerator;
}