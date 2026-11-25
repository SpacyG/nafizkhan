(function () {
  'use strict';
    if (typeof HTMLDialogElement === 'undefined' || typeof HTMLDialogElement.prototype.showModal !== 'function') return;
    const widget = document.createElement('div');
    widget.className = 'margin-widget';
    widget.innerHTML = `
    <button type="button" class="margin-launcher" aria-haspopup="dialog" aria-controls="margin-dialog">
      <span aria-hidden="true">M.</span> Chat with Margin
    </button>
    <dialog id="margin-dialog" class="margin-dialog" aria-labelledby="margin-title">
      <div class="margin-head">
        <div><h2 id="margin-title">Margin<span>.</span></h2><p>Nafiz Khan’s portfolio assistant</p></div>
        <button type="button" data-margin-close aria-label="Close Margin">Close</button>
      </div>
      <section data-margin-transcript role="log" aria-label="Conversation" tabindex="0"></section>
      <div class="margin-starters" role="group" aria-label="Suggested messages">
        <button type="button" data-intent="process">How it works</button>
        <button type="button" data-intent="pricing">Pricing</button>
        <button type="button" data-intent="sample">See a sample edit</button>
        <button type="button" data-intent="start">Start a project</button>
      </div>
      <form class="margin-form">
        <label for="margin-message">Message Margin</label>
        <input id="margin-message" maxlength="800" autocomplete="off" enterkeyhint="send" required>
        <button type="submit">Send</button>
      </form>
      <div class="margin-foot"><p>Chat stays on this page.</p><button type="button" data-margin-reset>New chat</button></div>
    </dialog>
  `;
    document.body.append(widget);
    const dialog = widget.querySelector('dialog');
    const launcher = widget.querySelector('.margin-launcher');
    const closeButton = dialog.querySelector('[data-margin-close]');
    launcher.addEventListener('click', () => { dialog.showModal(); closeButton.focus(); });
    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => launcher.focus());

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

  const transcript = dialog.querySelector('[data-margin-transcript]');
  const message = dialog.querySelector('#margin-message');
  let respond = createMargin();

  function addMessage(who, result) {
    const entry = document.createElement('article');
    if (who === 'You') entry.className = 'margin-visitor';
    const label = document.createElement('strong');
    label.textContent = who;
    const text = document.createElement('p');
    text.textContent = result.text;
    entry.append(label, text);
    if (result.links) {
      const links = document.createElement('div');
      links.className = 'margin-links';
      for (const [label, href] of result.links) {
        const link = document.createElement('a');
        link.textContent = label;
        link.href = href;
        links.append(link);
      }
      entry.append(links);
    }
    transcript.append(entry);
    transcript.scrollTop = transcript.scrollHeight;
  }

  function send(text, suggested) {
    if (!text.trim()) return;
    addMessage('You', { text });
    addMessage('Margin', respond(text, suggested));
  }

  dialog.querySelector('.margin-form').addEventListener('submit', event => {
    event.preventDefault();
    send(message.value);
    message.value = '';
  });
  dialog.querySelectorAll('[data-intent]').forEach(button => {
    button.addEventListener('click', () => send(button.textContent, button.dataset.intent));
  });
  dialog.querySelector('[data-margin-reset]').addEventListener('click', () => {
    respond = createMargin();
    transcript.replaceChildren();
    message.value = '';
    addMessage('Margin', { text: welcome });
    message.focus();
  });
  addMessage('Margin', { text: welcome });
})();
