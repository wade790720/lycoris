/**
 * 應用程式配置管理器
 * 負責管理 3D 渲染相關的配置參數，包括相機、畫布和互動狀態
 */
class AppConfig {
  constructor() {
    this.fov = 1000; // 3D相機視野參數 
    this.zoom = 2.4; // 相機縮放倍數
    this.debug = false; // 除錯模式開關
  }

  /**
   * 取得畫布配置
   * @returns {Object} 包含寬度、高度和像素密度的配置物件
   */
  getCanvasConfig() {
    return {
      width: 1000,
      height: 1000,
      pixelDensity: 2  // 一般：1-2; 高解析度：3
    };
  }

  getCameraConfig() {
    return {
      fov: this.fov,
      zoom: this.zoom
    };
  }

  setFov(value) {
    this.fov = value;
  }

  setZoom(value) {
    this.zoom = value;
  }

  toggleDebug() {
    this.debug = !this.debug;
    return this.debug;
  }
}