class Layer {
  constructor(args = {}) {
    let def = {
      graphics: createGraphics(width || 1000, height || 1000), // ⚡ 使用實際 canvas 尺寸
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
      // ⚡ 效能優化屬性
      isDirty: true,           // 髒標記：圖層是否需要重繪
      lastPosition: createVector(0, 0),  // 上次位置，用於變化檢測
      lastRotation: 0,         // 上次旋轉
      lastScale: 1.02,         // 上次縮放
      blurCache: null,         // 模糊效果快取
      isVisible: true,         // 可見性 (用於視錐體剔除)
      updateFrequency: 1       // 更新頻率：1=每幀, 2=每2幀, 等等
    };
    Object.assign(def, args);
    Object.assign(this, def);
    
    this.graphics.translate(width / 2, height / 2) //圖層預設 0,0 都設定為中央
  }
  clear() {
    this.graphics.clear()
  }

  // 更新圖層位置
  updatePosition() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);

    // 邊界反彈
    if (this.position.x > windowWidth || this.position.x < 0) {
      this.velocity.x *= -1;
    }
    if (this.position.y > windowHeight || this.position.y < 0) {
      this.velocity.y *= -1;
    }
  }

  // 應用力到加速度
  applyForce(force) {
    this.acceleration.add(force);
  }
}

class LayerSystem {
  constructor(numLayers, debug = false) {
    this.layers = [];
    this.numLayers = numLayers;
    this.debug = debug;
    // ⚡ 效能快取
    this.thumbnailCache = null;
    this.lastFrameCount = 0;
    this.skipFrames = 0; // 跳幀計數器
    this.initLayers();
  }

  // ⚡ 優化版初始化圖層 (差異化更新頻率)
  initLayers() {
    for (let i = 0; i < this.numLayers; i++) {
      // ⚡ 根據圖層深度設定不同更新頻率
      const updateFreq = i < 2 ? 1 : i < 4 ? 2 : 3; // 前景更新頻繁，背景較慢
      this.addLayer(`Layer ${i}`, i, { updateFrequency: updateFreq });
    }
    this.sortLayers();
    console.log("⚡ LayerSystem 效能優化已啟用！");
    console.log(`📊 圖層更新頻率: L0-1(每幀), L2-3(每2幀), L4+(每3幀)`);
  }

  // 新增圖層
  addLayer(name, zIndex = this.layers.length, extraProps = {}) {
    let layer = new Layer({ name: name, zIndex: zIndex, ...extraProps });
    this.layers.push(layer);
    this.sortLayers(); // 新增圖層後排序
    return layer;
  }

  clearAllLayer() {
    this.layers.forEach(layer => layer.clear())
  }

  // 根據 z-index 排序圖層
  sortLayers() {
    this.layers.sort((a, b) => a.zIndex - b.zIndex);
  }

  // ⚡ 優化版圖層更新
  update() {
    for (let layer of this.layers) {
      // ⚡ 頻率控制：不是每幀都更新所有圖層
      if (frameCount % layer.updateFrequency !== 0) continue;
      
      // 儲存舊值
      layer.lastPosition.set(layer.position.x, layer.position.y);
      layer.lastRotation = layer.rotation;
      layer.lastScale = layer.scale;
      
      // 計算新值
      layer.position.x = sin(frameCount / 250 + layer.randomId + mouseX / 500) * width / 50;
      layer.position.y = cos(frameCount / 450 + layer.randomId + mouseY / 500) * width / 80;
      layer.rotation = cos(frameCount / 800 + layer.randomId) / 100;
      
      // ⚡ 髒檢查：只有真正改變時才標記為需要重繪
      const posChanged = p5.Vector.dist(layer.position, layer.lastPosition) > 0.5;
      const rotChanged = abs(layer.rotation - layer.lastRotation) > 0.001;
      const scaleChanged = abs(layer.scale - layer.lastScale) > 0.001;
      
      layer.isDirty = posChanged || rotChanged || scaleChanged;
      
      // ⚡ 視錐體剔除：檢查是否在可見範圍內
      layer.isVisible = this.isInViewport(layer);
      
      if (layer.isDirty && layer.isVisible) {
        layer.updatePosition();
      }
    }
  }

  // ⚡ 視錐體剔除檢查
  isInViewport(layer) {
    const margin = 100; // 留一些邊距
    return (
      layer.position.x > -width/2 - margin &&
      layer.position.x < width/2 + margin &&
      layer.position.y > -height/2 - margin &&
      layer.position.y < height/2 + margin
    );
  }

  // ⚡ 優化版圖層渲染
  draw(mainGraphics) {
    // ⚡ 預先計算混合模式，避免重複設定
    let currentBlendMode = null;
    let currentFilter = "";
    
    for (let i = 0; i < this.layers.length; i++) {
      let layer = this.layers[i];
      
      // ⚡ 跳過不可見或不需更新的圖層
      if (!layer.isVisible) continue;
      
      mainGraphics.push();
      
      // ⚡ 優化模糊效果：快取 + 條件更新
      let behindVal = map(i, 3, 0, 1, 0, true);
      let blurAmount = int(behindVal * 10);
      
      if (i < 5 && blurAmount > 0) {
        let filterStr = `blur(${blurAmount}px)`;
        // ⚡ 只在濾鏡真正改變時才設定
        if (currentFilter !== filterStr) {
          mainGraphics.drawingContext.filter = filterStr;
          currentFilter = filterStr;
        }
      } else if (currentFilter !== "") {
        mainGraphics.drawingContext.filter = "";
        currentFilter = "";
      }
      
      // ⚡ 只在混合模式改變時才設定
      if (currentBlendMode !== SCREEN) {
        mainGraphics.blendMode(SCREEN);
        currentBlendMode = SCREEN;
      }
      
      // 變換和繪製
      mainGraphics.translate(layer.position.x, layer.position.y);
      mainGraphics.rotate(layer.rotation);
      mainGraphics.scale(layer.scale);
      mainGraphics.image(layer.graphics, 0, 0);
      mainGraphics.pop();
      
      // ⚡ 渲染後清除髒標記
      layer.isDirty = false;

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

    // Debug 模式：在右側顯示所有圖層的縮圖
    if (this.debug) {
      this.drawLayerThumbnails(mainGraphics);
    }
  }

  // ⚡ 優化版圖層縮圖 (快取機制)
  drawLayerThumbnails(mainGraphics) {
    // ⚡ 縮圖快取：只在圖層改變時重新生成
    if (!this.thumbnailCache || frameCount % 30 === 0) { // 每30幀更新一次
      this.generateThumbnailCache();
    }
    
    const thumbnailSize = 120;
    const spacing = 10;
    const startX = width - thumbnailSize - 20;
    let startY = 20;

    mainGraphics.push();
    mainGraphics.textAlign(LEFT, TOP);
    mainGraphics.textSize(14);
    mainGraphics.fill(255);
    mainGraphics.text("圖層視覺化", startX, startY);
    startY += 25;

    for (let i = 0; i < this.layers.length; i++) {
      let layer = this.layers[i];
      let y = startY + i * (thumbnailSize + spacing);

      // 繪製圖層縮圖背景
      mainGraphics.stroke(255);
      mainGraphics.strokeWeight(1);
      mainGraphics.fill(0, 100);
      mainGraphics.rect(startX, y, thumbnailSize, thumbnailSize);

      // ⚡ 使用快取的縮圖
      if (this.thumbnailCache && this.thumbnailCache[i]) {
        mainGraphics.image(this.thumbnailCache[i], startX, y, thumbnailSize, thumbnailSize);
      }

      // 圖層資訊文字 (減少文字渲染)
      mainGraphics.fill(255);
      mainGraphics.noStroke();
      if (frameCount % 10 === 0) { // ⚡ 文字每10幀更新一次
        mainGraphics.text(`L${i}`, startX, y + thumbnailSize + 5);
        mainGraphics.text(`${int(layer.position.x)},${int(layer.position.y)}`, startX, y + thumbnailSize + 20);
      }
    }
    mainGraphics.pop();
  }

  // ⚡ 生成縮圖快取
  generateThumbnailCache() {
    if (!this.thumbnailCache) this.thumbnailCache = [];
    
    for (let i = 0; i < this.layers.length; i++) {
      if (!this.thumbnailCache[i]) {
        this.thumbnailCache[i] = createGraphics(120, 120);
      }
      
      // 只為有變化的圖層重新生成縮圖
      if (this.layers[i].isDirty || !this.thumbnailCache[i]) {
        let thumb = this.thumbnailCache[i];
        thumb.clear();
        thumb.scale(120 / width);
        thumb.image(this.layers[i].graphics, 0, 0);
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