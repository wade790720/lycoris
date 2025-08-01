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

// 紫丁香風格配置 - 基於 Lilas 的紫白優雅色調
const FLOWER_STYLES = {
  default: {
    green: {
      count: 6,
      settings: {
        // 深綠色莖部 - 參考卡芙卡服裝的深色基調
        brushColor: () => color(random(140, 160), random(35, 55), random(20, 35)),
        brushAlpha: 1,
        brushNoiseScale: () => random(30, 150),
        brushColorVariant: 0.4,
        brushCanvasSize: 160,
        aspectRatio: 0.12
      }
    },
    // 主要花穗顏色 - 漸層中段（經典薰衣草）
    purple: {
      count: 8,
      settings: {
        brushColor: () => color(random(265, 280), random(45, 65), random(35, 55)),
        brushAlpha: 0.85,
        brushNoiseScale: () => random(15, 70),
        brushColorVariant: 0.3,
        aspectRatio: 0.7,
        brushCanvasSize: 120,
        brushTimeFactor: 0.08
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
    // 微白色花穗 - 低調的淡白點綴
    white: {
      count: 2,  // 🎨 調整這個數字來控制白色花瓣數量 (建議: 1-20)
      settings: {
        // 畫筆顏色 - 設定花朵的基本顏色 (色相, 飽和度, 亮度)
        brushColor: () => color(random(0, 10), random(0, 20), random(90, 100)),
        
        // 畫筆透明度 - 控制花朵的透明程度 (0.0=完全透明, 1.0=完全不透明)
        brushAlpha: 0.3,
        
        // 筆刷噪聲縮放 - 控制筆觸的粗糙程度/紋理細節 (數值越大越粗糙)
        brushNoiseScale: () => random(100, 500),
        
        // 顏色變化幅度 - 控制每朵花顏色的隨機變化程度 (0.0=無變化, 1.0=最大變化)
        brushColorVariant: 0.5,
        
        // 長寬比 - 控制花瓣的形狀比例 (數值越小越細長, 越大越圓)
        aspectRatio: 0.7,
        
        // 畫筆畫布大小 - 控制單個花瓣的大小 (數值越大花瓣越大)
        brushCanvasSize: 50,
        
        // 時間因子 - 控制花朵綻放的速度 (數值越大綻放越快)
        brushTimeFactor: 0.1
      }
    }
  },
  // 暮光藍紫色系風格 - 深靛藍與灰藍色調
  twilight: {
    green: {
      count: 6,
      settings: {
        // 深靛藍色莖部 - 沉靜的背景氛圍
        brushColor: () => color(240, random(80, 90), random(15, 20)), // #1e1e2b 深靛藍
        brushAlpha: 1,
        brushNoiseScale: () => random(30, 150),
        brushColorVariant: 0.4,
        brushCanvasSize: 160,
        aspectRatio: 0.12
      }
    },
    // 主要花穗顏色 - 柔和紫灰
    purple: {
      count: 15,
      settings: {
        // 柔和紫灰色 - 樹梢柔光
        brushColor: () => color(240, random(30, 45), random(75, 85)), // #b0b0cb 柔和紫灰
        brushAlpha: 0.8,
        brushNoiseScale: () => random(15, 80),
        brushColorVariant: 0.35,
        aspectRatio: 0.28,
        brushCanvasSize: 125,
        brushTimeFactor: 0.06
      }
    },
    // 灰藍色花穗 - 樹蔭氛圍
    darkPurple: {
      count: 10,
      settings: {
        // 灰藍色 - 樹蔭中的沉靜氛圍
        brushColor: () => color(230, random(40, 55), random(25, 35)), // #2f2f46 灰藍
        brushAlpha: 0.75,
        brushNoiseScale: () => random(10, 60),
        brushColorVariant: 0.4,
        aspectRatio: 0.22,
        brushCanvasSize: 110,
        brushTimeFactor: 0.08
      }
    },
    // 淡藍紫色花穗 - 光斑中的紫光
    lightPurple: {
      count: 12,
      settings: {
        // 淡藍紫色 - 光斑中柔和的紫光
        brushColor: () => color(240, random(25, 40), random(60, 75)), // #8383a4 淡藍
        brushAlpha: 0.65,
        brushNoiseScale: () => random(20, 100),
        brushColorVariant: 0.3,
        aspectRatio: 0.32,
        brushCanvasSize: 140,
        brushTimeFactor: 0.05
      }
    },
    // 藍紫色花穗 - 中景層次
    white: {
      count: 8,
      settings: {
        // 較深的藍紫色 - 中景層次與陰影過渡
        brushColor: () => color(245, random(45, 60), random(40, 50)), // #434369 較深藍紫
        brushAlpha: 0.7,
        brushNoiseScale: () => random(30, 150),
        brushColorVariant: 0.2,
        aspectRatio: 0.35,
        brushCanvasSize: 130,
        brushTimeFactor: 0.04
      }
    }
  },
};

// 花朵繪製相關的畫刷管理器
class FlowerBrushManager {
  constructor(styleConfig = FLOWER_STYLES.default) {
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
    this.brushes.purple = this._generateBrushSet(this.brushConfigs.purple);
    this.brushes.white = this._generateBrushSet(this.brushConfigs.white);
    this.brushes.black = this._generateBrushSet(this.brushConfigs.black);

    // 生成混合效果畫刷 - 紫丁香特色層次
    this.mixedBrushes.purpleBlack = this._generateMixedBrushes(this.brushes.purple, this.brushes.black);
    this.mixedBrushes.purpleWhite = this._generateMixedBrushes(this.brushes.purple, this.brushes.white); // 紫白混合
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

  // 獲取隨機花瓣畫刷組合 - 紫丁香紫白配色
  getRandomPetalBrushes() {
    return random([
      this.mixedBrushes.purpleBlack,
      this.mixedBrushes.purpleWhite,
      this.brushes.purple,              // 純紫色
      this.brushes.white                // 純白色
    ]);
  }
}

// 全域畫刷管理器實例
let brushManager = new FlowerBrushManager();

// 【入口函數】主要花朵生成函數 - 支援動態風格配置
// 這是生成植物的起始點，從這裡開始整個生成流程
function generateFlowers(options = {}) {
  const {
    style = 'default',           // 選擇風格：default(經典彼岸花)、gothic(哥德風)、ink(水墨風)
    flowerCount = 20,            // 要生成幾朵花
    position = { x: [-100, 100], y: [-20, 20], z: [-100, 100] }, 
    customStyle = null,           // 自定義風格配置
    clusterMode = false           // 叢生模式
  } = options;

  colorMode(HSB);               // 設定為HSB色彩模式(色相/飽和度/亮度)

  // 【步驟1】初始化畫刷系統 - 根據選定風格準備所有繪圖工具
  const styleConfig = customStyle || FLOWER_STYLES[style] || FLOWER_STYLES.default;
  brushManager.updateStyle(styleConfig);    // 更新風格配置
  brushManager.initializeAllBrushes();

  // 【步驟2】批量生成薰衣草 - 薰衣草通常成叢生長
  if (clusterMode) {
    // 叢生模式：創建幾個叢群，每個叢群內密集生長
    const clusterCount = Math.ceil(flowerCount / 5);

    Array.from({ length: clusterCount }).forEach(() => {
      // 為每個叢群選擇一個中心點
      const clusterCenter = createVector(
        random(position.x[0], position.x[1]),
        random(position.y[0], position.y[1]) + 300,
        random(position.z[0], position.z[1])
      );

      // 在叢群中心周圍生成薰衣草
      const plantsInCluster = random(3, 7);
      Array.from({ length: plantsInCluster }).forEach(() => {
        const offset = createVector(
          random(-25, 25),  // 叢群內的隨機偏移
          random(-5, 5),
          random(-25, 25)
        );
        generateFlowerPlant(clusterCenter.copy().add(offset));
      });
    });
  } else {
    // 散佈模式：隨機分佈
    console.log("散佈模式");
    Array.from({ length: flowerCount }).forEach(() => {
      generateFlowerPlant(createVector(
        random(position.x[0], position.x[1]),
        random(position.y[0], position.y[1]) + 300,
        random(position.z[0], position.z[1])
      ));
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
      velocityShrinkFactor: 0.998,          // 速度衰減係數(讓莖部漸漸變細)
      radiusShrinkFactor: 0.997,            // 半徑衰減係數(讓莖部漸漸變細)
      acceleration: createVector(0, -0.005, 0), // 重力加速度
      radius: random(15, 25),               // 莖部粗細
      color: color(100, 100, 100),          // 莖部顏色
      preDelay: 0,                          // 延遲時間
      renderJitter: 3,                      // 繪製時的隨機抖動
      lifespan: random(60, 200),            // 生長時間(決定莖部長度)
      mainGraphics: plantDrawingLayer.graphics, // 繪製圖層
      maxSegments: 12,                      // 最大線段數
      brush: random(brushManager.getMixedBrush('plant')),  // 主要畫刷(綠色系)
      brush2: random(brushManager.getMixedBrush('plant')), // 次要畫刷(用於混合效果)
      renderType: "brushImageLerp",         // 渲染類型(畫刷混合)
      speedLimit: 3,                        // 速度限制
      isBrushRotateFollowVelocity: true,    // 畫刷是否跟隨運動方向旋轉

      // 【關鍵回調】當花莖生長完畢時，生成70%-100%區間的花穗
      endCallback: (_this) => {
        // 薰衣草特色：莖部100%完成後，在70%-100%區間生成花穗
        const spikeCount = int(random(4, 9)); // 隨機生成4-6個花穗
        const totalStemLength = _this.originalLive; // 莖部總長度

        for (let i = 0; i < spikeCount; i++) {
          // 計算花穗在70%-100%區間的位置
          const progressRatio = i / Math.max(spikeCount - 1, 1); // 0到1的比例
          const stemProgress = 0.7 + progressRatio * 0.3; // 70%到100%的分布
          const heightOffset = totalStemLength * (1 - stemProgress); // 從頂端向下的偏移

          // 為每個花穗創建沿莖部實際生長方向的位置
          const stemDirection = _this.vector.copy().normalize(); // 莖部生長方向
          const offsetPosition = stemDirection.copy().mult(heightOffset); // 向下偏移到指定位置

          const offsetParticle = {
            ..._this,
            p: _this.p.copy().add(offsetPosition) // 沿莖部實際方向分布
          };

          // 延遲生成每個花穗，創造自然的綻放順序（從下往上）
          setTimeout(() => {
            flowerGenerator.generateFlower(offsetParticle);
          }, (spikeCount - 1 - i) * 150); // 倒序延遲，從上往下觸發，但視覺上從下往上綻放
        }
      },

      // 【動畫效果】每幀更新時執行的函數 - 讓莖部有自然搖擺
      tick: (_this) => {
        // 使用柏林噪聲(Perlin Noise)模擬風吹效果
        _this.p.x += map(noise(_this.randomId, frameCount / 50), 0, 1, -0.5, 0.5) * 0.6;     // 更輕微的X軸搖擺
        _this.p.y += map(noise(frameCount / 50, _this.randomId, 1500), 0, 1, -0.3, 0.3) * 0.4; // 更輕微的Y軸搖擺
        _this.p.z += map(noise(1500, _this.randomId, frameCount / 50), 0, 1, -0.5, 0.5) * 0.6; // 更輕微的Z軸搖擺
        if (_this.r < 0.01) _this.r = 0;
      }
    };
  }

  // 【步驟4.1】生成花莖主體 - 建立花莖粒子並開始生長動畫
  static generateStem(pos) {
    colorMode(HSB);

    // 計算植物生長方向 - 主要向上，但加入隨機傾斜讓植物更自然
    let plantGrowthDirection = Rotation3D.rotateRandom(
      createVector(0, -random(0.9, 1) - 1, 0),  // 基礎向上向量
      random(radians(35))                     // 隨機傾斜角度 (限制在20度以內)
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
    // this._generateStamens(stemParticle, flowerParams);
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
      petalCount: int(random(6, 12)),   // 花瓣數量(彼岸花特色：細長花瓣)
      flowerRadius: random(20, 50),     // 花朵半徑
      startAng: 0,             // 起始角度(讓每朵花朝向不同)
      rotateFactor: random(0.3, 1),     // 旋轉因子(影響花瓣搖擺幅度)
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
    FLOWER_STYLES
  };
}