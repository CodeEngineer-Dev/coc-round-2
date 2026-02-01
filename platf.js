const { Block, Platformer } = (function() {
    // Constants
    const HVEL = 1; // PLEASE ADJUST AS NECESSARY, I HAVE NOT PLAYTESTED THESE CONSTANTS MAINLY
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
        constructor(x, y, z, texture) {
            // Initiates x, y, z, and texture, creates hitbox
            this.x = x;
            this.y = y;
            this.z = z;
            this.texture = texture;
            this.hbox = new CubicHitbox(x, y, z, x + 1, y + 1, z + 1);
        }

        /** Adds the block to the scene.
         * 
         * @param {Scene} scene 
         */
        addToScene(scene) {
            // ok i actually have no idea how your library works, so i'm going to leave this blank for now
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
            this.hbox = new CubicHitbox(x, y, z, x + Player.width, y + Player.width, z + Player.height);
            // Creates x, y, z velocities
            this.xv = 0;
            this.yv = 0;
            this.zv = 0;
            // Yaw, pitch
            this.yaw = 0;
            this.pitch = 0;
        }

        /** Orients camera.
         * 
         * @param {Camera} camera 
         */
        orient(camera) {
            // Sets camera position
            camera.transform.setPosition(
                this.x + Player.width / 2,
                this.y + Player.width / 2,
                this.z + Player.height - 0.3
            );
            // Set rotation (0 at the end is roll, but we don't use roll)
            camera.transform.setRotation(this.pitch, this.yaw, 0);
        }

        /** Resets hitbox.
         * 
         */
        resetHitbox() {
            this.hbox.set(this.x, this.y, this.z, this.x + Player.width, this.y + Player.width, this.z + Player.height);
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
            if (events.KeyW) {
                p.xv += HVEL * Math.cos(p.yaw);
                p.zv -= HVEL * Math.sin(p.yaw);
            }
            if (events.KeyA) {
                p.xv -= HVEL * Math.sin(p.yaw);
                p.zv += HVEL * Math.cos(p.yaw);
            }
            if (events.KeyS) {
                p.xv -= HVEL * Math.cos(p.yaw);
                p.zv += HVEL * Math.sin(p.yaw);
            }
            if (events.KeyD) {
                p.xv += HVEL * Math.sin(p.yaw);
                p.zv -= HVEL * Math.cos(p.yaw);
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
                // Only allow jumps if falling
                if (events.Space && p.yv < 0) {
                    p.yv = JUMP;
                } else {
                    p.yv = 0;
                }
                p.resetHitbox();
            }

            // Angling
            p.yaw -= events.dx * SENS;
            p.pitch -= events.dy * SENS;
            p.pitch = clamp(p.pitch, -Math.PI / 2, Math.PI / 2);
        }
    }

    return { Block, Platformer };
})();