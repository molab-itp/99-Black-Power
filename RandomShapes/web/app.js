// RandomShapes web — port of the SwiftUI app in ../RandomShapes/
// Hash routes mirror MainView's TabView:
//   #shape1  Shape1  renderCircles + renderGraphics, sized to the view (GeometryReader)
//   #shape2  Shape2  renderArcs(pi)
//   #shape3  Shape3  renderArcs(startAngle) + slider
//   #shape4  Shape4  renderArcs(startAngle) + slider, turning 1° every 0.1s
//   #shape5  Shape5  renderColorGrid + Shuffle button
// The render* functions draw on a 2D canvas the same way the Swift versions
// draw with UIGraphicsImageRenderer.

// UIKit colors (not SwiftUI): pure RGB primaries
const UIColor = {
  black: '#000000',
  red: '#ff0000',
  green: '#00ff00',
  yellow: '#ffff00',
  darkGray: '#555555',
  gold: 'rgb(255, 215, 0)', // Graphics.swift
};

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------- canvas helper

// Size a canvas to width x height CSS pixels, sharp on high-DPI screens.
// Returns a 2D context in CSS-pixel units, like a UIGraphicsImageRenderer context.
function imageRenderer(canvas, width, height) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  canvas.style.width = `${width}px`;
  canvas.style.height = 'auto';
  canvas.style.aspectRatio = `${width} / ${height}`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  // CGContext defaults: black stroke, 1pt line
  ctx.strokeStyle = UIColor.black;
  ctx.lineWidth = 1;
  return ctx;
}

function ellipsePath(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
}

function insetBy(r, dx, dy) {
  return { x: r.x + dx, y: r.y + dy, w: r.w - dx * 2, h: r.h - dy * 2 };
}

// ---------------------------------------------------------------- Shape1.swift

function renderCircles(canvas, width, height) {
  const ctx = imageRenderer(canvas, width, height);
  const box = { w: width, h: height };
  let ibox = { x: 0, y: 0, w: box.w, h: box.w };
  const dx = box.w / 8;
  for (const color of [UIColor.black, UIColor.red, UIColor.green, UIColor.gold]) {
    ctx.fillStyle = color;
    ellipsePath(ctx, ibox.x, ibox.y, ibox.w, ibox.h);
    ctx.fill();
    ibox = insetBy(ibox, dx, dx);
  }
}

// ---------------------------------------------------------------- renderGraphics.swift

function renderGraphics(canvas, width, height) {
  const ctx = imageRenderer(canvas, width, height);
  const len = Math.trunc(width / 4);
  const hi = height;
  const bars = [UIColor.red, UIColor.green, UIColor.yellow, UIColor.black];
  bars.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(len * i, 0, len, hi);
  });
  ctx.strokeStyle = UIColor.darkGray;
  let box = { x: 0, y: 0, w: width, h: height };
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  for (let i = 0; i <= 5; i++) {
    box = insetBy(box, 4, 4);
    ctx.strokeRect(box.x, box.y, box.w, box.h);
  }
}

// ---------------------------------------------------------------- Shape2.swift

// drawPath(using: .fillStroke): fill closes the path implicitly, stroke does not
function fillStroke(ctx) {
  ctx.fill();
  ctx.stroke();
}

function renderArcs(canvas, astartAngle, width = 400, height = 400) {
  const ctx = imageRenderer(canvas, width, height);
  const box = { w: width, h: height };
  let ibox = { x: 0, y: 0, w: box.w, h: box.w };

  ctx.fillStyle = UIColor.black;
  ellipsePath(ctx, ibox.x, ibox.y, ibox.w, ibox.h);
  fillStroke(ctx);

  const cx = box.w / 2;
  const cy = box.h / 2;
  const radius = box.w / 2;
  const deltaAngle = (Math.PI * 2) / 3;
  const marginAngle = deltaAngle / 10;
  let startAngle = astartAngle - Math.PI / 2 + marginAngle / 2;
  let endAngle = startAngle + deltaAngle;

  for (const color of [UIColor.red, UIColor.green, UIColor.gold]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle - marginAngle);
    fillStroke(ctx);
    startAngle += deltaAngle;
    endAngle += deltaAngle;
  }

  const dx = box.w / 3.5;
  ibox = insetBy(ibox, dx, dx);
  ctx.fillStyle = UIColor.black;
  ellipsePath(ctx, ibox.x, ibox.y, ibox.w, ibox.h);
  fillStroke(ctx);
}

// ---------------------------------------------------------------- Shape5.swift

let myColors = [UIColor.black, UIColor.red, UIColor.green, UIColor.gold];
let myColorIndex = 0;

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomColorIndex() {
  myColorIndex = Math.floor(Math.random() * myColors.length);
  // Fisher-Yates shuffle
  for (let i = myColors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [myColors[i], myColors[j]] = [myColors[j], myColors[i]];
  }
}

function renderColorGrid(canvas) {
  const width = 400;
  const height = 400;
  const ctx = imageRenderer(canvas, width, height);
  const ibox = { x: 0, y: 0, w: width, h: width };

  ctx.fillStyle = UIColor.black;
  ellipsePath(ctx, ibox.x, ibox.y, ibox.w, ibox.h);
  fillStroke(ctx);

  let x = 0;
  let y = 0;
  const w = 50;
  const h = 50;
  while (true) {
    ctx.fillStyle = randomElement(myColors);
    ctx.fillRect(x, y, w, h);
    x = x + w;
    if (x > ibox.w) {
      x = 0;
      y += h;
      if (y > ibox.h) break;
    }
  }
}

// ---------------------------------------------------------------- views

// Each view: start() runs when its tab is shown and may return a stop function.
const views = {
  shape1: { start: startShape1 },
  shape2: { start: startShape2 },
  shape3: { start: startShape3 },
  shape4: { start: startShape4 },
  shape5: { start: startShape5 },
};

// Shape1 — GeometryReader: images sized from the view's width and height
function startShape1() {
  const section = $('view-shape1');
  const draw = () => {
    const w = section.clientWidth;
    const h = section.clientHeight;
    if (!w || !h) return;
    renderCircles($('circlesCanvas'), w, h / 2);
    renderGraphics($('graphicsCanvas'), Math.trunc(w), Math.trunc(h / 3));
  };
  const ro = new ResizeObserver(draw);
  ro.observe(section);
  return () => ro.disconnect();
}

function startShape2() {
  renderArcs($('shape2Canvas'), Math.PI);
}

// @State startAngle = random in 0...pi, kept across tab switches like TabView
let shape3Angle = Math.random() * Math.PI;
function startShape3() {
  const slider = $('shape3Slider');
  const draw = () => renderArcs($('shape3Canvas'), shape3Angle);
  slider.value = shape3Angle;
  slider.oninput = () => { shape3Angle = Number(slider.value); draw(); };
  draw();
}

let shape4Angle = Math.random() * Math.PI;
function startShape4() {
  const slider = $('shape4Slider');
  const draw = () => {
    renderArcs($('shape4Canvas'), shape4Angle);
    slider.value = shape4Angle; // like Slider, pins at the end once past 2π
  };
  slider.oninput = () => { shape4Angle = Number(slider.value); draw(); };
  draw();
  // Timer.publish(every: 0.1) — add 1° each tick
  const id = setInterval(() => {
    shape4Angle += (Math.PI * 2) / 360;
    draw();
  }, 100);
  return () => clearInterval(id);
}

// @State uiImage = renderColorGrid() — drawn once, redrawn on Shuffle
let shape5Drawn = false;
function startShape5() {
  if (!shape5Drawn) {
    renderColorGrid($('shape5Canvas'));
    shape5Drawn = true;
  }
  randomColorIndex(); // .onAppear
}
$('shuffle').onclick = () => {
  randomColorIndex();
  renderColorGrid($('shape5Canvas'));
};

// ---------------------------------------------------------------- routing

let stopCurrent = null;

function route() {
  if (stopCurrent) { stopCurrent(); stopCurrent = null; }
  const name = views[location.hash.slice(1)] ? location.hash.slice(1) : 'shape1';
  for (const v of document.querySelectorAll('main > section')) v.hidden = v.id !== `view-${name}`;
  for (const a of document.querySelectorAll('nav a')) {
    if (a.getAttribute('href') === `#${name}`) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  document.title = `${name[0].toUpperCase()}${name.slice(1)} · RandomShapes`;
  stopCurrent = views[name].start() || null;
}
window.addEventListener('hashchange', route);
route();
