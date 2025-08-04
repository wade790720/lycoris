// 圖層類 - 單一繪圖層管理
class Layer {
  constructor(args = {}) {
    let def = {
      graphics: createGraphics(windowWidth, windowHeight),
      name: "Unnamed Layer",
      zIndex: 0,
      position: createVector(0, 0),
      velocity: createVector(0, 0),
      acceleration: createVector(0, 0),
      rotation: 0,
      scale: 1.02,
      speed: random(0.01, 0.05),
      randomId: int(random(100000)),
      noiseOffsetX: random(1000),    // X軸噪音偏移
      noiseOffsetY: random(1000),    // Y軸噪音偏移
      noiseOffsetSize: random(1000)  // 尺寸噪音偏移
    };
    Object.assign(def, args);
    Object.assign(this, def);

    this.graphics.translate(width / 2, height / 2); // 設定坐標中心
  }
  
  // 清空圖層內容
  clear() {
    this.graphics.clear();
  }

  // 釋放圖層資源
  dispose() {
    if (this.graphics) {
      this.graphics.remove();
      this.graphics = null;
    }
  }

  // 更新圖層位置
  updatePosition() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);

    // 邊界反彈檢查
    if (this.position.x > windowWidth || this.position.x < 0) {
      this.velocity.x *= -1;
    }
    if (this.position.y > windowHeight || this.position.y < 0) {
      this.velocity.y *= -1;
    }
  }

  // 應用物理力
  applyForce(force) {
    this.acceleration.add(force);
  }
}

// 圖層系統 - 管理多個繪圖層
class LayerSystem {
  constructor(numLayers, debug = false) {
    this.layers = [];
    this.numLayers = numLayers;
    this.debug = debug;
    this.initLayers();
  }

  // 初始化所有圖層
  initLayers() {
    for (let i = 0; i < this.numLayers; i++) {
      this.addLayer(`Layer ${i}`);
    }
    this.sortLayers();
  }

  // 新增圖層
  addLayer(name, zIndex = this.layers.length) {
    let layer = new Layer({ name: name, zIndex: zIndex });
    this.layers.push(layer);
    this.sortLayers(); // 重新排序
    return layer;
  }

  // 清空所有圖層
  clearAllLayer() {
    this.layers.forEach(layer => layer.clear());
  }

  // 釋放所有資源
  dispose() {
    this.layers.forEach(layer => layer.dispose());
    this.layers = [];
  }

  // Z軸排序圖層
  sortLayers() {
    this.layers.sort((a, b) => a.zIndex - b.zIndex);
  }

  // 更新所有圖層位置
  update() {
    for (let layer of this.layers) {
      layer.position.x = sin(frameCount / 250 + layer.randomId + mouseX / 500) * width / 50
      layer.position.y = cos(frameCount / 450 + layer.randomId + mouseY / 500) * width / 80
      layer.rotation = cos(frameCount / 800 + layer.randomId) / 100
      layer.updatePosition();
    }
  }

  // 繪製所有圖層
  draw(mainGraphics) {
    for (let i = 0; i < this.layers.length; i++) {
      let layer = this.layers[i];
      mainGraphics.push();
      let behindVal = map(i, 3, 0, 1, 0, true)

      if (i < 5) {
        mainGraphics.drawingContext.filter = `blur(${int(behindVal * 10)}px) `

      }
      mainGraphics.blendMode(SCREEN)
      mainGraphics.translate(layer.position.x, layer.position.y);
      mainGraphics.rotate(layer.rotation);
      mainGraphics.scale(layer.scale);
      mainGraphics.image(layer.graphics, 0, 0);
      mainGraphics.pop();

      // 如果啟用了 debug 模式，繪製圖層編號和 randomId
      if (this.debug) {
        mainGraphics.push();
        mainGraphics.translate(layer.position.x + width / 2, layer.position.y + height / 2);
        mainGraphics.fill(255, 0, 0);
        mainGraphics.textSize(32);
        mainGraphics.textAlign(CENTER, CENTER);
        mainGraphics.text(`${i} (${layer.randomId})`, 0, 0); // 顯示編號和 randomId
        mainGraphics.pop();
      }
    }
  }

  // 根據名稱獲取圖層
  getLayerByName(name) {
    return this.layers.find(layer => layer.name === name);
  }

  // 根據索引獲取圖層
  getLayerByIndex(index) {
    if (index < 0 || index >= this.layers.length) {
      return null;
    }
    return this.layers[index];
  }

  // 設定圖層的 z-index
  setLayerZIndex(name, newIndex) {
    let layer = this.getLayerByName(name);
    if (layer) {
      layer.zIndex = newIndex;
      this.sortLayers();
    }
  }

  // 設定圖層的位移、旋轉和縮放
  setLayerTransform(name, x, y, rotation, scale) {
    let layer = this.getLayerByName(name);
    if (layer) {
      layer.position.set(x, y);
      layer.rotation = rotation;
      layer.scale = scale;
    }
  }

  // 獲取圖層數量
  get layerCount() {
    return this.layers.length;
  }

  // 隨機獲取圖層
  getRandomLayer(minZIndex = -Infinity, maxZIndex = Infinity) {
    let filteredLayers = this.layers.filter(
      layer => layer.zIndex >= minZIndex && layer.zIndex <= maxZIndex
    );
    if (filteredLayers.length === 0) {
      return null;
    }
    let randomIndex = floor(random(filteredLayers.length));
    return filteredLayers[randomIndex];
  }
}