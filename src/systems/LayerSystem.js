// 圖層類 - 單一繪圖層管理
class Layer {
  constructor(args = {}) {
    // 使用資源管理器獲取graphics
    const resourceManager = getResourceManager();
    
    let def = {
      graphics: resourceManager.acquireGraphics(windowWidth, windowHeight),
      name: "Unnamed Layer",
      zIndex: 0,
      position: createVector(0, 0),
      velocity: createVector(0, 0),
      acceleration: createVector(0, 0),
      rotation: 0,
      scale: 1.02,
      speed: random(0.01, 0.05),
      randomId: int(random(100000)),
      noiseOffsetX: random(1000),
      noiseOffsetY: random(1000),
      noiseOffsetSize: random(1000),
      resourceManager: resourceManager  // 保存引用用於釋放
    };
    Object.assign(def, args);
    Object.assign(this, def);

    this.graphics.translate(width / 2, height / 2);
  }
  
  // 清空圖層內容
  clear() {
    this.graphics.clear();
  }

  // 釋放圖層資源
  dispose() {
    if (this.graphics && this.resourceManager) {
      // 使用資源管理器釋放
      this.resourceManager.releaseGraphics(this.graphics);
      this.graphics = null;
    } else if (this.graphics) {
      // 備用方案：直接釋放
      if (this.graphics.remove) {
        this.graphics.remove();
      }
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
    this.resourceManager = getResourceManager();
    this.disposed = false;
    
    this.initLayers();
    console.log(`[SYSTEM] LayerSystem initialized with ${numLayers} layers using ResourceManager`);
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
    if (this.disposed) {
      console.warn('[LAYER] Cannot add layer to disposed LayerSystem');
      return null;
    }
    
    let layer = new Layer({ 
      name: name, 
      zIndex: zIndex,
      resourceManager: this.resourceManager 
    });
    this.layers.push(layer);
    this.sortLayers();
    return layer;
  }

  // 清空所有圖層
  clearAllLayer() {
    if (this.disposed) {
      console.warn('[LAYER] Cannot clear disposed LayerSystem');
      return;
    }
    
    this.layers.forEach(layer => {
      try {
        layer.clear();
      } catch (error) {
        console.error('[LAYER] Error clearing layer:', error);
      }
    });
  }

  // 釋放所有資源
  dispose() {
    if (this.disposed) {
      console.warn('[LAYER] LayerSystem already disposed');
      return;
    }
    
    console.log(`[LAYER] Disposing ${this.layers.length} layers`);
    
    // 逐一釋放層級資源
    this.layers.forEach((layer, index) => {
      try {
        layer.dispose();
      } catch (error) {
        console.error(`[LAYER] Error disposing layer ${index}:`, error);
      }
    });
    
    this.layers = [];
    this.disposed = true;
    console.log('[LAYER] LayerSystem disposed');
  }

  // Z軸排序圖層
  sortLayers() {
    this.layers.sort((a, b) => a.zIndex - b.zIndex);
  }

  // 更新所有圖層位置
  update() {
    if (this.disposed) return;
    
    for (let layer of this.layers) {
      try {
        layer.position.x = sin(frameCount / 250 + layer.randomId + mouseX / 500) * width / 50;
        layer.position.y = cos(frameCount / 450 + layer.randomId + mouseY / 500) * width / 80;
        layer.rotation = cos(frameCount / 800 + layer.randomId) / 100;
        layer.updatePosition();
      } catch (error) {
        console.error('[LAYER] Error updating layer:', error);
      }
    }
  }

  // 繪製所有圖層
  draw(mainGraphics) {
    if (this.disposed || !mainGraphics) return;
    
    for (let i = 0; i < this.layers.length; i++) {
      let layer = this.layers[i];
      if (!layer || !layer.graphics) continue;
      
      try {
        mainGraphics.push();
        let behindVal = map(i, 3, 0, 1, 0, true);

        if (i < 5) {
          mainGraphics.drawingContext.filter = `blur(${int(behindVal * 10)}px) `;
        }
        
        mainGraphics.blendMode(SCREEN);
        mainGraphics.translate(layer.position.x, layer.position.y);
        mainGraphics.rotate(layer.rotation);
        mainGraphics.scale(layer.scale);
        mainGraphics.image(layer.graphics, 0, 0);
        mainGraphics.pop();

        // Debug模式
        if (this.debug) {
          mainGraphics.push();
          mainGraphics.translate(layer.position.x + width / 2, layer.position.y + height / 2);
          mainGraphics.fill(255, 0, 0);
          mainGraphics.textSize(32);
          mainGraphics.textAlign(CENTER, CENTER);
          mainGraphics.text(`${i} (${layer.randomId})`, 0, 0);
          mainGraphics.pop();
        }
      } catch (error) {
        console.error(`[LAYER] Error drawing layer ${i}:`, error);
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
    return this.disposed ? 0 : this.layers.length;
  }
  
  // 檢查是否已釋放
  get isDisposed() {
    return this.disposed;
  }

  // 隨機獲取圖層
  getRandomLayer(minZIndex = -Infinity, maxZIndex = Infinity) {
    if (this.disposed || this.layers.length === 0) {
      return null;
    }
    
    let filteredLayers = this.layers.filter(
      layer => layer && layer.zIndex >= minZIndex && layer.zIndex <= maxZIndex
    );
    
    if (filteredLayers.length === 0) {
      return null;
    }
    
    let randomIndex = floor(random(filteredLayers.length));
    return filteredLayers[randomIndex];
  }
  
  // 獲取系統統計
  getStats() {
    return {
      totalLayers: this.layers.length,
      activeLayers: this.layers.filter(l => l && l.graphics).length,
      disposed: this.disposed,
      resourceStats: this.resourceManager ? this.resourceManager.getStats() : null
    };
  }
}