// Utils

// make plat global
let plat;

/**
 * Utility function for clamping number values. Comes from https://www.omarileon.me/blog/javascript-clamp.
 *
 * @param {number} num
 * @param {number} lower
 * @param {number} upper
 * @returns {number}
 */
function clamp(num, lower, upper) {
  return Math.min(Math.max(num, lower), upper);
}

// Delta
let delta = 0;
let past = Date.now();

/** Utility function for updating delta clock.
 * 
 */
function updateDelta() {
  // Calculates the difference between the last frame and this frame, then resets the last frame time
  const now = Date.now();
  delta = Math.min((now - past) / 1000, 0.1);
  past = now;
}

// Canvas and overlay
const canvas = document.querySelector("#canvas");
const overlay = document.querySelector("#overlay");
canvas.width = canvas.getBoundingClientRect().width;
canvas.height = canvas.getBoundingClientRect().height;
overlay.width = overlay.getBoundingClientRect().width;
overlay.height = overlay.getBoundingClientRect().height;
const ctx2D = overlay.getContext("2d");

// Events (events + mouse)
const events = {dx: 0, dy: 0};
const eventsPrev = {dx: 0, dy: 0};
let mouseX = 0;
let mouseY = 0;
let pointerInUse = false;

// When key down, mark it as true
document.addEventListener("keydown", e => {
  events[e.code] = true;
  // Shift shortcut
  events.Shift = events.ShiftLeft || events.ShiftRight;
})

// Similar to above
document.addEventListener("keyup", e => {
  events[e.code] = false;
  events.Shift = events.ShiftLeft || events.ShiftRight;
})

// Lock pointer upon click
overlay.addEventListener("mousedown", () => {
  overlay.requestPointerLock();
})

/** Mouse movement event listener
 * 
 * @param {*} event 
 */
function onMouseMove(event) {
  events.dx = event.movementX;
  events.dy = event.movementY;
  if (pointerInUse) {
    mouseX += events.dx;
    mouseY += events.dy;
    mouseX = clamp(mouseX, 0, overlay.width);
    mouseY = clamp(mouseY, 0, overlay.height);
  }
}

// More listeners
function onMouseDown() {
  events.Mouse = true;
}

function onMouseUp() {
  events.Mouse = false;
}

// Turn pointer on and off
function turnPointerOn() {
  pointerInUse = true;
  mouseX = overlay.width / 2;
  mouseY = overlay.height / 2;
}

function turnPointerOff() {
  pointerInUse = false;
}

function togglePointer() {
  (pointerInUse ? turnPointerOff : turnPointerOn)();
}

// Draw pointer if in use
function drawPointer() {
if (pointerInUse) {
    ctx2D.lineWidth = 1;
    ctx2D.strokeStyle = "#000000";
    ctx2D.fillStyle = "#ffffff";
    ctx2D.translate(mouseX, mouseY);
    ctx2D.beginPath();
    ctx2D.moveTo(0, 0);
    ctx2D.lineTo(10, 13);
    ctx2D.lineTo(6, 13);
    ctx2D.lineTo(7, 18);
    ctx2D.lineTo(4, 19);
    ctx2D.lineTo(3, 14);
    ctx2D.lineTo(0, 17);
    ctx2D.closePath();
    ctx2D.fill();
    ctx2D.stroke();
    ctx2D.resetTransform();
  }
}

// When pointer is locked
document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement == overlay) {
    // Mouse stuff
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
  } else {
    // Stop tracking mouse stuff
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("mouseup", onMouseUp);
    events.Mouse = false;
  }
})