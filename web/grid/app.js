// Browse the 100 in prep/data/people.json.
// Same relative path works locally (repo root served) and on GitHub Pages.
const DATA_DIR = '../../prep/data/';

const grid = document.getElementById('grid');
const search = document.getElementById('search');
const sort = document.getElementById('sort');
const count = document.getElementById('count');
const dialog = document.getElementById('detail');
const detailBody = document.getElementById('detail-body');

let people = [];
let shown = [];

// Build an element: el('div', { class: 'x' }, child1, 'text', ...)
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v != null) node.setAttribute(k, v);
  }
  node.append(...children.filter((c) => c != null));
  return node;
}

function initials(name) {
  return name.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).slice(0, 2).join('');
}

function render() {
  const q = search.value.trim().toLowerCase();
  shown = people.filter((p) => !q || `${p.name} ${p.description}`.toLowerCase().includes(q));
  if (sort.value === 'name') shown.sort((a, b) => a.name.localeCompare(b.name));
  else shown.sort((a, b) => a.order - b.order);

  grid.replaceChildren(...shown.map(card));
  count.textContent = `${shown.length} of ${people.length}`;
}

function card(p) {
  const img = p.image
    ? el('div', { class: 'img', role: 'img', 'aria-label': p.name, style: `background-image:url('${DATA_DIR}${p.image.thumb}')` })
    : el('div', { class: 'img none', 'aria-hidden': 'true' }, initials(p.name));
  const button = el('button', { class: 'card', type: 'button' },
    img,
    el('div', { class: 'text' },
      el('div', { class: 'name' }, p.name),
      el('div', { class: 'dates' }, p.datesText)));
  button.addEventListener('click', () => { location.hash = p.id; });
  return button;
}

function credit(image) {
  const license = image.licenseUrl ? el('a', { href: image.licenseUrl }, image.license) : image.license;
  return el('p', { class: 'credit' },
    'Image: ', el('a', { href: image.sourceUrl }, image.file),
    image.artist ? ` by ${image.artist}` : null,
    '. License: ', license, '.',
    image.credit ? el('br') : null,
    image.credit ? `Credit: ${image.credit}` : null);
}

function showDetail(p) {
  // Prev/next follow the current filter, or the full list if p is filtered out
  const list = shown.includes(p) ? shown : people;
  const i = list.indexOf(p);
  const prev = list[i - 1];
  const next = list[i + 1];
  detailBody.replaceChildren(
    p.image ? el('img', { src: DATA_DIR + p.image.full, alt: p.name }) : null,
    el('h2', {}, p.name),
    el('p', { class: 'dates' }, `${p.datesText}. ${p.description}`),
    el('p', { class: 'summary' }, p.summary),
    el('p', {}, el('a', { href: p.articleUrl }, 'Read more on Wikipedia')),
    p.image ? credit(p.image) : el('p', { class: 'credit' }, 'No freely licensed image available.'),
    el('div', { class: 'nav' },
      prev ? el('a', { href: `#${prev.id}` }, `← ${prev.name}`) : el('span'),
      next ? el('a', { href: `#${next.id}` }, `${next.name} →`) : el('span')));
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
}

// The URL hash holds the open person's id, so each person has a shareable link.
function route() {
  const p = people.find((x) => x.id === location.hash.slice(1));
  if (p) showDetail(p);
  else if (dialog.open) dialog.close();
}

function closeDetail() {
  history.pushState(null, '', location.pathname + location.search);
  if (dialog.open) dialog.close();
}

dialog.querySelector('.close').addEventListener('click', closeDetail);
dialog.addEventListener('cancel', (e) => { e.preventDefault(); closeDetail(); });
dialog.addEventListener('click', (e) => { if (e.target === dialog) closeDetail(); });
search.addEventListener('input', render);
sort.addEventListener('change', render);
window.addEventListener('hashchange', route);

fetch(DATA_DIR + 'people.json')
  .then((r) => r.json())
  .then((data) => {
    people = data.people;
    document.getElementById('subtitle').textContent = `${data.title}, sorted by birth year`;
    document.getElementById('source').href = data.sourceRevision;
    render();
    route();
  })
  .catch((err) => {
    grid.textContent = `Could not load data: ${err.message}`;
  });
