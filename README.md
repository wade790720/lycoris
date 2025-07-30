### 📂 資料夾結構

```
lycoris/
├── 📁 src/                    # 主要源碼
│   ├── 📁 core/              # 核心系統
│   │   ├── AppConfig.js      # 應用程式配置
│   │   ├── SceneManager.js   # 場景管理器
│   │   └── main.js           # 應用程式入口點
│   │
│   ├── 📁 systems/           # 功能系統
│   │   ├── BrushSystem.js    # 筆刷系統
│   │   ├── LayerSystem.js    # 圖層系統
│   │   └── ParticleSystem.js # 粒子系統
│   │
│   ├── 📁 controls/          # 控制相關
│   │   ├── Controls.js       # 輸入控制
│   │   └── DebugManager.js   # 調試管理
│   │
│   ├── 📁 scenes/            # 場景內容
│   │   ├── 📁 flowers/       # 花朵主題場景
│   │   │   ├── flower.js     # 基礎花朵場景
│   │   │   ├── cherry.js     # 櫻花場景 (未來)
│   │   │   └── lotus.js      # 蓮花場景 (未來)
│   │   ├── 📁 abstract/      # 抽象藝術場景
│   │   │   ├── galaxy.js     # 星系效果 (未來)
│   │   │   └── mandala.js    # 曼陀羅圖案 (未來)
│   │   └── 📁 seasonal/      # 季節主題場景
│   │       ├── spring.js     # 春季場景 (未來)
│   │       └── autumn.js     # 秋季場景 (未來)
│   │
│   └── 📁 utils/             # 工具函數
│       ├── easing.js         # 緩動函數
│       ├── shader.js         # 著色器工具
│       └── vector3d.js       # 3D 向量運算
│
├── 📁 assets/                # 靜態資源
│   ├── 📁 textures/          # 材質貼圖
│   │   ├── canvas-light-6k.jpg
│   │   └── canvas-light.jpeg
│   │
│   └── 📁 shaders/           # 著色器檔案 (未來擴展)
│
├── 📁 lib/                   # 第三方函式庫
│   └── p5.min.js             # p5.js 核心
│
├── 📁 docs/                  # 文件資料
│   └── CODE_ANALYSIS_README.md
│
├── 📁 build/                 # 建置輸出 (未來)
│
├── index.html                # 主頁面
└── README.md                 # 專案說明
```

## 🏗️ 模組職責劃分

### Core 核心模組
- **`main.js`** - 應用程式入口點，負責初始化和生命週期管理
- **`AppConfig.js`** - 全域配置管理 (視野、縮放、顏色等)
- **`SceneManager.js`** - 場景渲染邏輯 (粒子管理、3D 渲染、後處理)

### Systems 系統模組
- **`BrushSystem.js`** - 筆刷生成和管理
- **`LayerSystem.js`** - 多圖層渲染系統
- **`ParticleSystem.js`** - 粒子物理和渲染

### Controls 控制模組
- **`Controls.js`** - 滑鼠鍵盤輸入處理
- **`DebugManager.js`** - 開發調試工具

### Scenes 場景模組
- **`scenes/flowers/`** - 花朵主題場景系列
  - `lycoris.js` - 基礎花朵生成邏輯
- **`scenes/abstract/`** - 抽象藝術場景
- **`scenes/seasonal/`** - 季節主題場景

### Utils 工具模組
- **`easing.js`** - 緩動和動畫曲線
- **`shader.js`** - 圖形效果工具
- **`vector3d.js`** - 3D 數學運算

```

## ✨ 重構優點

1. **清晰的模組邊界** - 每個資料夾都有明確的職責
2. **更好的可維護性** - 相關功能集中在一起
3. **便於團隊協作** - 開發者可以專注於特定模組
4. **支援未來擴展** - 新功能可以輕鬆加入對應資料夾
5. **標準化結構** - 符合現代前端專案組織慣例

## 🚀 實施建議

1. **分階段遷移** - 一次移動一個模組，確保每次都能正常運行
2. **保留備份** - 在重構前建立 git 分支或備份
3. **測試優先** - 每次移動後都要測試功能是否正常
4. **文件更新** - 同步更新相關文件和註釋