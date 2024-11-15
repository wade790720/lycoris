class Controls {
  constructor() {
    this.isDragging = false;
    this.isPanning = false;
    this.previousMouseX = 0;
    this.previousMouseY = 0;
    
    // 常數設定
    this.ZOOM_FACTOR = 1.1;
    this.MIN_ZOOM = 0.1;
    this.MAX_ZOOM = 10;
    this.FOV_SENSITIVITY = 2;
    this.PAN_SENSITIVITY = 0.1;
    this.ROTATION_SENSITIVITY = 0.01;
  }

  handleMouseWheel(event, state) {
    state.zoom *= event.delta > 0 ? this.ZOOM_FACTOR : 1/this.ZOOM_FACTOR;
    state.zoom = constrain(state.zoom, this.MIN_ZOOM, this.MAX_ZOOM);
  }

  handleMouseDragged(state) {
    const deltaX = mouseX - this.previousMouseX;
    const deltaY = mouseY - this.previousMouseY;

    if (this.isDragging) {
      state.fov += deltaY * this.FOV_SENSITIVITY;
      state.fov = constrain(state.fov, 50, 1000);
    } 
    else if (this.isPanning) {
      state.cameraPosition.x -= deltaX * this.PAN_SENSITIVITY;
      state.cameraPosition.y += deltaY * this.PAN_SENSITIVITY;
    } 
    else {
      state.angleY += deltaX * this.ROTATION_SENSITIVITY;
      state.angleX -= deltaY * this.ROTATION_SENSITIVITY;
    }

    this.updatePreviousMousePosition();
  }

  handleMousePressed() {
    this.updatePreviousMousePosition();
    this.isDragging = keyIsDown(SHIFT);
    this.isPanning = mouseButton === RIGHT;
  }

  handleMouseReleased() {
    this.isDragging = false;
    this.isPanning = false;
  }

  handleKeyPressed(state) {
    const KEY_ACTIONS = {
      ']': () => this.adjustFOV(1.1, state),
      '}': () => this.adjustFOV(1.1, state),
      '[': () => this.adjustFOV(1/1.1, state),
      '{': () => this.adjustFOV(1/1.1, state),
      's': () => this.downloadJPEG(),
      'r': () => this.resetFOV(state)
    };

    const action = KEY_ACTIONS[key];
    if (action) action();
  }

  updatePreviousMousePosition() {
    this.previousMouseX = mouseX;
    this.previousMouseY = mouseY;
  }

  adjustFOV(factor, state) {
    state.fov = constrain(state.fov * factor, 50, 1000);
  }

  downloadJPEG() {
    const timestamp = new Date().toISOString()
      .slice(0,19)
      .replace(/[-:]/g,'');
    save(`Lycoris_${timestamp}.jpg`);
  }

  resetFOV(state) {
    state.fov = 500;
  }
} 