/**
 * @typedef {Object} Vector3D
 * @property {number} x
 * @property {number} y
 * @property {number} z
 */

class Vector3DUtils {
  static DEFAULT_FOV = 1000;
  static DEFAULT_ZOOM = 1;

  /**
   * 將3D點投影到2D平面
   * @param {Vector3D} point3D - 3D空間中的點
   * @param {Vector3D} camera - 攝影機位置
   * @param {number} fov - 視野範圍
   * @param {number} zoom - 縮放比例
   * @returns {Vector3D} 投影後的2D點
   */
  static projectTo2D(
    point3D,
    camera = createVector(0, 0, 0),
    fov = this.DEFAULT_FOV,
    zoom = this.DEFAULT_ZOOM
  ) {
    const relativePoint = p5.Vector.sub(point3D, camera);
    const scale = fov / (fov + relativePoint.z);
    return createVector(
      relativePoint.x * scale * zoom,
      relativePoint.y * scale * zoom
    );
  }
}

class Rotation3D {
  /**
   * 沿任意軸旋轉3D點
   * @param {Vector3D} point - 要旋轉的點
   * @param {Vector3D} axis - 旋轉軸
   * @param {number} angle - 旋轉角度（弧度）
   * @returns {Vector3D} 旋轉後的點
   */
  static rotateAroundAxis(point, axis, angle) {
    const cosA = cos(angle);
    const sinA = sin(angle);
    const axisNorm = axis.copy().normalize();

    // 使用 Rodrigues 旋轉公式
    const { x: ax, y: ay, z: az } = axisNorm;
    const oneMinusCos = 1 - cosA;

    const x = point.x * (cosA + oneMinusCos * ax * ax) +
      point.y * (oneMinusCos * ax * ay - sinA * az) +
      point.z * (oneMinusCos * ax * az + sinA * ay);

    const y = point.x * (oneMinusCos * ay * ax + sinA * az) +
      point.y * (cosA + oneMinusCos * ay * ay) +
      point.z * (oneMinusCos * ay * az - sinA * ax);

    const z = point.x * (oneMinusCos * az * ax - sinA * ay) +
      point.y * (oneMinusCos * az * ay + sinA * ax) +
      point.z * (cosA + oneMinusCos * az * az);

    return createVector(x, y, z);
  }

  /**
   * 沿X軸旋轉
   */
  static rotateX(point, angle) {
    return this.rotateAroundAxis(point, createVector(1, 0, 0), angle);
  }

  /**
   * 沿Y軸旋轉
   */
  static rotateY(point, angle) {
    return this.rotateAroundAxis(point, createVector(0, 1, 0), angle);
  }

  /**
   * 沿Z軸旋轉
   */
  static rotateZ(point, angle) {
    return this.rotateAroundAxis(point, createVector(0, 0, 1), angle);
  }

  /**
   * 隨機旋轉向量
   */
  static rotateRandom(vector, maxAngle) {
    const angles = {
      x: random(-maxAngle, maxAngle),
      y: random(-maxAngle, maxAngle),
      z: random(-maxAngle, maxAngle)
    };

    return this.rotateZ(
      this.rotateY(
        this.rotateX(vector, angles.x),
        angles.y
      ),
      angles.z
    );
  }
}

class Camera3D {
  /**
   * 設定攝影機視角
   */
  static lookAt(point, cameraPos, target, up = createVector(0, 1, 0)) {
    const zAxis = p5.Vector.sub(cameraPos, target).normalize();
    const xAxis = p5.Vector.cross(up, zAxis).normalize();
    const yAxis = p5.Vector.cross(zAxis, xAxis);
    const relativePoint = p5.Vector.sub(point, cameraPos);

    return createVector(
      relativePoint.dot(xAxis),
      relativePoint.dot(yAxis),
      relativePoint.dot(zAxis)
    );
  }
}

class Graphics3D {
  static CROSSHAIR_LENGTH = 30;
  static AXIS_LENGTH = 1000;

  /**
   * 繪製十字準心
   */
  static drawCrosshair(x, y) {
    push();
    stroke(255);
    strokeWeight(1);
    const len = this.CROSSHAIR_LENGTH;
    line(x - len, y, x + len, y);
    line(x, y - len, x, y + len);
    pop();
  }

  /**
   * 繪製3D坐標軸
   */
  static drawAxes(angleX = 0, angleY = 0, angleZ = 0, cameraPosition = null, fov = 1000, zoom = 1) {
    push();
    colorMode(RGB);
    const len = this.AXIS_LENGTH;

    // 如果沒有提供相機位置，使用預設值
    if (!cameraPosition) {
      cameraPosition = createVector(0, 0, -200);
    }

    // X軸（紅）
    this.draw3DLine(
      createVector(-len, 0, 0),
      createVector(len, 0, 0),
      color(255, 0, 0),
      angleX, angleY, angleZ, cameraPosition, fov, zoom
    );

    // Y軸（綠）
    this.draw3DLine(
      createVector(0, -len, 0),
      createVector(0, len, 0),
      color(0, 255, 0),
      angleX, angleY, angleZ, cameraPosition, fov, zoom
    );

    // Z軸（藍）
    this.draw3DLine(
      createVector(0, 0, -len),
      createVector(0, 0, len),
      color(0, 0, 255),
      angleX, angleY, angleZ, cameraPosition, fov, zoom
    );
    pop();
  }

  /**
   * 繪製3D線段
   */
  static draw3DLine(start, end, col, angleX = 0, angleY = 0, angleZ = 0, cameraPosition = null, fov = 1000, zoom = 1) {
    const graphics = layerSystem.getLayerByIndex(0).graphics || mainGraphics;
    graphics.push();
    graphics.stroke(col);
    graphics.strokeWeight(1);

    // 如果沒有提供相機位置，使用預設值
    if (!cameraPosition) {
      cameraPosition = createVector(0, 0, -200);
    }

    const transformPoint = (point) => {
      let rotated = Rotation3D.rotateY(point, angleY);
      rotated = Rotation3D.rotateX(rotated, angleX);
      rotated = Rotation3D.rotateZ(rotated, angleZ);
      return Vector3DUtils.projectTo2D(rotated, cameraPosition, fov, zoom);
    };

    const start2D = transformPoint(start);
    const end2D = transformPoint(end);

    graphics.line(start2D.x, start2D.y, end2D.x, end2D.y);
    graphics.pop();
  }
}