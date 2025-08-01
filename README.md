# Lycoris 🌺
## 互動式 3D 花朵動畫系統

Lycoris 是一個基於 p5.js 的創新 3D 視覺藝術專案，以石蒜花（彼岸花）為靈感，實現了一個功能完整的 3D 粒子花朵渲染系統。專案結合了先進的 3D 數學運算、動態筆刷系統、層級渲染技術，創造出美麗而富有藝術感的互動式花朵動畫。

## ✨ 主要特性

### 🎨 多元風格系統
- **原始風格（Original）**：自然色彩的花朵，具有真實的花卉顏色變化
- **哥特風格（Gothic）**：深沉神秘的色調，營造哥特式美學氛圍
- **水墨風格（Ink）**：具有東方水墨畫韻味的黑白渲染效果

### 🌐 完整 3D 渲染系統
- **3D 粒子系統**：每個花瓣、花蕊都是獨立的 3D 粒子，具有完整的物理運動特性
- **相機控制**：支援旋轉、縮放、平移的 3D 相機系統
- **投影變換**：準確的 3D 到 2D 投影運算，呈現立體視覺效果
- **深度排序**：智慧 Z-buffer 實現，確保正確的深度顯示

### 🖌️ 動態筆刷系統
- **Shader 驅動**：基於 WebGL Shader 的動態筆刷生成
- **即時渲染**：筆刷紋理即時計算，支援顏色變化和動畫效果
- **混合模式**：多種筆刷混合技術，創造豐富的視覺層次

### 🎮 豐富互動體驗
- **滑鼠控制**：拖拽旋轉視角、滾輪縮放、右鍵平移
- **鍵盤操作**：數字鍵切換風格、功能鍵調整參數
- **即時反饋**：流暢的 60fps 渲染，響應式互動體驗

### 🎭 視覺效果系統
- **多層渲染**：10 層獨立渲染層，支援複雜視覺效果堆疊
- **後處理效果**：網幕混合、燃燒混合、模糊等專業視覺效果
- **紋理叠加**：背景紋理混合，增強整體視覺質感

## 🏗️ 專案架構

### 目錄結構
```
lycoris/
├── assets/                 # 靜態資源
│   └── canvas-background.jpg
├── lib/                    # 第三方函式庫
│   └── p5.min.js          # p5.js 核心庫
├── src/                    # 源碼目錄
│   ├── core/              # 核心模組
│   │   ├── main.js        # 應用程式主入口
│   │   ├── AppConfig.js   # 配置管理器
│   │   └── SceneManager.js # 場景管理器
│   ├── flowers/           # 花朵生成系統
│   │   ├── lycoris.js     # 主要花朵生成邏輯
│   │   └── gothic.js      # 哥特風格實現
│   ├── systems/           # 核心系統
│   │   ├── ParticleSystem.js # 粒子系統
│   │   ├── BrushSystem.js    # 筆刷系統
│   │   └── LayerSystem.js    # 層級系統
│   ├── controls/          # 控制系統
│   │   ├── Controls.js    # 互動控制
│   │   └── DebugManager.js # 除錯管理
│   └── utils/            # 工具函數
│       ├── vector3d.js   # 3D 數學運算
│       ├── easing.js     # 緩動函數
│       └── shader.js     # Shader 定義
└── index.html            # 主頁面
```

### 核心模組說明

#### 🎯 Core 核心模組
- **main.js**：應用程式生命週期管理，處理 p5.js 的 `setup()`, `draw()`, `preload()` 等核心函數
- **AppConfig.js**：統一配置管理，包含相機參數、畫布設定、顏色調色盤等
- **SceneManager.js**：場景管理核心，負責粒子更新、渲染、後處理等場景相關操作

#### 🌸 Flowers 花朵系統
- **lycoris.js**：主要花朵生成邏輯，包含花瓣、花蕊、花莖的物理特性和視覺效果
- **gothic.js**：專門針對哥特風格的特殊渲染實現

#### ⚙️ Systems 系統模組
- **ParticleSystem.js**：粒子類別定義，包含物理運動、渲染、生命週期管理
- **BrushSystem.js**：筆刷管理系統，負責動態筆刷生成和管理
- **LayerSystem.js**：多層渲染系統，支援複雜的視覺效果疊加

#### 🎮 Controls 控制模組
- **Controls.js**：使用者互動處理，包含滑鼠和鍵盤事件響應
- **DebugManager.js**：開發者工具，提供除錯資訊和場景狀態監控

#### 🔧 Utils 工具模組
- **vector3d.js**：完整的 3D 數學函式庫，包含旋轉、投影、相機變換
- **easing.js**：豐富的緩動函數集合，提供自然的動畫過渡效果
- **shader.js**：WebGL Shader 定義，用於筆刷紋理生成

## 🔄 應用程式生命週期

### 1. 初始化階段（Initialization Phase）
```javascript
// 1. 預載資源
function preload() {
  overAllTexture = loadImage("assets/canvas-background.jpg");
}

// 2. 系統設定
function setup() {
  appConfig = new AppConfig();           // 載入配置
  createCanvas(1000, 1000);              // 建立畫布
  initializeApplication();               // 初始化應用程式
}

// 3. 系統初始化流程
function initializeApplication() {
  debugManager = new DebugManager();     // 除錯管理器
  sceneManager = new SceneManager();     // 場景管理器
  initializeSystems();                   // 初始化各系統
  initializeScene();                     // 初始化場景
}
```

### 2. 系統建構階段（System Construction）
```javascript
function initializeSystems() {
  mainGraphics = createGraphics(width, height);  // 主縪圖層
  controls = new Controls();                     // 控制系統
  brushSystem = new BrushSystem();               // 筆刷系統
  layerSystem = new LayerSystem(10, false);     // 10層渲染系統
}

function initializeScene() {
  sceneManager.initialize();                    // 場景初始化
  generateFlowersByStyle('ink');                // 生成預設風格花朵
}
```

### 3. 渲染循環階段（Render Loop）
```javascript
function draw() {
  // 1. 除錯前處理
  debugManager.preRender(layerSystem, mainGraphics);
  
  // 2. 設定3D坐標系
  mainGraphics.push();
  mainGraphics.translate(width, height);
  
  // 3. 場景狀態更新
  sceneManager.updateSceneState(debugManager);
  
  // 4. 粒子渲染
  sceneManager.renderParticles(mainGraphics, debugManager, fov, zoom);
  
  // 5. 後處理效果
  sceneManager.applyPostProcessing(mainGraphics, layerSystem, overAllTexture);
  
  // 6. 除錯資訊顯示
  debugManager.drawDebugInfo(sceneState);
}
```

## 🎨 繪製流程詳解

### 3D 到 2D 投影管線

#### 1. 3D 空間變換
```javascript
// 三軸旋轉變換
let rotatedP = Rotation3D.rotateY(position, angleY);
rotatedP = Rotation3D.rotateX(rotatedP, angleX);
rotatedP = Rotation3D.rotateZ(rotatedP, angleZ);

// 透視投影
const projected2D = Vector3DUtils.projectTo2D(rotatedP, camera, fov, zoom);
```

#### 2. 粒子渲染管線
```javascript
class Particle {
  draw({ angleX, angleY, angleZ, camera, fov, zoom }) {
    // 1. 3D位置變換
    const rotated3D = this.transform3D(angleX, angleY, angleZ);
    
    // 2. 投影到2D平面
    const position2D = Vector3DUtils.projectTo2D(rotated3D, camera, fov, zoom);
    
    // 3. 渲染抖動效果
    const jitteredPos = this.applyRenderJitter(position2D);
    
    // 4. 執行渲染
    this.executeRender(jitteredPos);
  }
}
```

#### 3. 多種渲染模式
- **brushImage**：靜態筆刷圖像渲染
- **brushImageLerp**：雙筆刷插值混合渲染
- **brush**：程序化筆刷渲染
- **splash**：濺射效果渲染
- **line**：線條渲染
- **history**：軌跡渲染

### 後處理效果管線

#### 1. 基礎渲染層
```javascript
applyPostProcessing() {
  // 清空背景
  background(0);
  mainGraphics.clear();
  
  // 更新並繪製所有層級
  layerSystem.update();
  layerSystem.draw(mainGraphics);
  image(mainGraphics, 0, 0);
}
```

#### 2. 混合效果層
```javascript
applyBlendEffects() {
  // 網幕混合 - 增加亮度發光效果
  blendMode(SCREEN);
  drawingContext.filter = "blur(2px)";
  drawingContext.globalAlpha = 0.25;
  image(mainGraphics, 0, 0);
  
  // 燃燒混合 - 加深陰影對比
  blendMode(BURN);
  drawingContext.globalAlpha = 0.25;
  image(mainGraphics, 0, 0);
}
```

#### 3. 紋理叠加層
```javascript
applyTextureOverlay() {
  // 乘法混合模式叠加背景紋理
  blendMode(MULTIPLY);
  drawingContext.globalAlpha = 0.6;
  image(overAllTexture, 0, 0, scaledWidth, scaledHeight);
}
```

## 🎮 互動操作指南

### 滑鼠控制
- **左鍵拖拽**：旋轉 3D 場景視角
- **Shift + 左鍵拖拽**：調整相機視野角度（FOV）
- **右鍵拖拽**：平移相機位置
- **滾輪**：縮放場景

### 鍵盤控制
- **數字鍵 1**：切換到原始風格花朵
- **數字鍵 2**：切換到哥特風格花朵  
- **數字鍵 3**：切換到水墨風格花朵
- **方括號 [ ]**：調整相機視野角度
- **S 鍵**：儲存當前畫面為 JPEG 圖片
- **R 鍵**：重設相機視野角度

### 除錯模式
除錯模式提供開發者工具，顯示：
- 3D 旋轉角度資訊
- 相機位置和參數
- 粒子數量統計
- 幀率和時間資訊
- 3D 坐標軸顯示

## 🚀 安裝與使用

### 系統需求
- 現代網頁瀏覽器（Chrome, Firefox, Safari, Edge）
- 支援 WebGL 的顯示卡
- 建議使用高解析度顯示器以獲得最佳視覺效果

### 快速開始
1. **下載專案**
   ```bash
   git clone [repository-url]
   cd lycoris
   ```

2. **開啟專案**
   - 直接在瀏覽器中開啟 `index.html`
   - 或使用本地伺服器（推薦）：
   ```bash
   # 使用 Python
   python -m http.server 8000
   # 或使用 Node.js
   npx live-server
   ```

3. **開始探索**
   - 使用滑鼠拖拽旋轉視角
   - 按下數字鍵 1-3 切換不同花朵風格
   - 使用滾輪縮放觀察細節

### 自訂配置
可以在 `src/core/AppConfig.js` 中調整：
- 畫布解析度和像素密度
- 相機初始參數
- 顏色調色盤
- 物理運動參數

## 🎨 技術亮點

### 1. 先進的 3D 數學運算
- **四元數旋轉**：使用 Rodrigues 旋轉公式實現平滑的 3D 旋轉
- **透視投影**：準確的 3D 到 2D 透視投影變換
- **向量運算**：完整的 3D 向量數學函式庫

### 2. 創新的筆刷系統
- **動態 Shader**：即時計算的筆刷紋理，支援時間動畫
- **多重混合**：支援雙筆刷插值混合，創造豐富變化
- **參數化控制**：顏色、透明度、雜訊比例等完全可控

### 3. 智慧粒子管理
- **生命週期管理**：完整的粒子生成、更新、死亡循環
- **物理模擬**：真實的加速度、阻力、邊界碰撞
- **渲染最佳化**：距離排序、視錐剔除、效能監控

### 4. 專業視覺效果
- **多層渲染**：獨立的渲染層支援複雜效果疊加
- **後處理管線**：網幕、燃燒、乘法等專業混合模式
- **抗鋸齒技術**：高像素密度渲染確保畫質

## 🔧 開發者資訊

### 擴展花朵風格
在 `src/flowers/lycoris.js` 的 `FLOWER_STYLES` 中新增風格：
```javascript
const FLOWER_STYLES = {
  yourStyle: {
    green: { count: 10, settings: { /* 莖部設定 */ } },
    white: { count: 5, settings: { /* 花蕊設定 */ } },
    // ... 其他顏色配置
  }
};
```

### 自訂粒子行為
擴展 `Particle` 類別的 `tick` 和 `endCallback` 函數：
```javascript
const customParticle = new Particle({
  tick: (particle) => {
    // 自訂更新邏輯
  },
  endCallback: (particle) => {
    // 粒子死亡時的回調
  }
});
```

### 新增渲染模式
在 `ParticleSystem.js` 中擴展渲染方法：
```javascript
const renderMethods = {
  yourRenderMode: () => this.yourCustomRender()
};
```

## 📊 效能考量

- **目標幀率**：60 FPS
- **建議粒子數**：< 1000 個同時粒子
- **記憶體使用**：約 50-100MB
- **GPU 需求**：支援 WebGL 1.0

## 🎭 藝術理念

Lycoris 專案靈感來自日本的石蒜花（彼岸花），象徵著生命的輪迴與美的永恆。透過程式碼創造的數位花朵，我們探索了：

- **東西方美學融合**：結合程式藝術與傳統花卉美學
- **技術與藝術的平衡**：在複雜的 3D 渲染技術中保持藝術感性
- **互動性設計**：讓觀者成為藝術創作的參與者
- **數位永恆性**：透過程式碼保存的花朵永不凋零

---

✨ **享受在數位花園中的美妙時光！** 🌺

---
*Lycoris - 數位石蒜花，盛開在程式碼的花園中*