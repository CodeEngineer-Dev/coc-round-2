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

function positionHeld(up, rot, yaw, pitch, roll) {
  // ChatGPT helped me understand how to implement the quaternion math
  let forwardVec = renderer.scene.camera.transform.getForward();
  let rightVec = renderer.scene.camera.transform.getRight();
  let upVec = renderer.scene.camera.transform.getUp();
  let translationVec = glMatrix.vec3.create();
  glMatrix.vec3.scale(translationVec, upVec, up);
  glMatrix.vec3.add(translationVec, forwardVec, translationVec); // set forwardVec to forwardVec - upVec * 0.9
  
  let playerTranslation = renderer.scene.camera.transform.translation;
  
  let rotor = glMatrix.quat.create();
  glMatrix.quat.setAxisAngle(rotor, upVec, rot);
  glMatrix.vec3.transformQuat(translationVec, translationVec, rotor);
  held.transform.setTranslation(
    playerTranslation[0] + translationVec[0] * 0.7,
    playerTranslation[1] + translationVec[1] * 0.7,
    playerTranslation[2] + translationVec[2] * 0.7
  );
  let playerRotation = glMatrix.quat.clone(renderer.scene.camera.transform.rotation);
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

const proto1 = new ItemPrototype(
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
      positionHeld(-0.9, (attackThing * 1.25 - 1) * Math.PI * 0.3, attackThing * 2, - attackThing / 5, attackThing);
    },
    use: function() {
      this.data.lastUse = Date.now();
    },
  }
);

const p_apple = new ItemPrototype(
  "Apple",
  {
    stackable: true,
    iconGetter: function() {
      return texture2.canvas;
    },
    model: function() {
    },
    use: function() {
      plat.player.health += 15;
      plat.player.health = Math.min(plat.player.health, plat.player.maxHealth);
      return true;
    },
  }
);