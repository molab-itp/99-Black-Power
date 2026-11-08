// The Baby and the Boat
// A story Walter Thompson told, retold as an animated picture book.
// Plain JavaScript + canvas, no framework.

(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const stage = document.getElementById('stage');
  const caption = document.getElementById('caption');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const againBtn = document.getElementById('again');
  const dotsEl = document.getElementById('dots');

  let W = 0, H = 0;
  let current = 0;
  let sceneStart = performance.now();
  let tellings = 1; // how many times grandpa Dookie has told the story
  let captionTimers = [];
  // ?t=5 freezes every scene at 5 seconds (handy for screenshots)
  const tParam = new URLSearchParams(location.search).get('t');
  const FROZEN_T = tParam != null && isFinite(tParam) ? parseFloat(tParam) : null;

  // ---------- small helpers ----------

  // deterministic pseudo-random in [0,1) from an integer
  function rnd(i) {
    const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return s - Math.floor(s);
  }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function clamp01(u) { return Math.max(0, Math.min(1, u)); }
  function smooth(u) { u = clamp01(u); return u * u * (3 - 2 * u); }

  function grad(c, y0, y1, stops) {
    const g = c.createLinearGradient(0, y0, 0, y1);
    stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s));
    return g;
  }

  function sky(c, stops) {
    c.fillStyle = grad(c, 0, H, stops);
    c.fillRect(0, 0, W, H);
  }

  function stars(c, n, t, maxY) {
    for (let i = 0; i < n; i++) {
      const x = rnd(i) * W;
      const y = rnd(i + 500) * maxY;
      const a = 0.35 + 0.35 * Math.sin(t * (1 + rnd(i + 900) * 2) + i);
      c.fillStyle = `rgba(255,248,230,${a})`;
      c.fillRect(x, y, 1.6, 1.6);
    }
  }

  function waveAt(x, t, amp) {
    return Math.sin(x * 0.018 + t * 1.3) * amp + Math.sin(x * 0.041 - t * 0.9) * amp * 0.5;
  }

  function sea(c, y, t, top, bottom, amp) {
    amp = amp == null ? 3 : amp;
    c.fillStyle = grad(c, y, H, [top, bottom]);
    c.beginPath();
    c.moveTo(0, H);
    for (let x = 0; x <= W + 8; x += 8) c.lineTo(x, y + waveAt(x, t, amp));
    c.lineTo(W, H);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.10)';
    c.lineWidth = 1;
    for (let k = 1; k < 6; k++) {
      const yy = y + ((H - y) * k) / 6;
      const a = amp * (1 + k * 0.4);
      c.beginPath();
      for (let x = 0; x <= W + 10; x += 10) {
        const v = yy + waveAt(x + k * 90, t + k, a);
        if (x === 0) c.moveTo(x, v); else c.lineTo(x, v);
      }
      c.stroke();
    }
  }

  // standing figure, feet at (x, y), height s
  function person(c, x, y, s, col) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(x, y - s * 0.86, s * 0.13, 0, TAU);
    c.fill();
    c.beginPath();
    c.moveTo(x - s * 0.17, y);
    c.quadraticCurveTo(x - s * 0.2, y - s * 0.68, x, y - s * 0.71);
    c.quadraticCurveTo(x + s * 0.2, y - s * 0.68, x + s * 0.17, y);
    c.closePath();
    c.fill();
  }

  // seated figure, seat at (x, y), facing dir (1 right, -1 left)
  function seated(c, x, y, s, col, dir) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(x, y - s * 0.62, s * 0.12, 0, TAU);
    c.fill();
    c.beginPath();
    c.moveTo(x - s * 0.15, y);
    c.quadraticCurveTo(x - s * 0.17, y - s * 0.45, x, y - s * 0.48);
    c.quadraticCurveTo(x + s * 0.17, y - s * 0.45, x + s * 0.15, y);
    c.closePath();
    c.fill();
    // thigh and shin
    c.fillRect(Math.min(x, x + dir * s * 0.38), y - s * 0.1, s * 0.38, s * 0.1);
    c.fillRect(x + dir * s * 0.38 - s * 0.05, y - s * 0.1, s * 0.09, s * 0.4);
  }

  // hull with its deck at y
  function hull(c, x, y, len, col) {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x - len / 2, y);
    c.lineTo(x + len / 2, y);
    c.lineTo(x + len * 0.4, y + len * 0.12);
    c.lineTo(x - len * 0.42, y + len * 0.12);
    c.closePath();
    c.fill();
  }

  function bundle(c, x, y, r, alpha) {
    c.save();
    c.globalAlpha = alpha == null ? 1 : alpha;
    c.fillStyle = '#f6efe4';
    c.beginPath();
    c.ellipse(x, y, r * 1.5, r, 0, 0, TAU);
    c.fill();
    c.fillStyle = '#7a4a32';
    c.beginPath();
    c.arc(x + r * 0.7, y - r * 0.1, r * 0.45, 0, TAU);
    c.fill();
    c.restore();
  }

  function glow(c, x, y, r, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,220,140,${0.85 * a})`);
    g.addColorStop(1, 'rgba(255,220,140,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
  }

  function label(c, text, x, y) {
    c.fillStyle = '#fba414';
    c.font = `${Math.max(11, H * 0.032)}px system-ui, sans-serif`;
    c.textAlign = 'center';
    c.fillText(text, x, y);
  }

  const SKIN = ['#3a2418', '#4a2e1e', '#2e1d14', '#5a3826', '#43291b', '#35201a'];

  // the high, crowded ship on the left; the low, less crowded boat on the right;
  // a ladder slopes down from the ship's rail to the boat. Shared by "ladder" and "fall".
  function ladderScene(c, t) {
    sky(c, ['#4c5870', '#8d97a6', '#b9b7b0']);
    const seaY = H * 0.76;
    sea(c, seaY, t, '#3b5468', '#14202c', 3);
    const s = H * 0.3;
    const gapL = W * 0.42, gapR = W * 0.6;
    const leftDeck = H * 0.4 + waveAt(W * 0.2, t, 2);
    const rightDeck = H * 0.66 + waveAt(W * 0.8, t + 1.3, 3);
    // ship side and boat side
    c.fillStyle = '#2a1a14';
    c.fillRect(0, leftDeck, gapL, H);
    c.fillStyle = '#3a271c';
    c.fillRect(gapR, rightDeck, W - gapR, H);
    c.fillStyle = '#5a3a28';
    c.fillRect(0, leftDeck - 4, gapL, 4);
    c.fillRect(gapR, rightDeck - 4, W - gapR, 4);
    // still crowded on the ship; a few already across
    for (let i = 0; i < 11; i++) {
      const x = W * (0.03 + i * 0.033) + rnd(i) * 6;
      person(c, x, leftDeck, s * (0.85 + rnd(i + 20) * 0.2), SKIN[i % SKIN.length]);
    }
    [0.7, 0.8, 0.9].forEach((v, i) =>
      person(c, W * v, rightDeck, s * (0.9 + rnd(i + 7) * 0.15), SKIN[(i + 3) % SKIN.length]));
    // the ladder
    const top = [gapL - W * 0.005, leftDeck - H * 0.01];
    const bot = [gapR + W * 0.01, rightDeck];
    const dx = bot[0] - top[0], dy = bot[1] - top[1];
    const len = Math.hypot(dx, dy);
    const nx = (-dy / len) * H * 0.018, ny = (dx / len) * H * 0.018;
    c.strokeStyle = '#8a6a48';
    c.lineCap = 'round';
    c.lineWidth = Math.max(2, H * 0.008);
    c.beginPath();
    c.moveTo(top[0] + nx, top[1] + ny); c.lineTo(bot[0] + nx, bot[1] + ny);
    c.moveTo(top[0] - nx, top[1] - ny); c.lineTo(bot[0] - nx, bot[1] - ny);
    c.stroke();
    c.lineWidth = Math.max(1.5, H * 0.005);
    c.beginPath();
    for (let k = 1; k < 9; k++) {
      const x = top[0] + (dx * k) / 9, y = top[1] + (dy * k) / 9;
      c.moveTo(x + nx, y + ny); c.lineTo(x - nx, y - ny);
    }
    c.stroke();
    const at = (p) => [top[0] + dx * p, top[1] + dy * p];
    return { seaY, s, leftDeck, rightDeck, gapL, gapR, at };
  }

  // stepwise progress: n rungs, a pause on each
  function rungs(u, n) {
    u = clamp01(u) * n;
    const k = Math.floor(u);
    return k >= n ? 1 : (k + smooth((u - k) * 1.4)) / n;
  }

  // the young mother on the ladder; returns where the baby is held
  function climber(c, r, p, holding) {
    const [x, y] = r.at(p);
    const s = r.s;
    person(c, x, y, s, '#5a3826');
    const w = Math.max(3, H * 0.016);
    const shoulder = [x, y - s * 0.62];
    // one hand grips the ladder above
    const [gx, gy] = r.at(Math.max(0, p - 0.12));
    arm(c, shoulder[0], shoulder[1], gx, gy - s * 0.05, w);
    const hold = [x + s * 0.16, y - s * 0.5];
    if (holding) arm(c, shoulder[0], shoulder[1], hold[0], hold[1], w);
    return hold;
  }

  function arm(c, x0, y0, x1, y1, w) {
    c.strokeStyle = '#2e1d14';
    c.lineWidth = w;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
  }

  // ---------- scenes ----------

  const scenes = [
    {
      lines: [
        { text: 'The Baby and the Boat', cls: 'refrain' },
        { text: 'A story my father told.' },
      ],
      draw(c, t) {
        const hy = H * 0.62;
        sky(c, ['#1a1030', '#5a2a4a', '#d0603a', '#f2a65a']);
        glow(c, W * 0.7, hy, H * 0.35, 0.6);
        c.fillStyle = '#ffd08a';
        c.beginPath();
        c.arc(W * 0.7, hy, H * 0.08, 0, TAU);
        c.fill();
        sea(c, hy, t, '#4a2a44', '#120a18', 2);
        for (let k = 0; k < 7; k++) {
          const y = hy + 8 + k * H * 0.04;
          const half = (H * 0.07 - k * 4) * (0.8 + 0.2 * Math.sin(t * 2 + k));
          c.fillStyle = `rgba(255,200,120,${0.5 - k * 0.06})`;
          c.fillRect(W * 0.7 - half, y, half * 2, 2);
        }
        const sx = W * 0.25 + Math.sin(t * 0.15) * W * 0.04;
        const sy = hy + waveAt(sx, t, 2) - 2;
        hull(c, sx, sy, W * 0.1, '#140c18');
        c.fillStyle = '#140c18';
        c.fillRect(sx - 2, sy - W * 0.06, 3, W * 0.06);
        c.fillRect(sx + W * 0.02, sy - W * 0.035, 3, W * 0.035);
      },
    },
    {
      lines: [
        { text: 'My Dad, Walter Thompson, retold this story to me as we sat on his front porch in Kingston.' },
        { text: "Here's what I remember." },
      ],
      draw(c, t) {
        sky(c, ['#f3b46a', '#f7d49a']);
        // hills
        c.fillStyle = '#5d8a6a';
        c.beginPath();
        c.moveTo(0, H);
        for (let x = 0; x <= W; x += 10) c.lineTo(x, H * 0.45 + Math.sin(x * 0.006 + 1) * H * 0.06);
        c.lineTo(W, H);
        c.fill();
        c.fillStyle = '#3d6b4a';
        c.beginPath();
        c.moveTo(0, H);
        for (let x = 0; x <= W; x += 10) c.lineTo(x, H * 0.55 + Math.sin(x * 0.011) * H * 0.04);
        c.lineTo(W, H);
        c.fill();
        // house
        const floorY = H * 0.8;
        c.fillStyle = '#d9c19a';
        c.fillRect(W * 0.18, H * 0.34, W * 0.64, floorY - H * 0.34);
        c.fillStyle = '#6b4a2e';
        c.fillRect(W * 0.24, H * 0.46, W * 0.07, floorY - H * 0.46); // door
        c.fillStyle = '#7fa7b8';
        c.fillRect(W * 0.64, H * 0.44, W * 0.1, H * 0.12); // window
        c.fillStyle = '#8b2e2a';
        c.beginPath();
        c.moveTo(W * 0.12, H * 0.36);
        c.lineTo(W * 0.24, H * 0.2);
        c.lineTo(W * 0.76, H * 0.2);
        c.lineTo(W * 0.88, H * 0.36);
        c.closePath();
        c.fill();
        c.fillStyle = '#efe4d0';
        for (let i = 0; i < 5; i++) c.fillRect(W * (0.14 + i * 0.18), H * 0.36, W * 0.012, floorY - H * 0.36);
        c.fillStyle = '#5a3a28';
        c.fillRect(W * 0.1, floorY, W * 0.8, H * 0.05);
        c.fillStyle = '#6b4a2e';
        c.fillRect(0, floorY + H * 0.05, W, H);
        // bench
        const seatY = floorY - H * 0.12;
        c.fillStyle = '#7a5236';
        c.fillRect(W * 0.36, seatY, W * 0.3, H * 0.02);
        c.fillRect(W * 0.37, seatY, W * 0.01, H * 0.12);
        c.fillRect(W * 0.64, seatY, W * 0.01, H * 0.12);
        // Dad and son
        const sway = Math.sin(t * 0.9) * 2;
        seated(c, W * 0.45 + sway, seatY, H * 0.42, '#3a2418', 1);
        seated(c, W * 0.57, seatY, H * 0.32, '#5a3826', -1);
        // talking dots
        for (let i = 0; i < 3; i++) {
          const a = 0.3 + 0.7 * Math.max(0, Math.sin(t * 3 - i * 0.7));
          c.fillStyle = `rgba(58,36,24,${a})`;
          c.beginPath();
          c.arc(W * 0.47 + i * H * 0.03, seatY - H * 0.36, H * 0.008, 0, TAU);
          c.fill();
        }
      },
    },
    {
      lines: [
        { text: 'My Dad roomed with the Dookie family.' },
        { text: "He was good friends with my Uncle Felix Dookie, and I think that's how he came to meet my mom, Mabel." },
      ],
      draw(c, t) {
        sky(c, ['#121733', '#2b3a5c']);
        stars(c, 70, t, H * 0.45);
        const ground = H * 0.8;
        c.fillStyle = '#1f2a1f';
        c.fillRect(0, ground, W, H - ground);
        // house
        c.fillStyle = '#6a5a48';
        c.fillRect(W * 0.1, H * 0.3, W * 0.8, ground - H * 0.3);
        c.fillStyle = '#4a2420';
        c.beginPath();
        c.moveTo(W * 0.06, H * 0.32);
        c.lineTo(W * 0.5, H * 0.1);
        c.lineTo(W * 0.94, H * 0.32);
        c.closePath();
        c.fill();
        for (let i = 0; i < 4; i++) {
          const x = W * (0.16 + i * 0.19);
          const flick = 0.8 + 0.2 * Math.sin(t * 2 + i * 1.7);
          glow(c, x + W * 0.04, H * 0.42, W * 0.07, 0.5 * flick);
          c.fillStyle = `rgba(255,214,130,${flick})`;
          c.fillRect(x, H * 0.36, W * 0.08, H * 0.12);
        }
        // the family out front
        const s = H * 0.38;
        const people = [
          { x: 0.2, name: 'Grandpa Dookie', h: 0.88, col: '#4a2e1e' },
          { x: 0.38, name: 'Felix Dookie', h: 1, col: '#3a2418' },
          { x: 0.56, name: 'Walter', h: 1.02, col: '#2e1d14' },
          { x: 0.74, name: 'Mabel', h: 0.92, col: '#5a3826' },
        ];
        people.forEach((p, i) => {
          const a = smooth((t - 0.4 - i * 0.5) / 0.8);
          c.save();
          c.globalAlpha = a;
          person(c, W * p.x, ground, s * p.h, p.col);
          label(c, p.name, W * p.x, ground + H * 0.08);
          c.restore();
        });
        // Walter & Mabel
        const g = smooth((t - 3.2) / 1.5);
        if (g > 0) glow(c, W * 0.65, ground - s * 0.75, H * 0.12, g * (0.7 + 0.3 * Math.sin(t * 2)));
      },
    },
    {
      lines: [
        { text: 'My Dad would shave grandpa Dookie regularly.' },
        { text: '"Every time I shaved grandpa Dookie," my Dad said, "grandpa Dookie would tell the same story."', cls: 'quote' },
      ],
      draw(c, t) {
        const floorY = H * 0.82;
        c.fillStyle = '#e2cfa8';
        c.fillRect(0, 0, W, floorY);
        c.fillStyle = '#7a5236';
        c.fillRect(0, floorY, W, H - floorY);
        // window light
        c.fillStyle = 'rgba(255,240,200,0.6)';
        c.fillRect(W * 0.78, H * 0.15, W * 0.14, H * 0.3);
        // tally of tellings on the wall
        c.strokeStyle = '#6b4a2e';
        c.lineWidth = 2;
        for (let i = 0; i < tellings; i++) {
          const group = Math.floor(i / 5);
          const k = i % 5;
          const gx = W * 0.06 + group * W * 0.06;
          c.beginPath();
          if (k < 4) {
            c.moveTo(gx + k * W * 0.01, H * 0.12);
            c.lineTo(gx + k * W * 0.01, H * 0.2);
          } else {
            c.moveTo(gx - W * 0.005, H * 0.19);
            c.lineTo(gx + W * 0.035, H * 0.13);
          }
          c.stroke();
        }
        // barber chair
        const seatY = floorY - H * 0.16;
        c.fillStyle = '#5a2a22';
        c.fillRect(W * 0.32, seatY, W * 0.16, H * 0.03);
        c.fillRect(W * 0.31, seatY - H * 0.3, W * 0.025, H * 0.33);
        c.fillStyle = '#333';
        c.fillRect(W * 0.39, seatY, W * 0.015, H * 0.16);
        // grandpa Dookie, draped
        const s = H * 0.55;
        const gx = W * 0.38;
        seated(c, gx, seatY, s, '#4a2e1e', 1);
        c.fillStyle = '#f2efe8';
        c.beginPath();
        c.moveTo(gx - s * 0.06, seatY - s * 0.5);
        c.lineTo(gx + s * 0.5, seatY + s * 0.05);
        c.lineTo(gx - s * 0.18, seatY + s * 0.05);
        c.closePath();
        c.fill();
        // shaving cream
        const headX = gx, headY = seatY - s * 0.62;
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(headX + s * 0.07, headY + s * 0.07, s * 0.06, 0, TAU);
        c.fill();
        // Walter with the razor
        const wx = W * 0.58;
        person(c, wx, floorY, H * 0.7, '#2e1d14');
        const stroke = Math.sin(t * 2.5);
        const rx = headX + s * 0.14;
        const ry = headY + s * 0.02 + stroke * s * 0.05;
        arm(c, wx - H * 0.04, floorY - H * 0.48, rx + 6, ry, Math.max(3, H * 0.022));
        c.fillStyle = '#c9ccd1';
        c.fillRect(rx - 2, ry - 6, 6, 12);
        // the story, again: a speech bubble with a little boat
        const bx = W * 0.2, by = H * 0.3, br = H * 0.11;
        const a = smooth((t - 1) / 1);
        c.save();
        c.globalAlpha = a;
        c.fillStyle = '#fffaf0';
        c.beginPath();
        c.ellipse(bx, by, br * 1.5, br, 0, 0, TAU);
        c.fill();
        c.beginPath();
        c.moveTo(bx + br * 0.8, by + br * 0.7);
        c.lineTo(headX - s * 0.05, headY - s * 0.05);
        c.lineTo(bx + br * 1.2, by + br * 0.4);
        c.fill();
        c.fillStyle = '#7fa7b8';
        c.fillRect(bx - br * 1.1, by + br * 0.2, br * 2.2, br * 0.25);
        hull(c, bx + Math.sin(t) * br * 0.3, by + br * 0.2 + Math.sin(t * 2) * 2, br * 1.1, '#3a271c');
        c.restore();
      },
    },
    {
      lines: [
        { text: 'Grandpa Dookie and his young wife were taken to Jamaica on a very crowded boat' },
        { text: '(most likely a ship).' },
      ],
      draw(c, t) {
        sky(c, ['#2b2d4f', '#7a5b7a', '#e7a77a']);
        const hy = H * 0.6;
        sea(c, hy, t, '#2c4a63', '#0f1c2b', 3);
        const cx = W * 0.5;
        const deck = hy - H * 0.02 + waveAt(cx, t, 3);
        const len = W * 0.62;
        c.save();
        c.translate(cx, deck);
        c.rotate(Math.sin(t * 0.8) * 0.02);
        c.translate(-cx, -deck);
        // masts and sails
        c.fillStyle = '#1e140f';
        c.fillRect(cx - len * 0.2, deck - H * 0.42, 4, H * 0.42);
        c.fillRect(cx + len * 0.15, deck - H * 0.38, 4, H * 0.38);
        c.fillStyle = 'rgba(240,226,200,0.85)';
        c.beginPath();
        c.moveTo(cx - len * 0.2 + 6, deck - H * 0.4);
        c.quadraticCurveTo(cx - len * 0.05, deck - H * 0.28, cx - len * 0.2 + 6, deck - H * 0.16);
        c.fill();
        c.beginPath();
        c.moveTo(cx + len * 0.15 + 6, deck - H * 0.36);
        c.quadraticCurveTo(cx + len * 0.28, deck - H * 0.26, cx + len * 0.15 + 6, deck - H * 0.15);
        c.fill();
        // crowd, packed tight
        const n = 46;
        for (let i = 0; i < n; i++) {
          const x = cx - len * 0.46 + (len * 0.92 * (i + rnd(i) * 0.6)) / n;
          const bob = Math.sin(t * 2 + i) * 1.2;
          person(c, x, deck + bob, H * (0.08 + rnd(i + 40) * 0.035), SKIN[i % SKIN.length]);
        }
        hull(c, cx, deck, len, '#2a1a14');
        c.restore();
      },
    },
    {
      lines: [
        { text: 'On the boat was another young couple, and the wife was pregnant.' },
        { text: 'While at sea, she gave birth on the boat.' },
      ],
      draw(c, t) {
        sky(c, ['#0e1028', '#2a2350', '#3b3060']);
        stars(c, 80, t, H * 0.5);
        const deckY = H * 0.78 + Math.sin(t * 0.8) * 3;
        // crowd behind
        for (let i = 0; i < 12; i++) {
          const x = W * (0.03 + i * 0.087) + rnd(i) * 10;
          if (x > W * 0.36 && x < W * 0.64) continue;
          person(c, x, deckY, H * (0.42 + rnd(i + 3) * 0.08), '#1a1220');
        }
        c.fillStyle = '#3a271c';
        c.fillRect(0, deckY, W, H - deckY);
        c.fillStyle = '#5a3a28';
        c.fillRect(0, deckY, W, 4);
        // the couple
        person(c, W * 0.44, deckY, H * 0.58, '#3a2418');
        const seatY = deckY - H * 0.08;
        c.fillStyle = '#4a3020';
        c.fillRect(W * 0.49, seatY, W * 0.1, H * 0.08); // crate
        seated(c, W * 0.53, seatY, H * 0.48, '#5a3826', -1);
        const bx = W * 0.505, by = seatY - H * 0.17;
        const born = smooth((t - 1.8) / 2.2);
        glow(c, bx, by, H * 0.25, born * (0.75 + 0.25 * Math.sin(t * 1.5)));
        bundle(c, bx, by, H * 0.025, born);
      },
    },
    {
      lines: [
        { text: 'The boat was so crowded, passengers had to transfer to another, less crowded boat.' },
      ],
      draw(c, t) {
        sky(c, ['#5d6b80', '#a8b2bd']);
        const hy = H * 0.62;
        sea(c, hy, t, '#3b5468', '#1b2a38', 3);
        const x1 = W * 0.3, x2 = W * 0.72;
        const d1 = hy - H * 0.01 + waveAt(x1, t, 3);
        const d2 = hy + H * 0.01 + waveAt(x2, t + 1, 3);
        // crowded ship
        c.fillStyle = '#1e140f';
        c.fillRect(x1 - 2, d1 - H * 0.35, 4, H * 0.35);
        for (let i = 0; i < 26; i++) {
          const x = x1 - W * 0.18 + (W * 0.36 * (i + rnd(i) * 0.5)) / 26;
          person(c, x, d1, H * (0.08 + rnd(i + 9) * 0.03), SKIN[i % SKIN.length]);
        }
        hull(c, x1, d1, W * 0.4, '#2a1a14');
        // less crowded boat
        for (let i = 0; i < 6; i++) {
          person(c, x2 - W * 0.1 + i * W * 0.04, d2, H * 0.09, SKIN[(i + 2) % SKIN.length]);
        }
        hull(c, x2, d2, W * 0.28, '#4a3020');
        // a ladder from the ship down to the boat; people climb down, one way only
        const top = [x1 + W * 0.19, d1 - H * 0.005];
        const bot = [x2 - W * 0.1, d2];
        c.strokeStyle = '#8a6a48';
        c.lineWidth = Math.max(1.5, H * 0.006);
        c.beginPath();
        c.moveTo(top[0], top[1]); c.lineTo(bot[0], bot[1]);
        c.moveTo(top[0], top[1] - H * 0.02); c.lineTo(bot[0], bot[1] - H * 0.02);
        for (let k = 1; k < 8; k++) {
          const x = lerp(top[0], bot[0], k / 8), y = lerp(top[1], bot[1], k / 8);
          c.moveTo(x, y); c.lineTo(x, y - H * 0.02);
        }
        c.stroke();
        for (let k = 0; k < 3; k++) {
          const p = rungs((t * 0.18 + k / 3) % 1, 8);
          person(c, lerp(top[0], bot[0], p), lerp(top[1], bot[1], p), H * 0.09, SKIN[k % SKIN.length]);
        }
      },
    },
    {
      lines: [
        { text: 'While crossing over to the new boat, the newborn baby was carried down a ladder.' },
      ],
      draw(c, t) {
        const r = ladderScene(c, t);
        // she climbs down slowly, rung by rung, and stops partway
        const p = 0.45 * rungs(t / 5, 4);
        const hold = climber(c, r, p, true);
        bundle(c, hold[0], hold[1], H * 0.022);
      },
    },
    {
      lines: [
        { text: 'Someone let the baby slip,' },
        { text: 'and the baby fell into the sea.' },
      ],
      captionGap: 3.2,
      draw(c, t) {
        const r = ladderScene(c, t);
        const slip = 2.6;
        const p = 0.45 + 0.1 * rungs(Math.min(t, slip) / 2, 1);
        if (t < slip) {
          const hold = climber(c, r, p, true);
          bundle(c, hold[0], hold[1], H * 0.022);
          return;
        }
        const hold = climber(c, r, p, false);
        const fallT = t - slip;
        const g = H * 1.4;
        const impact = Math.sqrt((2 * (r.seaY - hold[1])) / g);
        const [sx, sy] = r.at(p);
        // empty hand reaching down after the baby
        arm(c, sx, sy - r.s * 0.62, hold[0] + r.s * 0.05, hold[1] + r.s * 0.25, Math.max(3, H * 0.016));
        if (fallT < impact) {
          bundle(c, hold[0], hold[1] + 0.5 * g * fallT * fallT, H * 0.022);
          return;
        }
        const after = fallT - impact;
        c.save();
        c.beginPath();
        c.rect(r.gapL, r.seaY - H * 0.05, r.gapR - r.gapL, H);
        c.clip();
        for (let k = 0; k < 4; k++) {
          const rr = (after - k * 0.6) * W * 0.03;
          if (rr <= 0) continue;
          const a = Math.max(0, 0.7 - after * 0.08 - k * 0.12);
          c.strokeStyle = `rgba(240,240,255,${a})`;
          c.lineWidth = 1.5;
          c.beginPath();
          c.ellipse(hold[0], r.seaY + 4, rr, rr * 0.22, 0, 0, TAU);
          c.stroke();
        }
        c.restore();
      },
    },
    {
      lines: [
        { text: 'Grandpa Dookie told the same story every time Walter shaved him, and would end with the same refrain:' },
        { text: '"De baby born a sea, an the baby die a sea."', cls: 'refrain' },
        { text: '(The baby born at sea, and the baby died at sea.)', cls: 'gloss' },
      ],
      captionGap: 2.2,
      draw(c, t) {
        sky(c, ['#05060f', '#141a33', '#26304f']);
        stars(c, 120, t, H * 0.55);
        const hy = H * 0.6;
        const mx = W * 0.5, my = H * 0.22;
        glow(c, mx, my, H * 0.2, 0.5);
        c.fillStyle = '#f4ecd6';
        c.beginPath();
        c.arc(mx, my, H * 0.06, 0, TAU);
        c.fill();
        sea(c, hy, t * 0.5, '#1a2440', '#05070f', 1.5);
        for (let k = 0; k < 9; k++) {
          const y = hy + 6 + k * H * 0.035;
          const half = (H * 0.05 - k * 2) * (0.7 + 0.3 * Math.sin(t * 1.5 + k));
          c.fillStyle = `rgba(244,236,214,${0.4 - k * 0.04})`;
          c.fillRect(mx - half, y, half * 2, 1.5);
        }
        // one slow ripple, returning like the refrain
        const p = (t % 6) / 6;
        c.strokeStyle = `rgba(244,236,214,${0.35 * (1 - p)})`;
        c.lineWidth = 1.2;
        c.beginPath();
        c.ellipse(mx, H * 0.8, p * W * 0.3, p * W * 0.3 * 0.18, 0, 0, TAU);
        c.stroke();
      },
    },
  ];

  // ---------- story navigation ----------

  scenes.forEach((_, i) => {
    const d = document.createElement('span');
    d.title = `Part ${i + 1}`;
    d.addEventListener('click', (e) => { e.stopPropagation(); go(i); });
    dotsEl.appendChild(d);
  });

  function showCaption(scene) {
    captionTimers.forEach(clearTimeout);
    captionTimers = [];
    caption.innerHTML = '';
    const gap = (scene.captionGap || 1.6) * 1000;
    scene.lines.forEach((line, i) => {
      const p = document.createElement('p');
      p.textContent = line.text;
      if (line.cls) p.className = line.cls;
      caption.appendChild(p);
      captionTimers.push(setTimeout(() => p.classList.add('show'), 300 + i * gap));
    });
  }

  function go(i) {
    current = Math.max(0, Math.min(scenes.length - 1, i));
    sceneStart = performance.now();
    showCaption(scenes[current]);
    prevBtn.disabled = current === 0;
    const last = current === scenes.length - 1;
    nextBtn.hidden = last;
    againBtn.hidden = !last;
    [...dotsEl.children].forEach((d, k) => d.classList.toggle('on', k === current));
    history.replaceState(null, '', '#' + (current + 1));
  }

  function next() { if (current < scenes.length - 1) go(current + 1); }
  function prev() { go(current - 1); }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  againBtn.addEventListener('click', () => {
    tellings += 1; // grandpa Dookie tells it again
    go(3);
  });
  stage.addEventListener('click', next);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  });

  // ---------- render loop ----------

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = stage.clientWidth;
    H = stage.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function frame(now) {
    const t = FROZEN_T != null ? FROZEN_T : (now - sceneStart) / 1000;
    ctx.save();
    scenes[current].draw(ctx, t);
    ctx.restore();
    const fade = 1 - t / 0.7;
    if (fade > 0) {
      ctx.fillStyle = `rgba(13,10,20,${fade})`;
      ctx.fillRect(0, 0, W, H);
    }
    requestAnimationFrame(frame);
  }

  const start = parseInt(location.hash.slice(1), 10);
  go(Number.isFinite(start) ? start - 1 : 0);
  requestAnimationFrame(frame);
})();
