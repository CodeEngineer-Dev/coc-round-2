// Held item
const held = new RenderComponent("items/sword");

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

function positionHeld(up) {
  // ChatGPT helped me understand how to implement the quaternion math
  let forwardVec = renderer.scene.camera.transform.getForward();
  let upVec = renderer.scene.camera.transform.getUp();
  let scaledVec = glMatrix.vec3.create();
  glMatrix.vec3.scale(scaledVec, upVec, up);
  glMatrix.vec3.add(forwardVec, forwardVec, scaledVec); // set forwardVec to forwardVec - upVec * 0.9
  
  let playerTranslation = renderer.scene.camera.transform.translation;
  
  let rotor = glMatrix.quat.create();
  glMatrix.quat.setAxisAngle(rotor, upVec, angle); // set rotor to rotate about upVec by angle
  let playerRotation = renderer.scene.camera.transform.rotation;
  glMatrix.vec3.transformQuat(forwardVec, forwardVec, rotor); // rotate the forwardVec by angle to move the sword to the right
  held.transform.setTranslation(
    playerTranslation[0] + forwardVec[0] * 0.7,
    playerTranslation[1] + forwardVec[1] * 0.7,
    playerTranslation[2] + forwardVec[2] * 0.7
  );
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
      positionHeld(-0.9 + 1 - Math.min(Math.pow((Date.now() - (this.data.lastUse ?? -Infinity)) / 250, 0.5), 1));
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