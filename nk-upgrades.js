/* nk-upgrades.js — add before </body> in index.html and work.html, after the existing scripts.
   1) Only the custom cursor, in normal AND calm mode
   2) Nebula backgrounds per section with soft transitions
   3) Slower, more spaced intro on the home hero
   4) Per-letter float + gradient highlight on hover
   (Shooting-star intro intentionally not included yet.) */
(function () {
  'use strict';
  if (window.__nkUpgrades) return; window.__nkUpgrades = true;

  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* wispy cloud texture (tileable SVG noise used as an alpha mask) */
  function cloud(seed, fx, fy) {
    return "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1100' height='800'%3E%3Cfilter id='f' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='" + fx + " " + fy + "' numOctaves='6' stitchTiles='stitch' seed='" + seed + "'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 3.4 -1.2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E\")";
  }

  var css = `
/* ---------- 1. one cursor only (custom), normal + calm ---------- */
#rocketCursor { display:none !important; }
@media (hover:hover) and (pointer:fine) {
  html:not(#nk), html:not(#nk) *, html:not(#nk) *::before, html:not(#nk) *::after { cursor:none !important; }
  html.calm #nk-dot, html.calm #nk-ring { display:block !important; }
}

/* ---------- 2. nebula section backgrounds ---------- */
.nk-neb { position:absolute; left:0; right:0; top:-150px; bottom:-150px; z-index:-1; pointer-events:none; opacity:var(--o,1);
  -webkit-mask-image:linear-gradient(to bottom,transparent 0,rgba(0,0,0,.25) 12%,#000 36%,#000 64%,rgba(0,0,0,.25) 88%,transparent 100%);
          mask-image:linear-gradient(to bottom,transparent 0,rgba(0,0,0,.25) 12%,#000 36%,#000 64%,rgba(0,0,0,.25) 88%,transparent 100%); }
.nk-neb.full { left:calc(50% - 50vw); right:auto; width:100vw; }
.nk-neb::before { content:""; position:absolute; inset:0; background:var(--bg); }
.nk-neb::after { content:""; position:absolute; inset:0; background:var(--c); opacity:.62;
  -webkit-mask-image:var(--m); mask-image:var(--m); -webkit-mask-size:1100px 800px; mask-size:1100px 800px; }

/* red emission nebula with dark dust lanes and a warm star glow */
.nk-red { --bg:
  radial-gradient(ellipse 60% 55% at 16% 30%, rgba(205,40,72,.32), transparent 70%),
  radial-gradient(ellipse 52% 60% at 84% 68%, rgba(150,24,60,.34), transparent 70%),
  radial-gradient(ellipse 34% 22% at 60% 22%, rgba(10,2,8,.6), transparent 75%),
  radial-gradient(ellipse 24% 24% at 9% 86%, rgba(255,175,90,.17), transparent 70%);
  --c:linear-gradient(115deg, rgba(255,90,110,.9), rgba(150,20,70,.9) 60%, rgba(255,150,90,.6)); }
/* blue / violet nebula with a pink flush */
.nk-blue { --bg:
  radial-gradient(ellipse 62% 55% at 78% 28%, rgba(60,120,255,.32), transparent 70%),
  radial-gradient(ellipse 50% 60% at 14% 70%, rgba(150,70,230,.32), transparent 70%),
  radial-gradient(ellipse 30% 26% at 30% 18%, rgba(236,90,170,.22), transparent 70%),
  radial-gradient(ellipse 30% 20% at 55% 82%, rgba(8,6,24,.5), transparent 75%);
  --c:linear-gradient(60deg, rgba(90,160,255,.9), rgba(150,90,235,.9) 60%, rgba(240,110,190,.6)); }
/* violet / magenta */
.nk-violet { --bg:
  radial-gradient(ellipse 58% 55% at 24% 36%, rgba(160,70,220,.3), transparent 70%),
  radial-gradient(ellipse 50% 55% at 82% 62%, rgba(220,80,160,.26), transparent 70%),
  radial-gradient(ellipse 30% 22% at 60% 14%, rgba(10,4,20,.5), transparent 75%);
  --c:linear-gradient(135deg, rgba(190,120,255,.9), rgba(230,100,170,.8)); }
/* deep teal-blue */
.nk-teal { --bg:
  radial-gradient(ellipse 60% 55% at 70% 32%, rgba(40,150,190,.28), transparent 70%),
  radial-gradient(ellipse 50% 60% at 18% 66%, rgba(50,90,210,.3), transparent 70%),
  radial-gradient(ellipse 28% 24% at 45% 84%, rgba(6,10,24,.55), transparent 75%);
  --c:linear-gradient(80deg, rgba(80,210,220,.8), rgba(70,110,230,.9)); }

@media print { .nk-neb { display:none !important; } }

/* ---------- 3. slower, more spaced intro ---------- */
#home .eyebrow { animation-delay:.2s !important; }
.nk-ch { animation-delay:calc(.9s + var(--i) * 75ms) !important; }
#home .hero-tagline { animation-delay:2.4s !important; }
#home .hero-copy { animation-delay:2.8s !important; }
#home .buttons { animation-delay:3.2s !important; }

/* ---------- crisp + smooth: no blur on reveals or intro ---------- */
html .js-reveal { filter:none !important; transform:translate3d(0,20px,0); transition:opacity .85s ease, transform .95s cubic-bezier(.22,.8,.24,1) !important; }
html .js-reveal.revealed { filter:none !important; transform:none; }
@keyframes nk-enter { from { opacity:0; transform:translate3d(0,22px,0); } to { opacity:1; transform:none; } }
@keyframes nk-letter { from { opacity:0; transform:translate3d(0,.45em,0); } to { opacity:1; transform:none; } }
#home .eyebrow, #home .hero-tagline, #home .hero-copy, #home .buttons { animation-name:nk-enter !important; animation-duration:1.1s !important; }
.nk-ch { filter:none !important; animation-name:nk-letter !important; }

/* ---------- 4. per-letter hover float + gradient ---------- */
.nk-wd { display:inline-block; white-space:nowrap; }
.nk-lt { display:inline-block; --k:0; translate:0 calc(var(--k) * -11px); }
.nk-lt[data-lit] { color:color-mix(in srgb, currentColor calc((1 - var(--k)) * 100%), hsl(var(--h,270) 100% 76%));
  text-shadow:0 0 calc(var(--k) * 16px) hsl(var(--h,270) 100% 70% / calc(var(--k) * .7)); }
/* retire the old whole-word hover so the two effects never fight */
html .gw[style*="--lit"], html .gw:hover { color:inherit !important; text-shadow:none !important; transform:none !important; }
@media (prefers-reduced-motion:reduce) { .nk-lt { translate:none; } }
`;
  var st = document.createElement('style'); st.id = 'nk-upgrades-css'; st.textContent = css;
  document.body.appendChild(st);                      /* last in the document, so it wins ties */

  /* ---------- 2. attach the nebulas ---------- */
  function neb(host, cls, seed, o, extra) {
    if (!host) return;
    var d = document.createElement('div');
    d.className = 'nk-neb ' + cls + (extra ? ' ' + extra : ''); d.setAttribute('aria-hidden', 'true');
    d.style.setProperty('--m', cloud(seed, '.009', '.016'));
    if (o !== 1) d.style.setProperty('--o', o);
    host.insertBefore(d, host.firstChild);
    return d;
  }
  if (document.getElementById('home')) {
    neb(document.getElementById('home'), 'nk-violet', 3, .5, 'full');
    neb(document.getElementById('services'), 'nk-red', 11, 1);
    neb(document.getElementById('approach'), 'nk-blue', 21, 1);
    neb(document.getElementById('work'), 'nk-violet', 31, 1);
    neb(document.getElementById('about'), 'nk-teal', 41, 1);
    neb(document.getElementById('reviews'), 'nk-red', 51, .9);
    neb(document.getElementById('contact'), 'nk-blue', 61, 1);
  } else {
    var main = document.getElementById('main') || document.querySelector('main');
    var a = neb(main, 'nk-blue', 71, 1); if (a) { a.style.top = '0'; a.style.bottom = 'auto'; a.style.height = '55%'; }
    var b = neb(main, 'nk-red', 81, 1);  if (b) { b.style.bottom = '0'; b.style.top = 'auto'; b.style.height = '70%'; }
  }

  /* ---------- 4. split headings into letters ---------- */
  document.querySelectorAll('.nk-ch').forEach(function (e) { e.classList.add('nk-lt'); });   /* hero-name letters */
  function splitLetters(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
    while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach(function (n) {
      if (!n.nodeValue.trim() || (n.parentElement && n.parentElement.closest('.nk-lt'))) return;
      var frag = document.createDocumentFragment();
      n.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var word = document.createElement('span'); word.className = 'nk-wd';
        Array.from(part).forEach(function (ch) { var s = document.createElement('span'); s.className = 'nk-lt'; s.textContent = ch; word.appendChild(s); });
        frag.appendChild(word);
      });
      n.parentNode.replaceChild(frag, n);
    });
  }
  document.querySelectorAll('.gw, .hero-tagline').forEach(splitLetters);

  if (!fine) return;                                   /* touch devices: no hover effect */

  /* proximity engine: letters near the pointer rise and shift colour across a violet-to-pink-to-cyan gradient */
  var R = 95, letters = [], dirty = true, px = -9999, py = -9999, raf = 0;
  function collect() { letters = [].slice.call(document.querySelectorAll('.nk-lt')).map(function (el) { return { el: el, k: 0, cx: 0, cy: 0, hw: 0, hh: 0, on: false }; }); dirty = true; }
  function measure() { letters.forEach(function (l) { var r = l.el.getBoundingClientRect(); l.cx = r.left + r.width / 2; l.cy = r.top + r.height / 2; l.hw = r.width / 2; l.hh = r.height / 2; }); dirty = false; }
  function tick() {
    raf = 0; if (!letters.length) collect(); if (dirty) measure();
    var busy = false;
    letters.forEach(function (l) {
      var target = 0;
      if (l.cy > -150 && l.cy < innerHeight + 150) {
        var d = Math.hypot(Math.max(Math.abs(px - l.cx) - l.hw, 0), Math.max(Math.abs(py - l.cy) - l.hh, 0));
        if (d < R) { var k = 1 - d / R; target = k * k * (3 - 2 * k); }
      }
      l.k += (target - l.k) * .22;
      if (Math.abs(target - l.k) < .01) l.k = target; else busy = true;
      if (l.k > 0) {
        l.el.style.setProperty('--k', l.k.toFixed(3));
        l.el.style.setProperty('--h', String(Math.round(190 + clamp(l.cx / innerWidth, 0, 1) * 170) % 360));
        if (!l.on) { l.el.setAttribute('data-lit', ''); l.on = true; }
      } else if (l.on) {
        l.el.style.removeProperty('--k'); l.el.style.removeProperty('--h'); l.el.removeAttribute('data-lit'); l.on = false;
      }
    });
    if (busy) raf = requestAnimationFrame(tick);
  }
  var kick = function () { if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener('pointermove', function (e) { if (e.pointerType && e.pointerType !== 'mouse') return; px = e.clientX; py = e.clientY; kick(); }, { passive: true });
  addEventListener('scroll', function () { dirty = true; if (px > -9000) kick(); }, { passive: true });
  addEventListener('resize', function () { dirty = true; }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { px = py = -9999; kick(); });
  addEventListener('blur', function () { px = py = -9999; kick(); });
  addEventListener('load', function () { dirty = true; });
})();
