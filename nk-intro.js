/* ===================================================================
   5. INTRO — the centaur's arrow (home page only; click / any key skips)
   black cosmos -> a constellation centaur draws itself -> bow is drawn ->
   the arrow pierces the dark -> cracks of light -> the site is revealed
   =================================================================== */
(function () {
  'use strict';
  if (window.__nkIntro || !document.getElementById('home')) return; window.__nkIntro = true;
  document.documentElement.setAttribute('data-nk-intro', 'v4');
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
