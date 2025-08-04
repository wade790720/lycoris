/*
=== Lycoris 風格管理器 (專用於 index.html) ===

【功能概述】
- 繼承 BaseStyleManager，專門管理彼岸花(Lycoris)的3種風格
- 實現20秒自動輪播功能
- 支援手動切換風格
- 只適用於 index.html + lycoris.js

【支援風格】
1. original - 🌺 經典彼岸花
2. gothic - 🖤 哥德暗黑 
3. ink - 🖋️ 中國水墨
*/

// Lycoris 彼岸花風格配置
const LYCORIS_STYLES = {
  // 經典彼岸花
  original: {
    name: '🌺 經典彼岸花',
    config: {
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
          brushColor: () => color(random(0, 10), random(0, 20), random(0, 30)),
          brushAlpha: 0.8,
          brushNoiseScale: () => random(10, 500),
          brushColorVariant: 0.8,
          aspectRatio: 0.2,
          brushCanvasSize: 200,
          brushTimeFactor: 0.1
        }
      },
      red: {
        count: 5,
        settings: {
          brushColor: () => color(random(340, 390) % 360, random(90, 98), random(80, 100)),
          brushAlpha: 0.8,
          brushNoiseScale: () => random(10, 50),
          brushColorVariant: 0.8,
          aspectRatio: 0.25,
          brushCanvasSize: 300,
          brushTimeFactor: 0.1
        }
      },
      yellow: {
        count: 5,
        settings: {
          brushColor: () => color(random(35, 50), random(90, 98), random(80, 95)),
          brushAlpha: 1,
          brushNoiseScale: 20,
          brushColorVariant: 0.3,
          aspectRatio: 0.2,
          brushCanvasSize: 300,
          brushTimeFactor: 0.1
        }
      }
    }
  },
  
  // 哥德暗黑風格
  gothic: {
    name: '🖤 哥德暗黑',
    config: {
      green: {
        count: 10,
        settings: {
          brushColor: () => color(random(280, 300), random(60, 80), random(25, 45)),
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
          brushColor: () => color(random(40, 50), random(70, 85), random(40, 60)),
          brushAlpha: 0.8,
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
        count: 5,
        settings: {
          brushColor: () => color(random(350, 10), random(80, 95), random(15, 35)),
          brushAlpha: 0.9,
          brushNoiseScale: () => random(10, 50),
          brushColorVariant: 0.8,
          aspectRatio: 0.25,
          brushCanvasSize: 300,
          brushTimeFactor: 0.1
        }
      },
      yellow: {
        count: 5,
        settings: {
          brushColor: () => color(random(20, 35), random(85, 95), random(50, 70)),
          brushAlpha: 1,
          brushNoiseScale: 20,
          brushColorVariant: 0.4,
          aspectRatio: 0.2,
          brushCanvasSize: 300,
          brushTimeFactor: 0.1
        }
      }
    }
  },
  
  // 中國水墨風格
  ink: {
    name: '🖋️ 中國水墨',
    config: {
      green: {
        count: 8,
        settings: {
          brushColor: () => color(random(120, 140), random(20, 40), random(15, 35)),
          brushAlpha: 0.6,
          brushNoiseScale: () => random(100, 400),
          brushColorVariant: 0.3,
          brushCanvasSize: 200,
          aspectRatio: 0.06
        }
      },
      white: {
        count: 12,
        settings: {
          brushColor: () => color(random(30, 50), random(5, 15), random(92, 100)),
          brushAlpha: 0.4,
          brushNoiseScale: () => random(150, 600),
          brushColorVariant: 0.2,
          aspectRatio: 0.6,
          brushCanvasSize: 300,
          brushTimeFactor: 0.02
        }
      },
      black: {
        count: 15,
        settings: {
          brushColor: () => color(random(0, 20), random(10, 30), random(5, 25)),
          brushAlpha: 0.8,
          brushNoiseScale: () => random(80, 500),
          brushColorVariant: 0.4,
          aspectRatio: 0.2,
          brushCanvasSize: 350,
          brushTimeFactor: 0.03
        }
      },
      red: {
        count: 4,
        settings: {
          brushColor: () => color(random(5, 15), random(70, 90), random(50, 70)),
          brushAlpha: 0.7,
          brushNoiseScale: () => random(40, 200),
          brushColorVariant: 0.5,
          aspectRatio: 0.15,
          brushCanvasSize: 180,
          brushTimeFactor: 0.05
        }
      },
      yellow: {
        count: 6,
        settings: {
          brushColor: () => color(random(0, 30), random(8, 20), random(60, 80)),
          brushAlpha: 0.5,
          brushNoiseScale: 30,
          brushColorVariant: 0.3,
          aspectRatio: 0.18,
          brushCanvasSize: 220,
          brushTimeFactor: 0.02
        }
      }
    }
  }
};

// Lycoris 專用風格管理器
class LycorisStyleManager extends BaseStyleManager {
  constructor() {
    const config = {
      flowerType: 'Lycoris',
      styles: LYCORIS_STYLES,
      styleNames: ['original', 'gothic', 'ink'],
      defaultStyle: 'original',
      rotationInterval: 20000, // 20秒
      numberKeyMap: {
        6: 'gothic',   // 6 → 🖤 哥德暗黑
        7: 'ink',      // 7 → 🖋️ 中國水墨
        8: 'original'  // 8 → 🌺 經典彼岸花
      }
    };
    
    super(config);
  }
  
  // 實現基類的抽象方法：初始化 Lycoris 畫刷管理器
  initializeBrushManager() {
    // 使用 lycoris.js 的 LycorisBrushManager
    if (typeof window.LycorisBrushManager !== 'undefined') {
      this.brushManager = new window.LycorisBrushManager(this.currentStyle.config);
      this.brushManager.initializeAllBrushes();
      return true;
    } else {
      console.warn('[ERROR] LycorisBrushManager 未找到，請確保 lycoris.js 已載入');
      return false;
    }
  }
  
  
  // 實現基類的抽象方法：生成當前風格的花朵
  generateCurrentStyleFlowers() {
    const options = {
      style: this.currentStyleName,
      flowerCount: 10,
      position: { x: [-100, 100], y: [-20, 20], z: [-100, 100] }
    };
    
    // 調用對應的 lycoris 生成函數
    switch (this.currentStyleName) {
      case 'gothic':
        if (typeof generateGothicFlowers !== 'undefined') {
          generateGothicFlowers(options);
        }
        break;
      case 'ink':
        if (typeof generateInkFlowers !== 'undefined') {
          generateInkFlowers(options);
        }
        break;
      case 'original':
      default:
        if (typeof generateLycorisFlowers !== 'undefined') {
          generateLycorisFlowers(options);
        }
        break;
    }
  }
  
}

// 使用通用模組匯出
createModuleExports(LycorisStyleManager, LYCORIS_STYLES, 'LycorisStyleManager');