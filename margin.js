(function () {
  'use strict';

  // BEGIN EXISTING MARGIN ANSWER ENGINE
  const portfolio = new URL('index.html', location.href).href;
  const workPage = new URL('work.html', location.href).href;
  const email = 'n.tonmoy.khan@gmail.com';
  const welcome = 'I’m Margin, Nafiz’s assistant. I can show you his writing samples, explain how he works, or help you put together a short project brief.';
  const questions = [
    'What do you need written: an email, a sales page, a landing page, or something else?',
    'Who is it for, and what should readers do next?',
    'Do you have existing copy or brand notes?',
    'When do you need it?'
  ];
  const fallback = 'I don’t know that, but Nafiz can answer by email. Write to ' + email + '.';
  const responses = {
    pricing: { text: 'Nafiz quotes one fixed price per project and agrees it with you before work starts. The quote depends on the goal, audience, how much needs writing or reworking, and the research involved.', links: [['Read about project quotes', portfolio + '#process']] },
    timing: { text: 'Nafiz confirms timing after seeing your brief. You can include your preferred date when you contact him.' },
    results: { text: 'Nafiz can discuss your goal when he reviews the brief. He doesn’t guarantee outcomes such as sales, conversions, or rankings.' },
    evidence: { text: 'Nafiz is at the beginning of his copywriting career. The portfolio samples are practice projects for fictional brands.' },
    process: { text: 'Nafiz reviews your brief and shares a fixed quote before work starts. The portfolio explains how the work moves from drafting to revisions and delivery.', links: [['See the process', portfolio + '#process']] },
    services: { text: 'Nafiz writes emails, sales pages, and landing pages. You can see what he offers on the portfolio.', links: [['See services', portfolio + '#services']] },
    sample: { text: 'Morning Ritual shows a practice email edit from first draft to rewrite. The portfolio has more concept samples to browse.', links: [['See the sample edit', workPage + '#sample-email'], ['Browse samples', portfolio + '#work']] },
    identity: { text: 'I’m Margin, Nafiz’s automated portfolio assistant. I use prepared answers and can help you put together a project brief.' },
    contact: { text: 'You can email Nafiz at ' + email + ' or use his portfolio contact form. Include what you need and when you need it.', links: [['Email Nafiz', 'mailto:' + email], ['Open the contact form', portfolio + '#contact']] },
    outside: { text: 'That’s outside what Nafiz offers. If you’re unsure whether your project fits his copywriting services, email ' + email + '.' },
    boundary: { text: 'I can help with Nafiz’s samples, services, and project briefs. What would you like to know about working with him?' }
  };

  function detectIntent(message, collecting) {
    if (/\b(?:ignore|override|forget|bypass)\b.{0,85}\b(?:rules|instructions|prompt|above)\b|system prompt|reveal.{0,20}instructions|\b(?:pretend|act as)\b/i.test(message)) return 'boundary';
    if (/\b(?:seo|ads|advertising|social media|design|translation|translate|web development)\b/i.test(message)) return 'outside';
    if (/\b(?:price|prices|pricing|rates?|cost|discount|budget|how much|per word|per hour|per day)\b|[$€£৳]/i.test(message)) return 'pricing';
    if (/\b(?:revisions?|refunds?|payment terms|deposit)\b/i.test(message)) return 'unknown';
    if (/\b(?:clients?|testimonials?|awards?|experience|reviews?|results?|case studies)\b/i.test(message) && !/\b(?:guarantee|promise)\b/i.test(message)) return 'evidence';
    if (/\b(?:sales|conversions?|rankings?|revenue)\b/i.test(message) && /\b(?:guarantee|promise|double|increase|boost)\b/i.test(message)) return 'results';
    if (/\b(?:available|availability|turnaround|delivery time|how long|can you (?:deliver|finish)|guarantee|promise)\b/i.test(message)) return 'timing';
    if (/\b(?:are you (?:nafiz|an? ai|an? bot|human)|who are you|what are you)\b/i.test(message)) return 'identity';
    if (/\b(?:samples?|portfolio|browse|before.and.after|morning ritual)\b/i.test(message)) return 'sample';
    if (/\b(?:how (?:do(?:es)?|would|will).{0,30}(?:work|start)|process|steps|working together work)\b/i.test(message)) return 'process';
    if (/\b(?:contact form|contact nafiz|your email|email address|how (?:can|do) i (?:reach|contact))\b/i.test(message)) return 'contact';
    if (/\b(?:world cup|weather|sports score|capital of|solve|joke|recipe)\b/i.test(message)) return 'boundary';
    if (!collecting && /\b(?:start a project|hire|work with|i need|i want|i'd like|i’d like|looking for|can you write|can nafiz write|help (?:me )?with)\b/i.test(message)) return 'start';
    if (/\b(?:services|what do(?:es)? (?:you|nafiz|he) (?:do|offer|write))\b/i.test(message)) return 'services';
    return null;
  }

  function briefDetails(message) {
    const answers = [];
    const deliverable = message.match(/\b(?:landing pages?|sales pages?|welcome emails?|email sequences?|emails?|website copy)\b/i);
    if (deliverable) answers[0] = deliverable[0];
    const audience = message.match(/\bfor\s+([^.!?,;]+?)(?=\s+(?:to|by|and (?:i|it|the))\b|[.!?,;]|$)/i);
    const goal = message.match(/\b(?:the goal is to (?:get them to\s+)?|(?:we|i) want (?:readers|them) to\s+|so (?:readers|they) can\s+)([^.!?,;]+)/i);
    if (audience && goal) answers[1] = audience[1] + ' → ' + goal[1];
    const materials = message.match(/\b(?:i have|we have|no)\s+((?:existing |some |a )?(?:copy|draft|brand notes|brand guide)[^.!?,;]*)/i);
    if (materials) answers[2] = materials[0];
    const date = message.match(/\b(?:need (?:it|this) by|due (?:by|on)|deadline is)\s+([^.!?,;]+)/i);
    if (date) answers[3] = date[1];
    return answers;
  }

  function createMargin() {
    let collecting = false;
    let answers = [];

    function advance() {
      const next = questions.findIndex((_, index) => !answers[index]);
      if (next !== -1) return { text: questions[next] };
      collecting = false;
      const summary = [
        'Project: ' + answers[0],
        'Audience and goal: ' + answers[1],
        'Materials: ' + answers[2] + ' | Requested date: ' + answers[3]
      ].join('\n');
      return {
        text: summary + '\n\nEmail this brief or paste it into the contact form. Nafiz will review the fit and confirm timing and a fixed project quote if it’s a match.',
        summary,
        links: [['Open email draft', 'mailto:' + email + '?subject=Project%20brief&body=' + encodeURIComponent(summary)], ['Open the contact form', portfolio + '#contact']]
      };
    }

    return function reply(message, suggested) {
      const input = message.trim();
      if (/^(?:cancel|stop|never mind|nevermind|just browsing|i(?:'m|’m| am) just browsing)[.!]?$/i.test(input)) {
        collecting = false;
        answers = [];
        return { text: 'The brief is closed. You can still browse Nafiz’s work.', links: [['Browse samples', portfolio + '#work']] };
      }
      const intent = suggested || detectIntent(input, collecting);
      if (intent === 'start') {
        if (!collecting) answers = briefDetails(input);
        collecting = true;
        return advance();
      }
      if (intent && responses[intent]) return responses[intent];
      if (intent === 'unknown' || /\?$/.test(input)) return { text: fallback, links: [['Email Nafiz', 'mailto:' + email]] };
      if (collecting) {
        const next = questions.findIndex((_, index) => !answers[index]);
        answers[next] = input;
        const details = briefDetails(input);
        details.forEach((answer, index) => { if (!answers[index]) answers[index] = answer; });
        return advance();
      }
      return { text: fallback, links: [['Email Nafiz', 'mailto:' + email]] };
    };
  }
  // END EXISTING MARGIN ANSWER ENGINE

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
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clock = new Intl.DateTimeFormat(undefined, {hour:'numeric', minute:'2-digit'});
  const replyQueue = [];
  let respond = createMargin();
  let replyTimer;
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
    if (result.links) {
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

  function deliverReply() {
    if (!replyQueue.length) {
      typing.hidden = true;
      return;
    }
    typing.hidden = false;
    scrollToLatest();
    replyTimer = setTimeout(() => {
      replyTimer = undefined;
      addMessage('Margin', replyQueue.shift());
      if (!dialog.open) setUnread(true);
      deliverReply();
    }, reduced.matches ? 0 : 360);
  }

  function send(text, suggested) {
    if (!text.trim()) return;
    addMessage('You', {text});
    message.focus({preventScroll:true});
    starters.hidden = true;
    replyQueue.push(respond(text, suggested));
    if (replyTimer === undefined) deliverReply();
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
    button.addEventListener('click', () => send(button.textContent, button.dataset.intent));
  });
  dialog.querySelector('[data-margin-reset]').addEventListener('click', () => {
    respond = createMargin();
    clearTimeout(replyTimer);
    replyTimer = undefined;
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
