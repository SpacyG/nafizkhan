const login = document.querySelector('#login');
const studio = document.querySelector('#studio');
const editor = document.querySelector('#editor');
const status = document.querySelector('#studio-status');
const list = document.querySelector('#entries');
const newEntry = document.querySelector('#new-entry');
const logout = document.querySelector('#logout');
const remove = document.querySelector('#remove-entry');
const photo = document.querySelector('#studio-photo');
const textFile = document.querySelector('#text-file');
const fields = editor.elements;
let selected = null;
let busy = false;

async function api(path, method = 'GET', data) {
  const response = await fetch('api/' + path, {
    method,
    credentials: 'same-origin',
    signal: AbortSignal.timeout(30_000),
    ...(data === undefined ? {} : {
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    })
  });
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw Error('The dashboard needs the portfolio server to be running.');
  }
  const result = await response.json();
  if (!response.ok) {
    const error = Error(result.error);
    error.status = response.status;
    throw error;
  }
  return result;
}

function setType() {
  for (const panel of editor.querySelectorAll('[data-kind]')) {
    panel.hidden = panel.dataset.kind !== fields.kind.value;
    for (const field of panel.querySelectorAll('input, select, textarea')) field.disabled = panel.hidden;
  }
}

function edit(entry = null) {
  selected = entry;
  editor.reset();
  document.querySelector('#editor-heading').textContent = entry ? 'Edit entry' : 'New entry';
  remove.hidden = !entry;
  fields.kind.disabled = Boolean(entry);
  photo.hidden = !entry?.hasPhoto;
  photo.removeAttribute('src');
  if (entry) {
    for (const name of ['kind', 'title', 'description', 'category', 'credit', 'body', 'alt']) {
      if (entry[name]) fields[name].value = entry[name];
    }
    if (entry.video) fields.video.value = 'https://www.youtube.com/watch?v=' + entry.video;
    fields.published.checked = entry.published;
    if (entry.hasPhoto) {
      photo.alt = entry.alt;
      photo.src = 'api/entries/' + entry.id + '/photo?v=' + entry.photoVersion;
    }
  }
  setType();
}

async function loadEntries() {
  const entries = await api('entries');
  list.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement('li');
    empty.textContent = 'No entries yet.';
    list.append(empty);
  }
  for (const entry of entries) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    const state = document.createElement('small');
    button.type = 'button';
    button.textContent = entry.title;
    state.textContent = { sample: 'Writing sample', photo: 'Photo', vlog: 'Vlog' }[entry.kind] + (entry.published ? ' · Published' : ' · Draft');
    button.addEventListener('click', () => {
      if (busy) return;
      edit(entry);
      fields.title.focus();
    });
    item.append(button, state);
    list.append(item);
  }
}

async function showDashboard() {
  await loadEntries();
  edit();
  studio.hidden = false;
  login.hidden = true;
}

async function act(task, { signIn = false } = {}) {
  if (busy) return;
  busy = true;
  const controls = [...studio.querySelectorAll('button'), login.querySelector('button')];
  controls.forEach(control => { control.disabled = true; });
  status.textContent = '';
  try {
    await task();
  } catch (error) {
    if (!signIn && error.status === 401) {
      studio.hidden = true;
      login.hidden = false;
      edit();
      login.elements.password.focus();
    }
    status.textContent = error.message;
  } finally {
    controls.forEach(control => { control.disabled = false; });
    busy = false;
  }
}

async function readPhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5_000_000) {
    throw Error('Choose a JPEG, PNG, or WebP file under 5 MB.');
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const [format, image] = canvas.toDataURL('image/webp', 0.86).split(',');
    return { mime: format.slice(5).split(';')[0], image };
  } catch {
    throw Error('The selected file could not be read as a photo.');
  } finally {
    bitmap?.close();
  }
}

fields.kind.addEventListener('change', setType);
newEntry.addEventListener('click', () => { edit(); fields.title.focus(); });
textFile.addEventListener('change', async () => {
  const file = textFile.files[0];
  const target = selected;
  if (!file) return;
  try {
    if (!file.name.toLowerCase().endsWith('.txt') || file.size > 64_000) throw Error('Choose a .txt file under 64 KB.');
    const copy = await file.text();
    if (selected !== target || textFile.files[0] !== file) return;
    if (copy.length > fields.body.maxLength) throw Error('Samples can contain up to 16,000 characters.');
    fields.body.value = copy;
    status.textContent = 'Text imported. Review it before saving.';
  } catch (error) {
    status.textContent = error.message;
  } finally {
    if (textFile.files[0] === file) textFile.value = '';
  }
});
login.addEventListener('submit', event => {
  event.preventDefault();
  act(async () => {
    const password = login.elements.password.value;
    login.reset();
    await api('session', 'POST', { password });
    await showDashboard();
    status.textContent = 'Signed in.';
  }, { signIn: true });
});
logout.addEventListener('click', () => act(async () => {
  await api('session', 'DELETE');
  studio.hidden = true;
  login.hidden = false;
  edit();
  list.replaceChildren();
  login.elements.password.focus();
  status.textContent = 'Signed out.';
}));
editor.addEventListener('submit', event => {
  event.preventDefault();
  act(async () => {
    const entry = { published: fields.published.checked };
    for (const name of ['kind', 'title', 'description', 'category', 'credit', 'body', 'alt', 'video']) entry[name] = fields[name].value;
    if (selected) entry.version = selected.version;
    if (entry.kind === 'photo' && fields.image.files[0]) Object.assign(entry, await readPhoto(fields.image.files[0]));
    const saved = await api(selected ? 'entries/' + selected.id : 'entries', selected ? 'PUT' : 'POST', entry);
    edit(saved);
    status.textContent = saved.published ? 'Published.' : 'Draft saved.';
    await loadEntries();
  });
});
remove.addEventListener('click', () => {
  if (!selected || !confirm('Permanently delete "' + selected.title + '"?')) return;
  act(async () => {
    await api('entries/' + selected.id, 'DELETE', { version: selected.version });
    edit();
    status.textContent = 'Entry deleted.';
    await loadEntries();
  });
});

try {
  const session = await api('session');
  if (!session.enabled) status.textContent = 'The owner dashboard is disabled on this server.';
  else if (session.signedIn) await showDashboard();
  else login.hidden = false;
} catch (error) {
  status.textContent = error.message;
}
