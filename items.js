function createContext(width, height) {
  const texture = document.createElement("canvas");
  texture.width = width;
  texture.height = height;
  const context = texture.getContext("2d");
  return context;
}

const texture1 = createContext(16, 16);
texture1.fillStyle = "#ff0000";
texture1.fillRect(0, 0, 8, 8);

const texture2 = createContext(16, 16);
texture2.fillStyle = "#0000ff";
texture2.fillRect(0, 0, 8, 8);

function positionHeld(up, forward, rot, yaw, pitch, roll) {
  // ChatGPT helped me understand how to implement the quaternion math
  let forwardVec = renderer.scene.camera.transform.getForward();
  let rightVec = renderer.scene.camera.transform.getRight();
  let upVec = renderer.scene.camera.transform.getUp();
  let buffer = glMatrix.vec3.create();
  let translationVec = glMatrix.vec3.create();
  glMatrix.vec3.scale(buffer, upVec, up);
  glMatrix.vec3.scale(translationVec, forwardVec, forward);
  glMatrix.vec3.add(translationVec, buffer, translationVec); // set forwardVec to forwardVec - upVec * 0.9

  let playerTranslation = renderer.scene.camera.transform.translation;

  let rotor = glMatrix.quat.create();
  glMatrix.quat.setAxisAngle(rotor, upVec, rot);
  glMatrix.vec3.transformQuat(translationVec, translationVec, rotor);
  held.transform.setTranslation(
    playerTranslation[0] + translationVec[0] * 0.7,
    playerTranslation[1] + translationVec[1] * 0.7,
    playerTranslation[2] + translationVec[2] * 0.7,
  );
  let playerRotation = glMatrix.quat.clone(
    renderer.scene.camera.transform.rotation,
  );
  let yawRotor = glMatrix.quat.create();
  let pitchRotor = glMatrix.quat.create();
  let rollRotor = glMatrix.quat.create();
  glMatrix.quat.setAxisAngle(rollRotor, forwardVec, roll);
  glMatrix.quat.setAxisAngle(pitchRotor, rightVec, pitch);
  glMatrix.quat.setAxisAngle(yawRotor, upVec, yaw);
  glMatrix.quat.multiply(playerRotation, rollRotor, playerRotation);
  glMatrix.quat.multiply(playerRotation, pitchRotor, playerRotation);
  glMatrix.quat.multiply(playerRotation, yawRotor, playerRotation);
  held.transform.setRotationQuaternion(playerRotation);
}

const p_sword = new ItemPrototype(
  "Sword",
  {
    stackable: false,
    iconGetter: function() {
      return texture1.canvas;
    },
    model: function() {
      held.mesh = "items/sword";
      held.transform.setScale(0.5, 0.5, 0.5);
      const attackThing = 1 - Math.min(Math.pow((Date.now() - (this.data.lastUse ?? -Infinity)) / 250, 0.5), 1);
      positionHeld(-0.9, 1, (attackThing * 1.25 - 1) * Math.PI * 0.3, attackThing * 2, - attackThing / 5, attackThing);
    },
    use: function(user) {
      if (Date.now() - this.data.lastUse >= 250) {
        this.data.lastUse = Date.now();
        const cone = new Cone(
          user.x + user.constructor.width / 2,
          user.y + user.constructor.height - 0.3,
          user.z + user.constructor.width / 2,
          user.yaw, user.pitch, Math.PI / 4
        );
        const intersect = cone.collideEntities([...plat.entities, plat.player].filter(e => e != user));
        for (const entry of intersect) {
          if ((entry.entity instanceof NPC || entry.entity instanceof Player) && entry.data?.dist < 4) {
            entry.entity.indirectDamage({strength: 10, from: user});
          }
        }
      }
      else {
        this.data.lastUse = Date.now();
      }
);

const p_dagger = new ItemPrototype(
  "Dagger",
  {
    stackable: false,
    iconGetter: function() {
      return texture2.canvas;
    },
    model: function() {
      held.mesh = "items/dagger";
      held.transform.setScale(0.5, 0.5, 0.5);
      const attackThing = 1 - Math.min(Math.pow((Date.now() - (this.data.lastUse ?? -Infinity)) / 500, 0.5), 1);
      positionHeld(-0.7, attackThing + 1, -Math.PI * 0.3 + attackThing * 0.5, 0, Math.PI / 2 * (1 - attackThing), 0);
    },
    use: function(user) {
      if (Date.now() - this.data.lastUse >= 500) {
        this.data.lastUse = Date.now();
        const ray = new Ray(
          user.x + user.constructor.width / 2,
          user.y + user.constructor.height - 0.3,
          user.z + user.constructor.width / 2,
          user.yaw, user.pitch
        );
        const intersect = ray.collideEntities([...plat.blocks, ...plat.entities, plat.player].filter(e => e != user));
        if ((intersect.entity instanceof NPC || intersect.entity instanceof Player) && intersect.data?.t < 4) {
          intersect.entity.indirectDamage({strength: 25, from: user});
        }
      } else {
        this.data.lastUse = Date.now();
      }
);

const p_apple = new ItemPrototype("Apple", {
  stackable: true,
  iconGetter: function () {
    return texture2.canvas;
  },
  model: function () {
    held.mesh = "items/red-apple";
    held.transform.setScale(0.5, 0.5, 0.5);
    positionHeld(-0.7, 1, -Math.PI * 0.3, 0, Math.PI / 2, 0);
  },
  use: function (user) {
    user.health += 15;
    user.health = Math.min(user.health, user.maxHealth);
    return true;
  },
});
