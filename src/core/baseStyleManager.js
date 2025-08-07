// 風格管理器基類 - 提供通用風格管理功能
// 功能: 自動輪播、風格切換、數字鍵映射、狀態追蹤

class BaseStyleManager {
  constructor(config = {}) {
    // 管理器配置
    this.flowerType = config.flowerType || 'unknown';
    this.styles = config.styles || {};
    this.styleNames = config.styleNames || [];
    this.defaultStyle = config.defaultStyle || this.styleNames[0];
    this.rotationInterval = config.rotationInterval || 20000;
    this.numberKeyMap = config.numberKeyMap || {};
    
    // 當前狀態
    this.currentStyleName = this.defaultStyle;
    this.currentStyle = this.styles[this.defaultStyle];
    this.currentStyleIndex = this.styleNames.indexOf(this.defaultStyle);
    this.rotationTimer = null;
    this.isRotating = false;
    
    // 畫刷管理器
    this.brushManager = null;
    
    // 只記錄一次初始化
    if (!window[this.flowerType + 'StyleManagerInitialized']) {
      window[this.flowerType + 'StyleManagerInitialized'] = true;
    }
  }
  
  // 抽象方法: 初始化畫刷管理器
  initializeBrushManager() {
    throw new Error('initializeBrushManager() 必須由子類別實現');
  }
  
  // 更新畫刷管理器 - 優先更新配置，必要時才重建
  updateBrushManager() {
    if (this.brushManager && typeof this.brushManager.updateStyle === 'function') {
      // 更新現有配置
      this.brushManager.updateStyle(this.currentStyle.config);
      
      // 確保畫刷已初始化
      if (typeof this.brushManager.initializeAllBrushes === 'function') {
        this.brushManager.initializeAllBrushes();
      }
      return true;
    } else {
      // 重新初始化
      return this.initializeBrushManager();
    }
  }
  
  // 抽象方法：生成當前風格的花朵 (子類別必須實現)
  generateCurrentStyleFlowers() {
    throw new Error('generateCurrentStyleFlowers() 必須由子類別實現');
  }
  
  // 核心方法：切換到指定風格
  switchToStyle(styleName, generateFlowers = true) {
    if (!this.styles[styleName]) {
      console.warn('[ERROR] ' + this.flowerType + ' style "' + styleName + '" not found');
      return false;
    }
    
    
    this.currentStyleName = styleName;
    this.currentStyle = this.styles[styleName];
    this.currentStyleIndex = this.styleNames.indexOf(styleName);
    
    console.log('[LIFECYCLE] ' + this.flowerType + ' style switched to:', this.currentStyle.name);
    
    // 更新畫刷管理器配置
    const brushUpdateSuccess = this.updateBrushManager();
    
    if (brushUpdateSuccess && generateFlowers) {
      // 清除場景並生成新風格的花朵
      if (typeof sceneManager !== 'undefined') {
        sceneManager.clearScene();
      } else {
        console.warn('[WARNING] sceneManager not available, cannot clear scene');
      }
      
      // 調用風格生成函數
      this.generateCurrentStyleFlowers();
    } else if (!brushUpdateSuccess) {
      console.error('[ERROR] Failed to update brush manager, skipping flower generation');
    }
    
    return true;
  }
  
  // === 輪播控制 ===
  
  // 開始自動輪播
  startAutoRotation() {
    if (this.isRotating) {
      return;
    }
    
    this.isRotating = true;
    
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
  }
  
  // 暫停輪播
  pauseRotation() {
    this.stopAutoRotation();
  }
  
  // 恢復輪播
  resumeRotation() {
    if (!this.isRotating) {
      this.startAutoRotation();
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
  
  // === 導航控制 ===
  
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
  
  // === 資訊獲取 ===
  
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
  
  // === 工具方法 ===
  
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
    console.log('[SYSTEM] ' + this.flowerType + ' StyleManager destroyed');
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