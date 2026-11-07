// Parse https://en.wikipedia.org/wiki/100_Greatest_African_Americans
// into data/people.json, sorted by earliest date (birth year),
// with a folder per person holding full.jpg + thumb.jpg + info.json.
//
// usage: node build.js [--force]   (--force re-downloads existing images)

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LIST_TITLE = '100_Greatest_African_Americans';
const LIST_URL = `https://en.wikipedia.org/wiki/${LIST_TITLE}`;
const API = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = '99-Black-Power-prep/1.0 (https://github.com/molab-itp/99-Black-Power)';

const OUT_DIR = path.join(__dirname, 'data');
const PEOPLE_DIR = path.join(OUT_DIR, 'people');
const FULL_WIDTH = 1280; // max width of full size image
const THUMB_WIDTH = 256; // width of thumbnail

const force = process.argv.includes('--force');

// Hand-picked images for entries whose article has no lead image.
// Keyed by person id (slug); note explains images that are not a portrait.
const IMAGE_OVERRIDES = {
  'david-walker': {
    file: 'David_Walker_Appeal.jpg',
    note: "Frontispiece of Walker's Appeal (1830); no authenticated portrait of Walker is known.",
  },
  'kenneth-b-clark': {
    file: 'Kenneth_and_Mamie_Clark_1958_(cropped).jpg',
    note: 'Kenneth Clark (left) with Mamie Phipps Clark, 1958.',
  },
  'john-henrik-clarke': {
    file: 'John_Henrik_Clarke_Africana_Library,_2023.jpg',
    note: 'The John Henrik Clarke Africana Library at Cornell University; no freely licensed portrait of Clarke is available.',
  },
  'august-wilson': {
    file: 'August_wilson.jpg', // non-free, used under fair use on English Wikipedia
  },
  // position: CSS background-position for the cropped grid thumbnail
  'prince-hall': { position: 'center top' },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, tries = 5) {
  for (let i = 0; ; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (res.ok) return res;
    if (i >= tries - 1 || (res.status !== 429 && res.status < 500)) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    const wait = Number(res.headers.get('retry-after')) * 1000 || 2000 * 2 ** i;
    console.warn(`  ${res.status}, retrying in ${wait}ms`);
    await sleep(wait);
  }
}

async function api(params) {
  const qs = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  const res = await fetchWithRetry(`${API}?${qs}`);
  return res.json();
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function slugify(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function wikiUrl(title) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

function stripHtml(s) {
  return (s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// Parse lines like:
//   # [[Richard Allen (bishop)|Richard Allen]] (1760–1831)
//   # [[Guion Bluford]] (born 1942)
//   # [[Sojourner Truth]] ({{circa|1797}}–1883)
function parseList(wikitext) {
  const people = [];
  const re = /^#\s*\[\[([^\]|]+)(?:\|([^\]]+))?\]\]\s*\((.*)\)\s*$/;
  for (const line of wikitext.split('\n')) {
    const m = line.match(re);
    if (!m) continue;
    const [, linkTitle, label, datesRaw] = m;
    const circa = /circa|c\./i.test(datesRaw);
    const dates = datesRaw.replace(/\{\{circa\|(\d+)\}\}/gi, '$1');
    let born = null;
    let died = null;
    let dm;
    if ((dm = dates.match(/born\s+(\d{3,4})/i))) {
      born = Number(dm[1]);
    } else if ((dm = dates.match(/(\d{3,4})\s*[–-]\s*(\d{3,4})/))) {
      born = Number(dm[1]);
      died = Number(dm[2]);
    }
    people.push({
      listIndex: people.length + 1, // position in the (alphabetical) source list
      name: (label || linkTitle).trim(),
      title: linkTitle.trim(),
      born,
      died,
      circa,
      datesText: dates.trim(),
    });
  }
  return people;
}

async function getPageInfo(people) {
  // Resolve redirects, page urls, lead image file name, short description, intro extract
  const byTitle = new Map();
  for (const group of chunk(people, 20)) {
    const data = await api({
      action: 'query',
      titles: group.map((p) => p.title).join('|'),
      redirects: '1',
      prop: 'pageimages|info|description|extracts',
      piprop: 'name',
      inprop: 'url',
      exintro: '1',
      explaintext: '1',
      exsentences: '3',
      exlimit: 'max',
    });
    const q = data.query;
    const alias = new Map();
    for (const n of q.normalized || []) alias.set(n.from, n.to);
    for (const r of q.redirects || []) alias.set(r.from, r.to);
    const pages = new Map(q.pages.map((pg) => [pg.title, pg]));
    for (const p of group) {
      let t = p.title;
      while (alias.has(t)) t = alias.get(t);
      byTitle.set(p.title, pages.get(t));
    }
  }
  return byTitle;
}

async function getImageInfo(fileNames) {
  // Image urls (original + resized) and license/attribution metadata
  const byFile = new Map();
  for (const group of chunk(fileNames, 50)) {
    const data = await api({
      action: 'query',
      titles: group.map((f) => `File:${f}`).join('|'),
      prop: 'imageinfo',
      iiprop: 'url|size|mime|extmetadata',
      iiurlwidth: String(FULL_WIDTH),
      iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|Credit|ImageDescription',
    });
    const alias = new Map((data.query.normalized || []).map((n) => [n.to, n.from]));
    for (const pg of data.query.pages) {
      const ii = pg.imageinfo?.[0];
      if (!ii) continue;
      const key = (alias.get(pg.title) || pg.title).replace(/^File:/, '');
      byFile.set(key.replace(/ /g, '_'), ii);
      byFile.set(key.replace(/_/g, ' '), ii);
    }
  }
  return byFile;
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function saveImages(url, dir) {
  const fullPath = path.join(dir, 'full.jpg');
  const thumbPath = path.join(dir, 'thumb.jpg');
  if (!force && (await exists(fullPath)) && (await exists(thumbPath))) return 'cached';

  const res = await fetchWithRetry(url);
  const buf = Buffer.from(await res.arrayBuffer());
  const img = sharp(buf).flatten({ background: '#ffffff' });
  await img
    .clone()
    .resize({ width: FULL_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toFile(fullPath);
  await img
    .clone()
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toFile(thumbPath);
  await sleep(500); // be polite to upload.wikimedia.org
  return 'downloaded';
}

async function main() {
  console.log(`Fetching ${LIST_URL}`);
  const listData = await api({ action: 'parse', page: LIST_TITLE, prop: 'wikitext|revid' });
  const people = parseList(listData.parse.wikitext);
  console.log(`Parsed ${people.length} entries`);

  const pageInfo = await getPageInfo(people);
  const imageFile = (p) => IMAGE_OVERRIDES[slugify(p.name)]?.file || pageInfo.get(p.title)?.pageimage;
  const fileNames = [...new Set(people.map(imageFile).filter(Boolean))];
  const imageInfo = await getImageInfo(fileNames);

  // Sort by earliest date in the listing (birth year), then death year, then name
  people.sort(
    (a, b) =>
      (a.born ?? Infinity) - (b.born ?? Infinity) ||
      (a.died ?? Infinity) - (b.died ?? Infinity) ||
      a.name.localeCompare(b.name)
  );

  await fs.mkdir(PEOPLE_DIR, { recursive: true });

  const out = [];
  for (const [i, p] of people.entries()) {
    const pg = pageInfo.get(p.title);
    const slug = slugify(p.name);
    const dir = path.join(PEOPLE_DIR, slug);
    await fs.mkdir(dir, { recursive: true });

    const file = imageFile(p);
    const ii = file ? imageInfo.get(file) : null;
    const meta = ii?.extmetadata || {};
    let image = null;
    if (ii) {
      const status = await saveImages(ii.thumburl || ii.url, dir);
      console.log(`${String(i + 1).padStart(3)} ${p.name} — image ${status}`);
      image = {
        full: `people/${slug}/full.jpg`,
        thumb: `people/${slug}/thumb.jpg`,
        file,
        sourceUrl: ii.descriptionurl,
        originalUrl: ii.url.split('?')[0],
        originalWidth: ii.width,
        originalHeight: ii.height,
        artist: stripHtml(meta.Artist?.value) || null,
        credit: stripHtml(meta.Credit?.value) || null,
        license: meta.LicenseShortName?.value || null,
        licenseUrl: meta.LicenseUrl?.value || null,
        note: IMAGE_OVERRIDES[slug]?.note || null,
        position: IMAGE_OVERRIDES[slug]?.position || null,
      };
    } else {
      console.log(`${String(i + 1).padStart(3)} ${p.name} — no image`);
    }

    const entry = {
      order: i + 1,
      listIndex: p.listIndex,
      id: slug,
      name: p.name,
      born: p.born,
      died: p.died,
      circa: p.circa,
      datesText: p.datesText,
      description: pg?.description || null,
      summary: pg?.extract || null,
      articleTitle: pg?.title || p.title,
      articleUrl: pg?.fullurl || wikiUrl(p.title),
      image,
    };
    await fs.writeFile(path.join(dir, 'info.json'), JSON.stringify(entry, null, 2));
    out.push(entry);
  }

  const doc = {
    title: '100 Greatest African Americans',
    sourceUrl: LIST_URL,
    sourceRevision: `${LIST_URL.replace('/wiki/', '/w/index.php?title=')}&oldid=${listData.parse.revid}`,
    generated: new Date().toISOString(),
    sortedBy: 'born (earliest first)',
    count: out.length,
    people: out,
  };
  await fs.writeFile(path.join(OUT_DIR, 'people.json'), JSON.stringify(doc, null, 2));
  console.log(`Wrote ${path.relative(process.cwd(), path.join(OUT_DIR, 'people.json'))}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
