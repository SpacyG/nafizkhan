const filters = document.querySelector('.filters');
const samples = document.querySelector('.samples');
const viewer = document.querySelector('#photo-viewer');
const workList = document.querySelector('.work-list');
const sampleSelector = document.querySelector('.sample-selector');
const sampleDialog = document.querySelector('.sample-dialog');
const heroArt = document.querySelector('.hero-art');
const featuredText = new Map(
  [...document.querySelectorAll('template[data-featured-sample]')].map(template => [
    template.dataset.featuredSample,
    template.content
  ])
);
let readingCard;

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

function renderWorkCard(entry) {
  const card = element('a', '', 'work-card');
  card.href = 'work.html#' + entry.id;

  const preview = element('div', '', 'work-preview');
  const type = element('span', entry.category, 'work-type');
  const [firstLine, ...bodyLines] = entry.body.split('\n').map(line => line.trim()).filter(Boolean);
  const excerpt = firstLine?.replace(/^(?:Subject|Headline):\s*/i, '') || entry.title;
  const excerptText = excerpt.length > 140 ? excerpt.slice(0, 137).trimEnd() + '…' : excerpt;
  preview.append(type, element('p', excerptText, 'work-excerpt'));
  const opening = bodyLines.slice(0, 2).join(' ');
  if (opening) {
    preview.append(element('p', opening.length > 220 ? opening.slice(0, 217).trimEnd() + '…' : opening, 'work-opening'));
  }

  const meta = element('div', '', 'work-meta');
  const description = element('div');
  description.append(element('strong', entry.title));
  if (entry.description) description.append(element('p', entry.description));
  meta.append(description, element('span', 'Read full sample ↗'));
  card.append(preview, meta);
  return card;
}

function setupFeaturedSamples() {
  if (!sampleSelector) return;
  const cards = [...workList.querySelectorAll('.work-card')];
  const activeId = sampleSelector.querySelector('[aria-pressed="true"]')?.getAttribute('aria-controls');
  const buttons = cards.map((card, index) => {
    card.id = 'featured-' + card.hash.slice(1);
    const button = element('button', card.querySelector('strong').textContent);
    button.type = 'button';
    button.setAttribute('aria-controls', card.id);
    button.addEventListener('click', () => select(index));
    return button;
  });

  function select(activeIndex) {
    cards.forEach((card, index) => {
      card.hidden = index !== activeIndex;
      buttons[index].setAttribute('aria-pressed', String(!card.hidden));
    });
  }

  sampleSelector.replaceChildren(...buttons);
  sampleSelector.hidden = cards.length < 2;
  select(Math.max(0, cards.findIndex(card => card.id === activeId)));
}

function showFeaturedSample(card) {
  const content = featuredText.get(card.hash.slice(1));
  if (!content) return false;
  const cards = [...workList.querySelectorAll('.work-card')];
  const index = cards.indexOf(card);
  const title = card.querySelector('strong').textContent;
  const reader = sampleDialog.querySelector('.reader-content');
  sampleDialog.querySelector('#reader-title').textContent = title;
  reader.replaceChildren(content.cloneNode(true));
  reader.scrollTop = 0;
  sampleDialog.querySelector('.reader-position').textContent = title + ' · ' + (index + 1) + ' of ' + cards.length;
  sampleDialog.querySelector('.reader-footer').hidden = cards.length < 2;
  readingCard = card;
  if (!sampleDialog.open) sampleDialog.showModal();
  return true;
}

if (sampleDialog && typeof sampleDialog.showModal === 'function') {
  workList.addEventListener('click', event => {
    const card = event.target.closest('.work-card');
    if (!card || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (showFeaturedSample(card)) event.preventDefault();
  });
  sampleDialog.querySelector('.reader-footer').addEventListener('click', event => {
    const step = event.target.closest('[data-reader-step]')?.dataset.readerStep;
    if (!step) return;
    const cards = [...workList.querySelectorAll('.work-card')];
    if (cards.length < 2) return;
    const index = cards.findIndex(card => card.hash === readingCard.hash);
    const next = (Math.max(0, index) + Number(step) + cards.length) % cards.length;
    if (showFeaturedSample(cards[next])) sampleSelector.children[next].click();
  });
  sampleDialog.addEventListener('close', () => {
    const visible = workList.querySelector('.work-card:not([hidden])');
    visible?.focus({ preventScroll: true });
  });
}

if (heroArt) {
  const hero = heroArt.parentElement;
  const motion = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const resetArt = () => {
    heroArt.style.removeProperty('--art-x');
    heroArt.style.removeProperty('--art-y');
  };
  hero.addEventListener('pointermove', event => {
    if (!motion.matches || event.pointerType !== 'mouse') return;
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    heroArt.style.setProperty('--art-x', (x * 24).toFixed(1) + 'px');
    heroArt.style.setProperty('--art-y', (y * 18).toFixed(1) + 'px');
  });
  hero.addEventListener('pointerleave', resetArt);
  motion.addEventListener('change', resetArt);
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
setupFeaturedSamples();

async function loadContent() {
  try {
    const result = await fetch('api/content.json', { signal: AbortSignal.timeout(5000) });
    if (!result.ok || !result.headers.get('content-type')?.includes('application/json')) return;
    const { entries } = await result.json();
    if (Array.isArray(entries)) {
      if (workList) {
        const featured = entries.filter(entry => entry.kind === 'sample').slice(0, 3);
        featuredText.clear();
        for (const entry of featured) featuredText.set(entry.id, element('p', entry.body, 'plain-copy'));
        workList.replaceChildren(...featured.map(renderWorkCard));
        setupFeaturedSamples();
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
