/**
 * 應用程式配置管理器
 * 負責管理 3D 渲染相關的配置參數，包括相機、畫布和互動狀態
 */
class AppConfig {
  constructor() {
    this.fov = 1000; // 3D 相機視野參數
    this.sphereRadius = 400; // 粒子系統的球體半徑
    this.colors = "cfdbd5-e8eddf-f5cb5c-242423-333533-d8a47f-ef8354-ee4b6a-df3b57-0f7173" // 調色盤：預設顏色配色方案
      .split("-")
      .map(a => "#" + a);
    
    this.zoom = 2.4; // 相機縮放倍數
    this.isDragging = true; // 滑鼠互動狀態追蹤
    this.isPanning = false;
    this.previousMouseX = 0;
    this.previousMouseY = 0;
    this.debug = true; // 除錯模式開關
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

  /**
   * 設定滑鼠互動狀態
   * @param {boolean} isDragging - 是否正在拖拽
   * @param {boolean} isPanning - 是否正在平移
   * @param {number} mouseX - 滑鼠 X 座標
   * @param {number} mouseY - 滑鼠 Y 座標
   */
  setMouseState(isDragging, isPanning, mouseX = 0, mouseY = 0) {
    this.isDragging = isDragging;
    this.isPanning = isPanning;
    this.previousMouseX = mouseX;
    this.previousMouseY = mouseY;
  }

  getMouseState() {
    return {
      isDragging: this.isDragging,
      isPanning: this.isPanning,
      previousMouseX: this.previousMouseX,
      previousMouseY: this.previousMouseY
    };
  }
}