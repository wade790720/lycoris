/*
=== Lavender 風格管理器 (專用於 lavender.html) ===

【功能概述】
- 繼承 BaseStyleManager，專門管理薰衣草(Lavender)的6種風格
- 實現60秒自動輪播功能
- 支援手動切換風格
- 只適用於 lavender.html + lavender.js

【支援風格】
1. default - 🌺 經典薰衣草
2. twilight - 🌆 暮光藍紫
3. provence - 🌿 普羅旺斯薰衣草田
4. nordic - 🌙 北歐極光薰衣草園
5. japanese - 🌸 日式禪園薰衣草
6. oceanic - 🌊 海洋藝術薰衣草
*/

// Lavender 薰衣草風格配置
const LAVENDER_STYLES = {
  // 經典薰衣草
  default: {
    name: '🌺 經典薰衣草',
    config: {
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
          brushColor: () => color(random(350, 10), random(80, 95), random(10, 25)),
          brushAlpha: 0.9,
          brushNoiseScale: () => random(10, 500),
          brushColorVariant: 0.8,
          aspectRatio: 0.2,
          brushCanvasSize: 200,
          brushTimeFactor: 0.1
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
    }
  },
  
  // 暮光藍紫風格
  twilight: {
    name: '🌆 暮光藍紫',
    config: {
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
        count: 15,
        settings: {
          brushColor: () => color(240, random(30, 45), random(75, 85)),
          brushAlpha: 0.8,
          brushNoiseScale: () => random(15, 80),
          brushColorVariant: 0.35,
          aspectRatio: 0.28,
          brushCanvasSize: 125,
          brushTimeFactor: 0.06
        }
      },
      darkPurple: {
        count: 10,
        settings: {
          brushColor: () => color(230, random(40, 55), random(25, 35)),
          brushAlpha: 0.75,
          brushNoiseScale: () => random(10, 60),
          brushColorVariant: 0.4,
          aspectRatio: 0.22,
          brushCanvasSize: 110,
          brushTimeFactor: 0.08
        }
      },
      lightPurple: {
        count: 12,
        settings: {
          brushColor: () => color(240, random(25, 40), random(60, 75)),
          brushAlpha: 0.65,
          brushNoiseScale: () => random(20, 100),
          brushColorVariant: 0.3,
          aspectRatio: 0.32,
          brushCanvasSize: 140,
          brushTimeFactor: 0.05
        }
      },
      white: {
        count: 8,
        settings: {
          brushColor: () => color(245, random(45, 60), random(40, 50)),
          brushAlpha: 0.7,
          brushNoiseScale: () => random(30, 150),
          brushColorVariant: 0.2,
          aspectRatio: 0.35,
          brushCanvasSize: 130,
          brushTimeFactor: 0.04
        }
      }
    }
  },
  
  // 普羅旺斯風格
  provence: {
    name: '🌿 普羅旺斯薰衣草田',
    config: {
      green: {
        count: 8,
        settings: {
          brushColor: () => color(random(135, 155), random(60, 75), random(25, 40)),
          brushAlpha: 1,
          brushNoiseScale: () => random(35, 160),
          brushColorVariant: 0.35,
          brushCanvasSize: 165,
          aspectRatio: 0.12
        }
      },
      purple: {
        count: 18,
        settings: {
          brushColor: () => color(random(270, 285), random(55, 75), random(45, 70)),
          brushAlpha: 0.8,
          brushNoiseScale: () => random(15, 80),
          brushColorVariant: 0.4,
          aspectRatio: 0.5,
          brushCanvasSize: 125,
          brushTimeFactor: 0.08
        }
      },
      shadow: {
        count: 10,
        settings: {
          brushColor: () => color(random(250, 270), random(80, 95), random(12, 28)),
          brushAlpha: 0.65,
          brushNoiseScale: () => random(40, 200),
          brushColorVariant: 0.5,
          aspectRatio: 0.25,
          brushCanvasSize: 145,
          brushTimeFactor: 0.1
        }
      },
      white: {
        count: 8,
        settings: {
          brushColor: () => color(random(0, 20), random(0, 15), random(88, 100)),
          brushAlpha: 0.45,
          brushNoiseScale: () => random(60, 300),
          brushColorVariant: 0.2,
          aspectRatio: 0.85,
          brushCanvasSize: 70,
          brushTimeFactor: 0.06
        }
      }
    }
  },
  
  // 北歐極光風格
  nordic: {
    name: '🌙 北歐極光薰衣草園',
    config: {
      green: {
        count: 6,
        settings: {
          brushColor: () => color(random(180, 200), random(40, 60), random(30, 45)),
          brushAlpha: 0.9,
          brushNoiseScale: () => random(25, 120),
          brushColorVariant: 0.3,
          brushCanvasSize: 150,
          aspectRatio: 0.15
        }
      },
      purple: {
        count: 22,
        settings: {
          brushColor: () => color(random(260, 280), random(70, 85), random(50, 75)),
          brushAlpha: 0.85,
          brushNoiseScale: () => random(10, 60),
          brushColorVariant: 0.3,
          aspectRatio: 0.45,
          brushCanvasSize: 115,
          brushTimeFactor: 0.07
        }
      },
      lightBlue: {
        count: 12,
        settings: {
          brushColor: () => color(random(200, 220), random(45, 65), random(75, 90)),
          brushAlpha: 0.7,
          brushNoiseScale: () => random(20, 100),
          brushColorVariant: 0.25,
          aspectRatio: 0.6,
          brushCanvasSize: 100,
          brushTimeFactor: 0.05
        }
      },
      white: {
        count: 10,
        settings: {
          brushColor: () => color(random(200, 240), random(20, 35), random(85, 100)),
          brushAlpha: 0.5,
          brushNoiseScale: () => random(80, 250),
          brushColorVariant: 0.15,
          aspectRatio: 0.9,
          brushCanvasSize: 75,
          brushTimeFactor: 0.04
        }
      }
    }
  },
  
  // 日式禪園風格
  japanese: {
    name: '🌸 日式禪園薰衣草',
    config: {
      green: {
        count: 7,
        settings: {
          brushColor: () => color(random(120, 140), random(65, 80), random(20, 35)),
          brushAlpha: 0.95,
          brushNoiseScale: () => random(40, 180),
          brushColorVariant: 0.4,
          brushCanvasSize: 140,
          aspectRatio: 0.1
        }
      },
      purple: {
        count: 15,
        settings: {
          brushColor: () => color(random(285, 305), random(50, 70), random(45, 65)),
          brushAlpha: 0.75,
          brushNoiseScale: () => random(15, 90),
          brushColorVariant: 0.35,
          aspectRatio: 0.4,
          brushCanvasSize: 105,
          brushTimeFactor: 0.09
        }
      },
      sakura: {
        count: 18,
        settings: {
          brushColor: () => color(random(320, 340), random(35, 55), random(80, 95)),
          brushAlpha: 0.6,
          brushNoiseScale: () => random(25, 120),
          brushColorVariant: 0.3,
          aspectRatio: 0.7,
          brushCanvasSize: 90,
          brushTimeFactor: 0.06
        }
      },
      gold: {
        count: 5,
        settings: {
          brushColor: () => color(random(45, 60), random(80, 95), random(85, 100)),
          brushAlpha: 0.4,
          brushNoiseScale: () => random(100, 400),
          brushColorVariant: 0.2,
          aspectRatio: 0.95,
          brushCanvasSize: 50,
          brushTimeFactor: 0.03
        }
      }
    }
  },
  
  // 海洋藝術風格
  oceanic: {
    name: '🌊 海洋藝術薰衣草',
    config: {
      green: {
        count: 7,
        settings: {
          brushColor: () => color(random(160, 180), random(70, 85), random(25, 40)),
          brushAlpha: 0.9,
          brushNoiseScale: () => random(35, 160),
          brushColorVariant: 0.45,
          brushCanvasSize: 155,
          aspectRatio: 0.12
        }
      },
      deepBlue: {
        count: 25,
        settings: {
          brushColor: () => color(random(210, 230), random(75, 90), random(35, 60)),
          brushAlpha: 0.8,
          brushNoiseScale: () => random(12, 70),
          brushColorVariant: 0.35,
          aspectRatio: 0.35,
          brushCanvasSize: 130,
          brushTimeFactor: 0.08
        }
      },
      turquoise: {
        count: 15,
        settings: {
          brushColor: () => color(random(170, 190), random(60, 80), random(65, 85)),
          brushAlpha: 0.7,
          brushNoiseScale: () => random(20, 110),
          brushColorVariant: 0.3,
          aspectRatio: 0.5,
          brushCanvasSize: 105,
          brushTimeFactor: 0.06
        }
      },
      foam: {
        count: 12,
        settings: {
          brushColor: () => color(random(180, 200), random(25, 40), random(90, 100)),
          brushAlpha: 0.55,
          brushNoiseScale: () => random(60, 300),
          brushColorVariant: 0.2,
          aspectRatio: 0.85,
          brushCanvasSize: 80,
          brushTimeFactor: 0.04
        }
      }
    }
  }
};

// Lavender 專用風格管理器
class LavenderStyleManager extends BaseStyleManager {
  constructor() {
    const config = {
      flowerType: 'Lavender',
      styles: LAVENDER_STYLES,
      styleNames: ['default', 'twilight', 'provence', 'nordic', 'japanese', 'oceanic'],
      defaultStyle: 'default',
      rotationInterval: 60000, // 60秒
      numberKeyMap: {
        1: 'provence',  // 1 → 🌿 普羅旺斯薰衣草田
        2: 'nordic',    // 2 → 🌙 北歐極光薰衣草園
        3: 'japanese',  // 3 → 🌸 日式禪園薰衣草
        4: 'oceanic',   // 4 → 🌊 海洋藝術薰衣草
        5: 'twilight',  // 5 → 🌆 暮光藍紫風格
        8: 'default'    // 8 → 🌺 經典薰衣草
      }
    };
    
    super(config);
  }
  
  // 實現基類的抽象方法：初始化 Lavender 畫刷管理器
  initializeBrushManager() {
    // 檢查所有必要的依賴
    if (typeof window.FlowerBrushManager === 'undefined') {
      console.error('[ERROR] FlowerBrushManager 未找到，請確保 FlowerBase.js 已載入');
      return false;
    }
    
    if (typeof brushManager !== 'undefined' && brushManager) {
      // 重用現有的 brushManager
      this.brushManager = brushManager;
      this.brushManager.updateStyle(this.currentStyle.config);
      this.brushManager.initializeAllBrushes();
      return true;
    } else {
      // 創建新的畫刷管理器
      try {
        this.brushManager = new window.FlowerBrushManager(this.currentStyle.config);
        this.brushManager.initializeAllBrushes();
        return true;
      } catch (error) {
        console.error('[ERROR] 無法創建 FlowerBrushManager:', error);
        return false;
      }
    }
  }
  
  
  // 實現基類的抽象方法：生成當前風格的花朵
  generateCurrentStyleFlowers() {
    
    // 檢查畫刷管理器狀態
    if (!this.brushManager) {
      console.error('[ERROR] BrushManager not initialized, attempting to initialize...');
      if (!this.initializeBrushManager()) {
        console.error('[ERROR] Failed to initialize BrushManager, aborting flower generation');
        return;
      }
    }
    
    const options = {
      style: this.currentStyleName,
      flowerCount: 40,
      position: { x: [-200, 200], y: [-30, 30], z: [-200, 200] }
    };
    
    
    // 調用對應的 lavender 生成函數
    let functionCalled = false;
    switch (this.currentStyleName) {
      case 'provence':
        if (typeof generateProvenceLavender !== 'undefined') {
          generateProvenceLavender(options);
          functionCalled = true;
        } else {
          console.error('[ERROR] generateProvenceLavender function not found');
        }
        break;
      case 'nordic':
        if (typeof generateNordicLavender !== 'undefined') {
          generateNordicLavender(options);
          functionCalled = true;
        } else {
          console.error('[ERROR] generateNordicLavender function not found');
        }
        break;
      case 'japanese':
        if (typeof generateJapaneseLavender !== 'undefined') {
          generateJapaneseLavender(options);
          functionCalled = true;
        } else {
          console.error('[ERROR] generateJapaneseLavender function not found');
        }
        break;
      case 'oceanic':
        if (typeof generateOceanicLavender !== 'undefined') {
          generateOceanicLavender(options);
          functionCalled = true;
        } else {
          console.error('[ERROR] generateOceanicLavender function not found');
        }
        break;
      case 'twilight':
      case 'default':
      default:
        if (typeof generateFlowers !== 'undefined') {
          generateFlowers({ ...options, style: this.currentStyleName });
          functionCalled = true;
        } else {
          console.error('[ERROR] generateFlowers function not found');
        }
        break;
    }
    
    if (functionCalled) {
    } else {
      console.error('[ERROR] No flower generation function was called');
    }
  }
  
}

// 使用通用模組匯出
createModuleExports(LavenderStyleManager, LAVENDER_STYLES, 'LavenderStyleManager');