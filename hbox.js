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
      this.x1 <= that.x2 && that.x1 <= this.x2 &&
      this.y1 <= that.y2 && that.y1 <= this.y2 &&
      this.z1 <= that.z2 && that.z1 <= this.z2 
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
      ignoreZ ? -Infinity : Math.min(zt1, zt2)
    );
    const exitT = Math.min(
      ignoreX ? +Infinity : Math.max(xt1, xt2),
      ignoreY ? +Infinity : Math.max(yt1, yt2),
      ignoreZ ? +Infinity : Math.max(zt1, zt2)
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

  collideEntities(entities) {
    // If there are no entities, then it returns a null result
    // Otherwise, it takes each entity, maps it to { entity: entity, data: collision data with ray },
    // then uses .reduce to find the closest collision.
    return (
      entities.length == 0 ? { entity: null, data: { t: Infinity } } :
      entities.map(entity => ({ entity: entity, data: this.collide(entity.hbox)}))
              .reduce((best, cur) => cur.data.t < best.data.t ? cur : best)
    );
  }
}

/** Sweep. CAN ONLY TEST WITH CubicHitbox (because, frankly, there's no need to test with itself)
 * 
 * @class Sweep
 * @typedef {Sweep}
 */
class Sweep {
  // i'll save this for later
  constructor(x, y, z, yaw, pitch) {

  }
}