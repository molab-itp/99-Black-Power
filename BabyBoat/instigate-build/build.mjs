#!/usr/bin/env node
// Build "The Baby and the Boat" (BabyBoat/web) as an Instigate story.
//
//   1. render: open BabyBoat/web in headless Chrome, freeze each scene at a
//      chosen time (?t=N#scene) and save the 16:9 stage as frames/sceneNN.jpg
//   2. upload: send each frame to POST /v1/uploads (+ PUT to the signed URL)
//   3. story:  create the story (image tile + caption text tiles per scene),
//      or, if build-state.json names an existing story, swap its tiles in
//      place so the share link stays the same
//   4. publish: set visibility, cover and description
//
// Usage:
//   npm install            (once; installs playwright-core, uses your Google Chrome)
//   node build.mjs                 render + upload + create/update story
//   node build.mjs --render-only   just write frames/ (no API calls)
//   node build.mjs --new           ignore build-state.json, make a new story
//   node build.mjs --visibility public|shared|private
//
// API key: INSTIGATE_KEY in the environment or in ./.env (gitignored).
// Needs a key made with write access at https://www.instigate.ai/app/developers
// Docs: https://www.instigate.ai/docs/building-stories/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(HERE, '../web/index.html');
const FRAMES = path.join(HERE, 'frames');
const STATE = path.join(HERE, 'build-state.json');
const API = 'https://www.instigate.ai/api/v1';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };

const story = JSON.parse(fs.readFileSync(path.join(HERE, 'story.json'), 'utf8'));
const visibility = opt('--visibility') || story.visibility || 'private';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

// ---------- 1. render frames ----------

async function render() {
  const { chromium } = await import('playwright-core');
  fs.mkdirSync(FRAMES, { recursive: true });
  const browser = await chromium.launch(
    process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
  // stage is max 60rem x 60vh at 16:9 -> 960x540 CSS px; x2 = 1920x1080
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 2 });
  const files = [];
  for (const s of story.scenes) {
    const url = pathToFileURL(WEB).href + `?t=${s.t}#${s.scene}`;
    // a hash-only change doesn't reload, and app.js reads the hash only at load
    await page.goto('about:blank');
    await page.goto(url);
    await page.addStyleTag({ content: '#stage { border-radius: 0 !important; }' });
    await page.waitForTimeout(400); // let a few frames draw
    const file = path.join(FRAMES, `scene${String(s.scene).padStart(2, '0')}.jpg`);
    await page.locator('#stage').screenshot({ path: file, type: 'jpeg', quality: 90 });
    log(`rendered ${path.relative(HERE, file)}  (scene ${s.scene}, t=${s.t}s)`);
    files.push(file);
  }
  await browser.close();
  return files;
}

// ---------- API helpers ----------

function apiKey() {
  if (!process.env.INSTIGATE_KEY && fs.existsSync(path.join(HERE, '.env'))) {
    process.loadEnvFile(path.join(HERE, '.env'));
  }
  const k = process.env.INSTIGATE_KEY;
  if (!k) throw new Error('Set INSTIGATE_KEY (environment or ./.env)');
  return k;
}

async function api(method, route, body, { tries = 5 } = {}) {
  const headers = { Authorization: `Bearer ${apiKey()}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method === 'POST') headers['Idempotency-Key'] = randomUUID(); // reused on retry
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(API + route, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    if (res.status === 204) return null;
    const json = await res.json().catch(() => ({}));
    if (res.ok) return json;
    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < tries) {
      const wait = Number(res.headers.get('retry-after')) * 1000 || 2000 * attempt;
      log(`  ${method} ${route} -> ${res.status}, retrying in ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    const e = json.error || {};
    throw new Error(`${method} ${route} -> ${res.status} ${e.code || ''}: ${e.message || JSON.stringify(json)}`);
  }
}

// ---------- 2. upload frames ----------

async function uploadImage(file) {
  const data = fs.readFileSync(file);
  const up = await api('POST', '/uploads', { type: 'image', contentType: 'image/jpeg', size: data.length });
  const res = await fetch(up.upload.url, {
    method: up.upload.method || 'PUT',
    headers: { 'Content-Type': 'image/jpeg', 'Content-Length': String(data.length), ...(up.upload.headers || {}) },
    body: data,
  });
  if (!res.ok) throw new Error(`upload PUT ${path.basename(file)} -> ${res.status} ${await res.text()}`);
  // images are normally ready right away; wait briefly if not
  for (let i = 0; i < 15; i++) {
    const u = await api('GET', `/uploads/${up.id}`);
    if (u.status === 'ready') break;
    if (u.status === 'failed') throw new Error(`upload ${up.id} failed: ${u.error}`);
    await sleep(1000);
  }
  log(`uploaded ${path.basename(file)} -> ${up.id}`);
  return up.id;
}

// ---------- 3. tiles ----------

function buildTiles(uploadIds) {
  const tiles = [];
  story.scenes.forEach((s, i) => {
    const img = { type: 'image', upload: uploadIds[i] };
    if (story.imageDurationSec) img.durationSec = story.imageDurationSec;
    tiles.push(img);
    for (const text of s.texts) tiles.push({ type: 'text', text });
  });
  for (const text of story.closing || []) tiles.push({ type: 'text', text });
  if (tiles.length > 50) throw new Error(`${tiles.length} tiles; the API takes 50 per call`);
  return tiles;
}

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { return {}; }
}

async function existingStory(id) {
  if (!id) return null;
  try { return await api('GET', `/stories/${id}`, undefined, { tries: 2 }); }
  catch (e) { log(`previous story ${id} not reachable (${e.message}); making a new one`); return null; }
}

async function main() {
  const files = await render();
  if (flag('--render-only')) return;

  const uploadIds = [];
  for (const f of files) uploadIds.push(await uploadImage(f));
  const tiles = buildTiles(uploadIds);

  const prev = flag('--new') ? null : await existingStory(readState().storyId);
  let result;
  if (prev) {
    // put the new tiles first, then remove the old ones (30 writes/min -> pace deletes)
    log(`updating story ${prev.id} in place: +${tiles.length} tiles, -${prev.tiles.length} old`);
    result = await api('POST', `/stories/${prev.id}/tiles`, { tiles, after: null });
    for (const t of prev.tiles) {
      await sleep(2100);
      await api('DELETE', `/stories/${prev.id}/tiles/${t.id}`);
    }
  } else {
    result = await api('POST', '/stories', { title: story.title, description: story.description, tiles });
    log(`created story ${result.id} with ${result.tiles.length} tiles`);
  }

  const fresh = await api('GET', `/stories/${result.id}`);
  const cover = fresh.tiles.find((t) => t.type === 'image')?.media?.url;
  const patch = { title: story.title, description: story.description, visibility };
  if (cover) patch.coverUrl = cover;
  let done;
  try { done = await api('PATCH', `/stories/${result.id}`, patch); }
  catch (e) { // cover is a nicety; don't fail the build over it
    log(`patch with cover failed (${e.message}); retrying without cover`);
    delete patch.coverUrl;
    done = await api('PATCH', `/stories/${result.id}`, patch);
  }

  const state = {
    storyId: done.id, title: done.title, visibility: done.visibility,
    shareUrl: done.shareUrl, embedUrl: done.embedUrl, builtAt: new Date().toISOString(),
  };
  fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n');
  log(`\n${done.visibility}: ${done.shareUrl || '(private, no share link)'}`);
  if (done.embedUrl) log(`embed:  ${done.embedUrl}`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
