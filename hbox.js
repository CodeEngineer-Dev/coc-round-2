const [CubicHitbox, Ray, Cone, Sweep] = (function () {
  /** Axis-aligned cubic hitbox (more concisely, AABB).
   *
   * @class CubicHitbox
   * @typedef {CubicHitbox}
   */
  class CubicHitbox {
    /** Creates an instance of CubicHitbox.
     *
     * @constructor
     * @param {Number} x1
     * @param {Number} y1
     * @param {Number} z1
     * @param {Number} x2
     * @param {Number} y2
     * @param {Number} z2
     */
    constructor(x1, y1, z1, x2, y2, z2) {
      this.set(x1, y1, z1, x2, y2, z2);
    }
    /** Tests for collisions.
     *
     * @param {CubicHitbox} that
     * @returns {Boolean}
     */
    collide(that) {
      // Detects if it collides on every axis, then spits out the result
      return (
        this.x1 <= that.x2 &&
        that.x1 <= this.x2 &&
        this.y1 <= that.y2 &&
        that.y1 <= this.y2 &&
        this.z1 <= that.z2 &&
        that.z1 <= this.z2
      );
    }
    /** Sets the hitbox.
     *
     * @param {Number} x1
     * @param {Number} y1
     * @param {Number} z1
     * @param {Number} x2
     * @param {Number} y2
     * @param {Number} z2
     */
    set(x1, y1, z1, x2, y2, z2) {
      // Instead of storing the values straight from the arguments, the 1's are the minimum of the two values
      // and the 2's are the maximum, for no other reason than that it makes collisions 10 times more convenient
      this.x1 = Math.min(x1, x2);
      this.y1 = Math.min(y1, y2);
      this.z1 = Math.min(z1, z2);
      this.x2 = Math.max(x1, x2);
      this.y2 = Math.max(y1, y2);
      this.z2 = Math.max(z1, z2);
    }
  }

  /** Ray. CAN ONLY TEST WITH CubicHitbox (because, frankly, there's no need to test with itself)
   *
   * @class Ray
   * @typedef {Ray}
   */
  class Ray {
    /** Creates an instance of Ray. CAN ONLY TEST WITH CubicHitbox.
     *
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @param {Number} yaw
     * @param {Number} pitch
     */
    constructor(x, y, z, yaw, pitch) {
      this.x = x;
      this.y = y;
      this.z = z;
      // Forward vector
      this.fx = -Math.sin(yaw) * Math.cos(pitch);
      this.fy = Math.sin(pitch);
      this.fz = -Math.cos(yaw) * Math.cos(pitch);
    }

    /** Tests collisions with a cubic hitbox.
     *
     * @param {CubicHitbox} cubic
     * @returns {Object}
     */
    collide(cubic) {
      // Credits to ChatGPT for suggesting slab intersection method.
      // xyzyyxx wrote the code himself though.
      let ignoreX, ignoreY, ignoreZ;

      // X slab
      if (this.fx == 0) {
        if (this.x >= cubic.x1 && this.x <= cubic.x2) ignoreX = true;
        else return { t: Infinity };
      }
      const xt1 = (cubic.x1 - this.x) / this.fx;
      const xt2 = (cubic.x2 - this.x) / this.fx;

      // Y slab
      if (this.fy == 0) {
        if (this.y >= cubic.y1 && this.y <= cubic.y2) ignoreY = true;
        else return { t: Infinity };
      }
      const yt1 = (cubic.y1 - this.y) / this.fy;
      const yt2 = (cubic.y2 - this.y) / this.fy;

      // Z slab
      if (this.fz == 0) {
        if (this.z >= cubic.z1 && this.z <= cubic.z2) ignoreZ = true;
        else return { t: Infinity };
      }
      const zt1 = (cubic.z1 - this.z) / this.fz;
      const zt2 = (cubic.z2 - this.z) / this.fz;

      // Enter and exit time
      const enterT = Math.max(
        ignoreX ? -Infinity : Math.min(xt1, xt2),
        ignoreY ? -Infinity : Math.min(yt1, yt2),
        ignoreZ ? -Infinity : Math.min(zt1, zt2),
      );
      const exitT = Math.min(
        ignoreX ? +Infinity : Math.max(xt1, xt2),
        ignoreY ? +Infinity : Math.max(yt1, yt2),
        ignoreZ ? +Infinity : Math.max(zt1, zt2),
      );

      if (enterT > exitT || exitT < 0) {
        return { t: Infinity };
      } else {
        const t = Math.max(enterT, 0);
        const x = this.x + this.fx * t;
        const y = this.y + this.fy * t;
        const z = this.z + this.fz * t;
        return { t, x, y, z };
      }
    }

    /** Collision test with multiple entities.
     *
     * @param {Array} entities
     * @returns {Object}
     */
    collideEntities(entities) {
      // If there are no entities, then it returns a null result
      // Otherwise, it takes each entity, maps it to { entity: entity, data: collision data with ray },
      // then uses .reduce to find the closest collision.
      return entities.length == 0
        ? { entity: null, data: { t: Infinity } }
        : entities
            .map((entity) => ({
              entity: entity,
              data: this.collide(entity.hbox),
            }))
            .reduce((best, cur) => (cur.data.t < best.data.t ? cur : best));
    }
  }

  /** Cone. CAN ONLY TEST WITH CubicHitbox (because, frankly, there's no need to test with itself)
   *
   * @class Cone
   * @typedef {Cone}
   */
  class Cone {
    /** Creates an instance of Cone.
     *
     * @constructor
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @param {Number} yaw
     * @param {Number} pitch
     * @param {Number} sweepAngle
     */
    constructor(x, y, z, yaw, pitch, sweepAngle) {
      this.p = glMatrix.vec3.fromValues(x, y, z);
      const deg = 180 / Math.PI;

      // forward
      this.f = glMatrix.vec3.fromValues(
        -Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        -Math.cos(yaw) * Math.cos(pitch),
      );
      this.sweepAngle = sweepAngle;
    }

    /** Collision test with cubic hitbox.
     *
     * @param {CubicHitbox} cubic
     * @returns {Object}
     */
    collide(cubic) {
      // tests with center
      const vec = glMatrix.vec3.fromValues(
        (cubic.x1 + cubic.x2) / 2,
        (cubic.y1 + cubic.y2) / 2,
        (cubic.z1 + cubic.z2) / 2,
      );
      glMatrix.vec3.subtract(vec, vec, this.p);
      const ang = glMatrix.vec3.angle(vec, this.f);
      if (ang <= this.sweepAngle) {
        return { dist: glMatrix.vec3.length(vec) };
      } else {
        return { dist: Infinity };
      }
    }

    /** Collision test with multiple entities.
     *
     * @param {Array} entities
     * @returns {Array}
     */
    collideEntities(entities) {
      return entities.map((entity) => ({
        entity: entity,
        data: this.collide(entity.hbox),
      }));
      //.filter(entry => entry.data.dist != Infinity)
    }
  }

  // UNUSED.
  /** Sweep. CAN ONLY TEST WITH CubicHitbox (because, frankly, there's no need to test with itself)
   *
   * @class Sweep
   * @typedef {Sweep}
   */
  // AI helped me write this code, but it did not generate the code.
  class Sweep {
    /** Creates an instance of Sweep.
     *
     * @constructor
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @param {Number} yaw
     * @param {Number} pitch
     * @param {Number} sweepAngle
     */
    constructor(x, y, z, yaw, pitch, sweepAngle) {
      this.p = glMatrix.vec3.fromValues(x, y, z);
      const deg = 180 / Math.PI;

      // normal
      const q = glMatrix.quat.fromEuler(
        glMatrix.quat.create(),
        pitch * deg + 90,
        yaw * deg,
        0,
      );
      this.n = glMatrix.vec3.fromValues(1, 0, 0);
      this.n = glMatrix.vec3.transformQuat(this.n, this.n, q);

      // forward
      glMatrix.quat.fromEuler(q, pitch * deg, yaw * deg, 0);
      this.f = glMatrix.vec3.fromValues(1, 0, 0);
      this.f = glMatrix.vec3.transformQuat(this.f, this.f, q);

      this.sweepAngle = sweepAngle;
    }

    planeIntersect(auxn, r) {
      // auxn dot x = r
      // n dot x = n dot p

      // the line's vector can be found using cross product
      const linev = glMatrix.vec3.cross(glMatrix.vec3.create(), this.n, auxn);

      // edge case: parallel planes
      if (glMatrix.vec3.length(linev) < 1e-9) {
        return { type: "parallel" };
      }

      // otherwise find a point they share
      // we will solve the equations
      // auxn dot x = r
      // n dot x = n dot p
      // (n cross auxn) dot x = 0
      // ok i'll outsource all the heavy lifting to glMatrix.mat3 lol
      const mat = glMatrix.mat3.fromValues(...auxn, ...this.n, ...linev);
      // transpose mat because it is the wrong way
      glMatrix.transpose(mat, mat);
      // invert mat
      glMatrix.invert(mat, mat);
      // now apply it to the vector <r, n dot p, 0>
      const pointOnLine = glMatrix.vec3.fromValues(
        r,
        glMatrix.vec3.dot(this.n, this.p),
        0,
      );
      glMatrix.vec3.transformMat3(pointOnLine, pointOnLine, mat);

      return {
        type: "line",
        vec: linev,
        point: pointOnLine,
      };
    }

    rayCollision2D(px, py, vx, vy, x1, y1, x2, y2) {
      let ignoreX, ignoreY;

      // X slab
      if (vx == 0) {
        if (px >= x1 && px <= cubic.x2) ignoreX = true;
        else return { t: Infinity };
      }
      const xt1 = (x1 - px) / vx;
      const xt2 = (x2 - px) / vx;

      // Y slab
      if (vy == 0) {
        if (py >= y1 && py <= y2) ignoreY = true;
        else return { t: Infinity };
      }
      const yt1 = (y1 - py) / vy;
      const yt2 = (y2 - py) / vy;

      // Enter and exit time
      const enterT = Math.max(
        ignoreX ? -Infinity : Math.min(xt1, xt2),
        ignoreY ? -Infinity : Math.min(yt1, yt2),
      );
      const exitT = Math.min(
        ignoreX ? +Infinity : Math.max(xt1, xt2),
        ignoreY ? +Infinity : Math.max(yt1, yt2),
      );

      if (enterT > exitT) {
        return null;
      } else {
        const enterX = px + vx * enterX;
        const enterY = py + vy * enterY;
        const exitX = px + vx * exitX;
        const exitY = py + vy * exitY;
        return { enterT, enterX, enterY, exitT, exitX, exitY };
      }
    }

    collide(cubic) {
      const buffer = glMatrix.vec3.create();
      // check all 6 sides
      glMatrix.vec3.set(buffer, 1, 0, 0);
      const test1 = this.planeIntersect(buffer, cubic.x1); // yz, -x side
      const test2 = this.planeIntersect(buffer, cubic.x2); // yz, +x side
      glMatrix.vec3.set(buffer, 0, 1, 0);
      const test3 = this.planeIntersect(buffer, cubic.y1); // xz, -y side
      const test4 = this.planeIntersect(buffer, cubic.y2); // xz, +y side
      glMatrix.vec3.set(buffer, 0, 0, 1);
      const test5 = this.planeIntersect(buffer, cubic.z1); // xy, -z side
      const test6 = this.planeIntersect(buffer, cubic.z2); // xy, +z side
    }
  }

  return [CubicHitbox, Ray, Cone, Sweep];
})();
