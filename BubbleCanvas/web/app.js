// BubbleCanvas web — port of the SwiftUI app in ../BubbleCanvas/
//   LevelView            -> page layout: BubbleCanvas above OrientationDataView
//   BubbleCanvas         -> #level: trail image + donut bubble + crosshair marks,
//                           Alpha slider, Save / Load / Clear
//   MotionDetector       -> deviceorientation events (beta/gamma), adjusted for
//                           screen orientation like UIDeviceOrientation.adjustedRollAndPitch
//   OrientationDataView  -> "H: +00.00  V: +00.00" (roll, pitch in radians)
// Dragging on the level moves the bubble and draws, like the DragGesture.

const $ = (id) => document.getElementById(id);

// Dot colors, cycled once per second (UIKit colors)
const palette = ['#ff0000', '#00ff00', 'rgb(255, 214, 0)' /* gold */, '#000000'];

const dotSize = 20;
const range = Math.PI;
const trailKey = 'bubble-trail.png'; // like Documents/bubble-trail.png

const level = $('level');
const canvas = $('canvas');
const ctx = canvas.getContext('2d');

// Accumulated bubble trail, an offscreen canvas at device-pixel resolution
let trail = document.createElement('canvas');
let levelSize = { w: 0, h: 0 };
let dpr = window.devicePixelRatio || 1;

let dotAlpha = 0.02;
let lastPoint = null;
let dragPoint = null;
let pitch = 0;
let roll = 0;

// Transient message under the controls
let statusTimer = 0;
function status(msg) {
  $('status').textContent = msg;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { $('status').textContent = ''; }, 4000);
}

// ---------------------------------------------------------------- layout

// Resize the canvases to the level view; the trail so far is stretched to fit,
// like the trail Image .resizable() to levelSize
function resize() {
  const r = level.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width));
  const h = Math.max(1, Math.round(r.height));
  dpr = window.devicePixelRatio || 1;
  if (w === levelSize.w && h === levelSize.h && canvas.width === Math.round(w * dpr)) return;
  levelSize = { w, h };

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);

  const old = trail;
  trail = document.createElement('canvas');
  trail.width = canvas.width;
  trail.height = canvas.height;
  if (old.width && old.height) {
    trail.getContext('2d').drawImage(old, 0, 0, trail.width, trail.height);
  }
  render();
}
new ResizeObserver(resize).observe(level);

// ---------------------------------------------------------------- bubble position

// swap roll / pitch, as in the Swift app
function bubblePosition() {
  if (dragPoint) return dragPoint;
  return {
    x: ((pitch + range / 2) / range) * levelSize.w,
    y: ((roll + range / 2) / range) * levelSize.h,
  };
}

// ---------------------------------------------------------------- trail

function currentColor() {
  const second = Math.floor(Date.now() / 1000);
  return palette[second % palette.length];
}

// Append a trail dot at pt, baked straight into the trail canvas
function addDot(pt) {
  // Skip if the bubble hasn't moved
  if (lastPoint && lastPoint.x === pt.x && lastPoint.y === pt.y) return;
  lastPoint = { ...pt };
  const t = trail.getContext('2d');
  t.setTransform(dpr * trail.width / canvas.width, 0, 0, dpr * trail.height / canvas.height, 0, 0);
  t.globalAlpha = dotAlpha;
  t.fillStyle = currentColor();
  t.beginPath();
  t.arc(pt.x, pt.y, dotSize / 2, 0, Math.PI * 2);
  t.fill();
  requestRender();
}

function saveTrail() {
  try {
    localStorage.setItem(trailKey, trail.toDataURL('image/png'));
    status('Saved trail in this browser');
  } catch (e) {
    status('Save failed: ' + e.message);
  }
}

function loadTrail() {
  let png = null;
  try { png = localStorage.getItem(trailKey); } catch (e) { /* storage blocked */ }
  if (!png) { status('No saved trail'); return; }
  const img = new Image();
  img.onload = () => {
    // png is stretched to the current levelSize
    const t = trail.getContext('2d');
    t.setTransform(1, 0, 0, 1, 0, 0);
    t.globalAlpha = 1;
    t.clearRect(0, 0, trail.width, trail.height);
    t.drawImage(img, 0, 0, trail.width, trail.height);
    lastPoint = null;
    status('Loaded trail');
    requestRender();
  };
  img.src = png;
}

function clearTrail() {
  const t = trail.getContext('2d');
  t.setTransform(1, 0, 0, 1, 0, 0);
  t.clearRect(0, 0, trail.width, trail.height);
  lastPoint = null;
  requestRender();
}

// ---------------------------------------------------------------- drawing

let renderPending = false;
function requestRender() {
  if (renderPending) return;
  renderPending = true;
  requestAnimationFrame(() => { renderPending = false; render(); });
}

function render() {
  const { w, h } = levelSize;
  const css = getComputedStyle(document.documentElement);
  const fg = css.getPropertyValue('--fg').trim() || '#000';
  const accent = css.getPropertyValue('--accent').trim() || '#007aff';

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Image layer: trail baked so far
  ctx.drawImage(trail, 0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Donut: ring width 12.5 leaves a see-thru hole 50% of the diameter
  const p = bubblePosition();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 12.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 25 - 12.5 / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Center circle and crosshair marks
  ctx.strokeStyle = fg;
  ctx.fillStyle = fg;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 10, 0, Math.PI * 2);
  ctx.stroke();
  const vLine = (x, y) => ctx.fillRect(x - 0.25, y - 20, 0.5, 40);
  const hLine = (x, y) => ctx.fillRect(x - 20, y - 0.25, 40, 0.5);
  vLine(w / 2, h / 2);
  hLine(w / 2, h / 2);
  vLine(w / 2, 0);
  vLine(w / 2, h);
  hLine(0, h / 2);
  hLine(w, h / 2);
}

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', requestRender);

// ---------------------------------------------------------------- drag gesture

// Touch and drag moves the tracking circle, released returns to motion
function dragTo(e) {
  const r = level.getBoundingClientRect();
  dragPoint = {
    x: Math.min(Math.max(e.clientX - r.left, 0), levelSize.w),
    y: Math.min(Math.max(e.clientY - r.top, 0), levelSize.h),
  };
  // Draw while tracking the touch, even without motion updates
  addDot(dragPoint);
}

level.addEventListener('pointerdown', (e) => {
  try { level.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
  dragTo(e);
});
level.addEventListener('pointermove', (e) => {
  if (dragPoint) dragTo(e);
});
const endDrag = () => { dragPoint = null; requestRender(); };
level.addEventListener('pointerup', endDrag);
level.addEventListener('pointercancel', endDrag);

// ---------------------------------------------------------------- motion

// Screen rotation in degrees: 0 portrait, 90 landscapeLeft, 270 landscapeRight, 180 upside down
function screenAngle() {
  const a = screen.orientation?.angle ?? window.orientation ?? 0;
  return ((a % 360) + 360) % 360;
}

const deg = Math.PI / 180;
let motionSeen = false;

function onOrientation(e) {
  if (e.beta == null || e.gamma == null) return;
  motionSeen = true;
  const aRoll = e.gamma * deg;  // attitude.roll
  const aPitch = e.beta * deg;  // attitude.pitch
  // UIDeviceOrientation.adjustedRollAndPitch
  switch (screenAngle()) {
    case 90:  [roll, pitch] = [aPitch, -aRoll]; break;  // landscapeLeft
    case 270: [roll, pitch] = [-aPitch, aRoll]; break;  // landscapeRight
    case 180: [roll, pitch] = [-aRoll, -aPitch]; break; // portraitUpsideDown
    default:  [roll, pitch] = [aRoll, aPitch];          // portrait
  }
  $('hText').textContent = 'H: ' + fixed(roll);
  $('vText').textContent = 'V: ' + fixed(pitch);
  addDot(bubblePosition());
  requestRender();
}

// Double.describeAsFixedLengthString(): sign always, 2 integer, 2 fraction digits
function fixed(v) {
  const s = Math.abs(v).toFixed(2).padStart(5, '0');
  return (v < 0 ? '-' : '+') + s;
}

function startMotion() {
  window.addEventListener('deviceorientation', onOrientation);
  setTimeout(() => {
    if (!motionSeen) status('No motion sensor — drag on the level to draw');
  }, 1500);
}

const needsPermission = typeof DeviceOrientationEvent !== 'undefined'
  && typeof DeviceOrientationEvent.requestPermission === 'function';

if (needsPermission) {
  // iOS Safari: motion access must be requested from a tap
  const btn = $('motion');
  btn.hidden = false;
  btn.addEventListener('click', async () => {
    try {
      const result = await DeviceOrientationEvent.requestPermission();
      if (result === 'granted') {
        btn.hidden = true;
        status('Tilt to move the bubble');
        startMotion();
      } else {
        status('Motion access denied — drag on the level to draw');
      }
    } catch (e) {
      status('Motion unavailable: ' + e.message);
    }
  });
  status('Tap Enable Motion, or drag on the level to draw');
} else {
  startMotion();
}

// ---------------------------------------------------------------- controls

const alpha = $('alpha');
alpha.addEventListener('input', () => {
  dotAlpha = Number(alpha.value);
  $('alphaLabel').textContent = 'Alpha ' + dotAlpha.toFixed(2);
});

$('save').addEventListener('click', saveTrail);
$('load').addEventListener('click', loadTrail);
$('clear').addEventListener('click', clearTrail);

resize();
