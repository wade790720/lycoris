// 畫刷系統 - 管理畫刷實例與 Canvas 資源池
class BrushSystem {
  constructor() {
    this.brushes = [];
    this.sharedCanvas = createGraphics(300, 300, WEBGL);
    this.sharedShader = this.sharedCanvas.createShader(vert, frag);
    this.sharedCanvas.setAttributes({
      alpha: true,
      premultipliedAlpha: false
    });
    
    // 使用統一資源管理器
    this.resourceManager = getResourceManager();
    console.log('[SYSTEM] BrushSystem integrated with ResourceManager');
  }

  // 創建畫刷實例
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

  // 獲取 Canvas - 使用統一資源管理器
  acquireCanvas(size) {
    return this.resourceManager.acquireGraphics(size, size);
  }

  // 釋放 Canvas 回資源池
  releaseCanvas(canvas, size = null) {
    return this.resourceManager.releaseGraphics(canvas);
  }

  // 清理資源池 - 程式結束時調用
  dispose() {
    // 清理所有畫刷
    this.brushes.forEach(brush => brush.dispose());
    this.brushes = [];
    
    // 清理共享資源
    if (this.sharedCanvas && this.sharedCanvas.remove) {
      this.sharedCanvas.remove();
    }
    
    console.log('[SYSTEM] BrushSystem disposed');
  }

  // 更新所有畫刷
  updateAllBrushes() {
    this.brushes.forEach(brush => brush.update());
  }

  // 獲取畫刷圖像
  getBrushImage(index) {
    return this.brushes[index]?.getImage() || null;
  }

  // 移除畫刷並釋放資源
  removeBrush(brush) {
    const index = this.brushes.indexOf(brush);
    if (index > -1) {
      brush.dispose(); // 釋放 Canvas
      this.brushes.splice(index, 1);
    }
  }

  // 清理所有畫刷
  clear() {
    this.brushes.forEach(brush => brush.dispose());
    this.brushes = [];
  }

  // 獲取系統統計
  getStats() {
    return {
      totalBrushes: this.brushes.length,
      activeBrushes: this.brushes.filter(b => b.brushImage).length,
      resourceStats: this.resourceManager.getStats()
    };
  }
}

// 畫刷類 - 單一畫刷實例管理
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
    dispose: () => brushSystem.releaseCanvas(mergedBrush),
    width: mergedCanvasSize,
    height: mergedCanvasSize
  };
}