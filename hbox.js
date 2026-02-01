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