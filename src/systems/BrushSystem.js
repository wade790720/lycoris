class BrushSystem {
  constructor() {
    this.brushes = [];
    this.sharedCanvas = createGraphics(300, 300, WEBGL);
    this.sharedShader = this.sharedCanvas.createShader(vert, frag);
    this.sharedCanvas.setAttributes({
      alpha: true,
      premultipliedAlpha: false
    });
    
    // Canvas 池：重用而不是創建新的
    this.canvasPool = new Map(); // key = size, value = {available: [], inUse: []}
    this.maxPoolSize = 10; // 每個尺寸最多保留的 canvas 數量
  }

  createBrush(args) {
    const brush = new Brush({
      ...args,
      brushShader: this.sharedShader,
      brushHeadCanvas: this.sharedCanvas,
      brushSystem: this
    });
    this.brushes.push(brush);
    return brush;
  }

  // 從池中獲取 canvas，如果沒有則創建新的
  acquireCanvas(size) {
    if (!this.canvasPool.has(size)) {
      this.canvasPool.set(size, { available: [], inUse: [] });
    }
    
    const pool = this.canvasPool.get(size);
    let canvas;
    
    if (pool.available.length > 0) {
      // 重用現有的 canvas
      canvas = pool.available.pop();
    } else {
      // 創建新的 canvas
      canvas = createGraphics(size, size);
    }
    
    pool.inUse.push(canvas);
    return canvas;
  }

  // 釋放 canvas 回池中
  releaseCanvas(canvas, size) {
    if (!this.canvasPool.has(size)) return;
    
    const pool = this.canvasPool.get(size);
    const index = pool.inUse.indexOf(canvas);
    
    if (index > -1) {
      pool.inUse.splice(index, 1);
      
      // 清理 canvas
      canvas.clear();
      
      // 如果池未滿則放回，否則銷毀
      if (pool.available.length < this.maxPoolSize) {
        pool.available.push(canvas);
      } else {
        canvas.remove(); // 重要：調用 p5.js 的 remove() 方法
      }
    }
  }

  // 清理整個池（在程式結束時調用）
  dispose() {
    for (const [size, pool] of this.canvasPool) {
      [...pool.available, ...pool.inUse].forEach(canvas => {
        canvas.remove();
      });
    }
    this.canvasPool.clear();
    this.sharedCanvas.remove();
  }

  updateAllBrushes() {
    this.brushes.forEach(brush => brush.update());
  }

  getBrushImage(index) {
    return this.brushes[index]?.getImage() || null;
  }

  // 移除筆刷並釋放資源
  removeBrush(brush) {
    const index = this.brushes.indexOf(brush);
    if (index > -1) {
      brush.dispose(); // 釋放 canvas
      this.brushes.splice(index, 1);
    }
  }

  // 清理所有筆刷
  clear() {
    this.brushes.forEach(brush => brush.dispose());
    this.brushes = [];
  }
}

class Brush {
  constructor(args) {
    const defaults = {
      brushColor: color(0),
      brushAlpha: random(0.75, 1),
      brushCanvasSize: 200,
      brushBaseSize: 40,
      brushNoiseScale: random(1, 3),
      brushColorVariant: random(0.2, 0.4) + 0.3 * random(),
      brushTimeFactor: 1,
      brushBlurryFactor: random(0, 0.1),
      aspectRatio: random(0.001, 0.1),
      brushHeadCanvas: null,
      brushSystem: null,
      randomId: int(random(100000))
    };
    Object.assign(this, defaults, args);

    // 使用共享的 shader 而不是創建新的
    this.brushShader = args.brushShader;
    // 從池中獲取 canvas
    this.brushImage = this.brushSystem.acquireCanvas(this.brushCanvasSize);
    this.updateBrushImage();
  }

  // 銷毀筆刷時釋放 canvas
  dispose() {
    if (this.brushImage && this.brushSystem) {
      this.brushSystem.releaseCanvas(this.brushImage, this.brushCanvasSize);
      this.brushImage = null;
    }
  }

  updateBrushImage() {
    this.brushHeadCanvas.resizeCanvas(this.brushCanvasSize, this.brushCanvasSize);
    this.brushHeadCanvas.shader(this.brushShader);

    this.brushShader.setUniform('u_resolution', [1, 1]);
    this.brushShader.setUniform('u_time', frameCount / 1000);
    this.brushShader.setUniform('u_brushColor', [red(this.brushColor) / 255, green(this.brushColor) / 255, blue(this.brushColor) / 255]);
    this.brushShader.setUniform('u_brushAlpha', this.brushAlpha);
    this.brushShader.setUniform('u_brushNoiseScale', this.brushNoiseScale);
    this.brushShader.setUniform('u_brushColorVariant', this.brushColorVariant);
    this.brushShader.setUniform('u_aspectRatio', this.aspectRatio);
    this.brushShader.setUniform('u_brushTimeFactor', this.brushTimeFactor);
    this.brushShader.setUniform('u_randomId', this.randomId);
    this.brushShader.setUniform('u_blurryFactor', this.brushBlurryFactor);

    this.brushHeadCanvas.noStroke();
    this.brushHeadCanvas.clear();
    this.brushHeadCanvas.plane(this.brushCanvasSize, this.brushCanvasSize);
    this.brushImage.image(this.brushHeadCanvas, 0, 0, this.brushImage.width, this.brushImage.height);
  }

  getImage() {
    return this.brushImage;
  }

  update(color) {
    if (color) this.brushColor = color;
    this.updateBrushImage();
  }
}

function generateBrushHead(args) {
  return brushSystem.createBrush(args);
}

function mergeBrushHeads(brush1, brush2) {
  const brushImage1 = brush1.getImage();
  const brushImage2 = brush2.getImage();
  const mergedCanvasSize = max(brushImage1.width, brushImage2.width, brushImage1.height, brushImage2.height) * 1.5;
  
  // 使用 brushSystem 的 canvas 池而不是直接創建
  const mergedBrush = brushSystem.acquireCanvas(mergedCanvasSize);
  
  mergedBrush.clear(); // 清理之前的內容
  mergedBrush.blendMode(MULTIPLY);
  mergedBrush.push();
  mergedBrush.translate(mergedCanvasSize / 2, mergedCanvasSize / 2);
  mergedBrush.imageMode(CENTER);

  mergedBrush.image(brushImage1, random(-0.5, 0.5) * mergedCanvasSize, random(-0.5, 0.5) * mergedCanvasSize, brushImage1.width, brushImage1.width);
  mergedBrush.image(brushImage2, random(-0.5, 0.5) * mergedCanvasSize, random(-0.5, 0.5) * mergedCanvasSize, brushImage2.width, brushImage2.width);
  mergedBrush.pop();

  // 包裝返回物件，包含清理方法
  return {
    getImage: () => mergedBrush,
    dispose: () => brushSystem.releaseCanvas(mergedBrush, mergedCanvasSize),
    width: mergedCanvasSize,
    height: mergedCanvasSize
  };
}