class Particle {
    constructor(config = {}) {
        this.state = {
            // 基本屬性配置
            randomId: random(50000),
            mainGraphics: mainGraphics,
            color: color(255),
            charge: random(-5, 5) * random() * random() * random(),
            axis: createVector(random(-100, 100), random(-100, 100), random(-100, 100)).normalize(),

            // 渲染相關配置
            renderType: "brush",
            renderJitter: 2,
            renderJitterFreq: 100,
            p2D: null,
            p2D2: null,
            brush: null,
            maxSegments: 2,
            brushLerpMap: k => k,
            radiusMappingFunc: null,
            isBrushRotateFollowVelocity: true,
            brushAngleNoiseAmplitude: 0.2,
            history: [],

            // 生命週期相關配置
            isAlive: true,
            lifespan: int(random([100, 500])),
            originalLive: 0,
            updateCount: 0,
            tick: null,
            endCallback: null,
            preDelay: 0,

            // 物理運動相關配置
            lastPosition: createVector(0, 0, 0),
            p: createVector(0, 0, 0),
            v: createVector(0, 0, 0),
            a: createVector(0, 0, 0),
            r: random(),
            speedLimit: random(5, 100),
            radiusShrinkFactor: 0.995,
            velocityShrinkFactor: 0.995
        };

        // 合併配置
        this.state = {...this.state, ...config};
        Object.entries(this.state).forEach(([key, value]) => this[key] = value);

        const pathColor = color(this.color)
        pathColor.setAlpha(200)
        this.originalLive = this.lifespan
        this.pathColor = pathColor
    }

    update() {
        if (this.preDelay >= 0) {
            this.preDelay--;
            return;
        }
        if (this.lifespan < 0) {
            return;
        }

        this.updateCount++;
        this.lastPosition = this.p.copy();
        this.p.add(this.v);
        this.v.add(this.a);
        this.v.limit(this.r * this.speedLimit);
        this.v.mult(this.velocityShrinkFactor);
        this.lifespan -= 1;
        this.r *= this.radiusShrinkFactor;

        // 記錄當前位置到歷史記錄
        let sampleRate = 3;
        if ((frameCount + int(this.randomId)) % sampleRate == 0 && this.isAlive) {
            this.history.push(this.p.copy());
        }

        // 限制歷史記錄的長度
        if (this.history.length > 500) {
            this.history.shift();
        }
        if (this.lifespan == this.originalLive - 1) {
            this.history.push(this.p.copy());
        }
        if (this.r < 0.1 || this.lifespan < 0) {
            this.history.push(this.p.copy());
            if (this.endCallback) this.endCallback(this);
            this.isAlive = false;
        }

        // 額外呼叫的更新輔助函數
        if (this.tick) this.tick(this);
    }

    draw({ angleX, angleY, angleZ, camera, fov, zoom }) {
        // 如果有預設延遲，則不進行繪製
        if (this.preDelay >= 0) return;

        // 取得主要繪圖區域
        let mainGraphics = this.mainGraphics;

        // 開始新的繪圖狀態
        mainGraphics.push();
        mainGraphics.fill(this.color);
        mainGraphics.noStroke();

        // 旋轉粒子位置
        let rotatedP = rotateY3D(this.lastPosition, angleY);
        rotatedP = rotateX3D(rotatedP, angleX);
        rotatedP = rotateZ3D(rotatedP, angleZ);

        // 投影3D點到2D平面
        const p2D = project3Dto2D(rotatedP, camera, fov, zoom);
        this.p2D = this.applyRenderJitter(p2D);

        // 旋轉當前粒子位置
        let rotatedP2 = rotateY3D(this.p, angleY);
        rotatedP2 = rotateX3D(rotatedP2, angleX);
        rotatedP2 = rotateZ3D(rotatedP2, angleZ);

        // 投影3D點到2D平面
        const p2D2 = project3Dto2D(rotatedP2, camera, fov, zoom);
        this.p2D2 = this.applyRenderJitter(p2D2);

        // 計算當前粒子半徑
        const currentRadius = this.calculateRadius();

        // 計算2D方向角
        const headingAngle2D = this.p2D2.copy().sub(this.p2D).heading();
        const naturalBrushRotation = noise(frameCount / 50, this.randomId) * 5 + frameCount / 100;

        // 只在粒子存活時進行渲染
        if (this.originalLive === this.lifespan) return;

        // 定義渲染方法映射表
        const renderMethods = {
            brushImage: () => this.renderBrushImage(mainGraphics, headingAngle2D, naturalBrushRotation, currentRadius),
            brushImageLerp: () => this.renderBrushImageLerp(mainGraphics, headingAngle2D, naturalBrushRotation, currentRadius), 
            brush: () => this.renderBrush(mainGraphics, currentRadius),
            splash: () => this.renderSplash(mainGraphics),
            line: () => this.renderLine(mainGraphics),
            history: () => this.renderHistory(mainGraphics, angleX, angleY, angleZ, camera, fov, zoom),
            default: () => {
                mainGraphics.fill(this.color);
                mainGraphics.circle(this.p2D.x, this.p2D.y, currentRadius);
            }
        };

        // 執行對應的渲染方法,若無對應方法則執行預設渲染
        (renderMethods[this.renderType] || renderMethods.default)();

        // 呼叫額外的繪圖輔助函數
        if (this.draw2D) {
            this.draw2D(this);
        }

        // 結束繪圖狀態
        mainGraphics.pop();
    }

    // 渲染 brushImage 類型
    renderBrushImage(mainGraphics, headingAngle2D, naturalBrushRotation, radius) {
        mainGraphics.imageMode(CENTER);
        for (let i = 0; i < this.maxSegments; i++) {
            let lerpPoint = p5.Vector.lerp(this.p2D, this.p2D2, i / this.maxSegments);
            mainGraphics.push();
            mainGraphics.translate(lerpPoint.x, lerpPoint.y);
            if (this.isBrushRotateFollowVelocity) {
                mainGraphics.rotate(headingAngle2D);
            }
            mainGraphics.rotate(this.brushAngleNoiseAmplitude * naturalBrushRotation);
            mainGraphics.image(this.brush.getImage(), 0, 0, radius, radius);
            mainGraphics.pop();
        }
    }

    // 渲染 brushImageLerp 類型
    renderBrushImageLerp(mainGraphics, headingAngle2D, naturalBrushRotation, radius) {
        let lerpFactor = this.brushLerpMap(this.lifespan / this.originalLive);
        mainGraphics.imageMode(CENTER);
        for (let i = 0; i < this.maxSegments; i++) {
            let lerpPoint = p5.Vector.lerp(this.p2D, this.p2D2, i / this.maxSegments);
            mainGraphics.push();
            mainGraphics.translate(lerpPoint.x, lerpPoint.y);
            if (this.isBrushRotateFollowVelocity) {
                mainGraphics.rotate(headingAngle2D);
            }
            mainGraphics.rotate(this.brushAngleNoiseAmplitude * naturalBrushRotation);
            mainGraphics.drawingContext.globalAlpha = lerpFactor;
            mainGraphics.image(this.brush.getImage(), 0, 0, radius, radius);
            if (this.brush2) {
                mainGraphics.drawingContext.globalAlpha = 1 - lerpFactor;
                mainGraphics.image(this.brush2.getImage(), 0, 0, radius, radius);
            }
            mainGraphics.pop();
        }
    }

    // 渲染 brush 類型
    renderBrush(mainGraphics, radius) {
        for (let i = 0; i < this.maxSegments; i++) {
            let lerpPoint = p5.Vector.lerp(this.p2D, this.p2D2, i / this.maxSegments);
            for (let j = 0; j < 3; j++) {
                mainGraphics.stroke(this.color);
                mainGraphics.strokeWeight(radius * 0.8);
                mainGraphics.point(lerpPoint.x + random(random(-1, 1)) * 1.2, lerpPoint.y + random(random(-1, 1)) * 1.2);
            }
        }
    }

    // 渲染 splash 類型
    renderSplash(mainGraphics) {
        for (let i = 0; i < 350; i++) {
            this.color.setAlpha(random(1));
            mainGraphics.stroke(this.color);
            mainGraphics.strokeWeight(random(1.5));
            
            // splashRadius 是計算濺射效果的隨機半徑 (random radius)
            let splashRadius = (1 - random(random())) * this.radius * 0.5 * random(0.9, 1.1);
            
            // splashAngle 是濺射效果的隨機角度 (angle)
            let splashAngle = random(TWO_PI);
            
            // 使用極座標計算濺射效果的位置
            mainGraphics.point(
                this.p2D.x + splashRadius * cos(splashAngle),
                this.p2D.y + splashRadius * sin(splashAngle)
            );
        }
        this.color.setAlpha(1);
    }

    // 渲染 line 類型
    renderLine(mainGraphics) {
        this.color.setAlpha(0.01);
        for (let i = 0; i < 1; i++) {
            mainGraphics.stroke(this.color);
            for (let j = 0; j < 3; j++) {
                mainGraphics.strokeWeight(this.r * 8);
                mainGraphics.line(this.p2D.x, this.p2D.y, this.p2D2.x, this.p2D2.y);
            }
        }
        this.color.setAlpha(1);
    }

    // 渲染 history 類型
    renderTrajectory(graphics, rotationX, rotationY, rotationZ, cameraPosition, fieldOfView, zoomLevel) {
        this.color.setAlpha(1);
        graphics.push();
        graphics.stroke(typeof this.brush?.color === "object" ? this.brush.color : this.color);
        graphics.strokeWeight(1);
        graphics.noFill();
        graphics.beginShape();
        
        for (let i = 0; i < this.history.length; i++) {
            const position3D = this.history[i];
            let transformedPosition = rotateY3D(position3D, rotationY);
            transformedPosition = rotateX3D(transformedPosition, rotationX); 
            transformedPosition = rotateZ3D(transformedPosition, rotationZ);
            
            const position2D = project3Dto2D(transformedPosition, cameraPosition, fieldOfView, zoomLevel);
            graphics.curveVertex(position2D.x, position2D.y);
        }
        
        graphics.endShape();
        graphics.pop();
    }

    // 渲染抖動應用函數
    applyRenderJitter(position) {
        let jitteredPosition = position.copy();
        
        // 為每個座標軸添加柏林雜訊抖動效果
        jitteredPosition.x += map(
            noise(
                position.x / this.renderJitterFreq, 
                position.y / this.renderJitterFreq, 
                position.z / this.renderJitterFreq
            ), 
            0, 1, -1, 1
        ) * this.renderJitter;
        
        jitteredPosition.y += map(
            noise(
                position.x / this.renderJitterFreq, 
                position.y / this.renderJitterFreq, 
                position.z / this.renderJitterFreq + 5000
            ), 
            0, 1, -1, 1
        ) * this.renderJitter;
        
        jitteredPosition.z += map(
            noise(
                position.x / this.renderJitterFreq, 
                position.y / this.renderJitterFreq, 
                position.z / this.renderJitterFreq + 500000
            ), 
            0, 1, -1, 1
        ) * this.renderJitter;

        return jitteredPosition;
    }
    // 計算半徑函數
    calculateRadius() {
        let radius = this.r * (this.radiusMappingFunc ? this.radiusMappingFunc(constrain(this.lifespan / this.originalLive, 0.000001, 1), this) : 1);
        if (isNaN(radius) || radius <= 0) radius = 0.001;

        return radius;
    }
}


