const { Block, Entity, NPC, Platformer } = (function () {
  // Constants
  const HVEL = 4; // PLEASE ADJUST AS NECESSARY, I HAVE NOT PLAYTESTED THESE CONSTANTS MAINLY
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
    constructor(x, y, z, w, h, l) {
      // Initiates x, y, z, and texture, creates hitbox
      this.x = x;
      this.y = y;
      this.z = z;
      this.hbox = new CubicHitbox(x, y, z, x + w, y + h, z + l);
    }

    /** Creates an instance of Block from a scene graph node.
     * 
     * @param {Number} w 
     * @param {Number} h 
     * @param {Number} l 
     * @param {Object} node 
     * @returns {Block}
     */
    static fromNode(w, h, l, node) {
      // This moves a vector to where the block is, and then puts the block there
      const vec = glMatrix.vec4.fromValues(0, 0, 0, 1);
      glMatrix.vec4.transformMat4(vec, vec, node.worldMatrix); // vec = node.worldMatrix * vec
      return new Block(
        vec[0] - 0.5 * w,
        vec[1] - 0.5 * h,
        vec[2] - 0.5 * l,
        w,
        h,
        l
      );
    }
  }

  /** Entity
   * @class Entity
   * @typedef {Entity}
   */
  class Entity {
    /** Creates an instance of Entity.
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
        x + this.constructor.width,
        y + this.constructor.height, // Switched height to y-axis, VERY IMPORTANT!
        z + this.constructor.width,
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

    /** Resets hitbox.
     *
     */
    resetHitbox() {
      this.hbox.set(
        this.x,
        this.y,
        this.z,
        this.x + this.constructor.width,
        this.y + this.constructor.height, // Y axis is up down, not forward back.
        this.z + this.constructor.width,
      );
    }

    /** Damages entity.
     *
     * @param {Number} by
     */
    damage(by) {
      this.health -= by;
      if (this.health < 0) {
        this.health = 0;
      }
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

    /** Steps entity. The events is the entity's own internal controls.
     * 
     * @param {Platformer} plat
     * @param {Object} events
     */
    step(plat, events) {
      // Manage x and z velocities.
      this.xv = 0;
      this.zv = 0;

      // Switched these around until they worked, needed to add negation signs to forward and backwards.
      if (this.health > 0 && !this.inventory.opened) {
        if (events.KeyD) {
          this.xv += HVEL * Math.cos(this.yaw);
          this.zv -= HVEL * Math.sin(this.yaw);
        }
        if (events.KeyS) {
          this.xv += HVEL * Math.sin(this.yaw);
          this.zv += HVEL * Math.cos(this.yaw);
        }
        if (events.KeyA) {
          this.xv -= HVEL * Math.cos(this.yaw);
          this.zv += HVEL * Math.sin(this.yaw);
        }
        if (events.KeyW) {
          this.xv -= HVEL * Math.sin(this.yaw);
          this.zv -= HVEL * Math.cos(this.yaw);
        }
      }
      // Handle each axis separately
      this.x += this.xv * delta;
      this.resetHitbox();
      if (this.touchingArray(plat.blocks)) {
        // Undo movement if colliding into a block
        this.x -= this.xv * delta;
        this.xv = 0;
        this.resetHitbox();
      }
      // Z axis
      this.z += this.zv * delta;
      this.resetHitbox();
      if (this.touchingArray(plat.blocks)) {
        this.z -= this.zv * delta;
        this.zv = 0;
        this.resetHitbox();
      }

      // Y movement
      this.yv += GRAV * delta;
      this.y += this.yv * delta;
      this.resetHitbox();
      if (this.touchingArray(plat.blocks)) {
        this.y -= this.yv * delta;
        // Fall damage
        if (this.yv < -1.5 * JUMP) {
          this.damage(Math.pow(-this.yv / JUMP, 3) * 2);
        }
        // Only allow jumps if falling
        if (this.health > 0 && events.Space && this.yv < 0 && !this.inventory.opened) {
          this.yv = JUMP;
        } else {
          this.yv = 0;
        }
        this.resetHitbox();
      }

      // Angling
      if (this.health > 0 && !this.inventory.opened) {
        this.yaw -= events.dx * SENS;
        this.pitch -= events.dy * SENS;
        this.pitch = clamp(this.pitch, -Math.PI / 2, Math.PI / 2);
      }

      // Inventory
      if (events.KeyE && !eventsPrev.KeyE) {
        this.inventory.toggleOpened();
      }

      // Digits (to change inventory slot)
      for (let i = 1; i <= 9 && i <= this.inventory.slots[0].length; i++) {
        if (events[`Digit${i}`]) {
          this.inventory.selected = i - 1;
        }
      }

      // Inventory item usage
      if (events.MouseLeft && !eventsPrev.MouseLeft) {
        const slot = this.inventory.slots[0][this.inventory.selected];
        if (slot.content?.use) {
          const consumed = slot.content.use(this);
          if (consumed) {
            slot.amount --;
            if (slot.amount == 0) {
              slot.content = null;
            }
          }
        }
      }
    }
  }

  /** Non-player character, for use in the platforming engine
   *
   * @class NPC
   * @typedef {NPC}
   */
  class NPC extends Entity {
    static width = 1;
    static height = 0.75;

    /** Creates an instance of NPC.
     *
     * @constructor
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     */
    constructor(x, y, z, renderComponent) {
      super(x, y, z);
      this.renderComponent = renderComponent;
      this.ai = function(plat) {
        return {dx: 0, dy: 0};
      };
    }

    /** Adds the NPC to the scene.
     *
     * @param {Scene} scene
     */
    addToScene(scene) {
      scene.addComponent(this.renderComponent);
    }

    /** Updates render component.
     *
     */
    updateRenderComponent() {
      this.renderComponent.transform.setTranslation(
        this.x + this.constructor.width / 2,
        this.y + this.constructor.height / 2,
        this.z + this.constructor.width / 2
      );
      this.renderComponent.transform.setRotation(0, 0, this.yaw);
    }

    /** Sets ai. Takes function (plat) { return events; }.
     * 
     * @param {Function} ai 
     */
    setAI(ai) {
      this.ai = ai;
    }
  }

  /** Player, for use in the platforming engine
   *
   * @class Player
   * @typedef {Player}
   */
  class Player extends Entity {
    static width = 0.7;
    static height = 1.8;

    /** Creates an instance of Player.
     *
     * @constructor
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     */
    constructor(x, y, z) {
      super(x, y, z);
    }

    /** Orients camera.
     *
     * @param {Camera} camera
     */
    orient(camera) {
      this.resetHitbox();
      // Sets camera position
      camera.transform.setTranslation(
        this.hbox.x1 + this.constructor.width / 2,
        this.hbox.y1 + this.constructor.height - 0.3, // Same change as in the constructor!
        this.hbox.z1 + this.constructor.width / 2,
      );
      // Set rotation (0 at the end is roll, but we don't use roll)
      camera.transform.setRotation(
        (this.pitch * 180) / Math.PI,
        (this.yaw * 180) / Math.PI,
        0,
        true,
      );
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
      this.entities = [];
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
      this.player.step(this, events);
      for (const entity of this.entities) {
        entity.step(this, entity.ai.call(entity, this));
        entity.updateRenderComponent();
      }
    }
  }

  return { Block, Entity, NPC, Platformer };
})();
