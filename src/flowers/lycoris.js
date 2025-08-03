/*
=== 彼岸花(Lycoris)生成系統 - 從0到1生成植物的完整流程 ===

【整體流程概述】
1. 調用 generateFlowers() → 選擇風格、初始化畫刷系統
2. 批量生成植物 → 為每株植物分配3D空間位置
3. 生成花莖 → 從底部向上生長，模擬自然生長過程
4. 花莖完成後 → 自動觸發花朵生成
5. 生成花瓣 → 外層較大的花瓣，環形排列
6. 生成花蕊 → 內層較細長的雄蕊雌蕊
7. 花蕊完成後 → 在頂端生成黃色花粉效果

【技術特色】
- 使用粒子系統模擬生長動畫
- 3D向量數學計算自然的花瓣排列
- 柏林噪聲模擬風吹搖擺效果
- 畫刷系統提供藝術風格的視覺效果
- 回調鏈確保生長順序的自然性

【使用方式】
- generateFlowers() // 生成預設風格花朵
- generateLycorisFlowers() // 經典彼岸花風格
- generateGothicFlowers() // 哥德暗黑風格  
- generateInkFlowers() // 中國水墨風格
*/

// 初始化 Lycoris 風格管理器 (僅在 index.html 中使用)
if (typeof LycorisStyleManager !== 'undefined') {
  if (typeof styleManager === 'undefined' || !styleManager) {
    window.styleManager = new LycorisStyleManager();
    console.log('🌺 載入 Lycoris 風格管理器');
    
    // 添加初始化方法
    window.styleManager.initializeDefault = function() {
      this.switchToStyle('original');
      this.startAutoRotation();
      console.log('🌺 Lycoris 風格管理器初始化完成');
    };
    
    // 添加鍵盤事件處理方法
    window.styleManager.handleKeyPressed = function(key, keyCode) {
      // 🎨 統一風格切換鍵位（1-8 數字鍵）
      if (key >= '1' && key <= '8') {
        const number = parseInt(key);
        if (this.switchByNumber(number)) {
          const info = this.getCurrentStyleInfo();
          console.log(`🎨 切換風格: ${info.displayName}`);
        }
      } 
      // 空格鍵：暫停/恢復自動輪播
      else if (key === ' ') {
        this.toggleRotation();
        const info = this.getCurrentStyleInfo();
        console.log(`${info.isRotating ? '▶️ 恢復' : '⏸️ 暫停'}自動輪播`);
      }
      // 左右方向鍵：手動切換風格
      else if (keyCode === LEFT_ARROW) {
        this.previousStyle();
        const info = this.getCurrentStyleInfo();
        console.log(`⬅️ 上一個風格: ${info.displayName}`);
      }
      else if (keyCode === RIGHT_ARROW) {
        this.nextStyle();
        const info = this.getCurrentStyleInfo();
        console.log(`➡️ 下一個風格: ${info.displayName}`);
      }
    };
  }
}

// 獲取 Lycoris 風格配置的函數
function getLycorisStyleConfig(styleName = 'original') {
  // 嘗試從 LycorisStyleManager 獲取配置
  if (typeof window !== 'undefined' && window.LycorisStyleManager) {
    const styleManager = new window.LycorisStyleManager();
    const styles = styleManager.styles;
    return styles[styleName]?.config || styles.original?.config;
  }
  
  // 如果沒有 StyleManager，使用預設配置
  return getDefaultLycorisConfig();
}

// 預設 Lycoris 配置（備用）
function getDefaultLycorisConfig() {
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

// 花朵繪製相關的畫刷管理器
class FlowerBrushManager {
  constructor(styleConfig = getLycorisStyleConfig('original')) {
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

// 全域畫刷管理器實例
let brushManager = new FlowerBrushManager();

// 將 FlowerBrushManager 暴露到全域作用域供 StyleManager 使用（用不同名稱避免衝突）
if (typeof window !== 'undefined') {
  window.LycorisBrushManager = FlowerBrushManager;
}

// 【入口函數】主要花朵生成函數 - 支援動態風格配置
// 這是生成植物的起始點，從這裡開始整個生成流程
function generateFlowers(options = {}) {
  const {
    style = 'default',           // 選擇風格：default(經典彼岸花)、gothic(哥德風)、ink(水墨風)
    flowerCount = 10,            // 要生成幾朵花
    position = { x: [-100, 100], y: [-20, 20], z: [-100, 100] }, // 3D空間位置範圍
    customStyle = null           // 自定義風格配置
  } = options;

  colorMode(HSB);               // 設定為HSB色彩模式(色相/飽和度/亮度)

  // 【步驟1】初始化畫刷系統 - 根據選定風格準備所有繪圖工具
  const styleConfig = customStyle || getLycorisStyleConfig(style);
  brushManager.updateStyle(styleConfig);    // 更新風格配置
  brushManager.initializeAllBrushes();      // 生成各種顏色的畫刷集合

  // 【步驟2】批量生成植物 - 在指定範圍內隨機生成多株植物
  Array.from({ length: flowerCount }).forEach(() => {
    // 為每株植物分配一個隨機的3D位置
    generateFlowerPlant(createVector(
      random(position.x[0], position.x[1]),     // X軸位置
      random(position.y[0], position.y[1]) + 300, // Y軸位置(+300讓花朵從底部開始)
      random(position.z[0], position.z[1])      // Z軸位置
    ));
  });
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

// 【步驟3】生成單株植物 - 從指定位置開始生長一株完整的植物
// 這是每株植物的生成起點，會啟動花莖的生長過程
function generateFlowerPlant(pos) {
  // 調用花莖生成器，開始從底部向上生長花莖
  FlowerStemGenerator.generateStem(pos);
}

// 【步驟4】花莖生成器 - 專門負責生成花朵植物的莖部
// 這是植物生長的第一階段：從根部向上長出花莖
class FlowerStemGenerator {
  // 創建花莖粒子的基本屬性配置 - 定義花莖如何生長
  static createStemParticleConfig(pos, plantGrowthDirection, plantDrawingLayer) {
    return {
      p: pos.copy(),                        // 起始位置
      vector: plantGrowthDirection,         // 生長方向向量
      velocityShrinkFactor: 0.995,          // 速度衰減係數(讓莖部漸漸變細)
      radiusShrinkFactor: 0.995,            // 半徑衰減係數(讓莖部漸漸變細)
      acceleration: createVector(0, -0.01, 0), // 重力加速度
      radius: random(15, 25),               // 莖部粗細
      color: color(100, 100, 100),          // 莖部顏色
      preDelay: 0,                          // 延遲時間
      renderJitter: 5,                      // 繪製時的隨機抖動
      lifespan: random(40, 250),            // 生長時間(決定莖部長度)
      mainGraphics: plantDrawingLayer.graphics, // 繪製圖層
      maxSegments: 10,                      // 最大線段數
      brush: random(brushManager.getMixedBrush('plant')),  // 主要畫刷(綠色系)
      brush2: random(brushManager.getMixedBrush('plant')), // 次要畫刷(用於混合效果)
      renderType: "brushImageLerp",         // 渲染類型(畫刷混合)
      speedLimit: 5,                        // 速度限制
      isBrushRotateFollowVelocity: true,    // 畫刷是否跟隨運動方向旋轉

      // 【關鍵回調】當花莖生長完畢時，自動觸發花朵生成
      endCallback: (_this) => {
        flowerGenerator.generateFlower(_this); // 在莖部頂端生成花朵
      },

      // 【動畫效果】每幀更新時執行的函數 - 讓莖部有自然搖擺
      tick: (_this) => {
        // 使用柏林噪聲(Perlin Noise)模擬風吹效果
        _this.p.x += map(noise(_this.randomId, frameCount / 30), 0, 1, -1, 1) * 1.1;     // X軸搖擺
        _this.p.y += map(noise(frameCount / 30, _this.randomId, 1000), 0, 1, -1, 1) * 1.1; // Y軸搖擺
        _this.p.z += map(noise(1000, _this.randomId, frameCount / 30), 0, 1, -1, 1) * 1.1; // Z軸搖擺
        if (_this.r < 0.01) _this.r = 0;    // 防止半徑變成負數
      }
    };
  }

  // 【步驟4.1】生成花莖主體 - 建立花莖粒子並開始生長動畫
  static generateStem(pos) {
    colorMode(HSB);

    // 計算植物生長方向 - 主要向上，但加入隨機傾斜讓植物更自然
    let plantGrowthDirection = Rotation3D.rotateRandom(
      createVector(0, -random(0.9, 1) - 1, 0),  // 基礎向上向量
      random(PI / 2)                              // 隨機傾斜角度
    );

    // 選擇繪製圖層
    let plantDrawingLayer = layerSystem.getRandomLayer(0);

    // 創建花莖粒子配置並加入場景
    const particleConfig = this.createStemParticleConfig(pos, plantGrowthDirection, plantDrawingLayer);
    sceneManager.addParticle(new Particle(particleConfig)); // 開始生長動畫
  }
}


// 【步驟5】花朵生成器 - 專門負責花瓣和花蕊的生成邏輯
// 當花莖生長完畢後，這個類負責在莖部頂端綻放出美麗的花朵
class FlowerGenerator {
  // 【步驟5.1】生成花朵的主要函數 - 花莖生長完成後的回調函數
  generateFlower(stemParticle) {
    console.log(stemParticle);

    // 計算花朵的基本幾何參數(大小、方向、花瓣數量等)
    const flowerParams = this._calculateFlowerParameters(stemParticle);

    // 【步驟5.2】先生成外層花瓣 - 較大較明顯的花瓣
    this._generatePetals(stemParticle, flowerParams);

    // 【步驟5.3】再生成內層花蕊 - 較細長的雄蕊和雌蕊
    this._generateStamens(stemParticle, flowerParams);
  }

  // 【步驟5.1.1】計算花朵的基本參數 - 將複雜的3D數學運算集中管理
  _calculateFlowerParameters(stemParticle) {
    // 隨機決定花朵的整體大小比例
    const flowerScale = random(0.5, 0.8) / 2;

    // 計算花朵中心的生長方向(相對於莖部有隨機傾斜)
    const flowerCenterV = Rotation3D.rotateRandom(stemParticle.vector.copy(), random(PI / 2) * random(0.5, 1));

    // 【重要】計算花瓣的基準向量 - 定義花瓣在3D空間中的排列方向
    const vc1 = stemParticle.vector.cross(createVector(1, 0, -stemParticle.vector.x / stemParticle.vector.z)).normalize();
    const vc1_tilted = p5.Vector.lerp(vc1, stemParticle.vector, random(0.3, 0.5)).normalize();

    return {
      flowerScale,                      // 花朵整體縮放比例
      flowerCenterV,                    // 花朵中心方向向量
      vc1,                              // 花瓣基準方向
      vc1_tilted,                       // 傾斜後的花瓣方向
      petalCount: int(random(20, 40)),  // 花瓣數量(彼岸花特色：細長花瓣)
      flowerRadius: random(30, 50),     // 花朵半徑
      startAng: random(PI),             // 起始角度(讓每朵花朝向不同)
      rotateFactor: random(0.3, 1.2),   // 旋轉因子(影響花瓣搖擺幅度)
      delayFlower: 0                    // 花朵生成延遲時間
    };
  }

  // 【步驟5.2】生成花瓣 - 外層較大較明顯的花瓣
  _generatePetals(stemParticle, flowerParams) {
    // 環形排列生成所有花瓣(彼岸花通常有20-40片細長花瓣)
    for (let i = 0; i < flowerParams.petalCount; i++) {
      // 【重要】計算每片花瓣的3D方向向量
      const vc_final = Rotation3D.rotateRandom(
        Rotation3D.rotateAroundAxis(
          flowerParams.vc1_tilted,                                    // 基準方向
          stemParticle.vector,                                        // 旋轉軸(莖部方向)
          flowerParams.startAng + i / flowerParams.petalCount * 2 * PI // 環形分布角度
        ),
        random(PI / 3)                                                // 隨機傾斜(讓花瓣自然散開)
      );

      // 創建花瓣粒子的配置參數
      const petalConfig = this._createPetalParticleConfig(
        stemParticle, flowerParams, vc_final, 1.2, 0.995
      );

      // 【花瓣動畫】添加花瓣特有的動態旋轉效果 - 模擬在風中搖擺
      petalConfig.tick = (_this) => {
        this._applyPetalRotation(_this, flowerParams, vc_final);
      };

      // 將花瓣粒子加入場景開始動畫
      sceneManager.addParticle(new Particle(petalConfig));
    }
  }

  // 【步驟5.3】生成花蕊 - 內層較細長的雄蕊和雌蕊結構
  _generateStamens(stemParticle, flowerParams) {
    const stamenRadius = random(30, 40);   // 花蕊長度
    const stamenCount = random(35, 40);    // 花蕊數量(通常比花瓣稍多)

    // 環形排列生成所有花蕊
    for (let i = 0; i < stamenCount; i++) {
      // 計算花蕊方向 - 相比花瓣更向內彎曲
      const vc1_tilted = p5.Vector.lerp(flowerParams.vc1, stemParticle.vector, -random(0.00, 0.21)).normalize();
      const vc_final = Rotation3D.rotateAroundAxis(
        vc1_tilted,                                           // 向內彎曲的基準方向
        stemParticle.vector,                                  // 旋轉軸
        flowerParams.startAng + i / stamenCount * 2 * PI      // 環形分布
      );

      // 創建花蕊粒子配置
      const stamenConfig = this._createStamenParticleConfig(
        stemParticle, flowerParams, vc_final, stamenRadius
      );

      // 將花蕊粒子加入場景開始動畫
      sceneManager.addParticle(new Particle(stamenConfig));
    }
  }

  // 創建花瓣粒子配置
  _createPetalParticleConfig(stemParticle, flowerParams, vc_final, vectorMultiplier, shrinkFactor) {
    const _r = flowerParams.flowerRadius * flowerParams.flowerScale;
    const brushes = brushManager.getRandomPetalBrushes();

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
    const brushes = brushManager.getRandomPetalBrushes();

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
      // 【步驟6】當花蕊生長完畢時，在頂端生成花粉效果
      endCallback: (_this) => {
        flowerEndGenerator.generateFlowerEnd(_this);  // 生成黃色花粉粒子
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
const flowerGenerator = new FlowerGenerator();

// 【步驟6】花朵結尾效果生成器 - 負責花蕊末端的黃色花粉效果
// 這是植物生成的最後階段：在花蕊頂端綻放出金黃色的花粉
class FlowerEndGenerator {
  generateFlowerEnd(stamenParticle) {
    const pollenRadius = random(4, 8);         // 花粉粒子大小
    const yellowBrushes = brushManager.getBrush('yellow'); // 使用黃色畫刷

    const pollenConfig = {
      p: stamenParticle.p.copy(),              // 從花蕊頂端位置開始
      radius: pollenRadius,                    // 花粉粒子半徑
      vector: Rotation3D.rotateRandom(         // 花粉散布方向(隨機向四周飄散)
        stamenParticle.vector.copy().normalize().mult(random(0.8, 1)),
        random(-1, 1) * PI
      ),
      radiusShrinkFactor: 0.98,                // 花粉逐漸變小
      lifespan: pollenRadius * 2.5,            // 花粉持續時間
      velocityShrinkFactor: 0.9,               // 速度逐漸減慢
      preDelay: 0,                             // 無延遲
      mainGraphics: stamenParticle.mainGraphics,
      color: color(50, 100, 100),              // 亮黃色(HSB色彩)
      brush: random(yellowBrushes),            // 隨機選擇黃色畫刷
      brush2: random(yellowBrushes),
      brushLerpMap: k => k,
      maxSegments: 5,
      renderType: "brushImageLerp",
      radiusMappingFunc: (p) => {
        // 花粉粒子的大小變化曲線 - 先變大再變小，模擬真實花粉
        let _p = easeInOutQuad(p);
        let rr = sqrt(1 - pow(map(_p, 0, 1, -1, 1), 2));
        return rr;
      }
    };

    // 【完成】將花粉粒子加入場景，植物生成流程至此完成！
    sceneManager.addParticle(new Particle(pollenConfig));
  }
}

// 全域花朵結尾效果生成器實例
const flowerEndGenerator = new FlowerEndGenerator();

// 【便利函數】快速生成不同風格的花朵 - 封裝了常用的風格配置
const generateLycorisFlowers = (options = {}) => generateFlowers({ ...options, style: 'default' }); // 經典彼岸花
const generateGothicFlowers = (options = {}) => generateFlowers({ ...options, style: 'gothic' });   // 哥德暗黑風
const generateInkFlowers = (options = {}) => generateFlowers({ ...options, style: 'ink' });         // 中國水墨風

// 匯出主要函數和類別供外部使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateFlowers,
    generateLycorisFlowers,
    generateGothicFlowers,
    generateInkFlowers,
    FlowerBrushManager,
    getLycorisStyleConfig
  };
}