class Particle {
    constructor(args) {
        let def = {
            lastP: createVector(0, 0, 0), // 上一個位置
            p: createVector(0, 0, 0), // 當前位置
            v: createVector(0, 0, 0), // 速度
            a: createVector(0, 0, 0), // 加速度
            color: color(255), // 顏色
            rSpan: random([10, 20, 50, 100]), // 半徑跨度
            dashSpan: random([1, 10, 10000000]), // 破折號跨度
            alive: true, // 是否存活
            r: random(), // 半徑
            live: int(random([100, 500])), // 存活時間
            originalLive: 0, // 初始存活時間
            updateCount: 0, // 更新計數
            gen: 0, // 生成數
            freq: random(random(0, 50)), // 頻率
            freq2: random(random(0, 50)), // 第二頻率
            rotAmount: random(0.4, 1), // 旋轉量
            noiseAmount: random(0.8, 1), // 噪音量
            randomId: random(50000), // 隨機ID
            growFreq: random([20, 30, 40, 50]), // 增長頻率
            speedLimit: random(5, 100), // 速度限制
            history: [], // 歷史位置
            axis: createVector(random(-100, 100), random(-100, 100), random(-100, 100)).normalize(), // 軸
            charge: random(-5, 5) * random() * random() * random(), // 電荷
            tick: null, // 更新輔助函數
            endCallback: null, // 結束回調函數
            preDelay: 0, // 前置延遲
            rShrinkFactor: 0.995, // 半徑縮小因子
            vShrinkFactor: 0.995, // 速度縮小因子
            renderType: "brush", // 渲染類型
            renderJitter: 2, // 渲染抖動
            renderJitterFreq: 100, // 渲染抖動頻率
            p2D: null, // 2D位置
            p2D2: null, // 第二2D位置
            brush: null, // 畫刷
            maxSeg: 2, // 最大段數
            brushLerpMap: k => k, // 畫刷線性插值映射
            rMappingFunc: null, // 半徑映射函數
            isBrushRotateFollowVelocity: true, // 畫刷是否隨速度旋轉
            brushAngleNoiseAmpFactor: 0.2, // 畫刷角度噪音放大因子
            mainGraphics: mainGraphics // 主繪圖區域
        };
        Object.assign(def, args);
        Object.assign(this, def);

        let pathColor = color(this.color)
        pathColor.setAlpha(200)
        this.originalLive = this.live
        this.pathColor = pathColor
    }

    update() {
        if (this.preDelay >= 0) {
            this.preDelay--;
            return;
        }
        if (this.live < 0) {
            return;
        }

        this.updateCount++;
        this.lastP = this.p.copy();
        this.p.add(this.v);
        this.v.add(this.a);
        this.v.limit(this.r * this.speedLimit);
        this.v.mult(this.vShrinkFactor);
        this.live -= 1;
        this.r *= this.rShrinkFactor;

        // 記錄當前位置到歷史記錄
        let sampleRate = 3;
        if ((frameCount + int(this.randomId)) % sampleRate == 0 && this.alive) {
            this.history.push(this.p.copy());
        }

        // 限制歷史記錄的長度
        if (this.history.length > 500) {
            this.history.shift();
        }
        if (this.live == this.originalLive - 1) {
            this.history.push(this.p.copy());
        }
        if (this.r < 0.1 || this.live < 0) {
            this.history.push(this.p.copy());
            if (this.endCallback) this.endCallback(this);
            this.alive = false;
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
        let rotatedP = rotateY3D(this.lastP, angleY);
        rotatedP = rotateX3D(rotatedP, angleX);
        rotatedP = rotateZ3D(rotatedP, angleZ);

        // 投影3D點到2D平面
        let p2D = project3Dto2D(rotatedP, camera, fov, zoom);
        this.p2D = this.applyRenderJitter(p2D);

        // 旋轉當前粒子位置
        let rotatedP2 = rotateY3D(this.p, angleY);
        rotatedP2 = rotateX3D(rotatedP2, angleX);
        rotatedP2 = rotateZ3D(rotatedP2, angleZ);

        // 投影3D點到2D平面
        let p2D2 = project3Dto2D(rotatedP2, camera, fov, zoom);
        this.p2D2 = this.applyRenderJitter(p2D2);

        // 計算當前粒子半徑
        let _r = this.calculateRadius();

        // 計算2D方向角
        let headingAngle2D = this.p2D2.copy().sub(this.p2D).heading();
        let naturalBrushRotation = noise(frameCount / 50, this.randomId) * 5 + frameCount / 100;

        // 繪製根據不同渲染類型
        if (this.originalLive != this.live) {
            switch (this.renderType) {
                case "brushImage":
                    this.renderBrushImage(mainGraphics, headingAngle2D, naturalBrushRotation, _r);
                    break;
                case "brushImageLerp":
                    this.renderBrushImageLerp(mainGraphics, headingAngle2D, naturalBrushRotation, _r);
                    break;
                case "brush":
                    this.renderBrush(mainGraphics, _r);
                    break;
                case "splash":
                    this.renderSplash(mainGraphics);
                    break;
                case "line":
                    this.renderLine(mainGraphics);
                    break;
                case "history":
                    this.renderHistory(mainGraphics, angleX, angleY, angleZ, camera, fov, zoom);
                    break;
                default:
                    mainGraphics.fill(this.color);
                    mainGraphics.circle(this.p2D.x, this.p2D.y, _r);
                    break;
            }
        }

        // 呼叫額外的繪圖輔助函數
        if (this.draw2D) {
            this.draw2D(this);
        }

        // 結束繪圖狀態
        mainGraphics.pop();
    }

    // 渲染 brushImage 類型
    renderBrushImage(mainGraphics, headingAngle2D, naturalBrushRotation, _r) {
        mainGraphics.imageMode(CENTER);
        for (let i = 0; i < this.maxSeg; i++) {
            let lerpPoint = p5.Vector.lerp(this.p2D, this.p2D2, i / this.maxSeg);
            mainGraphics.push();
            mainGraphics.translate(lerpPoint.x, lerpPoint.y);
            if (this.isBrushRotateFollowVelocity) {
                mainGraphics.rotate(headingAngle2D);
            }
            mainGraphics.rotate(this.brushAngleNoiseAmpFactor * naturalBrushRotation);
            mainGraphics.image(this.brush.getImage(), 0, 0, _r, _r);
            mainGraphics.pop();
        }
    }

    // 渲染 brushImageLerp 類型
    renderBrushImageLerp(mainGraphics, headingAngle2D, naturalBrushRotation, _r) {
        let lerpFactor = this.brushLerpMap(this.live / this.originalLive);
        mainGraphics.imageMode(CENTER);
        for (let i = 0; i < this.maxSeg; i++) {
            let lerpPoint = p5.Vector.lerp(this.p2D, this.p2D2, i / this.maxSeg);
            mainGraphics.push();
            mainGraphics.translate(lerpPoint.x, lerpPoint.y);
            if (this.isBrushRotateFollowVelocity) {
                mainGraphics.rotate(headingAngle2D);
            }
            mainGraphics.rotate(this.brushAngleNoiseAmpFactor * naturalBrushRotation);
            mainGraphics.drawingContext.globalAlpha = lerpFactor;
            mainGraphics.image(this.brush.getImage(), 0, 0, _r, _r);
            if (this.brush2) {
                mainGraphics.drawingContext.globalAlpha = 1 - lerpFactor;
                mainGraphics.image(this.brush2.getImage(), 0, 0, _r, _r);
            }
            mainGraphics.pop();
        }
    }

    // 渲染 brush 類型
    renderBrush(mainGraphics, _r) {
        for (let i = 0; i < this.maxSeg; i++) {
            let lerpPoint = p5.Vector.lerp(this.p2D, this.p2D2, i / this.maxSeg);
            for (let j = 0; j < 3; j++) {
                mainGraphics.stroke(this.color);
                mainGraphics.strokeWeight(_r * 0.8);
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
            let rr = (1 - random(random())) * this.r * 0.5 * random(0.9, 1.1);
            let ang = random(2 * PI);
            mainGraphics.point(this.p2D.x + rr * cos(ang), this.p2D.y + rr * sin(ang));
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
    renderHistory(mainGraphics, angleX, angleY, angleZ, camera, fov, zoom) {
        this.color.setAlpha(1);
        mainGraphics.push();
        mainGraphics.stroke(typeof this.brush?.color === "object" ? this.brush.color : this.color);
        mainGraphics.strokeWeight(1);
        mainGraphics.noFill();
        mainGraphics.beginShape();
        for (let index = 0; index < this.history.length; index++) {
            let pos = this.history[index];
            let rotatedPos = rotateY3D(pos, angleY);
            rotatedPos = rotateX3D(rotatedPos, angleX);
            rotatedPos = rotateZ3D(rotatedPos, angleZ);
            let pos2D = project3Dto2D(rotatedPos, camera, fov, zoom);
            mainGraphics.curveVertex(pos2D.x, pos2D.y);
        }
        mainGraphics.endShape();
        mainGraphics.pop();
    }

    // 渲染抖動應用函數
    applyRenderJitter(p2D) {
        let _p2D = p2D.copy();
        _p2D.x += map(noise(p2D.x / this.renderJitterFreq, p2D.y / this.renderJitterFreq, p2D.z / this.renderJitterFreq), 0, 1, -1, 1) * this.renderJitter;
        _p2D.y += map(noise(p2D.x / this.renderJitterFreq, p2D.y / this.renderJitterFreq, p2D.z / this.renderJitterFreq + 5000), 0, 1, -1, 1) * this.renderJitter;
        _p2D.z += map(noise(p2D.x / this.renderJitterFreq, p2D.y / this.renderJitterFreq, p2D.z / this.renderJitterFreq + 500000), 0, 1, -1, 1) * this.renderJitter;
        return _p2D;
    }

    // 計算半徑函數
    calculateRadius() {
        let _r = this.r * (this.rMappingFunc ? this.rMappingFunc(constrain(this.live / this.originalLive, 0.000001, 1), this) : 1);
        if (isNaN(_r) || _r <= 0) _r = 0.001;

        return _r;
    }
}


