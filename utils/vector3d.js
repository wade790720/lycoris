// 將3D點投影到2D平面
function project3Dto2D(point3D, camera = createVector(0, 0, 0), fov = 1000, zoom = 1) {
  let relativePoint = p5.Vector.sub(point3D, camera);
  let scale = fov / (fov + relativePoint.z);
  let x2D = relativePoint.x * scale * zoom;
  let y2D = relativePoint.y * scale * zoom;
  return createVector(x2D, y2D);
}

// 沿任意軸旋轉3D點
function rotate3D(point, axis, angle) {
  let cosA = cos(angle);
  let sinA = sin(angle);
  let axisNorm = axis.copy().normalize();
  
  let x = point.x * (cosA + (1 - cosA) * axisNorm.x * axisNorm.x) +
          point.y * ((1 - cosA) * axisNorm.x * axisNorm.y - sinA * axisNorm.z) +
          point.z * ((1 - cosA) * axisNorm.x * axisNorm.z + sinA * axisNorm.y);

  let y = point.x * ((1 - cosA) * axisNorm.y * axisNorm.x + sinA * axisNorm.z) +
          point.y * (cosA + (1 - cosA) * axisNorm.y * axisNorm.y) +
          point.z * ((1 - cosA) * axisNorm.y * axisNorm.z - sinA * axisNorm.x);

  let z = point.x * ((1 - cosA) * axisNorm.z * axisNorm.x - sinA * axisNorm.y) +
          point.y * ((1 - cosA) * axisNorm.z * axisNorm.y + sinA * axisNorm.x) +
          point.z * (cosA + (1 - cosA) * axisNorm.z * axisNorm.z);

  return createVector(x, y, z);
}

// 沿X軸旋轉3D點
function rotateX3D(point, angle) {
  return rotate3D(point, createVector(1, 0, 0), angle);
}

// 沿Y軸旋轉3D點
function rotateY3D(point, angle) {
  return rotate3D(point, createVector(0, 1, 0), angle);
}

// 沿Z軸旋轉3D點
function rotateZ3D(point, angle) {
  return rotate3D(point, createVector(0, 0, 1), angle);
}

// 設定攝影機看向目標點
function lookAt(point, cameraPos, target, up = createVector(0, 1, 0)) {
  let zAxis = p5.Vector.sub(cameraPos, target).normalize();
  let xAxis = p5.Vector.cross(up, zAxis).normalize();
  let yAxis = p5.Vector.cross(zAxis, xAxis);

  let relativePoint = p5.Vector.sub(point, cameraPos);

  return createVector(
    relativePoint.dot(xAxis),
    relativePoint.dot(yAxis),
    relativePoint.dot(zAxis)
  );
}

// 隨機旋轉3D向量
function random3DRotate(vector, angle) {
  let angleX = random(-angle, angle);
  let angleY = random(-angle, angle);
  let angleZ = random(-angle, angle);

  let rotatedVector = rotateX3D(vector, angleX);
  rotatedVector = rotateY3D(rotatedVector, angleY);
  rotatedVector = rotateZ3D(rotatedVector, angleZ);

  return rotatedVector;
}

// 沿任意軸旋轉向量
function rotateVectorAroundAxis(v, axis, angle) {
  // 確保軸向量為單位向量
  let b = axis.copy().normalize();
  let a = v.copy();
  
  // 計算叉積
  let bCrossA = b.cross(a);
  
  // 計算點積
  let bDotA = b.dot(a);
  
  // 使用Rodrigues旋轉公式計算旋轉向量
  let aRot = p5.Vector.add(
    a.mult(Math.cos(angle)),
    p5.Vector.add(
      bCrossA.mult(Math.sin(angle)),
      b.mult(bDotA).mult(1 - Math.cos(angle))
    )
  );

  return aRot;
}

// 繪製十字線
function drawCrosshair(x, y) {
  let hLen = 30;
  push();
  stroke(255);
  strokeWeight(1);
  line(x - hLen, y, x + hLen, y); // 水平線
  line(x, y - hLen, x, y + hLen); // 垂直線
  pop();
}

// 繪製坐標軸
function drawAxes() {
  let axisLength = 1000;
  push();
  colorMode(RGB);

  // X軸 (紅色)
  draw3DLine(createVector(-axisLength, 0, 0), createVector(axisLength, 0, 0), color(255, 0, 0));

  // Y軸 (綠色)
  draw3DLine(createVector(0, -axisLength, 0), createVector(0, axisLength, 0), color(0, 255, 0));

  // Z軸 (藍色)
  draw3DLine(createVector(0, 0, -axisLength), createVector(0, 0, axisLength), color(0, 0, 255));
  pop();
}

// 繪製3D線段
function draw3DLine(start, end, col) {
  let _mainGraphics = layerSystem.getLayerByIndex(0).graphics || mainGraphics;
  _mainGraphics.push();
  _mainGraphics.stroke(col);
  _mainGraphics.strokeWeight(1);

  // 旋轉起點
  let rotatedStart = rotateY3D(start, angleY);
  rotatedStart = rotateX3D(rotatedStart, angleX);
  rotatedStart = rotateZ3D(rotatedStart, angleZ);

  // 投影起點
  let start2D = project3Dto2D(rotatedStart, cameraPosition, fov, zoom);

  // 旋轉終點
  let rotatedEnd = rotateY3D(end, angleY);
  rotatedEnd = rotateX3D(rotatedEnd, angleX);
  rotatedEnd = rotateZ3D(rotatedEnd, angleZ);

  // 投影終點
  let end2D = project3Dto2D(rotatedEnd, cameraPosition, fov, zoom);

  // 繪製線段
  _mainGraphics.line(start2D.x, start2D.y, end2D.x, end2D.y);
  _mainGraphics.pop();
}