/**
 * 應用程式配置管理器
 * 負責管理 3D 渲染相關的配置參數，包括相機、畫布和互動狀態
 */
class AppConfig {
  constructor() {
    this.fov = 1000; // 3D 相機視野參數
    this.colors = "cfdbd5-e8eddf-f5cb5c-242423-333533-d8a47f-ef8354-ee4b6a-df3b57-0f7173" // 調色盤：預設顏色配色方案
      .split("-")
      .map(a => "#" + a);
    
    this.zoom = 3.4; // 相機縮放倍數
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
      pixelDensity: 3  // 高解析度顯示
    };
  }

  getCameraConfig() {
    return {
      fov: this.fov,
      zoom: this.zoom
    };
  }

  getColors() {
    return this.colors;
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