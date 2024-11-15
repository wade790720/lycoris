// 花朵生成相關的變數宣告
let useBrushesRed, useBrushesWhite, useBrushesBlack, useBrushesGreen, flowerCenterYellowBrushes,
	plantBrushes, redWhiteBrushes, redBlackBrushes;

function generateFlowers() {
	colorMode(HSB);

	// 生成綠色畫刷
	useBrushesGreen = Array.from({ length: 10 }).map(() => generateBrushHead({
		brushColor: color(random(60, 115) + random() * random() * 10, random(80, 85) + random() * random() * 10, random(10, 60) + random() * random() * 20),
		brushAlpha: 1,
		brushNoiseScale: random(10, 300),
		brushColorVariant: 0.6,
		brushCanvasSize: 200,
		aspectRatio: 0.2,
	}));

	// 生成白色畫刷
	useBrushesWhite = Array.from({ length: 5 }).map(() => generateBrushHead({
		brushColor: color(random(0, 10), random(0, 20), random(90, 100)),
		brushAlpha: 1,
		brushNoiseScale: random(10, 500),
		brushColorVariant: 0.5,
		aspectRatio: 0.3,
		brushCanvasSize: 200,
		brushTimeFactor: 0.1,
	}));

	// 生成黑色畫刷
	useBrushesBlack = Array.from({ length: 5 }).map(() => generateBrushHead({
		brushColor: color(random(0, 10), random(0, 20), random(0, 30)),
		brushAlpha: 0.8,
		brushNoiseScale: random(10, 500),
		brushColorVariant: 0.8,
		aspectRatio: 0.2,
		brushCanvasSize: 200,
		brushTimeFactor: 0.1,
	}));

	// 生成紅色畫刷
	useBrushesRed = Array.from({ length: 5 }).map(() => generateBrushHead({
		brushColor: color(random(340, 390) % 360, random(90, 98), random(80, 100)),
		brushAlpha: 0.8,
		brushNoiseScale: random(10, 50),
		brushColorVariant: 0.8,
		aspectRatio: 0.25,
		brushCanvasSize: 300,
		brushTimeFactor: 0.1,
	}));

	// 生成花心的黃色畫刷
	flowerCenterYellowBrushes = Array.from({ length: 5 }).map(() => generateBrushHead({
		brushColor: color(random(35, 50), random(90, 98), random(80, 95)),
		brushAlpha: 1,
		brushNoiseScale: 20,
		brushColorVariant: 0.3,
		aspectRatio: 0.2,
		brushCanvasSize: 300,
		brushTimeFactor: 0.1,
	}));

	// 生成紅白混合畫刷
	redWhiteBrushes = Array.from({ length: 5 }).map(() => mergeBrushHeads(random(useBrushesRed), random(useBrushesWhite)));

	// 生成紅黑混合畫刷
	redBlackBrushes = Array.from({ length: 5 }).map(() => mergeBrushHeads(random(useBrushesRed), random(useBrushesBlack)));

	// 生成植物畫刷
	plantBrushes = Array.from({ length: 5 }).map(() => mergeBrushHeads(random(useBrushesGreen), random(useBrushesGreen)));

	// 生成花朵植物
	for (let i = 0; i < 10; i++) {
		generateFlowerPlant(createVector(random(-100, 100), random(-20, 20) + 300, random(-100, 100)));
	}
}

// 在平面內旋轉向量
function rotateVectorInPlane(v1, v2, v4, ang) {
	let normal = v1.cross(v2).normalize(); // 計算 v1 和 v2 的法向量
	let projection = v4.copy().sub(normal.copy().mult(v4.dot(normal))); // 計算 v4 在平面上的投影
	let cosAng = cos(ang);
	let sinAng = sin(ang);
	let rotatedV4 = projection.copy().mult(cosAng).add(normal.cross(projection).mult(sinAng)); // 計算旋轉後的向量
	return rotatedV4;
}

// 生成花朵植物
function generateFlowerPlant(pos) {
	colorMode(HSB);
	let vec = random3DRotate(createVector(0, -random(0.9, 1) - 1, 0), random(PI / 2));
	let layer = layerSystem.getRandomLayer(0);

	particles.push(new Particle({
		p: pos.copy(),
		v: vec,
		velocityShrinkFactor: 0.995,
		radiusShrinkFactor: 0.995,
		a: createVector(0, -0.01, 0),
		radius: random(15, 25),
		color: color(100, 100, 100),
		preDelay: 0,
		renderJitter: 5,
		lifespan: random(40, 250),
		mainGraphics: layer.graphics,
		maxSegments: 10,
		brush: random(plantBrushes),
		brush2: random(plantBrushes),
		renderType: "brushImageLerp",
		speedLimit: 5,
		isBrushRotateFollowVelocity: true,
		endCallback: (_this) => {
			generateFlower(_this);
		},
		tick: (_this) => {
			_this.p.x += map(noise(_this.randomId, frameCount / 30), 0, 1, -1, 1) * 1.1;
			_this.p.y += map(noise(frameCount / 30, _this.randomId, 1000), 0, 1, -1, 1) * 1.1;
			_this.p.z += map(noise(1000, _this.randomId, frameCount / 30), 0, 1, -1, 1) * 1.1;
			if (_this.r < 0.01) _this.r = 0;
		}
	}));
}

// 生成花朵
function generateFlower(_this) {
	let flowerScale = random(0.5, 0.8) / 2;
	let delayFlower = 0;
	let flowerCenterV = random3DRotate(_this.v.copy(), random(PI / 2) * random(0.5, 1));

	let vc1 = _this.v.cross(createVector(1, 0, -_this.v.x / _this.v.z)).normalize();
	let vc1_tilted = p5.Vector.lerp(vc1, _this.v, random(0.3, 0.5)).normalize();
	let petalCount = int(random(20, 40));
	let flowerRadius = random(30, 50);
	let startAng = random(PI);
	let rotateFactor = random(0.3, 1.2);

	// 生成花瓣
	for (let i = 0; i < petalCount; i++) {
		let vc_final = random3DRotate(rotateVectorAroundAxis(vc1_tilted, _this.v, startAng + i / petalCount * 2 * PI), random(PI / 3));
		let _r = flowerRadius * flowerScale;
		let pos = _this.p.copy();

		particles.push(new Particle({
			p: pos,
			radius: _r,
			v: vc_final.copy().normalize().mult(1.2),
			radiusShrinkFactor: 0.995,
			lifespan: _r * 2,
			velocityShrinkFactor: 1.02,
			preDelay: delayFlower,
			mainGraphics: _this.mainGraphics,
			color: color(0, 100, 100),
			brush: random(random([redBlackBrushes, redWhiteBrushes, useBrushesRed])),
			brush2: random(random([redBlackBrushes, redWhiteBrushes, useBrushesRed])),
			brushLerpMap: k => k,
			maxSegments: 5,
			renderType: "brushImageLerp",
			radiusMappingFunc: (p) => {
				let _p = easeOutSine(easeOutSine(p)) + noise(_this.randomId, _this.lifespan / 10) / 10;
				let rr = sqrt(1 - pow(map(_p, 0, 1, -1, 1), 2)) * 1.4;
				return rr;
			},
			tick(_this) {
				let amp = 1 / pow(map(_this.lifespan / _this.originalLive, 1, 0, 3, 0.3), 2) / 10 * rotateFactor;
				_this.v = rotateVectorInPlane(flowerCenterV, vc_final, _this.v, amp);
				_this.v = rotateY3D(_this.v, +sin(frameCount / 4 + _this.randomId + noise(frameCount / 3, _this.randomId)) / 30);
				_this.v = rotateZ3D(_this.v, +cos(frameCount / 6 + _this.randomId + noise(frameCount / 3, _this.randomId, 50)) / 30);
				_this.v = rotateX3D(_this.v, +sin(frameCount / 7 + _this.randomId + noise(frameCount / 3, _this.randomId, 500)) / 30);
				_this.v = rotateZ3D(_this.v, +sin(frameCount / 50 + _this.randomId + noise(frameCount / 50, _this.randomId)) / 30);
			},
		}));
	}

	// 生成細長花蕊
	flowerRadius = random(30, 40);
	petalCount = random(35, 40);
	for (let i = 0; i < petalCount; i++) {
		vc1_tilted = p5.Vector.lerp(vc1, _this.v, -random(0.00, 0.21)).normalize();
		let vc_final = rotateVectorAroundAxis(vc1_tilted, _this.v, startAng + i / petalCount * 2 * PI);
		let _r = flowerRadius * flowerScale;
		let pos = _this.p.copy();

		particles.push(new Particle({
			p: pos,
			radius: _r,
			v: vc_final.copy().normalize().mult(-random(2, 3)),
			radiusShrinkFactor: 0.975,
			lifespan: _r * 2,
			velocityShrinkFactor: 1.02,
			preDelay: delayFlower,
			mainGraphics: _this.mainGraphics,
			color: color(0, 0, 100),
			brush: random(random([redBlackBrushes, redWhiteBrushes, useBrushesRed])),
			brush2: random(random([redBlackBrushes, redWhiteBrushes, useBrushesRed])),
			brushLerpMap: k => k,
			maxSegments: 8,
			renderType: "brushImageLerp",
			tick(_this) {
				let amp = 1 / pow(map(_this.lifespan / _this.originalLive, 1, 0, 3, 0.3), 2) / 5 * rotateFactor / 5;
				_this.v = rotateVectorInPlane(flowerCenterV, vc_final, _this.v, amp);
			},
			endCallback: (_this) => {
				generateFlowerEnd(_this);
			}
		}));
	}
}

// 生成花朵結尾效果
function generateFlowerEnd(_this) {
	let _r = random(4, 8);
	particles.push(new Particle({
		p: _this.p.copy(),
		radius: _r,
		v: random3DRotate(_this.v.copy().normalize().mult(random(0.8, 1)), random(-1, 1) * PI),
		radiusShrinkFactor: 0.98,
		lifespan: _r * 2.5,
		velocityShrinkFactor: 0.9,
		preDelay: 0,
		mainGraphics: _this.mainGraphics,
		color: color(50, 100, 100),
		brush: random(flowerCenterYellowBrushes),
		brush2: random(flowerCenterYellowBrushes),
		brushLerpMap: k => k,
		maxSegments: 5,
		renderType: "brushImageLerp",
		radiusMappingFunc: (p) => {
			let _p = easeInOutQuad(p);
			let rr = sqrt(1 - pow(map(_p, 0, 1, -1, 1), 2));
			return rr;
		},
		tick(_this) {
			// 此處可以添加其他需要的更新操作
		}
	}));
}