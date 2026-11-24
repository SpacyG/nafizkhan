const filters = document.querySelector('.filters');
const samples = document.querySelector('.samples');
const viewer = document.querySelector('#photo-viewer');
const workList = document.querySelector('.work-list');

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function renderSample(entry) {
  const article = element('article', '', 'sample');
  article.id = entry.id;
  article.dataset.category = entry.category;
  article.append(element('p', entry.category + ' · ' + entry.credit, 'eyebrow'), element('h2', entry.title));
  if (entry.description) article.append(element('p', entry.description));
  const details = element('details');
  const text = element('div', '', 'sample-copy');
  text.append(element('p', entry.body, 'plain-copy'));
  details.append(element('summary', 'Read the sample'), text);
  article.append(details);
  return article;
}

function renderWorkRow(entry) {
  const row = element('a', '', 'work-row');
  row.href = 'work.html#' + entry.id;
  const detail = element('span');
  detail.append(element('strong', entry.title));
  if (entry.description) detail.append(element('span', entry.description, 'work-desc'));
  const arrow = element('span', '↗', 'row-arrow');
  arrow.setAttribute('aria-hidden', 'true');
  row.append(element('span', entry.category, 'work-type'), detail, arrow);
  return row;
}

function renderMedia(entry) {
  const gallery = document.querySelector('[data-gallery="' + entry.kind + '"]');
  if (!gallery) return;
  if (entry.kind === 'photo') {
    const figure = element('figure');
    const button = element('button');
    button.type = 'button';
    button.setAttribute('aria-label', 'Enlarge photo: ' + entry.title);
    const image = element('img');
    image.src = 'api/entries/' + entry.id + '/photo?v=' + entry.photoVersion;
    image.alt = entry.alt;
    image.loading = 'lazy';
    button.append(image);
    const caption = entry.description ? entry.title + ' · ' + entry.description : entry.title;
    figure.append(button, element('figcaption', caption));
    button.addEventListener('click', () => {
      const full = viewer.querySelector('img');
      full.src = image.src;
      full.alt = image.alt;
      viewer.querySelector('figcaption').textContent = caption;
      viewer.showModal();
    });
    gallery.append(figure);
  } else {
    const article = element('article');
    const link = element('a', entry.title + ' ↗', 'text-link');
    link.href = 'https://www.youtube.com/watch?v=' + entry.video;
    const title = element('h3');
    title.append(link);
    article.append(title);
    if (entry.description) article.append(element('p', entry.description));
    gallery.append(article);
  }
  gallery.closest('section').hidden = false;
}

function showCategory(category) {
  if (!filters) return;
  let shown = 0;
  for (const article of samples.children) {
    article.hidden = category !== 'all' && article.dataset.category !== category;
    if (!article.hidden) shown++;
  }
  for (const button of filters.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.dataset.filter === category));
  }
  document.querySelector('#filter-empty').hidden = shown > 0;
}

function openHash() {
  const article = document.getElementById(location.hash.slice(1));
  if (!article?.classList.contains('sample')) return;
  showCategory('all');
  article.querySelector('details').open = true;
  article.scrollIntoView();
}

filters?.addEventListener('click', event => {
  const category = event.target.closest('button')?.dataset.filter;
  if (category) showCategory(category);
});
viewer?.querySelector('[data-close]').addEventListener('click', () => viewer.close());
addEventListener('hashchange', openHash);
openHash();
if (filters) filters.hidden = false;

async function loadContent() {
  try {
    const result = await fetch('api/content.json', { signal: AbortSignal.timeout(5000) });
    if (!result.ok || !result.headers.get('content-type')?.includes('application/json')) return;
    const { entries } = await result.json();
    if (Array.isArray(entries)) {
      if (workList) {
        const featured = entries.filter(entry => entry.kind === 'sample').slice(0, 3);
        workList.replaceChildren(...featured.map(renderWorkRow));
        if (!featured.length) workList.append(element('p', 'New samples will appear here as they are published.'));
        const note = workList.closest('section').querySelector('.section-note');
        note.hidden = !featured.length || !featured.every(entry => entry.credit === 'Concept project');
      }
      if (samples) {
        const sampleEntries = entries.filter(entry => entry.kind === 'sample');
        samples.replaceChildren(...sampleEntries.map(renderSample));
        for (const button of filters.querySelectorAll('button')) {
          button.hidden = button.dataset.filter !== 'all' && !sampleEntries.some(entry => entry.category === button.dataset.filter);
        }
        const active = filters.querySelector('[aria-pressed="true"]');
        showCategory(active.hidden ? 'all' : active.dataset.filter);
        openHash();
      }
      if (viewer) entries.filter(entry => entry.kind !== 'sample').forEach(renderMedia);
    }
  } catch {
    // Static pages retain the original samples if the content service is unavailable.
  }
}

if (location.protocol !== 'file:') loadContent();
