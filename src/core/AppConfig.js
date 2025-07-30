class AppConfig {
  constructor() {
    this.fov = 1000;
    this.sphereRadius = 400;
    this.colors = "cfdbd5-e8eddf-f5cb5c-242423-333533-d8a47f-ef8354-ee4b6a-df3b57-0f7173"
      .split("-")
      .map(a => "#" + a);
    this.zoom = 2.4;
    this.isDragging = false;
    this.isPanning = false;
    this.previousMouseX = 0;
    this.previousMouseY = 0;
    this.debug = false;
  }

  getCanvasConfig() {
    return {
      width: 1000,
      height: 1000,
      pixelDensity: 3
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