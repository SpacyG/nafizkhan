(function () {
  'use strict';

  // BEGIN MARGIN QUALIFICATION ENGINE
  const portfolio = new URL('index.html', location.href).href;
  const workPage = new URL('work.html', location.href).href;
  const email = 'n.tonmoy.khan@gmail.com';
  const welcome = 'I’m Margin, Nafiz’s assistant. I can show you his writing samples, explain how he works, or help you put together a short project brief.';
  const questions = [
    'What do you need written: an email, a sales or landing page, a product description, or website copy?',
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
    services: { text: 'Nafiz writes emails, sales pages, landing pages, product descriptions, and website copy. You can see what he offers on the portfolio.', links: [['See services', portfolio + '#services']] },
    sample: { text: 'Morning Ritual shows a practice email edit from first draft to rewrite. The portfolio has more concept samples to browse.', links: [['See the sample edit', workPage + '#sample-email'], ['Browse samples', portfolio + '#work']] },
    planner: { text: 'The Daily Planner is a concept sales page. You can find the sample and its edit on the Work page.', links: [['See The Daily Planner', workPage + '#sample-sales']] },
    gym: { text: 'Local Gym is a concept landing page that makes strength training feel approachable. You can read the sample on the Work page.', links: [['See Local Gym', workPage + '#sample-landing']] },
    bookstore: { text: 'The bookstore sample is a concept welcome-back email. You can read it on the Work page.', links: [['See the bookstore email', workPage + '#sample-bookstore']] },
    lumaskin: { text: 'LumaSkin is a three-email abandoned-cart concept. You can read the sequence on the Work page.', links: [['See the LumaSkin sequence', workPage + '#sample-lumaskin']] },
    identity: { text: 'I’m Margin, Nafiz’s automated portfolio assistant. I use prepared answers and can help you put together a project brief.' },
    contact: { text: 'You can email Nafiz at ' + email + ' or use his portfolio contact form. Include what you need and when you need it.', links: [['Email Nafiz', 'mailto:' + email], ['Open the contact form', portfolio + '#contact']] },
    teardown: { text: 'Send one headline and a little context. Nafiz will point out what is clear, what is missing, and one direction to try.', links: [['See the free headline teardown', portfolio + '#teardown']] },
    terms: { text: 'Revision rounds and payment terms are set out in your project quote. Ask Nafiz by email about any specific terms, including refunds.', links: [['Email Nafiz', 'mailto:' + email]] },
    outside: { text: 'That’s outside what Nafiz offers. If you’re unsure whether your project fits his copywriting services, email ' + email + '.' },
    boundary: { text: 'I can help with Nafiz’s samples, services, and project briefs. What would you like to know about working with him?' }
  };

  function normalize(message) {
    return message.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[‘’]/g, "'").toLowerCase();
  }

  function safetyIntent(message) {
    const text = normalize(message);
    if (/\b(?:ignore|override|forget|bypass)\b[\s\S]{0,85}\b(?:rules|instructions|prompt|above)\b|system prompt|reveal[\s\S]{0,20}instructions|\b(?:pretend|act as)\b/.test(text)) return 'boundary';
    const explicit = text.replace(/[01345]/g, ch => ({0:'o',1:'i',3:'e',4:'a',5:'s'})[ch]);
    if (/(?:^|[^a-z])p[\W_]*[ou]?[\W_]*r[\W_]*n(?:o(?:graph(?:y|ic))?)?(?:$|[^a-z])|\b(?:nsfw|erotica|erotic|hentai|sexting)\b|sexually explicit|adult (?:content|script|video|site|website)|explicit sex/.test(explicit)) return 'boundary';
    if (/\b(?:seo|ads|advertising|social media|graphic design|web design|translation|translate|web development|video scripts?|screenplays?)\b/.test(text) && !/\b(?:no|without) (?:seo|ads|advertising|social media|graphic design|web design|translation|web development)\b/.test(text)) return 'outside';
    if (/^(?:please\s+)?(?:make|write|generate|draft|create|tell|give|show|send)\s+(?:me\s+)?(?:an?\s+)?(?:script|story|poem|essay|recipe|joke|code)\b|\b(?:world cup|weather forecast|sports scores?|capital of|bitcoin|stock prices?)\b/.test(text)) return 'boundary';
    return null;
  }

  const deliverables = [
    [/\b(?:landing pages?|landing copy)\b/, 'Landing page'],
    [/\b(?:sales pages?|sales copy)\b/, 'Sales page'],
    [/\bproduct descriptions?\b/, 'Product description'],
    [/\b(?:website copy|web copy|service pages?|homepage copy)\b/, 'Website copy'],
    [/\b(?:emails?|e-mails?|newsletters?)\b/, 'Email copy']
  ];

  function projectType(message) {
    const text = normalize(message);
    return deliverables.find(([pattern]) => pattern.test(text))?.[1];
  }

  function detectIntent(message, collecting) {
    const text = normalize(message).replace(/[.!?]+$/, '');
    const scope = projectType(message) || /\b(?:nafiz|margin|copywriting|your (?:services?|process|portfolio|work|projects?|rates?|pricing|samples?))\b/.test(text);
    if (/\b(?:free headline teardown|headline review|headline teardown)\b/.test(text)) return 'teardown';
    if (/\b(?:refunds?|payment terms|deposit|how many revisions?|revision rounds?)\b/.test(text)) return 'terms';
    if (/\b(?:sales|conversions?|rankings?|revenue)\b/.test(text) && /\b(?:guarantee|promise|double|increase|boost)\b/.test(text)) return 'results';
    if (text === 'pricing' || /^(?:how (?:much (?:do you charge|would (?:it|this) cost|does (?:it|this) cost)|is pricing handled|do you price)|what (?:does (?:it|this) cost|are (?:your|the) rates)|can i pay\s*[$€£৳]|is it\s*[$€£৳])/.test(text) ||
        (scope && /\b(?:price|prices|pricing|rates?|cost|discount|budget|how much|quote)\b/.test(text))) return 'pricing';
    if (/^(?:are you available|how long (?:does (?:it|a project) take|would (?:it|this) take)|(?:can you|can nafiz) (?:deliver|finish)|guarantee delivery|when (?:can you|can nafiz) (?:start|deliver))/.test(text) ||
        (scope && /\b(?:availability|turnaround|delivery time|guarantee|deadline)\b/.test(text))) return 'timing';
    if (/\b(?:clients?|testimonials?|awards?|years of experience)\b/.test(text) &&
        (scope || /^(?:show (?:me )?(?:your |some |the )?|which |who are |do you have |have you worked with )/.test(text))) return 'evidence';
    if (/^(?:are you (?:nafiz|an? ai|an? bot|human)|who are you|what are you)/.test(text)) return 'identity';
    if (/\bdaily planner\b/.test(text)) return 'planner';
    if (/\blocal gym\b/.test(text)) return 'gym';
    if (/\b(?:bookstore welcome.back|bookstore (?:sample|email))\b/.test(text)) return 'bookstore';
    if (/\blumaskin\b/.test(text)) return 'lumaskin';
    if (/\bmorning ritual\b/.test(text)) return 'sample';
    if (/^(?:(?:show me|see|browse|can i see|where can i see|i(?:'m| am) just browsing)\b.*\b(?:samples?|portfolio|edit|work)\b|samples?|portfolio|before.and.after)$/.test(text) ||
        (scope && /\b(?:samples?|portfolio|before.and.after)\b/.test(text))) return 'sample';
    if (/^(?:how (?:do you work|does (?:it|this|working together|your process) work)|how it works|process|how (?:can|do) i (?:get started|start working with you))$/.test(text)) return 'process';
    if (/^(?:contact(?: nafiz| form)?|your email|(?:what is|what's) your email(?: address)?|how (?:can|do) i (?:reach|contact) (?:you|nafiz))$/.test(text)) return 'contact';
    if (/^(?:services|what do(?:es)? (?:you|nafiz|he) (?:do|offer|write)|what services do you offer|what can you help with)$/.test(text)) return 'services';
    if (!collecting && (/^(?:i (?:want|would like) to )?start (?:a |my )?project$/.test(text) ||
        (projectType(message) && /\b(?:i need|i want|i'd like|looking for|can you write|can nafiz write|help (?:me )?with|i'm hiring|hire (?:you|nafiz)|make me)\b/.test(text)))) return 'start';
    return null;
  }

  function briefDetails(message) {
    const answers = [];
    answers[0] = projectType(message);
    const audience = message.match(/\bfor\s+([^.!?,;]+?)(?=\s+(?:to|by|and (?:i|it|the))\b|[.!?,;]|$)/i);
    const goal = message.match(/\b(?:the goal is to (?:get them to\s+)?|(?:we|i) want (?:readers|them) to\s+|so (?:readers|they) can\s+)([^.!?,;]+)/i);
    if (audience && goal) answers[1] = audience[1] + ' → ' + goal[1];
    const materials = message.match(/\b(?:i have|we have|no)\s+((?:existing |some |a )?(?:copy|draft|brand notes|brand guide)[^.!?,;]*)/i);
    if (materials) answers[2] = materials[0];
    const date = message.match(/\b(?:need (?:it|this) by|due (?:by|on)|deadline is)\s+([^.!?,;]+)/i);
    if (date && validAnswer(3, date[1])) answers[3] = date[1];
    return answers;
  }

  function validAnswer(step, message) {
    const text = normalize(message);
    if (text.endsWith('?')) return false;
    if (step === 0) return Boolean(projectType(message));
    if (step === 1) {
      return /\b(?:for|audience|target|customers?|readers?|buyers?|beginners?|shoppers?|subscribers?|visitors?|parents?|students?|business(?:es| owners)?|people|users?|professionals?|members?)\b/.test(text) &&
        /\b(?:book|sign up|subscribe|click|reply|buy|purchase|order|register|join|download|apply|contact|request|visit|donate|enquir\w*|inquir\w*|learn|understand|try|checkout)\b/.test(text);
    }
    if (step === 2) {
      return /^(?:yes|no|none|not yet|nothing(?: yet)?|from scratch)[.!]?$/.test(text) ||
        /^https?:\/\/[^\s]+$/i.test(text) ||
        /\b(?:copy|drafts?|brand (?:notes|guide|guidelines)|brief|existing (?:site|website|page)|materials|starting from scratch)\b/.test(text);
    }
    return /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|asap|flexible|no (?:rush|deadline)|not sure|(?:next|this) (?:week|month|quarter)|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}|\d+\s+(?:business )?(?:days?|weeks?|months?))\b|\b\d{1,4}[/.\-]\d{1,2}(?:[/.\-]\d{1,4})?\b/.test(text);
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
      const intent = safetyIntent(input) || suggested || detectIntent(input, collecting);
      if (intent === 'start') {
        if (!collecting) answers = briefDetails(input);
        collecting = true;
        return advance();
      }
      if (intent && responses[intent]) return responses[intent];
      if (collecting) {
        const next = questions.findIndex((_, index) => !answers[index]);
        if (!validAnswer(next, input)) return { text: questions[next] };
        answers[next] = next === 0 ? projectType(input) : input;
        return advance();
      }
      return { text: fallback, links: [['Email Nafiz', 'mailto:' + email]] };
    };
  }
  // END MARGIN QUALIFICATION ENGINE

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
