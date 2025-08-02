/*
=== 通用 StyleManager 基礎類別 ===

【設計原則】
- 遵循 DRY (Don't Repeat Yourself) 原則
- 提供通用的風格管理功能
- 子類別只需實現特定的風格邏輯

【功能概述】
- 自動輪播管理
- 風格切換控制
- 數字鍵映射
- 狀態追蹤
- 模組匯出
*/

class BaseStyleManager {
  constructor(config = {}) {
    // 基本配置
    this.flowerType = config.flowerType || 'unknown';
    this.styles = config.styles || {};
    this.styleNames = config.styleNames || [];
    this.defaultStyle = config.defaultStyle || this.styleNames[0];
    this.rotationInterval = config.rotationInterval || 20000;
    this.numberKeyMap = config.numberKeyMap || {};
    
    // 狀態管理
    this.currentStyleName = this.defaultStyle;
    this.currentStyle = this.styles[this.defaultStyle];
    this.currentStyleIndex = this.styleNames.indexOf(this.defaultStyle);
    this.rotationTimer = null;
    this.isRotating = false;
    
    // 畫刷管理器 (由子類別實現)
    this.brushManager = null;
    
    console.log(`🎨 ${this.flowerType} 風格管理器初始化完成`);
    console.log(`📝 可用風格: ${this.styleNames.join(', ')}`);
  }
  
  // 抽象方法：初始化畫刷管理器 (子類別必須實現)
  initializeBrushManager() {
    throw new Error('initializeBrushManager() 必須由子類別實現');
  }
  
  // 抽象方法：生成當前風格的花朵 (子類別必須實現)
  generateCurrentStyleFlowers() {
    throw new Error('generateCurrentStyleFlowers() 必須由子類別實現');
  }
  
  // 核心方法：切換到指定風格
  switchToStyle(styleName, generateFlowers = true) {
    if (!this.styles[styleName]) {
      console.warn(`⚠️ ${this.flowerType} 風格 "${styleName}" 不存在`);
      return false;
    }
    
    this.currentStyleName = styleName;
    this.currentStyle = this.styles[styleName];
    this.currentStyleIndex = this.styleNames.indexOf(styleName);
    
    console.log(`🎨 切換風格: ${this.currentStyle.name}`);
    
    // 初始化畫刷管理器
    if (this.initializeBrushManager() && generateFlowers) {
      // 清除場景並生成新風格的花朵
      if (typeof sceneManager !== 'undefined') {
        sceneManager.clearScene();
      }
      
      // 調用風格生成函數
      this.generateCurrentStyleFlowers();
    }
    
    return true;
  }
  
  // ==================== 輪播控制 ====================
  
  // 開始自動輪播
  startAutoRotation() {
    if (this.isRotating) {
      return;
    }
    
    this.isRotating = true;
    console.log(`🔄 開始 ${this.flowerType} 自動輪播 (每${this.rotationInterval/1000}秒切換)`);
    
    this.rotationTimer = setInterval(() => {
      this.nextStyle();
    }, this.rotationInterval);
  }
  
  // 停止自動輪播
  stopAutoRotation() {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
    this.isRotating = false;
    console.log(`⏹️ 停止 ${this.flowerType} 輪播`);
  }
  
  // 暫停輪播
  pauseRotation() {
    this.stopAutoRotation();
    console.log(`⏸️ 暫停 ${this.flowerType} 輪播`);
  }
  
  // 恢復輪播
  resumeRotation() {
    if (!this.isRotating) {
      this.startAutoRotation();
      console.log(`▶️ 恢復 ${this.flowerType} 輪播`);
    }
  }
  
  // 切換輪播狀態
  toggleRotation() {
    if (this.isRotating) {
      this.pauseRotation();
    } else {
      this.resumeRotation();
    }
  }
  
  // ==================== 導航控制 ====================
  
  // 切換到下一個風格
  nextStyle() {
    this.currentStyleIndex = (this.currentStyleIndex + 1) % this.styleNames.length;
    const nextStyleName = this.styleNames[this.currentStyleIndex];
    this.switchToStyle(nextStyleName);
  }
  
  // 切換到上一個風格
  previousStyle() {
    this.currentStyleIndex = (this.currentStyleIndex - 1 + this.styleNames.length) % this.styleNames.length;
    const prevStyleName = this.styleNames[this.currentStyleIndex];
    this.switchToStyle(prevStyleName);
  }
  
  // 根據數字鍵切換風格
  switchByNumber(number) {
    const styleName = this.numberKeyMap[number];
    if (styleName && this.styles[styleName]) {
      this.switchToStyle(styleName);
      return true;
    }
    return false;
  }
  
  // ==================== 資訊獲取 ====================
  
  // 獲取當前風格信息
  getCurrentStyleInfo() {
    return {
      name: this.currentStyleName,
      displayName: this.currentStyle.name,
      type: this.flowerType,
      isRotating: this.isRotating,
      styleIndex: this.currentStyleIndex,
      totalStyles: this.styleNames.length
    };
  }
  
  // 獲取所有風格列表
  getAllStyles() {
    return this.styleNames.map(name => ({
      name: name,
      displayName: this.styles[name].name,
      type: this.flowerType
    }));
  }
  
  // ==================== 工具方法 ====================
  
  // 檢查風格是否存在
  hasStyle(styleName) {
    return this.styles.hasOwnProperty(styleName);
  }
  
  // 獲取風格配置
  getStyleConfig(styleName) {
    return this.styles[styleName]?.config || null;
  }
  
  // 設定輪播間隔
  setRotationInterval(interval) {
    this.rotationInterval = interval;
    if (this.isRotating) {
      this.stopAutoRotation();
      this.startAutoRotation();
    }
  }
  
  // 銷毀管理器
  destroy() {
    this.stopAutoRotation();
    this.brushManager = null;
    console.log(`🗑️ ${this.flowerType} 風格管理器已銷毀`);
  }
}

// 工具函數：創建模組匯出
function createModuleExports(StyleManagerClass, stylesObject, windowKey) {
  // 暴露到全域作用域
  if (typeof window !== 'undefined') {
    window[windowKey] = StyleManagerClass;
    window[`${windowKey.replace('Manager', '').toUpperCase()}_STYLES`] = stylesObject;
  }
  
  // 匯出給模組系統使用
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      [StyleManagerClass.name]: StyleManagerClass,
      [`${StyleManagerClass.name.replace('Manager', '').toUpperCase()}_STYLES`]: stylesObject
    };
  }
}

// 暴露基礎類別
if (typeof window !== 'undefined') {
  window.BaseStyleManager = BaseStyleManager;
  window.createModuleExports = createModuleExports;
}

// 匯出給模組系統使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BaseStyleManager,
    createModuleExports
  };
}