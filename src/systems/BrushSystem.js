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

  createBrush(args) {
    const brush = new Brush({
      ...args,
      brushShader: this.sharedShader,
      brushHeadCanvas: this.sharedCanvas
    });
    this.brushes.push(brush);
    return brush;
  }

  updateAllBrushes() {
    this.brushes.forEach(brush => brush.update());
  }

  getBrushImage(index) {
    return this.brushes[index]?.getImage() || null;
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
      randomId: int(random(100000))
    };
    Object.assign(this, defaults, args);

    this.brushShader = this.brushHeadCanvas.createShader(vert, frag);
    this.brushImage = createGraphics(this.brushCanvasSize, this.brushCanvasSize);
    this.updateBrushImage();
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
  const mergedBrush = createGraphics(mergedCanvasSize, mergedCanvasSize);

  mergedBrush.blendMode(MULTIPLY);
  mergedBrush.translate(mergedCanvasSize / 2, mergedCanvasSize / 2);
  mergedBrush.imageMode(CENTER);

  mergedBrush.image(brushImage1, random(-0.5, 0.5) * mergedCanvasSize, random(-0.5, 0.5) * mergedCanvasSize, brushImage1.width, brushImage1.width);
  mergedBrush.image(brushImage2, random(-0.5, 0.5) * mergedCanvasSize, random(-0.5, 0.5) * mergedCanvasSize, brushImage2.width, brushImage2.width);

  mergedBrush.getImage = () => mergedBrush;
  return mergedBrush;
}