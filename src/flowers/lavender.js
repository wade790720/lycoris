// 薰衣草花朵生成系統
// 流程: 風格選擇 → 粒子生成 → 花莖生長 → 花朵經放 → 花蕊生成
// 技術: 3D向量數學、柏林噪聲、粒子系統、回調鏈控制

// Lavender 風格管理器初始化
if (typeof LavenderStyleManager !== 'undefined') {
  if (typeof styleManager === 'undefined' || !styleManager) {
    window.styleManager = new LavenderStyleManager();
    console.log('[SYSTEM] LavenderStyleManager loaded and registered');
    
    // 初始化方法 - 等待 SceneManager 準備完成
    window.styleManager.initializeDefault = function() {
      // 等待 SceneManager 準備完成
      if (typeof sceneManager !== 'undefined') {
        this.switchToStyle('default');
        this.startAutoRotation();
        console.log('[LIFECYCLE] LavenderStyleManager initialized with default style and auto-rotation enabled');
      } else {
        console.log('[SYSTEM] Deferring LavenderStyleManager initialization until SceneManager is ready');
      }
    };
    
    // 鍵盤事件處理
    window.styleManager.handleKeyPressed = function(key, keyCode) {
      // 數字鍵 1-8 切換風格
      if (key >= '1' && key <= '8') {
        const number = parseInt(key);
        if (this.switchByNumber(number)) {
          const info = this.getCurrentStyleInfo();
          console.log('[LIFECYCLE] Style switched by number key', number, ':', info.displayName);
        }
      } 
      // 空格鍵切換輪播
      else if (key === ' ') {
        this.toggleRotation();
        const info = this.getCurrentStyleInfo();
        console.log('[LIFECYCLE] Auto-rotation toggled:', info.isRotating ? 'resumed' : 'paused', '- current style:', info.displayName);
      }
      // 左右方向鍵切換風格
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

// 獲取 Lavender 風格配置的函數
function getLavenderStyleConfig(styleName = 'default') {
  // 嘗試從 LavenderStyleManager 獲取配置
  if (typeof window !== 'undefined' && window.LavenderStyleManager) {
    const styleManager = new window.LavenderStyleManager();
    const styles = styleManager.styles;
    return styles[styleName]?.config || styles.default?.config;
  }
  
  // 如果沒有 StyleManager，使用預設配置
  return getDefaultLavenderConfig();
}

// 預設 Lavender 配置（備用）
function getDefaultLavenderConfig() {
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

// 花朵繪製相關的畫刷管理器
class FlowerBrushManager {
  constructor(styleConfig = getLavenderStyleConfig('default')) {
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

  // 初始化所有畫刷 - 支持動態色彩系統
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

    // 生成智能混合效果 - 根據可用色彩自動組合
    const colorKeys = Object.keys(this.brushes);
    if (colorKeys.includes('purple') && colorKeys.includes('white')) {
      this.mixedBrushes.purpleWhite = this._generateMixedBrushes(this.brushes.purple, this.brushes.white);
    }
    if (colorKeys.includes('purple') && (colorKeys.includes('black') || colorKeys.includes('shadow'))) {
      const darkColor = this.brushes.black || this.brushes.shadow;
      this.mixedBrushes.purpleDark = this._generateMixedBrushes(this.brushes.purple, darkColor);
    }
    if (colorKeys.includes('green')) {
      this.mixedBrushes.plant = this._generateMixedBrushes(this.brushes.green, this.brushes.green);
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

  // 獲取指定類型的畫刷
  getBrush(type) {
    return this.brushes[type] || [];
  }

  // 獲取混合畫刷
  getMixedBrush(type) {
    return this.mixedBrushes[type] || [];
  }

  // 獲取隨機花瓣畫刷組合 - 智能選擇最佳配色
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
// 全域畫刷管理器實例
let brushManager = new FlowerBrushManager();

// 【入口函數】主要花朵生成函數 - 支援動態風格配置
// 這是生成植物的起始點，從這裡開始整個生成流程
function generateFlowers(options = {}) {
  const {
    style = 'default',           // 選擇風格：default(經典彼岸花)、gothic(哥德風)、ink(水墨風)
    flowerCount = 40,            // 要生成幾朵花
    position = { x: [-100, 100], y: [-20, 20], z: [-100, 100] }, 
    customStyle = null,           // 自定義風格配置
    clusterMode = false           // 叢生模式
  } = options;

  colorMode(HSB);               // 設定為HSB色彩模式(色相/飽和度/亮度)

  // 【步驟1】初始化畫刷系統 - 根據選定風格準備所有繪圖工具
  const styleConfig = customStyle || getLavenderStyleConfig(style);
  brushManager.updateStyle(styleConfig);    // 更新風格配置
  brushManager.initializeAllBrushes();

  // 【步驟2】黃金比例構圖系統 - 世界級三層景深佈局
  const goldenRatio = 1.618;
  const centerX = (position.x[0] + position.x[1]) * 0.618; // 黃金分割點
  const centerZ = (position.z[0] + position.z[1]) * 0.382;
  
  if (clusterMode) {
    // 世界級叢生模式：前景、中景、遠景三層分布
    const layers = [
      { depth: 0.2, count: Math.ceil(flowerCount * 0.3), scale: 1.2, focus: true },   // 前景層 - 大而清晰
      { depth: 0.5, count: Math.ceil(flowerCount * 0.5), scale: 1.0, focus: true },   // 中景層 - 主要視覺焦點
      { depth: 0.8, count: Math.ceil(flowerCount * 0.2), scale: 0.7, focus: false }   // 遠景層 - 小而模糊
    ];

    layers.forEach((layer, layerIndex) => {
      const clusterCount = Math.ceil(layer.count / 4);
      
      Array.from({ length: clusterCount }).forEach((_, clusterIndex) => {
        // 使用螺旋黃金比例分布叢群
        const angle = clusterIndex * 2.399; // 黃金角137.5度
        const radius = sqrt(clusterIndex) * 80;
        
        const clusterCenter = createVector(
          centerX + cos(angle) * radius * layer.depth,
          random(position.y[0], position.y[1]) + 300 - layerIndex * 50, // 高度層次
          centerZ + sin(angle) * radius * layer.depth
        );

        // 每個叢群內的植物分布
        const plantsInCluster = random(2, 6);
        Array.from({ length: plantsInCluster }).forEach(() => {
          const offset = createVector(
            random(-30, 30) * layer.scale,
            random(-10, 10),
            random(-30, 30) * layer.scale
          );
          generateFlowerPlant(clusterCenter.copy().add(offset), layer);
        });
      });
    });
  } else {
    // 散佈模式：使用斐波那契螺旋分布
    console.log('[RENDER] Using Fibonacci spiral distribution pattern');
    Array.from({ length: flowerCount }).forEach((_, i) => {
      const angle = i * 2.399; // 黃金角
      const radius = sqrt(i) * 25;
      
      // 創建自然的景深層次
      const layerDepth = (sin(angle * 0.5) + 1) * 0.5; // 0-1的深度值
      const scale = map(layerDepth, 0, 1, 0.6, 1.2);
      
      const plantPos = createVector(
        centerX + cos(angle) * radius,
        random(position.y[0], position.y[1]) + 300 - layerDepth * 60,
        centerZ + sin(angle) * radius
      );
      
      generateFlowerPlant(plantPos, { 
        depth: layerDepth, 
        scale: scale, 
        focus: layerDepth < 0.7 
      });
    });
  }
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

// 【步驟3】生成單株植物 - 世界級構圖的植物生成系統
// 每株植物根據其在構圖中的角色（前景/中景/遠景）採用不同的生長策略
function generateFlowerPlant(pos, layerInfo = { depth: 0.5, scale: 1.0, focus: true }) {
  // 根據景深調整植物特性
  const plantConfig = {
    position: pos,
    scale: layerInfo.scale,
    focusLevel: layerInfo.focus ? 1.0 : map(layerInfo.depth, 0, 1, 0.8, 0.3),
    curveIntensity: map(layerInfo.depth, 0, 1, 1.5, 0.8), // 前景更多曲線
    colorSaturation: map(layerInfo.depth, 0, 1, 1.0, 0.6) // 前景色彩更飽和
  };
  
  // 調用增強版花莖生成器
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

      // 【關鍵回調】當花莖生長完畢時，生成70%-100%區間的花穗
      endCallback: (_this) => {
        // 薰衣草特色：密集的花穗分布，創造蓬鬆優雅的效果
        const spikeCount = int(random(8, 15)); // 增加花穗數量：8-15個
        const totalStemLength = _this.originalLive; // 莖部總長度

        for (let i = 0; i < spikeCount; i++) {
          // 計算花穗在60%-100%區間的密集分布（擴展分布範圍）
          const progressRatio = i / Math.max(spikeCount - 1, 1); // 0到1的比例
          const stemProgress = 0.6 + progressRatio * 0.4; // 60%到100%的分布
          const heightOffset = totalStemLength * (1 - stemProgress); // 從頂端向下的偏移
          
          // 添加輕微的隨機偏移，讓花穗分布更自然
          const randomOffset = random(-0.02, 0.02) * totalStemLength;

          // 為每個花穗創建沿莖部實際生長方向的位置
          const stemDirection = _this.vector.copy().normalize(); // 莖部生長方向
          const offsetPosition = stemDirection.copy().mult(heightOffset + randomOffset); // 向下偏移到指定位置

          const offsetParticle = {
            ..._this,
            p: _this.p.copy().add(offsetPosition) // 沿莖部實際方向分布
          };

          // 縮短延遲時間，讓花穗更快速地綻放，增加密集感
          setTimeout(() => {
            flowerGenerator.generateFlower(offsetParticle);
          }, i * 60 + random(-15, 15)); // 從上到下逐次綻放
        }
      },

      // S曲線生長 + 自然風動
      tick: (_this) => {
        // S曲線生長軌跡 - 模擬自然植物的優雅彎曲
        const progress = 1 - (_this.lifespan / _this.originalLive);
        const sCurveOffset = sin(_this.curvePhase + progress * PI) * _this.curveAmplitude;
        
        // 應用S曲線到生長方向
        _this.vector.x += sCurveOffset * 0.02;
        _this.vector.z += cos(_this.curvePhase + progress * PI) * _this.curveAmplitude * 0.01;
        
        // 增強風動效果 - 模擬薰衣草田的波浪效果
        const windStrength = plantConfig.scale || 1.0; // 前景植物更受風影響
        _this.p.x += map(noise(_this.randomId, frameCount / 40), 0, 1, -0.8, 0.8) * windStrength;
        _this.p.y += map(noise(frameCount / 60, _this.randomId, 1500), 0, 1, -0.2, 0.2) * 0.3;
        _this.p.z += map(noise(1500, _this.randomId, frameCount / 45), 0, 1, -0.8, 0.8) * windStrength;
        
        // 添加群體波動效果 - 整片薰衣草田的協調搖擺
        const groupWave = sin(frameCount / 30 + _this.p.x * 0.01) * 0.3;
        _this.p.x += groupWave;
        
        if (_this.r < 0.01) _this.r = 0;
      }
    };
  }

  // 【步驟4.1】生成世界級花莖 - 融入構圖美學的花莖生成
  static generateStem(pos, plantConfig = {}) {
    colorMode(HSB);

    // 計算植物生長方向 - 主要向上，但加入隨機傾斜讓植物更自然
    let plantGrowthDirection = Rotation3D.rotateRandom(
      createVector(0, -random(0.9, 1) - 1, 0),  // 基礎向上向量
      random(radians(35))                     // 隨機傾斜角度 (限制在20度以內)
    );

    // 選擇繪製圖層
    let plantDrawingLayer = layerSystem.getRandomLayer(0);

    // 創建增強版花莖粒子配置並加入場景
    const particleConfig = this.createStemParticleConfig(pos, plantGrowthDirection, plantDrawingLayer, plantConfig);
    sceneManager.addParticle(new Particle(particleConfig)); // 開始世界級生長動畫
  }
}


// 【步驟5】花朵生成器 - 專門負責花瓣和花蕊的生成邏輯
// 當花莖生長完畢後，這個類負責在莖部頂端綻放出美麗的花朵
class FlowerGenerator {
  // 【步驟5.1】生成花朵的主要函數 - 花莖生長完成後的回調函數
  generateFlower(stemParticle) {
    // Debug: stemParticle data available here

    // 計算花朵的基本幾何參數(大小、方向、花瓣數量等)
    const flowerParams = this._calculateFlowerParameters(stemParticle);

    // 【步驟5.2】先生成外層花瓣 - 較大較明顯的花瓣
    this._generatePetals(stemParticle, flowerParams);
  }

  // 【步驟5.1.1】計算花朵的基本參數 - 將複雜的3D數學運算集中管理
  _calculateFlowerParameters(stemParticle) {
    // 隨機決定花朵的整體大小比例
    const flowerScale = random(0.5, 0.8) / 2;

    // 計算花朵中心的生長方向(相對於莖部有隨機傾斜)
    const flowerCenterV = Rotation3D.rotateRandom(stemParticle.vector.copy(), random(PI / 2) * random(0.5, 1));

    // 【重要】計算花瓣的基準向量 - 薰衣草花穗向斜上內彎
    const vc1 = stemParticle.vector.cross(createVector(1, 0, -stemParticle.vector.x / stemParticle.vector.z)).normalize();
    // 薰衣草特色：花穗更向上且內彎，增加向莖部方向的偏移
    const vc1_tilted = p5.Vector.lerp(vc1, stemParticle.vector, random(-0.4, -0.2)).normalize();

    return {
      flowerScale,                      // 花朵整體縮放比例
      flowerCenterV,                    // 花朵中心方向向量
      vc1,                              // 花瓣基準方向
      vc1_tilted,                       // 傾斜後的花瓣方向
      petalCount: int(random(12, 24)),  // 增加花瓣數量：12-24片，創造密集效果
      flowerRadius: random(15, 35),     // 稍微縮小半徑，讓花瓣更密集
      startAng: random(TWO_PI),         // 隨機起始角度，增加變化
      rotateFactor: random(0.2, 0.6),   // 降低旋轉因子，讓花瓣更穩定優雅
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

      // 創建花瓣粒子的配置參數 - 薰衣草花穗向斜上內彎
      const petalConfig = this._createPetalParticleConfig(
        stemParticle, flowerParams, vc_final, -0.8, 0.995  // 負值且減小絕對值，實現斜上內彎
      );

      // 【花瓣動畫】添加花瓣特有的動態旋轉效果 - 模擬在風中搖擺
      petalConfig.tick = (_this) => {
        this._applyPetalRotation(_this, flowerParams, vc_final);
      };

      // 將花瓣粒子加入場景開始動畫
      sceneManager.addParticle(new Particle(petalConfig));
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
      lifespan: _r * 1.8,  // 稍微縮短生命週期，讓花瓣更精緻
      velocityShrinkFactor: 1.015,  // 更溫和的速度衰減
      preDelay: flowerParams.delayFlower,
      mainGraphics: stemParticle.mainGraphics,
      color: color(0, 100, 100),
      brush: random(brushes),
      brush2: random(brushes),
      brushLerpMap: k => easeOutQuad(k),  // 使用更柔和的緩動函數
      maxSegments: 8,  // 增加線段數，讓筆觸更細膩
      renderType: "brushImageLerp",
      renderJitter: 1,  // 降低抖動，讓線條更平滑
      brushAngleNoiseAmplitude: 0.1,  // 降低角度噪聲，更穩定的筆觸
      radiusMappingFunc: (p) => {
        // 更柔和的半徑映射函數，創造優雅的花瓣形狀
        let _p = easeOutSine(easeOutSine(easeOutSine(p))) + noise(stemParticle.randomId, stemParticle.lifespan / 15) / 15;
        let rr = sqrt(1 - pow(map(_p, 0, 1, -1, 1), 2)) * 1.2;  // 稍微縮小，更精緻
        return rr;
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

// 普羅旺斯薰衣草田 - 法國印象派風情
const generateProvenceLavender = (options = {}) => {
  const defaultOptions = {
    flowerCount: 5,
    clusterMode: true,
    style: 'provence',
    position: { x: [-250, 250], y: [-40, 30], z: [-250, 250] }
  };
  generateFlowers({ ...defaultOptions, ...options });
};

// 北歐極光薰衣草園 - 冰島風情
const generateNordicLavender = (options = {}) => {
  const defaultOptions = {
    flowerCount: 5,
    clusterMode: true,
    style: 'nordic',
    position: { x: [-200, 200], y: [-30, 40], z: [-200, 200] }
  };
  generateFlowers({ ...defaultOptions, ...options });
};

// 日式禪園薰衣草 - 細膩的東方美學
const generateJapaneseLavender = (options = {}) => {
  const defaultOptions = {
    flowerCount: 5,
    clusterMode: false, // 日式風格傾向精致排列
    style: 'japanese',
    position: { x: [-180, 180], y: [-25, 35], z: [-180, 180] }
  };
  generateFlowers({ ...defaultOptions, ...options });
};

// 海洋藝術風格 - Turner風景薰衣草
const generateOceanicLavender = (options = {}) => {
  const defaultOptions = {
    flowerCount: 5,
    clusterMode: true,
    style: 'oceanic',
    position: { x: [-220, 220], y: [-35, 25], z: [-220, 220] }
  };
  generateFlowers({ ...defaultOptions, ...options });
};


// 匯出主要函數和類別供外部使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateFlowers,
    generateProvenceLavender,
    generateNordicLavender,
    generateJapaneseLavender,
    generateOceanicLavender,
    FlowerBrushManager,
    getLavenderStyleConfig,
  };
}

if (typeof window !== 'undefined') {
  window.FlowerBrushManager = FlowerBrushManager;
}