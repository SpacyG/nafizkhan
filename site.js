const filters = document.querySelector('.filters');
const samples = document.querySelector('.samples');
const gymCaseStudy = samples?.querySelector('#sample-landing [data-case-study]');
const viewer = document.querySelector('#photo-viewer');
const workList = document.querySelector('.work-list');
const sampleSelector = document.querySelector('.sample-selector');
const sampleDialog = document.querySelector('.sample-dialog');
const siteHeader = document.querySelector('.site-header');
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
  const email = entry.category === 'Email copy';
  const frame = element('div', '', 'sample-frame sample-frame--' + (email ? 'email' : 'browser'));
  const bar = element('div', '', 'sample-frame-bar');
  const icon = element('span', '', 'sample-frame-icon');
  icon.setAttribute('aria-hidden', 'true');
  bar.append(icon, document.createTextNode(email ? 'Inbox preview' : entry.category + ' preview'));
  frame.append(bar, text);
  details.append(element('summary', 'Read the full sample'), frame);
  if (entry.id === 'sample-landing' && gymCaseStudy &&
      entry.body.trimStart().startsWith('We lay the path, you take the steps.')) {
    article.append(gymCaseStudy.cloneNode(true));
  }
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
  meta.append(description, element('span', 'Open sample preview ↗'));
  card.append(preview, meta);
  return card;
}

function setupFeaturedSamples() {
  if (!sampleSelector || !workList) return;
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
    updateHomeComparison(cards[activeIndex]);
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
  writeSample(reader);
  return true;
}

const readerReady = sampleDialog && ['.reader-content', '#reader-title', '.reader-footer', '.reader-position'].every(selector => sampleDialog.querySelector(selector));
if (readerReady && workList && sampleSelector && typeof sampleDialog.showModal === 'function') {
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

if (siteHeader) {
  const updateHeader = () => siteHeader.classList.toggle('is-scrolled', scrollY > 12);
  addEventListener('scroll', updateHeader, { passive: true });
  addEventListener('pageshow', updateHeader);
  updateHeader();
}

const revealObserver = siteHeader && 'IntersectionObserver' in window
  ? new IntersectionObserver((entries, observer) => {
    const motion = matchMedia('(prefers-reduced-motion: no-preference)');
    const entering = entries.filter(entry => entry.isIntersecting);
    entering.forEach(({ target }, index) => {
      observer.unobserve(target);
      if (!motion.matches || target.contains(document.activeElement)) return;
      target.style.setProperty('--reveal-index', Math.min(index, 2));
      target.classList.add('is-revealing');
      target.addEventListener('animationend', () => {
        target.classList.remove('is-revealing');
        target.style.removeProperty('--reveal-index');
      }, { once: true });
    });
  }, { rootMargin: '0px 0px -24px' })
  : null;

function observeBelowFold(items) {
  for (const item of items) {
    if (item.hidden || item.getBoundingClientRect().top >= innerHeight) revealObserver?.observe(item);
  }
}

observeBelowFold(document.querySelectorAll('main .section:not([data-writing])'));

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
    image.decoding = 'async';
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
  if (!filters || !samples) return;
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
  const category = new URLSearchParams(location.search).get('category');
  showCategory(category === article.dataset.category ? category : 'all');
  if (!category) article.querySelector('details').open = true;
  article.scrollIntoView();
}

const practiceDrafts = {
  'sample-email': 'Our coffee is a good choice for the morning.',
  'sample-sales': 'This planner helps you organize your day.',
  'sample-landing': 'Join our gym to start exercising.',
  'sample-bookstore': 'Come back and browse our books.',
  'sample-lumaskin': 'Check out our new skin care product.'
};

const revisionNotes = {
  'sample-email': 'The rewrite links the smoothness of coffee to the reader’s morning.',
  'sample-sales': 'The headline opens with the reader’s day and the direction they want.',
  'sample-landing': '“Path” and “steps” give the gym and the reader a role each.',
  'sample-bookstore': 'The focus shifts from the store’s invitation to the reader’s preferences.',
  'sample-lumaskin': 'The subject opens with the reader’s skincare need before introducing the product.'
};

const featuredEdits = {
  'sample-email': {
    draft: 'We sell fresh coffee beans.',
    rewrite: 'Bold or light, find a roast you’ll look forward to tomorrow.',
    note: 'The edit gives readers a choice they can picture before they browse.'
  },
  'sample-sales': {
    draft: 'This planner has room for your tasks.',
    rewrite: 'Pick three priorities before your to-do list picks them for you.',
    note: 'The edit turns a product feature into a specific way to start the day.'
  },
  'sample-landing': {
    draft: 'We offer personal training.',
    rewrite: 'Start in a small group, with a trainer showing you what to do first.',
    note: 'The edit answers a beginner’s question about what happens when they arrive.'
  }
};

const editorialKeys = {
  'sample-email': ['your morning', 'Bold or light'],
  'sample-sales': ['a little more direction', 'three priorities'],
  'sample-landing': ['take the steps', 'a trainer showing you'],
  'sample-bookstore': ['Your preferences'],
  'sample-lumaskin': ['your skin']
};

const revisionCleanup = new WeakMap();

function annotateRevision(oldLine, newLine, draft, rewrite, phrase) {
  const before = draft.split(/(?<=\s)|(?=\s)/);
  const after = rewrite.split(/(?<=\s)|(?=\s)/);
  let start = 0;
  let end = 0;
  while (start < Math.min(before.length, after.length) && before[start] === after[start]) start++;
  while (end < Math.min(before.length, after.length) - start &&
    before[before.length - end - 1] === after[after.length - end - 1]) end++;
  oldLine.replaceChildren(
    before.slice(0, start).join(''),
    element('span', before.slice(start, before.length - end).join(''), 'revision-cut'),
    before.slice(before.length - end).join('')
  );

  const key = phrase && rewrite.toLowerCase().includes(phrase.toLowerCase())
    ? phrase
    : rewrite.trim().split(/\s+/).slice(0, 3).join(' ');
  const index = rewrite.toLowerCase().indexOf(key.toLowerCase());
  newLine.replaceChildren(
    rewrite.slice(0, index),
    element('span', rewrite.slice(index, index + key.length), 'revision-key'),
    rewrite.slice(index + key.length)
  );
}

function revisionControl(id, title, finalLine, example) {
  const draft = example?.draft ?? practiceDrafts[id];
  const rewrite = example?.rewrite ?? finalLine;
  if (!draft || !rewrite) return null;
  const panel = element('fieldset', '', 'revision');
  const legend = element('legend', 'Compare the edit · ' + title);
  const output = element('div', '', 'revision-lines');
  const oldLine = element('p', '', 'revision-draft');
  const newLine = element('p', '', 'revision-rewrite');
  const oldText = element('span');
  const newText = element('span');
  const cutNote = element('span', 'cut', 'revision-margin');
  const keyNote = element('span', 'key change', 'revision-margin');
  annotateRevision(oldText, newText, draft, rewrite, editorialKeys[id]?.[example ? 1 : 0]);
  oldLine.append(oldText, cutNote);
  newLine.append(newText, keyNote);
  const hint = element('p', 'Hover or focus to hold a stage. Drag the pen or pick a stage to compare.', 'revision-hint');
  const note = element('p', example?.note ?? revisionNotes[id], 'revision-note');
  const slider = element('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '2';
  slider.step = '1';
  slider.value = '1';
  slider.setAttribute('aria-label', 'Revision stage for ' + title);
  const controls = element('div', '', 'revision-controls');
  const labels = ['Practice draft', 'Pen marks', 'Nafiz’s rewrite'];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let timer = null;
  let inView = false;
  const buttons = labels.map((label, index) => {
    const button = element('button', label);
    button.type = 'button';
    button.addEventListener('click', () => { slider.value = String(index); update(); });
    controls.append(button);
    return button;
  });
  function update() {
    const stage = Number(slider.value);
    panel.dataset.stage = slider.value;
    note.hidden = stage === 0;
    cutNote.hidden = keyNote.hidden = stage !== 1;
    oldLine.hidden = stage === 2;
    newLine.hidden = stage === 0;
    slider.setAttribute('aria-valuetext', labels[stage]);
    buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === stage)));
  }
  slider.addEventListener('input', update);
  function schedule() {
    clearTimeout(timer);
    if (!inView || panel.closest('[hidden]') || reduced.matches || panel.matches(':hover, :focus-within')) return;
    const beat = Number(getComputedStyle(panel).getPropertyValue('--proof-revision-ms')) || 860;
    timer = setTimeout(() => {
      if (!panel.isConnected || panel.closest('[hidden]')) return;
      if (!document.hidden) {
        slider.value = String((Number(slider.value) + 1) % labels.length);
        update();
      }
      schedule();
    }, beat);
  }
  for (const event of ['pointerenter', 'pointerleave', 'focusin']) panel.addEventListener(event, schedule);
  panel.addEventListener('focusout', () => queueMicrotask(schedule));
  const playback = typeof IntersectionObserver === 'function' ? new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    schedule();
  }) : null;
  playback?.observe(panel);
  reduced.addEventListener('change', schedule);
  revisionCleanup.set(panel, () => {
    playback?.disconnect();
    clearTimeout(timer);
    reduced.removeEventListener('change', schedule);
  });
  output.append(oldLine, newLine);
  panel.append(legend, hint, output, slider, controls, note);
  update();
  return panel;
}

function attachWorkComparisons() {
  for (const article of samples?.children || []) {
    const subject = article.querySelector('.sample-subject');
    const firstBreak = subject?.querySelector('br');
    const parts = [...(subject?.childNodes || [])];
    const firstLine = parts.slice(0, firstBreak ? parts.indexOf(firstBreak) : parts.length).map(node => node.textContent).join('');
    const text = article.querySelector('.plain-copy')?.textContent || firstLine;
    const line = text.trim().split('\n').filter(s => s.trim())[0]?.trim().replace(/^(?:Email 1 · )?(?:Subject|Headline):\s*/i, '');
    const panel = revisionControl(article.id, article.querySelector('h2').textContent, line);
    if (panel) article.insertBefore(panel, article.querySelector('details'));
  }
}

function updateHomeComparison(card) {
  const slot = document.querySelector('.featured-comparison');
  if (!slot) return;
  revisionCleanup.get(slot.firstElementChild)?.();
  const id = card?.hash.slice(1);
  const panel = card && revisionControl(
    id, card.querySelector('strong').textContent, card.querySelector('.work-excerpt').textContent, featuredEdits[id]
  );
  slot.replaceChildren(...(panel ? [panel] : []));
}

function setupHeadline() {
  const headline = document.querySelector('.hero-copy h2');
  if (headline) {
    const original = [...headline.childNodes].map(node => node.cloneNode(true));
    const choices = [null, headline.dataset.altHeadline, 'Make the next step feel obvious.'];
    let index = 0;
    const cycle = element('button', '', 'headline-cycle');
    cycle.type = 'button';
    const hint = element('span', '↻ Try another headline', 'cycle-hint');
    function draw() {
      const nodes = index ? [document.createTextNode(choices[index])] : original;
      cycle.replaceChildren();
      for (const node of nodes) {
        if (node.nodeType !== Node.TEXT_NODE) { cycle.append(node.cloneNode(true)); continue; }
        for (const part of node.textContent.split(/(\s+)/)) {
          cycle.append(part.trim() ? element('span', part, 'markup-word') : document.createTextNode(part));
        }
      }
      cycle.append(hint);
    }
    cycle.addEventListener('click', () => { index = (index + 1) % choices.length; draw(); });
    draw();
    headline.replaceChildren(cycle);
  }
}

function setupServices() {
  document.querySelectorAll('.services dt').forEach((term, index) => {
    const example = term.parentElement.querySelector('.service-example');
    if (!example) return;
    const button = element('button', term.textContent + ' +');
    example.id = 'service-example-' + index;
    let pinned = false;
    let hovering = false;
    function show() {
      example.hidden = !(pinned || hovering);
      button.setAttribute('aria-expanded', String(!example.hidden));
    }
    button.type = 'button';
    button.setAttribute('aria-controls', example.id);
    button.addEventListener('click', () => { pinned = !pinned; hovering = false; show(); });
    const row = term.parentElement;
    const preview = document.querySelector('.service-proof');
    function showPreview() {
      if (!preview) return;
      const label = example.querySelector('strong');
      preview.querySelector('[data-service-kind]').textContent = label.textContent;
      preview.querySelector('[data-service-line]').textContent = example.textContent.slice(label.textContent.length).trim();
      preview.dataset.service = String(index);
    }
    button.addEventListener('focus', showPreview);
    button.addEventListener('click', showPreview);
    row.addEventListener('pointerenter', e => {
      hovering = e.pointerType === 'mouse';
      if (hovering) showPreview();
      show();
    });
    row.addEventListener('pointerleave', () => { hovering = false; show(); });
    term.replaceChildren(button);
    show();
  });
}

function setupCopyEmail() {
  const copy = document.querySelector('.copy-email');
  if (copy && copy.parentElement.querySelector('.email') && copy.parentElement.querySelector('.copy-status')) {
    copy.hidden = false;
    copy.addEventListener('click', async () => {
      const link = copy.parentElement.querySelector('.email');
      const status = copy.parentElement.querySelector('.copy-status');
      try {
        await navigator.clipboard.writeText(link.textContent.trim());
        copy.textContent = 'Copied ✓';
        status.textContent = 'Email address copied.';
      } catch {
        copy.textContent = 'Copy email';
        const selection = getSelection();
        const range = document.createRange();
        range.selectNodeContents(link);
        selection.removeAllRanges();
        selection.addRange(range);
        status.textContent = 'Email selected. Use your device’s Copy command.';
      }
    });
  }
}

function setupInkPointer() {
  const fine = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const dot = element('span', '', 'ink-dot');
  const ring = element('span', '', 'ink-ring');
  for (const item of [dot, ring]) item.setAttribute('aria-hidden','true');
  document.body.append(dot, ring);
  const style = getComputedStyle(document.documentElement);
  const number = name => parseFloat(style.getPropertyValue(name));
  const follow = number('--ring-follow');
  const tilt = number('--tilt-strength');
  const pull = number('--magnet-strength');
  let x = 0, y = 0, rx = 0, ry = 0, target, card, magnet, frame = 0;
  let needsHitTest = false;
  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    needsHitTest = false;
    document.body.classList.remove('ink-pointer-on');
    for (const item of [card,magnet]) item?.removeAttribute('data-reactive');
    card = magnet = target = null;
  }
  function paint() {
    frame = 0;
    if (needsHitTest) {
      needsHitTest = false;
      target = document.elementFromPoint(x, y);
    }
    const nextCard = target?.closest('.work-card,.sample');
    const nextMagnet = target?.closest('.button,.header nav a,.header-contact');
    if (card !== nextCard) card?.removeAttribute('data-reactive');
    if (magnet !== nextMagnet) magnet?.removeAttribute('data-reactive');
    card = nextCard;
    magnet = nextMagnet;
    for (const item of [card,magnet]) {
      if (!item) continue;
      const box = item.getBoundingClientRect();
      const px = Math.max(0,Math.min(1,(x-box.left)/box.width));
      const py = Math.max(0,Math.min(1,(y-box.top)/box.height));
      item.dataset.reactive = '';
      if (item === card) {
        item.style.setProperty('--pitch', ((.5-py)*tilt)+'deg');
        item.style.setProperty('--yaw', ((px-.5)*tilt)+'deg');
        item.style.setProperty('--spot-x', px*100+'%');
        item.style.setProperty('--spot-y', py*100+'%');
      } else {
        item.style.setProperty('--pull-x', ((px-.5)*pull)+'px');
        item.style.setProperty('--pull-y', ((py-.5)*pull)+'px');
      }
    }
    const control = target?.closest('a,button,summary,input');
    ring.classList.toggle('over-headline', Boolean(control?.matches('.headline-cycle')));
    ring.dataset.mode = control ? 'link' : target?.closest('p,h1,h2,dt,dd') ? 'text' : 'idle';
    rx += (x-rx)*follow; ry += (y-ry)*follow;
    dot.style.translate = x+'px '+y+'px';
    ring.style.translate = rx+'px '+ry+'px';
    if (Math.abs(x-rx)+Math.abs(y-ry) > .35) frame = requestAnimationFrame(paint);
  }
  document.addEventListener('pointermove', e => {
    if (!fine.matches || e.pointerType !== 'mouse' || document.querySelector('dialog[open]')) { reset(); return; }
    target = e.target; x = e.clientX; y = e.clientY;
    if (!document.body.classList.contains('ink-pointer-on')) { rx=x; ry=y; document.body.classList.add('ink-pointer-on'); }
    if (!frame) frame = requestAnimationFrame(paint);
  }, {passive:true});
  document.documentElement.addEventListener('pointerleave',reset);
  window.addEventListener('blur',reset);
  window.addEventListener('scroll', () => {
    if (!document.body.classList.contains('ink-pointer-on')) return;
    needsHitTest = true;
    if (!frame) frame = requestAnimationFrame(paint);
  }, { passive: true, capture: true });
  document.addEventListener('keydown',reset);
  document.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse') reset();});
  fine.addEventListener('change',reset);
}

function setupInkProgress() {
  const bar = document.querySelector('.ink-progress');
  if (!bar) return;
  const nav = [...siteHeader.querySelectorAll('nav a,.header-contact')];
  const sections = [...document.querySelectorAll('.home-page main section[id]')];
  const targets = {home:'Home',work:'Work',services:'Services',approach:'Services',about:'About',contact:'Get in touch'};
  let frame = 0;
  function update() {
    frame = 0;
    const max = document.documentElement.scrollHeight-innerHeight;
    bar.style.transform = 'scaleX('+Math.max(0,Math.min(1,max ? scrollY/max : 0))+')';
    if (!sections.length) return;
    const current = sections.filter(section=>section.getBoundingClientRect().top <= siteHeader.offsetHeight+innerHeight*.25).at(-1) || sections[0];
    const active = max > 0 && scrollY >= max - 2 ? sections.at(-1) : current;
    const label = targets[active.id];
    nav.forEach(link=>link.classList.toggle('current-section',link.textContent.trim().startsWith(label)));
  }
  function queue(){ if (!frame) frame=requestAnimationFrame(update); }
  addEventListener('scroll',queue,{passive:true});
  addEventListener('resize',queue);
  if ('ResizeObserver' in window) new ResizeObserver(queue).observe(document.body);
  update();
}
const writingObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    observer.unobserve(entry.target);
    const block = entry.target.closest('[data-writing]');
    if (block && !block.contains(document.activeElement)) block.classList.add('writing-visible');
  }
}, { rootMargin: '0px 0px -12% 0px' }) : null;

const markerObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries, observer) => {
  for (const { target, isIntersecting } of entries) {
    if (!isIntersecting) continue;
    target.classList.add('marker-drawn');
    observer.unobserve(target);
  }
}, { threshold: 0.15 }) : null;

function observeHeadingMarker(heading) {
  const [first, ...extra] = heading.querySelectorAll('mark.guide-highlight');
  extra.forEach(mark => mark.replaceWith(...mark.childNodes));
  if (!first || !markerObserver || first.classList.contains('marker-observed')) return;
  first.classList.add('marker-observed');
  markerObserver.observe(first);
}

const penObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    observer.unobserve(entry.target);
    entry.target.classList.add('guide-drawn');
  }
}, { rootMargin: '0px 0px -9% 0px' }) : null;

function writeSample(content) {
  if (!content || !matchMedia('(prefers-reduced-motion: no-preference)').matches || typeof content.animate !== 'function') return;
  content.getAnimations().forEach(animation => animation.cancel());
  const style = getComputedStyle(content);
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
  const lines = Math.max(1, Math.min(24, Math.round(content.clientHeight / lineHeight)));
  const frames = [];
  for (let line = 0; line < lines; line++) {
    const top = 100 * line / lines;
    const bottom = 100 * (line + 1) / lines;
    for (const edge of [0, 100]) {
      frames.push({
        clipPath: 'polygon(0 0, 100% 0, 100% ' + top + '%, ' + edge + '% ' + top +
          '%, ' + edge + '% ' + bottom + '%, 0 ' + bottom + '%)',
        offset: (line + (edge ? .98 : 0)) / lines
      });
    }
  }
  frames.push({ clipPath: frames.at(-1).clipPath, offset: 1 });
  content.animate(frames, { duration: parseFloat(style.getPropertyValue('--sample-write-ms')) });
}

function setupFeedback() {
  const frame = document.querySelector('.feedback-feed');
  if (!frame) return;
  const source = frame.dataset.src;
  if (!source || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(source)) return;
  frame.src = source;
  frame.hidden = false;
  frame.parentElement.hidden = false;
  document.getElementById('feedback-title').hidden = false;
}

function setupWriting(blocks = document.querySelectorAll('[data-writing], .samples > .sample')) {
  document.querySelectorAll('.guide-next:not(.guide-drawn), .approach-steps:not(.guide-drawn)').forEach(mark => penObserver?.observe(mark));
  for (const block of blocks) {
    block.dataset.writing = '';
    const heading = block.querySelector('h1,h2');
    if (!heading) continue;
    if (block.matches('.sample') && !heading.querySelector('mark')) {
      const title = heading.textContent.trim();
      const boundary = title.lastIndexOf(' ') + 1;
      heading.replaceChildren(title.slice(0, boundary), element('mark', title.slice(boundary), 'guide-highlight'));
    }
    observeHeadingMarker(heading);
    writingObserver?.observe(heading);
  }
}

function setupProofMotion() {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('proof-play');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.35 });
  document.querySelectorAll('[data-proof-motion]').forEach(mark => observer.observe(mark));
}

// Set one month here to update the badge on Home, Work, and About.
const availabilityMonth = '';

function setupAvailability() {
  if (!availabilityMonth.trim()) return;
  document.querySelectorAll('[data-availability]').forEach(badge => {
    badge.textContent = 'Taking projects for ' + availabilityMonth.trim();
  });
}

// Set this to the full endpoint from your Formspree dashboard.
const formspreeEndpoint = '';

function setupContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;
  const status = form.querySelector('.contact-form-status');
  const fields = form.querySelector('fieldset');
  const project = form.elements.namedItem('project_type');
  const ready = /^https:\/\/formspree\.io\/f\/[a-z0-9]+$/i.test(formspreeEndpoint.trim());
  if (ready) {
    form.action = formspreeEndpoint.trim();
    fields.disabled = false;
    status.hidden = true;
  }
  form.addEventListener('submit', event => {
    if (!ready) event.preventDefault();
  });
  document.querySelectorAll('[data-contact-project]').forEach(link => {
    const type = link.dataset.contactProject;
    link.addEventListener('click', () => {
      project.value = type;
      requestAnimationFrame(() => (ready ? form.elements.namedItem('name') : status).focus({ preventScroll: true }));
    });
  });
}

if (siteHeader) {
  for (const setup of [setupHeadline, setupServices, setupCopyEmail, setupInkPointer, setupInkProgress, setupFeedback, setupWriting, setupProofMotion, setupAvailability, setupContactForm, attachWorkComparisons]) {
    try {
      setup();
    } catch (error) {
      console.warn('[Nafiz portfolio] ' + setup.name + ' unavailable', error);
    }
  }
  samples?.addEventListener('toggle', event => {
    if (event.target.open && event.target.matches('.sample details')) writeSample(event.target.querySelector('.sample-copy'));
  }, true);
}

filters?.addEventListener('click', event => {
  const category = event.target.closest('button')?.dataset.filter;
  if (category) showCategory(category);
});
viewer?.querySelector('[data-close]')?.addEventListener('click', () => viewer.close());
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
        samples.querySelectorAll('.revision').forEach(panel => revisionCleanup.get(panel)?.());
        samples.replaceChildren(...sampleEntries.map(renderSample));
        attachWorkComparisons();
        setupWriting(samples.children);
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
