// BlackExplore web — port of the SwiftUI app in ../BlackExplore/
// Hash routes mirror ContentView's NavigationLinks:
//   #timeline  BlackExploreTimeline  (requestAnimationFrame, like TimelineView)
//   #timer     BlackExploreTimer     (setInterval, like Combine Timer)
//   #font8     BlackFont8View
//   #banner    BlackBannerView

const animInterval = 100; // ms — update every tenth of a second

const colors = {
  black: '#000',
  red: '#ff3b30',   // SwiftUI .red
  green: '#34c759', // SwiftUI .green
  gold: 'rgb(255, 215, 0)',
};

const routes = {
  timeline: { title: 'Timeline', view: 'view-wheel', start: startTimeline },
  timer: { title: 'Timer', view: 'view-wheel', start: startTimer },
  font8: { title: 'Black Font 8', view: 'view-font8', start: startFont8 },
  banner: { title: 'Black Banner', view: 'view-banner', start: startBanner },
};

const $ = (id) => document.getElementById(id);
let stopCurrent = null;

function route() {
  if (stopCurrent) { stopCurrent(); stopCurrent = null; }
  const r = routes[location.hash.slice(1)];
  for (const v of document.querySelectorAll('main > section')) v.hidden = true;
  $('back').hidden = !r;
  $('navTitle').textContent = r ? r.title : '';
  document.title = r ? `${r.title} · BlackExplore` : 'BlackExplore';
  if (!r) { $('view-home').hidden = false; return; }
  $(r.view).hidden = false;
  stopCurrent = r.start();
}
window.addEventListener('hashchange', route);
route();

// ---------------------------------------------------------------- wheel

function drawBlackExplore(ctx, width, height, startingAngle, innerRect, ninner) {
  // Square box filling the shorter side, centered
  let box;
  if (innerRect) {
    box = innerRect;
  } else {
    const dim = Math.min(width, height);
    box = { x: (width - dim) / 2, y: (height - dim) / 2, w: dim };
  }
  const cx = box.x + box.w / 2;
  const cy = box.y + box.w / 2;
  const radius = box.w / 2;
  const deltaAngle = (Math.PI * 2) / 3;
  const marginAngle = deltaAngle / 4;
  let startAngle = startingAngle - Math.PI / 2 + marginAngle / 2;

  // Outer black circle
  circle(ctx, cx, cy, radius, colors.black);
  // Red, green, gold segments
  for (const color of [colors.red, colors.green, colors.gold]) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + deltaAngle - marginAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    startAngle += deltaAngle;
  }
  // Inner black circle
  const dx = box.w / 4;
  const ibox = { x: box.x + dx, y: box.y + dx, w: box.w - dx * 2 };
  circle(ctx, cx, cy, ibox.w / 2, colors.black);

  const n = ninner ?? 16;
  if (!innerRect || n > 0) {
    drawBlackExplore(ctx, ibox.w, ibox.w, startingAngle + Math.PI * 0.06, ibox, n - 1);
  }
}

function circle(ctx, cx, cy, r, color) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function wheelRenderer() {
  const canvas = $('wheelCanvas');
  const ctx = canvas.getContext('2d');
  return (angle) => {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    drawBlackExplore(ctx, w, h, angle);
  };
}

// TimelineView(.animation(minimumInterval: 0.1)) — redraw on frames at most every 0.1s
function startTimeline() {
  const render = wheelRenderer();
  let angle = Math.PI;
  let last = 0;
  let raf;
  const frame = (t) => {
    if (t - last >= animInterval) {
      last = t;
      angle += Math.PI / 180;
    }
    render(angle);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

// Timer.publish(every: 0.1) — fixed interval, independent of display frames
function startTimer() {
  const render = wheelRenderer();
  let angle = Math.PI;
  render(angle);
  const id = setInterval(() => {
    angle += (Math.PI * 2) / 360;
    render(angle);
  }, animInterval);
  const onResize = () => render(angle);
  window.addEventListener('resize', onResize);
  return () => { clearInterval(id); window.removeEventListener('resize', onResize); };
}

// ---------------------------------------------------------------- font 8

function startFont8() {
  const input = $('font8Input');
  const pre = $('font8Pre');
  const stage = pre.parentElement;
  const fontSize = 31;
  const scale = 2;
  const update = () => {
    pre.textContent = buildFont8String(input.value || ' ', scale).join('\n');
    // Shrink to fit the stage (the iOS view clips instead)
    pre.style.fontSize = fontSize + 'px';
    const fit = Math.min(1, stage.clientWidth / pre.scrollWidth, stage.clientHeight / pre.scrollHeight);
    pre.style.fontSize = Math.max(2, fontSize * fit) + 'px';
  };
  update();
  input.addEventListener('input', update);
  window.addEventListener('resize', update);
  return () => { input.removeEventListener('input', update); window.removeEventListener('resize', update); };
}

// ---------------------------------------------------------------- banner

// Scrolls the font-8 banner right to left in a seamless loop
function startBanner() {
  const input = $('bannerInput');
  const stage = $('bannerStage');
  const track = $('bannerTrack');
  const baseFontSize = 16;
  const scale = 1;
  const speed = 60; // px per second at the base font size
  let copyWidth = 0;
  let k = 1; // scale factor so the banner's height fills the stage
  const start = performance.now();

  const build = () => {
    const text = buildFont8String(input.value || ' ', scale).join('\n');
    track.textContent = '';
    // Measure at the base size, then scale the font so the height fills the stage
    const first = makePre(text, baseFontSize);
    track.append(first);
    const h = first.getBoundingClientRect().height;
    k = h > 0 ? stage.clientHeight / h : 1;
    const fontSize = baseFontSize * k;
    first.style.fontSize = fontSize + 'px';
    copyWidth = first.getBoundingClientRect().width;
    // Enough copies to cover the stage plus one extra for wrap-around
    const copies = copyWidth > 0 ? Math.ceil(stage.clientWidth / copyWidth) + 1 : 1;
    for (let i = 1; i < copies; i++) track.append(makePre(text, fontSize));
  };
  const makePre = (text, fontSize) => {
    const pre = document.createElement('pre');
    pre.className = 'glyphs';
    pre.style.fontSize = fontSize + 'px';
    pre.textContent = text;
    return pre;
  };

  let raf;
  const frame = (t) => {
    const elapsed = (t - start) / 1000;
    const phase = copyWidth > 0 ? (elapsed * speed * k) % copyWidth : 0;
    track.style.transform = `translate(${-phase}px, -50%)`;
    raf = requestAnimationFrame(frame);
  };

  build();
  raf = requestAnimationFrame(frame);
  input.addEventListener('input', build);
  window.addEventListener('resize', build);
  return () => {
    cancelAnimationFrame(raf);
    input.removeEventListener('input', build);
    window.removeEventListener('resize', build);
  };
}
