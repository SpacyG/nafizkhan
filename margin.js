(function () {
  'use strict';

  // BEGIN MARGIN WORKERS AI CONNECTION
  const WORKER_URL = 'https://margin-chat.n-tonmoy-khan.workers.dev'; // Public Cloudflare Worker endpoint only.
  const CONTACT_EMAIL = 'n.tonmoy.khan@gmail.com'; // Match SITE_FACTS.email in the Worker.
  const WHATSAPP_LINK = 'https://wa.me/8801774495528'; // Only link to Nafiz's confirmed WhatsApp.
  const FALLBACK = "I can't answer right now. Email Nafiz at " + CONTACT_EMAIL + '.';
  const REQUEST_TIMEOUT = 10_000;
  const MAX_MESSAGES = 8;
  const MAX_CHARACTERS = 500;
  const welcome = "I'm Margin, Nafiz's AI assistant. Ask me about his work, services, or putting together a project brief.";

  async function getReply(messages, request) {
    const timer = setTimeout(() => request.abort(), REQUEST_TIMEOUT);
    try {
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({ messages: messages.slice(-MAX_MESSAGES) }),
        signal: request.signal,
      });
      if (!response.ok) return null;
      const { reply } = await response.json();
      return typeof reply === 'string' && reply.trim() ? reply.trim() : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
  // END MARGIN WORKERS AI CONNECTION

  // BEGIN MARGIN CHAT INTERFACE
  const widget = document.querySelector('.margin-widget');
  if (!widget || typeof HTMLDialogElement === 'undefined' ||
      typeof HTMLDialogElement.prototype.showModal !== 'function') return;

  const dialog = widget.querySelector('dialog');
  const launcher = widget.querySelector('.margin-launcher');
  const unread = widget.querySelector('.margin-unread');
  const thread = dialog.querySelector('.margin-thread');
  const transcript = dialog.querySelector('[data-margin-transcript]');
  const typing = dialog.querySelector('.margin-typing');
  const starters = dialog.querySelector('.margin-starters');
  const form = dialog.querySelector('.margin-form');
  const message = dialog.querySelector('#margin-message');
  const submit = form.querySelector('[type="submit"]');
  const narrow = matchMedia('(max-width: 479px)');
  const clock = new Intl.DateTimeFormat(undefined, {hour:'numeric', minute:'2-digit'});
  const replyQueue = [];
  let history = [];
  let activeRequest;
  let lastAuthor;
  let started = false;

  function scrollToLatest() {
    thread.scrollTop = thread.scrollHeight;
  }

  function setUnread(value) {
    unread.hidden = !value;
    launcher.setAttribute('aria-label', value ? 'Chat with Margin, unread reply' : 'Chat with Margin');
  }

  function openChat() {
    if (!started) {
      started = true;
      addMessage('Margin', {text: welcome});
    }
    if (narrow.matches) dialog.showModal();
    else dialog.show();
    widget.classList.toggle('margin-sheet-open', narrow.matches);
    launcher.setAttribute('aria-expanded', 'true');
    launcher.hidden = true;
    setUnread(false);
    message.focus({preventScroll:true});
    scrollToLatest();
  }

  launcher.addEventListener('click', openChat);
  dialog.querySelector('[data-margin-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    widget.classList.remove('margin-sheet-open');
    launcher.hidden = false;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus({preventScroll:true});
  });
  narrow.addEventListener('change', () => {
    if (!dialog.open) return;
    dialog.close();
    openChat();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && dialog.open && !narrow.matches &&
        !document.querySelector('dialog:modal')) {
      event.preventDefault();
      dialog.close();
    }
  });

  function addMessage(who, result) {
    const isVisitor = who === 'You';
    const entry = document.createElement('article');
    entry.className = isVisitor ? 'margin-entry margin-visitor' : 'margin-entry';
    entry.tabIndex = 0;
    const avatar = document.createElement('span');
    avatar.className = 'margin-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = 'M.';
    if (!isVisitor && lastAuthor !== who) entry.append(avatar);
    lastAuthor = who;

    const bubble = document.createElement('div');
    bubble.className = 'margin-bubble';
    const label = document.createElement('span');
    label.className = 'margin-sr-only';
    label.textContent = who + ': ';
    const text = document.createElement('p');
    text.textContent = result.text;
    bubble.append(label, text);
    if (result.links?.length) {
      const links = document.createElement('div');
      links.className = 'margin-links';
      for (const [label, href] of result.links) {
        const link = document.createElement('a');
        link.textContent = label;
        link.href = href;
        link.addEventListener('click', () => dialog.close());
        links.append(link);
      }
      bubble.append(links);
    }

    const timestamp = document.createElement('time');
    const now = new Date();
    timestamp.dateTime = now.toISOString();
    timestamp.textContent = clock.format(now);
    entry.append(bubble, timestamp);
    transcript.append(entry);
    scrollToLatest();
  }

  // Run one request at a time so queued messages use the previous answer.
  async function deliverReply() {
    if (!replyQueue.length || activeRequest) return;
    const request = new AbortController();
    activeRequest = request;
    typing.hidden = false;
    scrollToLatest();

    const current = { role: 'user', content: replyQueue.shift() };
    const messages = [...history, current].slice(-MAX_MESSAGES);
    const reply = await getReply(messages, request);
    if (activeRequest !== request) return; // New chat cleared this request.
    activeRequest = undefined;
    if (reply) {
      const context = [...reply].slice(0, MAX_CHARACTERS).join('');
      history = [...messages, { role: 'assistant', content: context }].slice(-MAX_MESSAGES);
    }
    addMessage('Margin', reply ? {
      text: reply,
      links: reply.includes(WHATSAPP_LINK) ? [['Message Nafiz on WhatsApp', WHATSAPP_LINK]] : [],
    } : {
      text: FALLBACK, links: [['Email Nafiz', 'mailto:' + CONTACT_EMAIL]],
    });
    if (!dialog.open) setUnread(true);
    typing.hidden = !replyQueue.length;
    void deliverReply();
  }

  function send(text) {
    const content = text.trim();
    if (!content || [...content].length > MAX_CHARACTERS) return;
    addMessage('You', { text: content });
    message.focus({preventScroll:true});
    starters.hidden = true;
    replyQueue.push(content);
    void deliverReply();
  }

  function updateSubmit() {
    submit.disabled = !message.value.trim();
  }
  message.addEventListener('input', updateSubmit);
  message.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    if (!submit.disabled) form.requestSubmit();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    send(message.value);
    message.value = '';
    updateSubmit();
  });
  starters.querySelectorAll('[data-intent]').forEach(button => {
    button.addEventListener('click', () => send(button.textContent));
  });
  dialog.querySelector('[data-margin-reset]').addEventListener('click', () => {
    activeRequest?.abort();
    activeRequest = undefined;
    history = [];
    replyQueue.length = 0;
    typing.hidden = true;
    lastAuthor = undefined;
    transcript.replaceChildren();
    starters.hidden = false;
    starters.scrollLeft = 0;
    message.value = '';
    updateSubmit();
    addMessage('Margin', {text: welcome});
    message.focus({preventScroll:true});
  });
  launcher.hidden = false;
  // END MARGIN CHAT INTERFACE
})();
