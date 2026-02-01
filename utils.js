// Utils

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

// Canvas
const canvas = document.querySelector("#canvas");

// Events (events + mouse)
const events = {dx: 0, dy: 0};
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
canvas.addEventListener("mousedown", () => {
    canvas.requestPointerLock();
})

// Mouse movement event listener
/**
 * 
 * @param {*} event 
 */
function onMouseMove(event) {
    events.dx = event.movementX;
    events.dy = event.movementY;
}

// More listeners
function onMouseDown() {
    events.Mouse = true;
}

function onMouseUp() {
    events.Mouse = false;
}

// When pointer is locked
document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement == canvas) {
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