// 宣告 Brush 系統類別
class BrushSystem {
  constructor() {
    this.brushes = [];
    this.sharedCanvas = createGraphics(300, 300, WEBGL);
    this.sharedShader = this.sharedCanvas.createShader(vert, frag);

    this.sharedCanvas.setAttributes({
      alpha: true,
      premultipliedAlpha: false
    });

  }

  // 創建新的 Brush 並添加到系統中
  createBrush(args) {
    const brush = new Brush({
      ...args,
      brushShader: this.sharedShader,
      brushHeadCanvas: this.sharedCanvas
    });
    this.brushes.push(brush);
    return brush;
  }

  // 更新所有 Brush
  updateAllBrushes() {
    this.brushes.forEach(brush => brush.update());
  }

  // 獲取指定索引的 Brush 圖像
  getBrushImage(index) {
    if (index >= 0 && index < this.brushes.length) {
      return this.brushes[index].getImage();
    }
    return null;
  }
}

// 宣告 Brush 類別
class Brush {
  constructor(args) {
    let def = {
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
      randomId: int(random(100000)),
      ...args
    };
    Object.assign(this, def);

    this.brushShader = this.brushHeadCanvas.createShader(vert, frag);
    this.brushImage = createGraphics(this.brushCanvasSize, this.brushCanvasSize);
    this.updateBrushImage();
  }

  // 更新 Brush 圖像
  updateBrushImage() {
    this.brushHeadCanvas.resizeCanvas(this.brushCanvasSize, this.brushCanvasSize);
    this.brushHeadCanvas.shader(this.brushShader);

    // 設置 shader 的 uniform 變量
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

    // 清除 brushHeadCanvas 上的內容並設置無邊框
    this.brushHeadCanvas.noStroke();
    this.brushHeadCanvas.clear();

    // 在 brushHeadCanvas 上繪製一個與畫布大小相同的平面
    this.brushHeadCanvas.plane(this.brushCanvasSize, this.brushCanvasSize);

    // 將 brushHeadCanvas 的內容複製到 brushImage
    this.brushImage.image(this.brushHeadCanvas, 0, 0, this.brushImage.width, this.brushImage.height);
  }


  // 獲取 Brush 圖像
  getImage() {
    return this.brushImage;
  }

  // 更新 Brush
  update(color) {
    this.brushColor = color || this.brushColor;
    this.updateBrushImage();
  }
}

// 生成 Brush 頭部的函數
function generateBrushHead(args) {
  return brushSystem.createBrush(args);
}

// 合併兩個 Brush 頭部
function mergeBrushHeads(brush1, brush2) {
  let brushImage1 = brush1.getImage();
  let brushImage2 = brush2.getImage();
  let mergedCanvasSize = max(brushImage1.width, brushImage2.width, brushImage1.height, brushImage2.height) * 1.5;
  let mergedBrush = createGraphics(mergedCanvasSize, mergedCanvasSize);

  mergedBrush.blendMode(MULTIPLY);
  mergedBrush.translate(mergedCanvasSize / 2, mergedCanvasSize / 2);
  mergedBrush.imageMode(CENTER);

  mergedBrush.image(brushImage1, random(-0.5, 0.5) * mergedCanvasSize, random(-0.5, 0.5) * mergedCanvasSize, brushImage1.width, brushImage1.width);
  mergedBrush.image(brushImage2, random(-0.5, 0.5) * mergedCanvasSize, random(-0.5, 0.5) * mergedCanvasSize, brushImage2.width, brushImage2.width);

  // 為合併的 Brush 添加 getImage 方法
  mergedBrush.getImage = () => {
    return mergedBrush;
  };

  return mergedBrush;
}