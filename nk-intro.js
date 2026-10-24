/* ===================================================================
   5. INTRO v6 — the centaur's arrow (home page only; click / any key skips)
   Uses your own drawing (images/nk-centaur-*.webp):
   the drawing sweeps in as glowing line art -> the bow flexes as it is drawn ->
   the arrow is loosed (string thrums, bow springs back) -> a beat of silence ->
   the arrow falls back like a meteor, straight at the viewer ->
   it strikes the centre of the screen, cracks spread, the site is revealed
   =================================================================== */
(function () {
  'use strict';
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '');
  if (window.__nkIntro || !document.getElementById('home')) return; window.__nkIntro = true;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.setAttribute('data-nk-intro', 'v6');
  var root = document.documentElement; root.classList.add('nk-intro-on');
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var eo = function (t) { return 1 - Math.pow(1 - t, 3); };
  var eio = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var TAU = Math.PI * 2;

  /* ---- timeline (ms, counted from the moment the images are ready) ---- */
  var T = { rev0: 250, rev1: 2900, draw0: 2700, draw1: 4000, rel: 4700, meteor: 5900, hit: 7100 };

  /* ---- geometry of the 1254 x 1254 drawing ---- */
  var IMG = 1254, BOWX = 880, BY0 = 250, BY1 = 430, FLEX = 46;
  var NOCK = [644, 334], ADIR = [0.99527, -0.0971], TIPT = [902, 12], TIPB = [1077, 762];
  function off(y) { var d = Math.abs(y - 340) - 90; return d <= 0 ? 0 : FLEX * Math.pow(clamp(d / (y < 340 ? 235 : 335), 0, 1), 1.5); }

  var st = document.createElement('style');
  st.textContent = `
html.nk-intro-on { overflow:hidden; }
html.nk-intro-on:not(.nk-intro-go) #home .eyebrow, html.nk-intro-on:not(.nk-intro-go) #home .hero-tagline,
html.nk-intro-on:not(.nk-intro-go) #home .hero-copy, html.nk-intro-on:not(.nk-intro-go) #home .buttons,
html.nk-intro-on:not(.nk-intro-go) .nk-ch { animation-play-state:paused !important; }
#nk-intro { position:fixed !important; inset:0 !important; top:0 !important; left:0 !important; width:100vw !important; height:100vh !important; z-index:2147483500 !important; background:#000; cursor:none; overflow:hidden; }
#nk-intro canvas { position:absolute; }
#nk-bg { inset:0; width:100%; height:100%; }
#nk-fig { filter:drop-shadow(0 0 7px rgba(167,139,250,.55)) drop-shadow(0 0 22px rgba(120,80,220,.35)); }
#nk-fx { position:fixed !important; inset:0 !important; top:0 !important; left:0 !important; width:100vw !important; height:100vh !important; z-index:2147483600 !important; pointer-events:none; }
.nk-hint { position:absolute; left:0; right:0; bottom:22px; text-align:center; font:600 .72rem/1 system-ui,sans-serif; letter-spacing:.28em; text-transform:uppercase; color:rgba(205,184,255,.55); transition:opacity .6s ease; }`;
  document.body.appendChild(st);

  var ov = document.createElement('div'); ov.id = 'nk-intro'; ov.setAttribute('aria-hidden', 'true');
  ov.innerHTML = '<canvas id="nk-bg"></canvas><canvas id="nk-fig"></canvas><div class="nk-hint">Click to skip</div>';
  var fxc = document.createElement('canvas'); fxc.id = 'nk-fx'; fxc.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ov); document.body.appendChild(fxc);

  var bg = ov.querySelector('#nk-bg'), bx = bg.getContext('2d'), fig = ov.querySelector('#nk-fig'), gx = fig.getContext('2d'),
      fx = fxc.getContext('2d'), hint = ov.querySelector('.nk-hint');

  var W, H, dpr, S, FX0, FY0, K, stars = [], tx, ty, p0x, p0y, maxR, F = 140;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    [bg, fxc].forEach(function (c) { c.width = W * dpr; c.height = H * dpr; });
    bx.setTransform(dpr, 0, 0, dpr, 0, 0); fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S = Math.min(W * .98, H * .97, 1100); FX0 = (W - S) / 2; FY0 = (H - S) / 2; K = S / IMG;
    var r = Math.min(dpr, 1500 / S);
    fig.width = Math.round(S * r); fig.height = Math.round(S * r);
    fig.style.width = S + 'px'; fig.style.height = S + 'px'; fig.style.left = FX0 + 'px'; fig.style.top = FY0 + 'px';
    gx.setTransform(fig.width / IMG, 0, 0, fig.width / IMG, 0, 0);
    stars = Array.from({ length: Math.min(300, Math.floor(W * H / 7000)) }, function () { return { x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + .3, p: Math.random() * TAU, a: Math.random() * .6 + .3 }; });
    tx = W / 2; ty = H / 2; p0x = tx + W * .11; p0y = -H * .07;
    maxR = Math.max(Math.hypot(tx, ty), Math.hypot(W - tx, ty), Math.hypot(tx, H - ty), Math.hypot(W - tx, H - ty)) + F;
  }
  size(); addEventListener('resize', size);

  var done = false, raf = 0, t0 = 0, last = 0, impact = 0, sparks = [], cracks = [], imgs = {};
  var names = { body: 'nk-centaur-body.webp', bow: 'nk-centaur-bow.webp', arrow: 'nk-centaur-arrow.webp' }, pending = 3;
  Object.keys(names).forEach(function (k) {
    var im = new Image(); im.onload = function () { imgs[k] = im; if (--pending === 0) start(); };
    im.onerror = function () { if (!done) { console.warn('[nk] intro image missing: ' + names[k]); skip(); } };
    im.src = BASE + 'images/' + names[k];
  });

  function start() { if (done) return; t0 = last = performance.now(); raf = requestAnimationFrame(frame); }

  function makeFx() {
    var base = Math.min(W, H), k;
    for (k = 0; k < 130; k++) { var a = Math.random() * TAU, v = 80 + Math.random() * 720; sparks.push({ x: tx, y: ty, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 2.2 + .6, c: Math.random() < .6 ? '255,225,160' : '205,175,255' }); }
    function grow(x, y, ang, len, s0, dur, gen) {
      var segs = Math.max(5, Math.round(len / (base * .035))), pts = [[x, y]], a = ang, i;
      for (i = 1; i <= segs; i++) {
        a += (Math.random() - .5) * .7; var d = len / segs * (.6 + Math.random() * .8);
        pts.push([pts[i - 1][0] + Math.cos(a) * d, pts[i - 1][1] + Math.sin(a) * d]);
        if (gen < 2 && i > 1 && i < segs && Math.random() < .3)
          grow(pts[i][0], pts[i][1], a + (Math.random() < .5 ? -1 : 1) * (.5 + Math.random() * .7), len * (.28 + Math.random() * .3), s0 + dur * i / segs, dur * .6, gen + 1);
      }
      cracks.push({ pts: pts, t0: s0, dur: dur, gen: gen });
    }
    for (k = 0; k < 17; k++) grow(tx, ty, k / 17 * TAU + (Math.random() - .5) * .35, base * (.35 + Math.random() * .5), Math.random() * 70, 480 + Math.random() * 320, 0);
  }

  function drawBg(t, warp) {
    bx.clearRect(0, 0, W, H);
    var g = bx.createRadialGradient(W * .5, H * .5, 0, W * .5, H * .5, Math.max(W, H) * .6);
    g.addColorStop(0, 'rgba(70,40,130,' + (.22 * clamp(t / 1500, 0, 1)).toFixed(3) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
    bx.fillStyle = g; bx.fillRect(0, 0, W, H);
    var fade = clamp(t / 700, 0, 1);
    stars.forEach(function (s) {
      bx.fillStyle = '#efe6ff'; bx.globalAlpha = s.a * fade * (.7 + .3 * Math.sin(t / 700 + s.p));
      if (warp > .02) { bx.strokeStyle = '#efe6ff'; bx.lineWidth = s.r; bx.lineCap = 'round'; bx.beginPath(); bx.moveTo(s.x, s.y); bx.lineTo(s.x + (s.x - tx) * warp * .35, s.y + (s.y - ty) * warp * .35); bx.stroke(); }
      else { bx.beginPath(); bx.arc(s.x, s.y, s.r, 0, TAU); bx.fill(); }
    });
    bx.globalAlpha = 1;
  }

  /* the figure: body + flexing bow + string + (until released) the arrow, then revealed through a soft sweep */
  function drawFig(t, A, mx, released) {
    gx.save(); gx.setTransform(1, 0, 0, 1, 0, 0); gx.clearRect(0, 0, fig.width, fig.height); gx.restore();
    gx.globalCompositeOperation = 'source-over';
    gx.drawImage(imgs.body, 0, 0);
    for (var y = 0; y < 790; y += 2) {
      if (y >= BY0 && y < BY1) continue;
      var dx = A * off(y + 1) / FLEX; gx.drawImage(imgs.bow, BOWX, y, IMG - BOWX, 2, BOWX + dx * FLEX / FLEX, y, IMG - BOWX, 2);
    }
    /* string: tip -> nock -> tip */
    var xt = TIPT[0] + A * off(TIPT[1]) / FLEX, xb = TIPB[0] + A * off(TIPB[1]) / FLEX;
    gx.save(); gx.strokeStyle = '#f1eaff'; gx.lineWidth = 2.2; gx.lineJoin = 'round'; gx.shadowColor = 'rgba(200,170,255,.9)'; gx.shadowBlur = 8;
    gx.beginPath(); gx.moveTo(xt, TIPT[1]); gx.lineTo(mx[0], mx[1]); gx.lineTo(xb, TIPB[1]); gx.stroke(); gx.restore();
    if (!released) { gx.save(); gx.shadowColor = 'rgba(255,205,110,.95)'; gx.shadowBlur = 14; gx.drawImage(imgs.arrow, 0, 0); gx.restore(); }

    /* reveal sweep: from the tail (bottom-left) up to the bow (top-right) */
    var prog = eo(clamp((t - T.rev0) / (T.rev1 - T.rev0), 0, 1));
    if (prog < 1) {
      var soft = .24, pos = -soft + prog * (1 + soft), s1 = clamp(pos, 0, 1), s2 = clamp(pos + soft, 0, 1);
      var g = gx.createLinearGradient(40, 1180, 1220, 180);
      gx.globalCompositeOperation = 'destination-in';
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(s1, 'rgba(0,0,0,1)'); g.addColorStop(s2, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      gx.fillStyle = g; gx.fillRect(0, 0, IMG, IMG);
      var g2 = gx.createLinearGradient(40, 1180, 1220, 180), c = clamp(pos + soft * .35, .001, .999);
      gx.globalCompositeOperation = 'source-atop';
      g2.addColorStop(clamp(c - .07, 0, 1), 'rgba(255,255,255,0)'); g2.addColorStop(c, 'rgba(255,255,255,.75)'); g2.addColorStop(clamp(c + .07, 0, 1), 'rgba(255,255,255,0)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
      gx.fillStyle = g2; gx.fillRect(0, 0, IMG, IMG);
      gx.globalCompositeOperation = 'source-over';
    }
  }

  var last = 0;
  function frame(now) {
    if (done) return;
    var t = now - t0, dt = Math.min(.05, (now - last) / 1000); last = now;
    var mt = clamp((t - T.meteor) / (T.hit - T.meteor), 0, 1), me = Math.pow(mt, 2.3);
    drawBg(t, impact ? 0 : me);

    /* ---- bow state ---- */
    var rel = t - T.rel, released = rel >= 0, A, mx = NOCK.slice(), tau = Math.max(0, rel) / 1000;
    if (!released) {
      var d = eio(clamp((t - T.draw0) / (T.draw1 - T.draw0), 0, 1));
      A = FLEX * (1 - d);
      if (t > T.draw0 + 600) A += Math.sin(t * .09) * .9 * d * clamp((t - T.draw1) / 400 + .4, 0, 1);       /* the strain of a full draw */
    } else {
      A = FLEX * (1 - Math.exp(-7 * tau) * Math.cos(38 * tau));                                              /* limbs spring back and settle */
      var xt = TIPT[0] + A * off(TIPT[1]) / FLEX, xb = TIPB[0] + A * off(TIPB[1]) / FLEX,
          ml = xt + (xb - xt) * ((NOCK[1] - TIPT[1]) / (TIPB[1] - TIPT[1])), w = Math.exp(-5.5 * tau) * Math.cos(44 * tau);
      mx = [ml + (NOCK[0] - ml) * w, NOCK[1]];                                                               /* the string thrums */
    }
    drawFig(t, A, mx, released);

    /* the figure recoils a hair at the release, then dims as the arrow returns */
    var rec = released ? 6 * Math.exp(-rel / 160) : 0;
    fig.style.transform = 'translate(' + (-rec).toFixed(1) + 'px,' + (rec * .4).toFixed(1) + 'px)';
    fig.style.opacity = (impact ? Math.max(0, 1 - (t - impact) / 140) : 1 - .72 * clamp((t - (T.rel + 900)) / 900, 0, 1)).toFixed(2);

    fx.clearRect(0, 0, W, H);

    /* ---- the arrow, loosed: flies off to the right into the dark ---- */
    if (released && rel < 900) {
      var s = (0.0036 * rel * rel + .06 * rel) / K;                                         /* image-space distance */
      var ax = FX0 + (s * ADIR[0]) * K, ay = FY0 + (s * ADIR[1]) * K, L = Math.min(s, 700) * K;
      var tipx = FX0 + (1196 + s * ADIR[0]) * K, tipy = FY0 + (282 + s * ADIR[1]) * K;
      var tg = fx.createLinearGradient(tipx - ADIR[0] * (L + 530 * K), tipy - ADIR[1] * (L + 530 * K), tipx, tipy);
      tg.addColorStop(0, 'rgba(255,200,120,0)'); tg.addColorStop(1, 'rgba(255,236,180,' + (.55 * clamp(1 - rel / 700, 0, 1)).toFixed(2) + ')');
      fx.save(); fx.strokeStyle = tg; fx.lineWidth = 5 * K + 2; fx.lineCap = 'round'; fx.beginPath();
      fx.moveTo(tipx - ADIR[0] * (L + 530 * K), tipy - ADIR[1] * (L + 530 * K)); fx.lineTo(tipx, tipy); fx.stroke();
      fx.shadowColor = 'rgba(255,205,110,.95)'; fx.shadowBlur = 16; fx.translate(ax, ay); fx.scale(K, K); fx.drawImage(imgs.arrow, 0, 0); fx.restore();
    }

    /* ---- the arrow falls back out of the sky, straight at you ---- */
    if (t >= T.meteor - 500 && !impact) {
      var pre = clamp((t - (T.meteor - 500)) / 500, 0, 1);
      var px = p0x + (tx - p0x) * me, py = p0y + (ty - p0y) * me, ang = Math.atan2(ty - p0y, tx - p0x), cx = Math.cos(ang), cy = Math.sin(ang);
      var sz = .04 + 1.5 * Math.pow(me, 1.15);
      if (t < T.meteor) {
        var tw = .5 + .5 * Math.sin(t / 60);
        fx.fillStyle = 'rgba(255,240,200,' + (.8 * pre * tw).toFixed(2) + ')'; fx.beginPath(); fx.arc(p0x, 8, 1.5 + 2 * pre, 0, TAU); fx.fill();
      } else {
        var tl = Math.min(Math.hypot(px - p0x, py - p0y), H * .75), tw0 = 2 + 30 * me;
        var tg2 = fx.createLinearGradient(px - cx * tl, py - cy * tl, px, py);
        tg2.addColorStop(0, 'rgba(255,190,110,0)'); tg2.addColorStop(.7, 'rgba(255,215,150,.35)'); tg2.addColorStop(1, 'rgba(255,248,225,.95)');
        fx.save(); fx.lineCap = 'round'; fx.shadowColor = '#ffcf80'; fx.shadowBlur = 22 + 40 * me; fx.strokeStyle = tg2; fx.lineWidth = tw0;
        fx.beginPath(); fx.moveTo(px - cx * tl, py - cy * tl); fx.lineTo(px, py); fx.stroke();
        var sl = 70 + 300 * sz; fx.shadowBlur = 16; fx.strokeStyle = '#ffe9a8'; fx.lineWidth = 1.5 + 7 * sz;
        fx.beginPath(); fx.moveTo(px - cx * sl, py - cy * sl); fx.lineTo(px, py); fx.stroke();
        var hs = 6 + 46 * sz, nx = -cy, ny = cx;
        fx.fillStyle = '#fff6d8'; fx.beginPath(); fx.moveTo(px + cx * hs * .5, py + cy * hs * .5);
        fx.lineTo(px - cx * hs + nx * hs * .45, py - cy * hs + ny * hs * .45); fx.lineTo(px - cx * hs - nx * hs * .45, py - cy * hs - ny * hs * .45); fx.closePath(); fx.fill();
        fx.strokeStyle = '#ffc56b'; fx.lineWidth = 1 + 3 * sz;
        for (var q = 0; q < 3; q++) for (var sg = -1; sg <= 1; sg += 2) { var bx0 = px - cx * (sl - q * 18 * sz), by0 = py - cy * (sl - q * 18 * sz); fx.beginPath(); fx.moveTo(bx0, by0); fx.lineTo(bx0 - cx * 26 * sz + nx * 14 * sz * sg, by0 - cy * 26 * sz + ny * 14 * sz * sg); fx.stroke(); }
        var gr = 14 + 150 * Math.pow(me, 1.3), gg = fx.createRadialGradient(px, py, 0, px, py, gr);
        gg.addColorStop(0, 'rgba(255,252,235,.95)'); gg.addColorStop(.35, 'rgba(255,215,150,.5)'); gg.addColorStop(1, 'rgba(255,170,100,0)');
        fx.fillStyle = gg; fx.beginPath(); fx.arc(px, py, gr, 0, TAU); fx.fill(); fx.restore();
        var wa = .5 * Math.pow(me, 3); if (wa > .01) { fx.fillStyle = 'rgba(255,240,215,' + wa.toFixed(2) + ')'; fx.fillRect(0, 0, W, H); }
        var rum = 4 * me; ov.style.transform = 'translate(' + ((Math.random() - .5) * rum).toFixed(1) + 'px,' + ((Math.random() - .5) * rum).toFixed(1) + 'px)';
      }
    }
    if (t >= T.hit && !impact) { impact = t; makeFx(); }

    /* ---- impact: flash, cracks, shock rings, the screen shatters open ---- */
    if (impact) {
      var di = t - impact, hk = clamp(di / 1600, 0, 1), R = maxR * eo(hk);
      var sh = 16 * Math.exp(-di / 140); ov.style.transform = 'translate(' + ((Math.random() - .5) * sh).toFixed(1) + 'px,' + ((Math.random() - .5) * sh).toFixed(1) + 'px)';
      var m = 'radial-gradient(circle at ' + tx + 'px ' + ty + 'px, transparent ' + R.toFixed(0) + 'px, #000 ' + (R + F).toFixed(0) + 'px)';
      ov.style.webkitMaskImage = m; ov.style.maskImage = m;
      if (di > 280) root.classList.add('nk-intro-go');
      var fa = 1 - di / 420;
      if (fa > 0) { var g2 = fx.createRadialGradient(tx, ty, 0, tx, ty, 320 * (.4 + di / 420)); g2.addColorStop(0, 'rgba(255,248,215,' + fa + ')'); g2.addColorStop(1, 'rgba(255,200,120,0)'); fx.fillStyle = g2; fx.fillRect(0, 0, W, H); }
      var j;
      for (j = 0; j < 3; j++) { var k2 = clamp((di - j * 150) / 950, 0, 1); if (k2 <= 0 || k2 >= 1) continue; fx.strokeStyle = 'rgba(255,214,150,' + ((1 - k2) * .7).toFixed(2) + ')'; fx.lineWidth = 1.5 + (1 - k2) * 4; fx.beginPath(); fx.arc(tx, ty, eo(k2) * maxR * .55, 0, TAU); fx.stroke(); }
      fx.save(); fx.shadowColor = '#c9a8ff'; fx.shadowBlur = 26; fx.strokeStyle = 'rgba(255,226,170,' + (.85 * (1 - hk * .9)).toFixed(2) + ')'; fx.lineWidth = 3; fx.beginPath(); fx.arc(tx, ty, R + F * .45, 0, TAU); fx.stroke();
      var ca = 1 - clamp((di - 650) / 1000, 0, 1);
      if (ca > 0) {
        fx.shadowColor = '#ffd36b'; fx.shadowBlur = 12; fx.lineCap = 'round'; fx.lineJoin = 'round';
        cracks.forEach(function (c) {
          var p = clamp((di - c.t0) / c.dur, 0, 1); if (p <= 0) return;
          var nf = p * (c.pts.length - 1), n = Math.floor(nf), fr = nf - n, i;
          fx.strokeStyle = 'rgba(255,238,195,' + ca.toFixed(2) + ')'; fx.lineWidth = [2.6, 1.5, .9][c.gen];
          fx.beginPath(); fx.moveTo(c.pts[0][0], c.pts[0][1]);
          for (i = 1; i <= n; i++) fx.lineTo(c.pts[i][0], c.pts[i][1]);
          if (n < c.pts.length - 1) fx.lineTo(c.pts[n][0] + (c.pts[n + 1][0] - c.pts[n][0]) * fr, c.pts[n][1] + (c.pts[n + 1][1] - c.pts[n][1]) * fr);
          fx.stroke();
        });
      }
      fx.restore();
      sparks.forEach(function (sp) { var al2 = 1 - di / 1200; if (al2 <= 0) return; sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vx *= .96; sp.vy *= .96; fx.fillStyle = 'rgba(' + sp.c + ',' + al2.toFixed(2) + ')'; fx.beginPath(); fx.arc(sp.x, sp.y, sp.r, 0, TAU); fx.fill(); });
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
})();
