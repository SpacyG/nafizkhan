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

/* ===================================================================
   5. INTRO — the centaur's arrow (home page only; click / any key skips)
   black cosmos -> a constellation centaur draws itself -> bow is drawn ->
   the arrow pierces the dark -> cracks of light -> the site is revealed
   =================================================================== */
(function () {
  'use strict';
  if (!document.getElementById('home')) return;
  console.log('[nk] centaur intro starting');
  var root = document.documentElement; root.classList.add('nk-intro-on');
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var eo = function (t) { return 1 - Math.pow(1 - t, 3); };
  var eio = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var TAU = Math.PI * 2;

  var st = document.createElement('style');
  st.textContent = `
html.nk-intro-on { overflow:hidden; }
html.nk-intro-on:not(.nk-intro-go) #home .eyebrow, html.nk-intro-on:not(.nk-intro-go) #home .hero-tagline,
html.nk-intro-on:not(.nk-intro-go) #home .hero-copy, html.nk-intro-on:not(.nk-intro-go) #home .buttons,
html.nk-intro-on:not(.nk-intro-go) .nk-ch { animation-play-state:paused !important; }
#nk-intro { position:fixed !important; inset:0 !important; top:0 !important; left:0 !important; width:100vw !important; height:100vh !important; z-index:2147483500 !important; background:#000; cursor:none; }
#nk-intro canvas { position:absolute; inset:0; width:100%; height:100%; }
#nk-fx { position:fixed !important; inset:0 !important; top:0 !important; left:0 !important; width:100vw !important; height:100vh !important; z-index:2147483600 !important; pointer-events:none; }
#nk-cs { position:absolute; left:3vw; top:50%; width:min(90vw,135vh); height:auto; transform:translateY(-50%); overflow:visible; filter:drop-shadow(0 0 7px rgba(167,139,250,.85)); }
#nk-lines path, #nk-str { fill:none; stroke:#cdb8ff; stroke-width:2.2; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:1; stroke-dashoffset:1; }
.nk-st { fill:#fff; opacity:0; }
#nk-ar { filter:drop-shadow(0 0 8px rgba(255,205,110,.95)); }
.nk-hint { position:absolute; left:0; right:0; bottom:22px; text-align:center; font:600 .72rem/1 system-ui,sans-serif; letter-spacing:.28em; text-transform:uppercase; color:rgba(205,184,255,.55); transition:opacity .6s ease; }`;
  document.body.appendChild(st);

  var P = [
    'M250 270C250 235 330 225 400 235C450 240 480 255 490 275C490 305 440 318 380 318C310 320 250 310 250 270Z',
    'M252 258C215 246 190 275 204 322',
    'M455 305L472 360L463 408', 'M428 312L418 366L432 408', 'M292 308L272 364L284 410', 'M322 316L332 360L318 408',
    'M468 262C476 232 480 205 484 176',
    'M503 158a15 15 0 1 0-30 0a15 15 0 1 0 30 0',
    'M476 148C455 140 440 150 428 166',
    'M484 186L640 188', 'M484 188L448 178L470 186',
    'M600 96Q690 190 600 284'
  ];
  var S = [[490,275],[250,270],[472,360],[418,366],[272,364],[332,360],[484,176],[488,158],[640,188],[600,96],[600,284],[446,176],[204,322],[463,408],[432,408],[284,410],[318,408]];
  var ov = document.createElement('div'); ov.id = 'nk-intro'; ov.setAttribute('aria-hidden', 'true');
  ov.innerHTML = '<canvas id="nk-bg"></canvas><svg id="nk-cs" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="nkTr" x1="0" x2="1"><stop offset="0" stop-color="#ffd36b" stop-opacity="0"/><stop offset="1" stop-color="#fff3c4"/></linearGradient></defs><g id="nk-lines">' +
    P.map(function (d) { return '<path pathLength="1" d="' + d + '"/>'; }).join('') + '</g><path id="nk-str" pathLength="1" d="M600 96L600 284"/>' +
    S.map(function (p) { return '<circle class="nk-st" cx="' + p[0] + '" cy="' + p[1] + '" r="3.4"/>'; }).join('') +
    '<g id="nk-ar" opacity="0"><rect id="nk-tr" x="470" y="183.5" width="0" height="5" fill="url(#nkTr)"/><path d="M470 186L690 186" stroke="#ffe9a8" stroke-width="3" stroke-linecap="round"/><path d="M690 186l-15-8v16z" fill="#fff3c4"/><path d="M470 186l-14-8M470 186l-14 8M484 186l-14-8M484 186l-14 8" stroke="#ffc56b" stroke-width="2" stroke-linecap="round"/></g></svg><div class="nk-hint">Click to skip</div>';
  var fxc = document.createElement('canvas'); fxc.id = 'nk-fx'; fxc.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ov); document.body.appendChild(fxc);

  var bg = ov.querySelector('#nk-bg'), bx = bg.getContext('2d'), fx = fxc.getContext('2d');
  var cs = ov.querySelector('#nk-cs'), lines = [].slice.call(ov.querySelectorAll('#nk-lines path')), str = ov.querySelector('#nk-str'),
      dots = [].slice.call(ov.querySelectorAll('.nk-st')), ar = ov.querySelector('#nk-ar'), tr = ov.querySelector('#nk-tr'), hint = ov.querySelector('.nk-hint');
  var W, H, dpr, stars = [], sc, tx, ty, dxT, maxR, F = 140, rect;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    [bg, fxc].forEach(function (c) { c.width = W * dpr; c.height = H * dpr; });
    bx.setTransform(dpr, 0, 0, dpr, 0, 0); fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.min(260, Math.floor(W * H / 8000)) }, function () { return { x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + .3, p: Math.random() * TAU, a: Math.random() * .6 + .3 }; });
    rect = cs.getBoundingClientRect(); sc = rect.width / 800;
    var tipX = rect.left + 690 * sc; tx = clamp(Math.max(W * .9, tipX + 100 * sc), 0, W - 10); ty = rect.top + 186 * sc; dxT = (tx - tipX) / sc;
    maxR = Math.max(Math.hypot(tx, ty), Math.hypot(W - tx, ty), Math.hypot(tx, H - ty), Math.hypot(W - tx, H - ty)) + F;
  }
  size(); addEventListener('resize', size);

  var t0 = performance.now(), raf = 0, done = false, impact = 0, sparks = [], cracks = [];
  function makeFx() {
    for (var i = 0; i < 90; i++) { var a = Math.random() * TAU, v = 80 + Math.random() * 520; sparks.push({ x: tx, y: ty, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 2 + .6, c: Math.random() < .6 ? '255,220,150' : '200,170,255' }); }
    for (var k = 0; k < 11; k++) {
      var ang = k / 11 * TAU + Math.random() * .4, len = (.2 + Math.random() * .3) * Math.min(W, H), pts = [[tx, ty]];
      for (var s = 1; s <= 7; s++) { ang += (Math.random() - .5) * .6; var d = len / 7; pts.push([pts[s - 1][0] + Math.cos(ang) * d, pts[s - 1][1] + Math.sin(ang) * d]); }
      cracks.push(pts);
    }
  }
  function drawBg(t) {
    bx.clearRect(0, 0, W, H); var fade = clamp(t / 700, 0, 1);
    stars.forEach(function (s) { bx.globalAlpha = s.a * fade * (.7 + .3 * Math.sin(t / 700 + s.p)); bx.fillStyle = '#efe6ff'; bx.beginPath(); bx.arc(s.x, s.y, s.r, 0, TAU); bx.fill(); });
    bx.globalAlpha = 1;
  }
  var last = t0;
  function frame(now) {
    if (done) return;
    var t = now - t0, dt = Math.min(.05, (now - last) / 1000); last = now;
    drawBg(t);
    lines.forEach(function (p, i) { p.style.strokeDashoffset = (1 - eo(clamp((t - 350 - i * 70) / 600, 0, 1))).toFixed(3); });
    str.style.strokeDashoffset = (1 - eo(clamp((t - 350 - 12 * 70) / 600, 0, 1))).toFixed(3);
    dots.forEach(function (d, i) { d.style.opacity = (clamp((t - 1100 - i * 45) / 500, 0, 1) * (.65 + .35 * Math.sin(t / 260 + i))).toFixed(2); });
    var pk = eio(clamp((t - 1900) / 700, 0, 1));
    if (t < 3200) {
      str.setAttribute('d', 'M600 96L' + (600 - 130 * pk).toFixed(1) + ' ' + (188 - 2 * pk).toFixed(1) + 'L600 284');
      ar.setAttribute('opacity', clamp((t - 2500) / 300, 0, 1).toFixed(2));
      ar.setAttribute('transform', 'translate(' + (t > 2800 ? Math.sin(t / 17) * .7 : 0).toFixed(2) + ' 0)');
    } else {
      var vt = (t - 3200) / 1000, rk = clamp((t - 3200) / 500, 0, 1), dx = dxT * rk * rk * rk;
      str.setAttribute('d', 'M600 96Q' + (600 + 34 * Math.exp(-vt * 5.5) * Math.cos(vt * 55)).toFixed(1) + ' 190 600 284');
      ar.setAttribute('transform', 'translate(' + dx.toFixed(1) + ' 0)');
      var L = Math.min(dx, 380); tr.setAttribute('x', 470 - L); tr.setAttribute('width', L);
      if (rk >= 1 && !impact) { impact = t; makeFx(); }
    }
    fx.clearRect(0, 0, W, H);
    if (impact) {
      var d = t - impact, hk = clamp(d / 1500, 0, 1), R = maxR * eo(hk);
      ar.setAttribute('opacity', Math.max(0, 1 - d / 160).toFixed(2));
      var m = 'radial-gradient(circle at ' + tx + 'px ' + ty + 'px, transparent ' + R.toFixed(0) + 'px, #000 ' + (R + F).toFixed(0) + 'px)';
      ov.style.webkitMaskImage = m; ov.style.maskImage = m;
      if (d > 250) root.classList.add('nk-intro-go');           /* the page begins to appear */
      var fa = 1 - d / 380;
      if (fa > 0) { var g = fx.createRadialGradient(tx, ty, 0, tx, ty, 260 * (.4 + d / 380)); g.addColorStop(0, 'rgba(255,244,200,' + fa + ')'); g.addColorStop(1, 'rgba(255,200,120,0)'); fx.fillStyle = g; fx.fillRect(0, 0, W, H); }
      for (var j = 0; j < 3; j++) { var k = clamp((d - j * 140) / 900, 0, 1); if (k <= 0 || k >= 1) continue; fx.strokeStyle = 'rgba(255,214,150,' + ((1 - k) * .7).toFixed(2) + ')'; fx.lineWidth = 1.5 + (1 - k) * 3; fx.beginPath(); fx.arc(tx, ty, eo(k) * maxR * .55, 0, TAU); fx.stroke(); }
      fx.save(); fx.shadowColor = '#c9a8ff'; fx.shadowBlur = 24; fx.strokeStyle = 'rgba(255,226,170,' + (.85 * (1 - hk * .9)).toFixed(2) + ')'; fx.lineWidth = 3; fx.beginPath(); fx.arc(tx, ty, R + F * .45, 0, TAU); fx.stroke();
      var ca = 1 - clamp((d - 500) / 900, 0, 1), cp = eo(clamp(d / 700, 0, 1));
      if (ca > 0) { fx.shadowColor = '#ffd36b'; fx.shadowBlur = 10; fx.strokeStyle = 'rgba(255,232,180,' + ca.toFixed(2) + ')'; fx.lineWidth = 1.4;
        cracks.forEach(function (pts) { var n = Math.max(1, Math.floor(cp * (pts.length - 1))); fx.beginPath(); fx.moveTo(pts[0][0], pts[0][1]); for (var q = 1; q <= n; q++) fx.lineTo(pts[q][0], pts[q][1]); fx.stroke(); }); }
      fx.restore();
      sparks.forEach(function (s) { var al = 1 - d / 1100; if (al <= 0) return; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= .96; s.vy *= .96; fx.fillStyle = 'rgba(' + s.c + ',' + al.toFixed(2) + ')'; fx.beginPath(); fx.arc(s.x, s.y, s.r, 0, TAU); fx.fill(); });
      if (hk >= 1) { cleanup(); return; }
    }
    if (t > 3000) hint.style.opacity = 0;
    raf = requestAnimationFrame(frame);
  }
  function cleanup() {
    done = true; cancelAnimationFrame(raf); removeEventListener('resize', size);
    removeEventListener('keydown', skip); ov.remove(); fxc.remove(); st.remove(); root.classList.remove('nk-intro-on', 'nk-intro-go');
  }
  function skip() {
    if (done) return; done = true; cancelAnimationFrame(raf); root.classList.add('nk-intro-go');
    ov.style.transition = fxc.style.transition = 'opacity .5s ease'; ov.style.opacity = fxc.style.opacity = 0; setTimeout(cleanup, 540);
  }
  ov.addEventListener('pointerdown', skip); addEventListener('keydown', skip);
  raf = requestAnimationFrame(frame);
})();
