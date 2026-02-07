const { Block, Platformer } = (function () {
  // Constants
  const HVEL = 3; // PLEASE ADJUST AS NECESSARY, I HAVE NOT PLAYTESTED THESE CONSTANTS MAINLY
  const JUMP = 10; // BECAUSE I HAVE NO IDEA HOW TO ADD A BLOCK TO THE SCENE.
  const GRAV = -30;
  const SENS = Math.PI / 250; // mouse sensitivity

  /** Block, for use in the platforming engine
   *
   * @class Block
   * @typedef {Block}
   */
  class Block {
    /** Creates an instance of Block.
     *
     * @constructor
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     */
    constructor(x, y, z, w, h, l, renderComponent) {
      // Initiates x, y, z, and texture, creates hitbox
      this.x = x;
      this.y = y;
      this.z = z;
      this.hbox = new CubicHitbox(x, y, z, x + w, y + h, z + l);

      // Assign render component to block
      this.renderComponent = renderComponent;
    }

    static fromRenderComponent(w, h, l, renderComponent) {
      return new Block(
        renderComponent.transform.translation[0] - 0.5 * w,
        renderComponent.transform.translation[1] - 0.5 * h,
        renderComponent.transform.translation[2] - 0.5 * l,
        w,
        h,
        l,
        renderComponent,
      );
    }

    /** Adds the block to the scene.
     *
     * @param {Scene} scene
     */
    addToScene(scene) {
      // addComponent to the renderer's scene
    }
  }

  /** Player, for use in the platforming engine
   *
   * @class Player
   * @typedef {Player}
   */
  class Player {
    static width = 0.7;
    static height = 1.8;

    /** Creates an instance of Block.
     *
     * @constructor
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     */
    constructor(x, y, z) {
      // Initiates x, y, z, creates hitbox
      this.x = x;
      this.y = y;
      this.z = z;
      this.hbox = new CubicHitbox(
        x,
        y,
        z,
        x + Player.width,
        y + Player.height, // Switched height to y-axis, VERY IMPORTANT!
        z + Player.width,
      );
      // Creates x, y, z velocities
      this.xv = 0;
      this.yv = 0;
      this.zv = 0;
      // Yaw, pitch
      this.yaw = 0;
      this.pitch = 0;
      // Health
      this.maxHealth = 100;
      this.health = this.maxHealth;
      this.displayHealth = this.health; // For a smooth animation when damaging or regen-ing
      // Inventory
      this.inventory = new Inventory();
    }

    /** Orients camera.
     *
     * @param {Camera} camera
     */
    orient(camera) {
      this.resetHitbox();
      // Sets camera position
      camera.transform.setTranslation(
        this.hbox.x1 + Player.width / 2,
        this.hbox.y1 + Player.height - 0.3, // Same change as in the constructor!
        this.hbox.z1 + Player.width / 2,
      );
      // Set rotation (0 at the end is roll, but we don't use roll)
      camera.transform.setRotation(
        (this.pitch * 180) / Math.PI,
        (this.yaw * 180) / Math.PI,
        0,
        true,
      );
    }

    /** Resets hitbox.
     *
     */
    resetHitbox() {
      this.hbox.set(
        this.x,
        this.y,
        this.z,
        this.x + Player.width,
        this.y + Player.height, // Y axis is up down, not forward back.
        this.z + Player.width,
      );
    }

    /** Damages player.
     *
     * @param {Number} by
     */
    damage(by) {
      this.health -= by;
      if (this.health < 0) {
        this.health = 0;
      }
    }

    /** Displays overlay on 2D context.
     *
     */
    healthBar() {
      // Draw health bar
      ctx2D.fillStyle = "#ff5f5f";
      ctx2D.fillRect(30, 30, (this.displayHealth / this.maxHealth) * 100, 20);
      // Draw outline
      ctx2D.strokeStyle = "#ffffff";
      ctx2D.lineWidth = 3;
      ctx2D.strokeRect(30, 30, 100, 20);
      // Text number
      ctx2D.fillStyle = "#ffffff";
      ctx2D.font = "15px Arial";
      ctx2D.textBaseline = "middle";
      ctx2D.textAlign = "center";
      ctx2D.fillText(Math.ceil(this.health), 80, 40);
      // Update display health
      this.displayHealth =
        this.health + (this.displayHealth - this.health) * 0.9;
    }

    /** Takes an array, returns first object to collide with or null.
     *
     * @param {Array} arr
     * @returns {*}
     */
    touchingArray(arr) {
      for (const obj of arr) {
        if (this.hbox.collide(obj.hbox)) {
          return obj;
        }
      }
      return null;
    }
  }

  /** Platformer game class, handles platforming logic
   *
   * @class Platformer
   * @typedef {Platformer}
   */
  class Platformer {
    /** Creates an instance of Platformer.
     *
     * @param {Number} spawnX
     * @param {Number} spawnY
     * @param {Number} spawnZ
     */
    constructor(spawnX, spawnY, spawnZ) {
      this.spawnX = spawnX;
      this.spawnY = spawnY;
      this.spawnZ = spawnZ;
      this.player = new Player(spawnX, spawnY, spawnZ);
      this.blocks = [];
    }
    /** Adds a block to the blocks.
     *
     * @param {Block} block
     */
    addBlock(block) {
      this.blocks.push(block);
    }
    /** Steps the platformer forward in time.
     *
     */
    step() {
      const p = this.player;
      // Manage x and z velocities, PLEASE ADJUST AS NECESSARY, NOT PLAYTESTED
      p.xv = 0;
      p.zv = 0;

      // Switched these around until they worked, needed to add negation signs to forward and backwards.
      if (p.health > 0 && !p.inventory.opened) {
        if (events.KeyD) {
          p.xv += HVEL * Math.cos(p.yaw);
          p.zv -= HVEL * Math.sin(p.yaw);
        }
        if (events.KeyS) {
          p.xv += HVEL * Math.sin(p.yaw);
          p.zv += HVEL * Math.cos(p.yaw);
        }
        if (events.KeyA) {
          p.xv -= HVEL * Math.cos(p.yaw);
          p.zv += HVEL * Math.sin(p.yaw);
        }
        if (events.KeyW) {
          p.xv -= HVEL * Math.sin(p.yaw);
          p.zv -= HVEL * Math.cos(p.yaw);
        }
      }
      // Handle each axis separately
      p.x += p.xv * delta;
      p.resetHitbox();
      if (p.touchingArray(this.blocks)) {
        p.x -= p.xv * delta;
        p.xv = 0;
        p.resetHitbox();
      }
      // Z axis
      p.z += p.zv * delta;
      p.resetHitbox();
      if (p.touchingArray(this.blocks)) {
        p.z -= p.zv * delta;
        p.zv = 0;
        p.resetHitbox();
      }

      // Y movement
      p.yv += GRAV * delta;
      p.y += p.yv * delta;
      p.resetHitbox();
      if (p.touchingArray(this.blocks)) {
        p.y -= p.yv * delta;
        // Fall damage
        if (p.yv < -1.5 * JUMP) {
          p.damage(Math.pow(-p.yv / JUMP, 3) * 2);
        }
        // Only allow jumps if falling
        if (p.health > 0 && events.Space && p.yv < 0 && !p.inventory.opened) {
          p.yv = JUMP;
        } else {
          p.yv = 0;
        }
        p.resetHitbox();
      }

      // Angling
      if (p.health > 0 && !p.inventory.opened) {
        p.yaw -= events.dx * SENS;
        p.pitch -= events.dy * SENS;
        p.pitch = clamp(p.pitch, -Math.PI / 2, Math.PI / 2);
      }

      // Inventory
      if (events.KeyE && !eventsPrev.KeyE) {
        p.inventory.toggleOpened();
      }

      // Digits (to change inventory slot)
      for (let i = 1; i <= 9 && i <= p.inventory.slots[0].length; i++) {
        if (events[`Digit${i}`]) {
          p.inventory.selected = i - 1;
        }
      }
    }
  }

  return { Block, Platformer };
})();
