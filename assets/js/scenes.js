/* =========================================================================
   THE LOUNGE · drawn scenes
   - Sky: the view from Falougha (sun, moon, stars, ridges, pines, village
     lights), coloured by the real position of the sun over Falougha.
   - Ropes: the jute rope curtain from the terrace, with simple physics.
   - Embers (grill), Crumbs (dessert), Topo (map).
   Exposes window.LoungeScenes.
   ========================================================================= */
(function () {
  'use strict';

  var LAT = 33.842438, LON = 35.734297, TZ = 'Asia/Beirut';
  var RAD = Math.PI / 180;
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- utils */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s += 0x6D2B79F5; var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hex(h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  function rgba(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? 1 : a) + ')'; }
  function fitCanvas(cv, maxDpr) {
    var dpr = Math.min(window.devicePixelRatio || 1, maxDpr || 2);
    var r = cv.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    return { w: w, h: h, dpr: dpr };
  }
  /* run fn every frame only while el is on screen */
  function whileVisible(el, fn) {
    var on = false, raf = 0, last = 0;
    function loop(t) {
      if (!on) return;
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
      fn(dt, t / 1000);
      raf = requestAnimationFrame(loop);
    }
    var io = new IntersectionObserver(function (en) {
      var vis = en[0].isIntersecting;
      if (vis && !on) { on = true; last = 0; raf = requestAnimationFrame(loop); }
      else if (!vis && on) { on = false; cancelAnimationFrame(raf); }
    }, { rootMargin: '80px' });
    io.observe(el);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { on = false; cancelAnimationFrame(raf); }
      else { var r = el.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight && !on) { on = true; last = 0; raf = requestAnimationFrame(loop); } }
    });
  }

  /* ------------------------------------------------------------- the sun */
  function sunPos(date) {
    var d = date.getTime() / 86400000 - 10957.5;            // days since J2000.0
    var g = (357.529 + 0.98560028 * d) * RAD;
    var q = 280.459 + 0.98564736 * d;
    var L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
    var e = (23.439 - 0.00000036 * d) * RAD;
    var ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
    var dec = Math.asin(Math.sin(e) * Math.sin(L));
    var gmst = (18.697374558 + 24.06570982441908 * d) % 24;
    var ha = (gmst * 15 + LON) * RAD - ra;
    var phi = LAT * RAD;
    var alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(ha));
    var az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(phi) - Math.sin(phi) * Math.cos(ha));
    return { alt: alt / RAD, az: (az / RAD + 360) % 360 };
  }
  var fmtTime = (function () {
    try { var f = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ }); return function (d) { return f.format(d).replace('AM', 'am').replace('PM', 'pm').replace(/ /g, ' '); }; }
    catch (e) { return function (d) { return d.toTimeString().slice(0, 5); }; }
  })();
  function localHour(d) {
    try { return +new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: TZ }).format(d) % 24; }
    catch (e) { return d.getHours(); }
  }
  /* sunrise and sunset closest to now (alt crosses -0.833°) */
  function sunTimes(now) {
    var start = now.getTime() - 14 * 3600000, rise = null, set = null, prev = sunPos(new Date(start)).alt;
    for (var m = 1; m <= 28 * 60; m += 2) {
      var t = start + m * 60000, a = sunPos(new Date(t)).alt;
      if (prev < -0.833 && a >= -0.833 && t > now.getTime() - 3600000 * 2 && !rise) rise = new Date(t);
      if (prev >= -0.833 && a < -0.833 && t > now.getTime() - 3600000 * 2 && !set) set = new Date(t);
      prev = a;
    }
    return { rise: rise, set: set };
  }
  function moonPhase(d) {
    var syn = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14);
    var age = ((d.getTime() - ref) / 86400000) % syn; if (age < 0) age += syn;
    return age / syn;                                      // 0 new, .5 full
  }

  /* ------------------------------------------------------- sky palette */
  var SKY = [ // alt, top, middle, horizon
    [-18, '#04100f', '#071a1a', '#0d2526'],
    [-10, '#0a1a28', '#16273a', '#2d3647'],
    [-6, '#16243f', '#3c3f5d', '#7a6474'],
    [-3, '#2b3a5e', '#7c6a86', '#d38f7c'],
    [0, '#4a5f86', '#c08e90', '#f0a978'],
    [4, '#6d88a8', '#d9b3a3', '#f6cf9f'],
    [12, '#7fa2c0', '#bfd0d8', '#f1e3cc'],
    [30, '#6f9cc2', '#aac8dc', '#e6eddf'],
    [60, '#5f93c0', '#9fc2dc', '#dfeadf']
  ].map(function (k) { return [k[0], hex(k[1]), hex(k[2]), hex(k[3])]; });
  function skyAt(alt) {
    if (alt <= SKY[0][0]) return SKY[0].slice(1);
    for (var i = 1; i < SKY.length; i++) {
      if (alt <= SKY[i][0]) {
        var a = SKY[i - 1], b = SKY[i], t = smooth((alt - a[0]) / (b[0] - a[0]));
        return [mix(a[1], b[1], t), mix(a[2], b[2], t), mix(a[3], b[3], t)];
      }
    }
    return SKY[SKY.length - 1].slice(1);
  }
  var RIDGE_DAY = [hex('#93aab4'), hex('#7d9a9c'), hex('#5f8278'), hex('#41664f'), hex('#21402f')];
  var RIDGE_NIGHT = [hex('#16242c'), hex('#122025'), hex('#0e1b1c'), hex('#0a1714'), hex('#06110d')];

  /* -------------------------------------------------------------- SKY */
  function Sky(canvas, opts) {
    opts = opts || {};
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.alt = 20; this.az = 230; this.moon = moonPhase(new Date());
    this.px = 0; this.py = 0; this.tx = 0; this.ty = 0;
    this.horizon = opts.horizon || 0.66;
    this.moonAt = opts.moon || [0.15, 0.34];
    this.seed = opts.seed || 7;
    this.lift = 0;
    this.build();
  }
  Sky.prototype.build = function () {
    var r = rng(this.seed);
    // ridges: smooth noise built from a few sines per layer
    this.layers = [];
    var specs = [
      { y: 0.0, amp: 0.045, f: [1.2, 2.7, 5.1] },
      { y: 0.045, amp: 0.05, f: [1.6, 3.4, 7.3] },
      { y: 0.1, amp: 0.055, f: [1.9, 4.2, 8.8] },
      { y: 0.175, amp: 0.05, f: [2.3, 5.5, 11] },
      { y: 0.27, amp: 0.045, f: [1.4, 3.9, 9.5] }
    ];
    for (var i = 0; i < specs.length; i++) {
      var s = specs[i], ph = [r() * 6.28, r() * 6.28, r() * 6.28], w = [1, 0.45 + r() * 0.2, 0.18 + r() * 0.1];
      var pts = [];
      for (var k = 0; k <= 160; k++) {
        var x = k / 160, v = 0;
        for (var j = 0; j < 3; j++) v += Math.sin(x * s.f[j] * 6.28 + ph[j]) * w[j];
        pts.push(s.y - (v / 1.7) * s.amp - (i === 0 ? 0.035 * Math.sin(x * 3.14) : 0));
      }
      this.layers.push(pts);
    }
    // village lights on layers 1-3
    this.lights = [];
    for (i = 0; i < 90; i++) {
      var L = 1 + Math.floor(r() * 3), xx = r();
      this.lights.push({ l: L, x: xx, d: 0.006 + r() * (0.05 + L * 0.02), s: 0.6 + r() * 1.1, p: r() * 6.28, sp: 0.5 + r() * 2 });
    }
    // stars
    this.stars = [];
    for (i = 0; i < 230; i++) this.stars.push({ x: r(), y: Math.pow(r(), 1.4) * 0.62, s: 0.35 + Math.pow(r(), 3) * 1.4, p: r() * 6.28, sp: 0.6 + r() * 2.2 });
    // stone pines on the two nearest ridges
    this.pines = [];
    for (i = 0; i < 26; i++) {
      var near = r() < 0.55;
      this.pines.push({ l: near ? 4 : 3, x: r() * 1.06 - 0.03, h: near ? 0.07 + r() * 0.08 : 0.03 + r() * 0.035, w: 0.6 + r() * 0.5, lean: (r() - 0.5) * 0.25, seed: Math.floor(r() * 1e9) });
    }
    // clouds
    this.clouds = [];
    for (i = 0; i < 4; i++) this.clouds.push({ x: i / 4 + r() * 0.15, y: 0.1 + r() * 0.32, s: 0.55 + r() * 0.6, v: 0.004 + r() * 0.006 });
    this.cloudSprite = null;
  };
  Sky.prototype.setSun = function (alt, az) { this.alt = alt; this.az = az; };
  Sky.prototype.pointer = function (x, y) { this.tx = x; this.ty = y; };
  Sky.prototype.makeCloud = function () {
    // flat, layered clouds that match the drawn ridges
    var shapes = [];
    var r = rng(this.seed + 3);
    for (var n = 0; n < 3; n++) {
      var bumps = [], cx = 40;
      while (cx < 300) { var rad = 22 + r() * 36; bumps.push([cx + rad * 0.6, 118 - rad * (0.55 + r() * 0.35), rad]); cx += rad * (1.05 + r() * 0.4); }
      shapes.push(bumps);
    }
    function sprite(top, bottom, bumps) {
      var c = document.createElement('canvas'); c.width = 380; c.height = 140;
      var g = c.getContext('2d');
      g.save(); g.beginPath(); g.rect(0, 0, 380, 120); g.clip();
      var gr = g.createLinearGradient(0, 30, 0, 120); gr.addColorStop(0, top); gr.addColorStop(1, bottom);
      g.fillStyle = gr; g.beginPath();
      for (var i = 0; i < bumps.length; i++) { g.moveTo(bumps[i][0] + bumps[i][2], bumps[i][1]); g.arc(bumps[i][0], bumps[i][1], bumps[i][2], 0, 6.2832); }
      g.rect(bumps[0][0], 100, bumps[bumps.length - 1][0] - bumps[0][0], 20);
      g.fill(); g.restore();
      return c;
    }
    this.cloudSprites = shapes.map(function (b) { return sprite('rgba(255,255,255,.95)', 'rgba(222,233,240,.9)', b); });
    this.cloudWarmSprites = shapes.map(function (b) { return sprite('rgba(255,236,226,.95)', 'rgba(240,178,160,.9)', b); });
    this.cloudSprite = true;
  };
  Sky.prototype.pine = function (ctx, x, y, h, w, lean, seed, col) {
    var r = rng(seed), tw = Math.max(1, h * 0.05);
    ctx.fillStyle = col; ctx.strokeStyle = col;
    // trunk
    ctx.lineWidth = tw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y + 2);
    ctx.quadraticCurveTo(x + lean * h * 0.5, y - h * 0.5, x + lean * h, y - h * 0.78); ctx.stroke();
    // umbrella canopy: a few flattened lobes
    var cx = x + lean * h, cy = y - h * 0.82, cw = h * 0.62 * w;
    ctx.beginPath();
    for (var i = 0; i < 7; i++) {
      var ox = (r() - 0.5) * cw * 1.4, oy = (r() - 0.6) * h * 0.14, rx = cw * (0.3 + r() * 0.25), ry = h * (0.07 + r() * 0.05);
      ctx.moveTo(cx + ox + rx, cy + oy);
      ctx.ellipse(cx + ox, cy + oy, rx, ry, 0, 0, 6.29);
    }
    ctx.fill();
    // a couple of branches
    ctx.lineWidth = tw * 0.6;
    ctx.beginPath(); ctx.moveTo(x + lean * h * 0.8, y - h * 0.62); ctx.lineTo(cx - cw * 0.35, cy + h * 0.02);
    ctx.moveTo(x + lean * h * 0.85, y - h * 0.66); ctx.lineTo(cx + cw * 0.38, cy + h * 0.03); ctx.stroke();
  };
  Sky.prototype.draw = function (time) {
    var dim = fitCanvas(this.cv, 1.6), W = dim.w, H = dim.h, ctx = this.ctx;
    ctx.setTransform(dim.dpr, 0, 0, dim.dpr, 0, 0);
    this.px += (this.tx - this.px) * 0.06; this.py += (this.ty - this.py) * 0.06;
    var alt = this.alt, cols = skyAt(alt);
    var night = smooth((-alt - 2) / 10);                 // 0 day .. 1 night
    var dusk = smooth(1 - Math.abs(alt - 1) / 9);        // peaks around sunset
    var hy = H * this.horizon + this.lift * H;
    // sky
    var g = ctx.createLinearGradient(0, 0, 0, hy);
    g.addColorStop(0, rgba(cols[0])); g.addColorStop(0.62, rgba(cols[1])); g.addColorStop(1, rgba(cols[2]));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // sun glow + disc
    var sx = W * (0.5 + (this.az - 228) / 100) + this.px * 6, sy = hy - (alt / 48) * hy * 0.95;
    if (alt > -12) {
      var gl = ctx.createRadialGradient(sx, Math.max(sy, hy * 0.6), 0, sx, Math.max(sy, hy * 0.6), Math.max(W, H) * 0.55);
      var warm = mix(hex('#ffd9a8'), hex('#ff9f6e'), dusk);
      gl.addColorStop(0, rgba(warm, 0.55 * (1 - night) * (0.4 + dusk * 0.6))); gl.addColorStop(1, rgba(warm, 0));
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    }
    if (alt > -2) {
      var sr = Math.max(14, Math.min(W, H) * 0.028);
      var sc = mix(hex('#fff6e2'), hex('#ffc58f'), dusk);
      ctx.fillStyle = rgba(sc, 0.95); ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 6.29); ctx.fill();
      var halo = ctx.createRadialGradient(sx, sy, sr, sx, sy, sr * 5);
      halo.addColorStop(0, rgba(sc, 0.45)); halo.addColorStop(1, rgba(sc, 0));
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(sx, sy, sr * 5, 0, 6.29); ctx.fill();
    }
    // stars
    var starA = smooth((-alt - 5) / 8);
    if (starA > 0.01) {
      for (var i = 0; i < this.stars.length; i++) {
        var s = this.stars[i], tw = 0.55 + 0.45 * Math.sin(time * s.sp + s.p);
        ctx.fillStyle = 'rgba(255,248,236,' + (starA * tw * (0.35 + s.s * 0.4)).toFixed(3) + ')';
        ctx.fillRect(s.x * W + this.px * -3, s.y * hy, s.s, s.s);
      }
      // the moon, with tonight's phase
      var mA = starA, mx = W * this.moonAt[0] - this.px * 5, my = hy * this.moonAt[1], mr = Math.max(11, Math.min(W, H) * 0.022);
      var ph = this.moon, k = Math.cos(ph * 6.2832);
      var mg = ctx.createRadialGradient(mx, my, mr, mx, my, mr * 6);
      mg.addColorStop(0, 'rgba(255,240,220,' + (0.16 * mA * (1 - k) / 2 + 0.03) + ')'); mg.addColorStop(1, 'rgba(255,240,220,0)');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr * 6, 0, 6.29); ctx.fill();
      ctx.fillStyle = 'rgba(255,248,235,' + (0.06 * mA) + ')'; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.29); ctx.fill();
      ctx.fillStyle = 'rgba(255,246,228,' + (0.95 * mA) + ')';
      ctx.beginPath();
      var waxing = ph < 0.5;
      ctx.arc(mx, my, mr, -Math.PI / 2, Math.PI / 2, !waxing);
      ctx.ellipse(mx, my, Math.abs(k) * mr, mr, 0, Math.PI / 2, -Math.PI / 2, (waxing ? k > 0 : k < 0));
      ctx.fill();
    }
    // clouds by day
    var cA = (1 - night) * 0.7;
    if (cA > 0.02) {
      if (!this.cloudSprite) this.makeCloud();
      ctx.save();
      for (i = 0; i < this.clouds.length; i++) {
        var c = this.clouds[i], k2 = i % 3, sc2 = c.s * clamp(W / 1500, 0.55, 1.2);
        var cw = 380 * sc2, ch = 140 * sc2, cx = ((c.x + time * c.v * 0.12) % 1.25 - 0.12) * W, cy = c.y * hy;
        ctx.globalAlpha = cA * (1 - dusk) * 0.85; ctx.drawImage(this.cloudSprites[k2], cx, cy, cw, ch);
        if (dusk > 0.02) { ctx.globalAlpha = cA * dusk * 0.85; ctx.drawImage(this.cloudWarmSprites[k2], cx, cy, cw, ch); }
      }
      ctx.restore();
    }
    // ridges, back to front
    var haze = cols[2];
    for (var l = 0; l < this.layers.length; l++) {
      var pts = this.layers[l], depth = l / (this.layers.length - 1);
      var base = mix(RIDGE_DAY[l], RIDGE_NIGHT[l], night);
      var col = mix(base, haze, (1 - depth) * (0.62 - night * 0.3) + dusk * 0.08 * (1 - depth));
      var ox = this.px * (4 + depth * 22), oy = this.py * (2 + depth * 8);
      ctx.fillStyle = rgba(col);
      ctx.beginPath(); ctx.moveTo(-40, H + 10);
      for (var p = 0; p < pts.length; p++) ctx.lineTo(-40 + (W + 80) * (p / (pts.length - 1)) + ox, hy + pts[p] * H + oy);
      ctx.lineTo(W + 40, H + 10); ctx.closePath(); ctx.fill();
      // warm rim light at golden hour
      if (dusk > 0.05 && l < 3) {
        ctx.strokeStyle = rgba(hex('#ffcf9a'), 0.22 * dusk * (1 - depth));
        ctx.lineWidth = 1.4; ctx.beginPath();
        for (p = 0; p < pts.length; p++) { var X = -40 + (W + 80) * (p / (pts.length - 1)) + ox, Y = hy + pts[p] * H + oy; if (p) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
        ctx.stroke();
      }
      // village lights after sunset
      if (night > 0.05 && l >= 1 && l <= 3) {
        for (i = 0; i < this.lights.length; i++) {
          var li = this.lights[i]; if (li.l !== l) continue;
          var idx = Math.round(li.x * (pts.length - 1));
          var lx = -40 + (W + 80) * li.x + ox, ly = hy + (pts[idx] + li.d) * H + oy;
          var a = night * (0.55 + 0.45 * Math.sin(time * li.sp + li.p));
          ctx.fillStyle = 'rgba(255,214,150,' + (a * 0.85).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(lx, ly, li.s * (0.45 + depth * 0.35), 0, 6.29); ctx.fill();
          ctx.fillStyle = 'rgba(255,190,120,' + (a * 0.07).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(lx, ly, li.s * 3, 0, 6.29); ctx.fill();
        }
      }
      // pines sit on the two nearest ridges
      if (l >= 3) {
        for (i = 0; i < this.pines.length; i++) {
          var pn = this.pines[i]; if (pn.l !== l) continue;
          var pi = clamp(Math.round(pn.x * (pts.length - 1)), 0, pts.length - 1);
          var px = -40 + (W + 80) * pn.x + ox, py = hy + pts[pi] * H + oy + 3;
          this.pine(ctx, px, py, pn.h * H, pn.w, pn.lean, pn.seed, rgba(col));
        }
      }
    }
  };

  /* -------------------------------------------------------------- ROPES */
  function ropeTexture(w, period, light) {
    var c = document.createElement('canvas'), H = period * 30;
    c.width = Math.ceil(w); c.height = H;
    var g = c.getContext('2d');
    var base = light ? ['#a98353', '#d8b98a', '#efd8ae', '#c7a372', '#8a6538'] : ['#94703f', '#c4a170', '#dcc193', '#b08b58', '#76552c'];
    var grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, base[4]); grd.addColorStop(0.3, base[1]); grd.addColorStop(0.55, base[2]); grd.addColorStop(0.8, base[3]); grd.addColorStop(1, base[4]);
    g.fillStyle = grd; g.fillRect(0, 0, w, H);
    // twisted strands
    for (var y = -period; y < H + period; y += period) {
      g.beginPath();
      g.moveTo(0, y); g.bezierCurveTo(w * 0.35, y + period * 0.15, w * 0.65, y + period * 0.55, w, y + period * 0.8);
      g.lineTo(w, y + period * 0.8 + period * 0.16); g.bezierCurveTo(w * 0.65, y + period * 0.7, w * 0.35, y + period * 0.3, 0, y + period * 0.18);
      g.closePath();
      g.fillStyle = 'rgba(70,45,18,.42)'; g.fill();
      g.beginPath();
      g.moveTo(0, y + period * 0.24); g.bezierCurveTo(w * 0.35, y + period * 0.38, w * 0.65, y + period * 0.75, w, y + period * 0.98);
      g.strokeStyle = 'rgba(255,240,210,.35)'; g.lineWidth = Math.max(0.6, w * 0.07); g.stroke();
    }
    // fibres
    var r = rng(light ? 5 : 9);
    g.lineWidth = 0.6;
    for (var i = 0; i < H * 0.9; i++) {
      var fx = r() * w, fy = r() * H, len = 2 + r() * 5;
      g.strokeStyle = r() < 0.5 ? 'rgba(255,236,200,.25)' : 'rgba(60,40,15,.25)';
      g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + (r() - 0.5) * 2, fy + len); g.stroke();
    }
    // copy the first period to the end so the strip tiles
    return { c: c, period: period, h: H };
  }

  function Ropes(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.ropes = []; this.part = 0; this.mx = -9999; this.my = -9999; this.mvx = 0; this.mvy = 0; this.t = 0;
    this.layout();
  }
  Ropes.prototype.layout = function () {
    var dim = fitCanvas(this.cv, 1.5); this.dim = dim;
    var W = dim.w, H = dim.h, r = rng(11);
    var mobile = W < 640;
    this.rw = mobile ? 8 : clamp(W / 120, 10, 15);
    var spacing = mobile ? 15 : clamp(W / 42, 26, 40);
    var gap = mobile ? W * 0.7 : Math.min(W * 0.56, 820);
    var n = Math.ceil(W / spacing) + 2, segs = mobile ? 12 : 15;
    var len = H * 1.15, seg = len / segs;
    this.seg = seg; this.segs = segs;
    this.tex = [ropeTexture(this.rw * dim.dpr, Math.round(this.rw * 1.05 * dim.dpr), true), ropeTexture(this.rw * dim.dpr, Math.round(this.rw * 1.05 * dim.dpr), false)];
    this.ropes = [];
    for (var i = 0; i < n; i++) {
      var x = -spacing + i * spacing + (r() - 0.5) * spacing * 0.25;
      if (Math.abs(x - W / 2) < gap / 2) continue;
      var side = x < W / 2 ? -1 : 1;
      var pts = [];
      for (var k = 0; k <= segs; k++) pts.push({ x: x, y: -6 + k * seg, px: x, py: -6 + k * seg });
      this.ropes.push({ x0: x, side: side, pts: pts, ph: r() * 6.28, tex: r() < 0.5 ? 0 : 1, edge: side < 0 ? x + 80 : W - x + 80, w: this.rw * (0.85 + r() * 0.3) });
    }
  };
  Ropes.prototype.pointer = function (x, y, vx, vy) { this.mx = x; this.my = y; this.mvx = vx; this.mvy = vy; };
  Ropes.prototype.step = function (dt, time) {
    var rs = this.ropes, segLen = this.seg, part = this.part;
    var damp = 0.965, dt2 = dt * dt, grav = 2400 * dt2;
    var mx = this.mx, my = this.my, pvx = this.mvx;
    for (var i = 0; i < rs.length; i++) {
      var R = rs[i], P = R.pts;
      var ax = R.x0 + R.side * part * R.edge;
      P[0].x = ax; P[0].y = -6;
      for (var k = 1; k < P.length; k++) {
        var p = P[k], vx = (p.x - p.px) * damp, vy = (p.y - p.py) * damp;
        p.px = p.x; p.py = p.y;
        var f = k / P.length;
        var wind = (Math.sin(time * 0.8 + R.ph + k * 0.18) * 0.7 + Math.sin(time * 2.1 + R.ph * 2.3) * 0.3) * 46 * f;
        var fx = wind * dt2;
        var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy, rad = 70;
        if (d2 < rad * rad) {
          var d = Math.sqrt(d2) || 1, s = 1 - d / rad;
          fx += (pvx * 0.45 + (dx / d) * 1.4) * s;
        }
        p.x += vx + fx; p.y += vy + grav;
      }
      for (var it = 0; it < 5; it++) {
        P[0].x = ax; P[0].y = -6;
        for (k = 0; k < P.length - 1; k++) {
          var a = P[k], b = P[k + 1], ddx = b.x - a.x, ddy = b.y - a.y, dist = Math.sqrt(ddx * ddx + ddy * ddy) || 0.001;
          var diff = (dist - segLen) / dist;
          if (k === 0) { b.x -= ddx * diff; b.y -= ddy * diff; }
          else { a.x += ddx * diff * 0.5; a.y += ddy * diff * 0.5; b.x -= ddx * diff * 0.5; b.y -= ddy * diff * 0.5; }
        }
      }
    }
    this.mvx *= 0.8; this.mvy *= 0.8;
  };
  Ropes.prototype.draw = function () {
    var dim = this.dim, ctx = this.ctx, W = dim.w, H = dim.h;
    ctx.setTransform(dim.dpr, 0, 0, dim.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var rs = this.ropes, i, k;
    // soft shadows behind the ropes
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(10,20,16,.1)';
    for (i = 0; i < rs.length; i++) {
      var P = rs[i].pts; ctx.lineWidth = rs[i].w * 1.1;
      ctx.beginPath(); ctx.moveTo(P[0].x + rs[i].w * 0.7, P[0].y + 4);
      for (k = 1; k < P.length; k++) ctx.lineTo(P[k].x + rs[i].w * 0.7, P[k].y + 4);
      ctx.stroke();
    }
    // ropes, textured segment by segment
    for (i = 0; i < rs.length; i++) {
      var R = rs[i], T = this.tex[R.tex], P2 = R.pts, acc = 0, w = R.w, scale = T.c.width / w;
      for (k = 0; k < P2.length - 1; k++) {
        var a = P2[k], b = P2[k + 1], dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy);
        if (a.y > H + 40 || a.x < -60 || a.x > W + 60) { acc += len; continue; }
        var srcY = (acc * scale) % (T.period * 6), srcH = Math.min(T.h - srcY, (len + 1.5) * scale);
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(Math.atan2(-dx, dy));
        ctx.drawImage(T.c, 0, srcY, T.c.width, srcH, -w / 2, -0.75, w, srcH / scale);
        ctx.restore();
        acc += len;
      }
    }
  };

  /* ------------------------------------------------------------- EMBERS */
  function sprite(r, inner, outer) {
    var c = document.createElement('canvas'); c.width = c.height = r * 2;
    var g = c.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, inner); gr.addColorStop(0.25, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); return c;
  }
  function embers(canvas) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d'), parts = [], r = rng(21), dim = fitCanvas(canvas, 1.5);
    var spr = [sprite(16, 'rgba(255,214,140,1)', 'rgba(255,120,40,0)'), sprite(16, 'rgba(255,170,90,1)', 'rgba(255,80,20,0)')];
    function spawn(initial) {
      return { x: r() * dim.w, y: initial ? r() * dim.h : dim.h + 10, vx: (r() - 0.5) * 12, vy: -(24 + r() * 60), life: 0, max: 4 + r() * 6, s: 1 + r() * 2.6, sp: spr[r() < 0.6 ? 0 : 1], ph: r() * 6.28 };
    }
    var N = Math.round(clamp(dim.w / 16, 40, 90));
    for (var i = 0; i < N; i++) parts.push(spawn(true));
    window.addEventListener('resize', function () { dim = fitCanvas(canvas, 1.5); });
    function frame(dt, t) {
      ctx.setTransform(dim.dpr, 0, 0, dim.dpr, 0, 0);
      ctx.clearRect(0, 0, dim.w, dim.h);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i]; p.life += dt;
        p.vx += Math.sin(t * 1.3 + p.ph) * 8 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        var k = p.life / p.max, a = Math.sin(Math.min(1, k) * Math.PI) * (0.55 + 0.45 * Math.sin(t * 9 + p.ph));
        if (k >= 1 || p.y < -20) { parts[i] = spawn(false); continue; }
        var s = p.s * 4 * (1 - k * 0.5);
        ctx.globalAlpha = clamp(a, 0, 1);
        ctx.drawImage(p.sp, p.x - s, p.y - s, s * 2, s * 2);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    if (RM) { frame(0.016, 0); return; }
    whileVisible(canvas, frame);
  }

  /* ------------------------------------------------------------- CRUMBS */
  function crumbs(canvas) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d'), r = rng(31), dim = fitCanvas(canvas, 1.5), parts = [];
    var cols = ['#a7bf55', '#c9d77e', '#7f9b36', '#d9e3a0', '#e0a04a'];
    function spawn(initial) {
      var gold = r() < 0.18;
      return { x: r() * dim.w, y: initial ? r() * dim.h : -20, vy: 14 + r() * 26, vx: (r() - 0.5) * 8, rot: r() * 6.28, vr: (r() - 0.5) * 2, s: gold ? 6 + r() * 8 : 2 + r() * 3.5, c: gold ? cols[4] : cols[Math.floor(r() * 4)], gold: gold, ph: r() * 6.28 };
    }
    var N = Math.round(clamp(dim.w / 40, 16, 36));
    for (var i = 0; i < N; i++) parts.push(spawn(true));
    window.addEventListener('resize', function () { dim = fitCanvas(canvas, 1.5); });
    function frame(dt, t) {
      ctx.setTransform(dim.dpr, 0, 0, dim.dpr, 0, 0); ctx.clearRect(0, 0, dim.w, dim.h);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y += p.vy * dt; p.x += (p.vx + Math.sin(t + p.ph) * 6) * dt; p.rot += p.vr * dt;
        if (p.y > dim.h + 20) { parts[i] = spawn(false); continue; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = 0.55;
        if (p.gold) { ctx.strokeStyle = p.c; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-p.s, 0); ctx.quadraticCurveTo(0, -p.s * 0.6, p.s, 0); ctx.stroke(); }
        else { ctx.fillStyle = p.c; ctx.beginPath(); ctx.moveTo(-p.s, -p.s * 0.4); ctx.lineTo(p.s * 0.7, -p.s * 0.6); ctx.lineTo(p.s, p.s * 0.5); ctx.lineTo(-p.s * 0.5, p.s * 0.7); ctx.closePath(); ctx.fill(); }
        ctx.restore();
      }
    }
    if (RM) return;
    whileVisible(canvas, frame);
  }

  /* --------------------------------------------------------------- TOPO */
  function noise2(seed) {
    var r = rng(seed), perm = [], i;
    for (i = 0; i < 256; i++) perm[i] = i;
    for (i = 255; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    for (i = 0; i < 256; i++) perm[i + 256] = perm[i];
    var gx = [], gy = [];
    for (i = 0; i < 256; i++) { var a = r() * 6.2832; gx[i] = Math.cos(a); gy[i] = Math.sin(a); }
    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    return function (x, y) {
      var X = Math.floor(x), Y = Math.floor(y), xf = x - X, yf = y - Y; X &= 255; Y &= 255;
      function g(ix, iy, dx, dy) { var h = perm[ix + perm[iy]]; return gx[h] * dx + gy[h] * dy; }
      var u = fade(xf), v = fade(yf);
      var n00 = g(X, Y, xf, yf), n10 = g(X + 1, Y, xf - 1, yf), n01 = g(X, Y + 1, xf, yf - 1), n11 = g(X + 1, Y + 1, xf - 1, yf - 1);
      return lerp(lerp(n00, n10, u), lerp(n01, n11, u), v);
    };
  }
  function topo(canvas) {
    if (!canvas) return;
    var n = noise2(1250);
    function draw() {
      var dim = fitCanvas(canvas, 2), W = dim.w, H = dim.h, ctx = canvas.getContext('2d');
      ctx.setTransform(dim.dpr, 0, 0, dim.dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var cs = 5, cols = Math.ceil(W / cs) + 1, rows = Math.ceil(H / cs) + 1, f = [], x, y;
      var cx = W * 0.5, cy = H * 0.52;
      for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) {
        var X = x * cs, Y = y * cs, nx = X / 170, ny = Y / 170;
        var v = n(nx, ny) * 0.9 + n(nx * 2.1 + 7, ny * 2.1 + 3) * 0.35 + n(nx * 4.3 + 1, ny * 4.3 + 9) * 0.12;
        v += (1 - (X / W)) * 0.45;                       // land rises to the east (right) is lower; west falls to the sea
        var dx = (X - cx) / W, dy = (Y - cy) / H;
        v += Math.exp(-(dx * dx + dy * dy) * 9) * 0.18;  // a shoulder where the village sits
        f.push(v);
      }
      var levels = 26, min = Infinity, max = -Infinity;
      for (var i = 0; i < f.length; i++) { if (f[i] < min) min = f[i]; if (f[i] > max) max = f[i]; }
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (var L = 1; L < levels; L++) {
        var lv = min + (max - min) * (L / levels), major = L % 5 === 0;
        ctx.strokeStyle = major ? 'rgba(220,188,176,.5)' : 'rgba(220,188,176,.2)';
        ctx.lineWidth = major ? 1.2 : 0.8;
        ctx.beginPath();
        for (y = 0; y < rows - 1; y++) for (x = 0; x < cols - 1; x++) {
          var a = f[y * cols + x], b = f[y * cols + x + 1], c = f[(y + 1) * cols + x + 1], d = f[(y + 1) * cols + x];
          var idx = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (d > lv ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          var X0 = x * cs, Y0 = y * cs;
          var top = [X0 + cs * (lv - a) / (b - a), Y0], right = [X0 + cs, Y0 + cs * (lv - b) / (c - b)];
          var bottom = [X0 + cs * (lv - d) / (c - d), Y0 + cs], left = [X0, Y0 + cs * (lv - a) / (d - a)];
          var segs = {
            1: [left, bottom], 2: [bottom, right], 3: [left, right], 4: [top, right], 5: [left, top, bottom, right],
            6: [top, bottom], 7: [left, top], 8: [left, top], 9: [top, bottom], 10: [left, bottom, top, right],
            11: [top, right], 12: [left, right], 13: [bottom, right], 14: [left, bottom]
          }[idx];
          for (var s = 0; s < segs.length; s += 2) { ctx.moveTo(segs[s][0], segs[s][1]); ctx.lineTo(segs[s + 1][0], segs[s + 1][1]); }
        }
        ctx.stroke();
      }
      // a dashed road through the village
      ctx.setLineDash([6, 7]); ctx.strokeStyle = 'rgba(245,196,124,.55)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-10, H * 0.78);
      ctx.bezierCurveTo(W * 0.25, H * 0.7, W * 0.32, H * 0.5, cx, cy);
      ctx.bezierCurveTo(W * 0.66, H * 0.54, W * 0.8, H * 0.3, W + 10, H * 0.24); ctx.stroke(); ctx.setLineDash([]);
    }
    draw();
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(draw, 150); });
  }


  /* ---------------------------------------------------------- STONE WALL */
  function stoneWall(canvas) {
    if (!canvas) return;
    function draw() {
      var dim = fitCanvas(canvas, 2), W = dim.w, H = dim.h, ctx = canvas.getContext('2d'), r = rng(1250);
      ctx.setTransform(dim.dpr, 0, 0, dim.dpr, 0, 0);
      ctx.fillStyle = '#b7a283'; ctx.fillRect(0, 0, W, H);           // mortar
      var y = -r() * 20, row = 0, sands = ['#e4d4b5', '#d8c4a0', '#ead dcc'.replace(' ', ''), '#cfb994', '#dfcca9', '#d2bd98', '#e8dbc0'];
      sands[2] = '#eadcc3';
      while (y < H) {
        var h = 52 + r() * 30, x = -r() * 80;
        while (x < W) {
          var w = 96 + r() * 110, g = 2.6 + r() * 1.4, c = sands[Math.floor(r() * sands.length)];
          var sx = x + g, sy = y + g, sw = w - g * 2, sh = h - g * 2;
          // rough outline
          ctx.beginPath();
          var pts = [], steps = 10;
          for (var e = 0; e < steps; e++) pts.push([sx + sw * e / steps, sy + (r() - 0.5) * 3.2]);
          for (e = 0; e < 5; e++) pts.push([sx + sw + (r() - 0.5) * 3.2, sy + sh * e / 5]);
          for (e = steps; e > 0; e--) pts.push([sx + sw * e / steps, sy + sh + (r() - 0.5) * 3.2]);
          for (e = 5; e > 0; e--) pts.push([sx + (r() - 0.5) * 3.2, sy + sh * e / 5]);
          ctx.moveTo(pts[0][0], pts[0][1]); for (e = 1; e < pts.length; e++) ctx.lineTo(pts[e][0], pts[e][1]); ctx.closePath();
          var grd = ctx.createRadialGradient(sx + sw * 0.42, sy + sh * 0.38, 4, sx + sw / 2, sy + sh / 2, Math.max(sw, sh) * 0.72);
          grd.addColorStop(0, shade(c, 10)); grd.addColorStop(0.7, c); grd.addColorStop(1, shade(c, -26));
          ctx.fillStyle = grd; ctx.fill();
          ctx.save(); ctx.clip();
          for (var k = 0; k < sw * sh / 22; k++) { ctx.fillStyle = r() < 0.55 ? 'rgba(255,250,236,.14)' : 'rgba(90,66,38,.11)'; ctx.fillRect(sx + r() * sw, sy + r() * sh, 1 + r() * 1.8, 1 + r() * 1.8); }
          // chisel marks
          ctx.strokeStyle = 'rgba(110,84,50,.1)'; ctx.lineWidth = 1;
          for (k = 0; k < sw / 9; k++) { var cxk = sx + r() * sw, cyk = sy + r() * sh; ctx.beginPath(); ctx.moveTo(cxk, cyk); ctx.lineTo(cxk + 3 + r() * 5, cyk + 6 + r() * 6); ctx.stroke(); }
          ctx.restore();
          x += w;
        }
        y += h; row++;
      }
      function shade(hx, amt) { var n = parseInt(hx.slice(1), 16), R = clamp((n >> 16) + amt, 0, 255), G2 = clamp((n >> 8 & 255) + amt, 0, 255), B = clamp((n & 255) + amt, 0, 255); return 'rgb(' + R + ',' + G2 + ',' + B + ')'; }
    }
    draw();
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(draw, 200); });
  }

  window.LoungeScenes = {
    Sky: Sky, Ropes: Ropes, embers: embers, crumbs: crumbs, topo: topo, stoneWall: stoneWall,
    sunPos: sunPos, sunTimes: sunTimes, fmtTime: fmtTime, localHour: localHour,
    whileVisible: whileVisible, fitCanvas: fitCanvas, rng: rng, clamp: clamp, smooth: smooth
  };
})();
