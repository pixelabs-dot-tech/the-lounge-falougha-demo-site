/* =========================================================================
   THE LOUNGE · the mezze table
   Each dish is drawn once, from above, on its own canvas: their sage-green
   ceramics and charcoal stoneware on the round grey stone table.
   Exposes window.LoungeTable.
   ========================================================================= */
(function () {
  'use strict';
  var S = window.LoungeScenes;
  var rng = S.rng, clamp = S.clamp;

  /* ---------------------------------------------------------- helpers */
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); }
  function ell(ctx, x, y, rx, ry, a) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, a || 0, 0, 6.2832); }
  function inDisc(r, R, cx, cy, rad) { var a = r() * 6.2832, d = Math.sqrt(r()) * rad; return [cx + Math.cos(a) * d, cy + Math.sin(a) * d]; }
  function inEll(r, cx, cy, rx, ry) { var a = r() * 6.2832, d = Math.sqrt(r()); return [cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry]; }
  function blob(ctx, r, x, y, rad, jag, n) {
    n = n || 9; var pts = [];
    for (var i = 0; i < n; i++) { var a = i / n * 6.2832, rr = rad * (1 - jag / 2 + r() * jag); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
    ctx.beginPath();
    var m0 = [(pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2]; ctx.moveTo(m0[0], m0[1]);
    for (i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
    ctx.closePath();
  }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
  function dropShadow(ctx, rx, ry, cx, cy) {
    ctx.save(); ctx.translate((cx || 100) + 5, (cy || 100) + 8); ctx.scale(1, ry / rx);
    var g = ctx.createRadialGradient(0, 0, rx * 0.7, 0, 0, rx * 1.12);
    g.addColorStop(0, 'rgba(10,14,12,.5)'); g.addColorStop(1, 'rgba(10,14,12,0)');
    ctx.fillStyle = g; circle(ctx, 0, 0, rx * 1.12); ctx.fill(); ctx.restore();
  }
  function speckle(ctx, r, n, fn, cols, s) {
    for (var i = 0; i < n; i++) { var p = fn(); ctx.fillStyle = pick(r, cols); ctx.fillRect(p[0], p[1], s * (0.5 + r()), s * (0.5 + r())); }
  }

  /* ----------------------------------------------------------- plates */
  var SAGE = { rim: '#c3c7a3', hi: '#e6e8d2', lo: '#8e936f', well: '#b5ba93', wellLo: '#9ea27c', dots: ['#7f8462', '#e9ebdc', '#a4a982'] };
  var COAL = { rim: '#4a4d4a', hi: '#6b6e6a', lo: '#2b2d2b', well: '#3f423f', wellLo: '#333532', dots: ['#5b5e5a', '#2a2c2a', '#6f726d'] };
  function bowl(ctx, r, g, R, inner) {
    dropShadow(ctx, R, R);
    var gr = ctx.createRadialGradient(80, 76, R * 0.2, 100, 100, R);
    gr.addColorStop(0, g.hi); gr.addColorStop(0.55, g.rim); gr.addColorStop(1, g.lo);
    ctx.fillStyle = gr; circle(ctx, 100, 100, R); ctx.fill();
    // inner wall: shaded top-left, lit bottom-right
    var w = ctx.createLinearGradient(60, 60, 140, 140);
    w.addColorStop(0, g.wellLo); w.addColorStop(0.5, g.well); w.addColorStop(1, g.hi);
    ctx.fillStyle = w; circle(ctx, 100, 100, R * inner); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(100, 100, R - 1.5, Math.PI * 1.05, Math.PI * 1.7); ctx.stroke();
    ctx.save(); circle(ctx, 100, 100, R); ctx.clip();
    speckle(ctx, r, 140, function () { return inDisc(r, 0, 100, 100, R); }, g.dots, 0.9);
    ctx.restore();
  }
  function plate(ctx, r, g, R) { bowl(ctx, r, g, R, 0.78); }
  function oval(ctx, r, g, RX, RY, ears) {
    dropShadow(ctx, RX, RY);
    if (ears) {
      ctx.fillStyle = g.rim;
      ell(ctx, 100 - RX * 0.98, 100, RX * 0.17, RY * 0.32); ctx.fill();
      ell(ctx, 100 + RX * 0.98, 100, RX * 0.17, RY * 0.32); ctx.fill();
    }
    var gr = ctx.createRadialGradient(80, 82, RY * 0.2, 100, 100, RX);
    gr.addColorStop(0, g.hi); gr.addColorStop(0.6, g.rim); gr.addColorStop(1, g.lo);
    ctx.fillStyle = gr; ell(ctx, 100, 100, RX, RY); ctx.fill();
    var w = ctx.createLinearGradient(100 - RX, 100 - RY, 100 + RX, 100 + RY);
    w.addColorStop(0, g.wellLo); w.addColorStop(0.55, g.well); w.addColorStop(1, g.hi);
    ctx.fillStyle = w; ell(ctx, 100, 100, RX * 0.86, RY * 0.8); ctx.fill();
    ctx.save(); ell(ctx, 100, 100, RX, RY); ctx.clip();
    speckle(ctx, r, 160, function () { return inEll(r, 100, 100, RX, RY); }, g.dots, 0.9);
    ctx.restore();
  }

  /* ------------------------------------------------------------ foods */
  function aril(ctx, r, x, y, s) {
    var g = ctx.createRadialGradient(x - s * 0.3, y - s * 0.3, 0, x, y, s * 1.2);
    g.addColorStop(0, '#ff6a7a'); g.addColorStop(0.45, '#c1122f'); g.addColorStop(1, '#6d0619');
    ctx.fillStyle = g; ell(ctx, x, y, s, s * 0.82, r() * 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,235,235,.85)'; circle(ctx, x - s * 0.32, y - s * 0.3, s * 0.22); ctx.fill();
  }
  function leafBit(ctx, r, x, y, s, cols) {
    ctx.fillStyle = pick(r, cols); blob(ctx, r, x, y, s, 0.9, 6); ctx.fill();
  }
  function fattoush(ctx, r) {
    bowl(ctx, r, SAGE, 92, 0.86);
    var R = 72, i, p;
    var greens = ['#5f9a3e', '#78b04e', '#4a8233', '#8fc25c', '#3d6f2c', '#a7cf73'];
    for (i = 0; i < 70; i++) { p = inDisc(r, 0, 100, 100, R); ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(r() * 6.28); leafBit(ctx, r, 0, 0, 9 + r() * 9, greens); ctx.strokeStyle = 'rgba(230,250,200,.35)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(7, 0); ctx.stroke(); ctx.restore(); }
    for (i = 0; i < 14; i++) { p = inDisc(r, 0, 100, 100, R - 6); ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(r() * 6.28); // cucumber half-moons
      ctx.fillStyle = '#d8e9b4'; ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, Math.PI); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#3f6e2a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, Math.PI); ctx.stroke(); ctx.restore(); }
    for (i = 0; i < 16; i++) { p = inDisc(r, 0, 100, 100, R - 6); ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(r() * 6.28); // tomato wedges
      ctx.fillStyle = '#d63f2a'; ctx.beginPath(); ctx.moveTo(-7, -4); ctx.quadraticCurveTo(0, -9, 7, -4); ctx.lineTo(4, 5); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#f2876a'; ctx.fillRect(-3, -2, 6, 4); ctx.restore(); }
    for (i = 0; i < 8; i++) { p = inDisc(r, 0, 100, 100, R - 10); // radish slices
      ctx.fillStyle = '#f7f1ec'; circle(ctx, p[0], p[1], 5.5); ctx.fill(); ctx.strokeStyle = '#d9476e'; ctx.lineWidth = 1.5; ctx.stroke(); }
    for (i = 0; i < 22; i++) { p = inDisc(r, 0, 100, 96, R - 12); ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(r() * 6.28); // fried bread
      var bg = ctx.createLinearGradient(-10, -10, 10, 10); bg.addColorStop(0, '#f0c070'); bg.addColorStop(1, '#b8732c');
      ctx.fillStyle = bg; blob(ctx, r, 0, 0, 8 + r() * 6, 0.7, 5); ctx.fill(); ctx.strokeStyle = 'rgba(120,60,20,.5)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = 'rgba(140,70,25,.45)'; circle(ctx, r() * 6 - 3, r() * 6 - 3, 1.4); ctx.fill(); ctx.restore(); }
    // pomegranate molasses
    ctx.strokeStyle = 'rgba(70,12,26,.85)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(62, 92);
    for (i = 0; i < 7; i++) ctx.quadraticCurveTo(70 + i * 9, 70 + (i % 2) * 40, 74 + i * 9, 95 + (i % 2 ? -12 : 10));
    ctx.stroke();
    for (i = 0; i < 26; i++) { p = inDisc(r, 0, 100, 100, R - 4); aril(ctx, r, p[0], p[1], 2.6); }
    speckle(ctx, r, 120, function () { return inDisc(r, 0, 100, 100, R); }, ['#7a1c22', '#9e2a2a'], 1.1); // sumac
  }
  function tabbouleh(ctx, r) {
    bowl(ctx, r, SAGE, 92, 0.86);
    var R = 72, i, p;
    var mound = ctx.createRadialGradient(92, 90, 5, 100, 100, R);
    mound.addColorStop(0, '#5c9a3a'); mound.addColorStop(1, '#2f5e22');
    ctx.fillStyle = mound; circle(ctx, 100, 100, R); ctx.fill();
    var greens = ['#4f8f32', '#6aaa45', '#3b7426', '#83c05a', '#2f6120', '#9fd06f'];
    for (i = 0; i < 1500; i++) { p = inDisc(r, 0, 100, 100, R); ctx.fillStyle = pick(r, greens); ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(r() * 3.14); ctx.fillRect(-1.6, -0.7, 3.2, 1.4); ctx.restore(); }
    for (i = 0; i < 260; i++) { p = inDisc(r, 0, 100, 100, R - 3); ctx.fillStyle = r() < 0.5 ? '#efe1b6' : '#e2cf98'; circle(ctx, p[0], p[1], 0.9); ctx.fill(); } // bulgur
    for (i = 0; i < 90; i++) { p = inDisc(r, 0, 100, 100, R - 4); ctx.fillStyle = r() < 0.6 ? '#e2402b' : '#f06a48'; ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(r() * 1.5); ctx.fillRect(-2.2, -2.2, 4.4, 4.4); ctx.fillStyle = 'rgba(255,200,170,.6)'; ctx.fillRect(-1.6, -1.6, 1.6, 1.6); ctx.restore(); }
    for (i = 0; i < 30; i++) { p = inDisc(r, 0, 100, 100, R - 6); aril(ctx, r, p[0], p[1], 2.5); }
    // lemon wedge
    ctx.save(); ctx.translate(146, 140); ctx.rotate(-0.7);
    ctx.fillStyle = '#f4d84a'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(0, -12, 12, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fbefa5'; ctx.beginPath(); ctx.moveTo(-9, -1); ctx.quadraticCurveTo(0, -9, 9, -1); ctx.closePath(); ctx.fill(); ctx.restore();
    var gl = ctx.createRadialGradient(80, 76, 0, 80, 76, 40); gl.addColorStop(0, 'rgba(255,255,255,.18)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gl; circle(ctx, 80, 76, 40); ctx.fill();
  }
  function hummus(ctx, r) {
    plate(ctx, r, SAGE, 92);
    var R = 66, i, p;
    var g = ctx.createRadialGradient(88, 86, 4, 100, 100, R);
    g.addColorStop(0, '#f0dcb4'); g.addColorStop(0.7, '#e2c58f'); g.addColorStop(1, '#cfae75');
    ctx.fillStyle = g; blob(ctx, r, 100, 100, R, 0.08, 14); ctx.fill();
    // swirl grooves
    ctx.lineCap = 'round';
    for (i = 0; i < 2; i++) {
      ctx.strokeStyle = i ? 'rgba(255,248,230,.55)' : 'rgba(150,110,55,.55)'; ctx.lineWidth = i ? 2 : 5;
      ctx.beginPath();
      for (var a = 0; a < 6.28 * 2.3; a += 0.1) { var rr = 10 + a * 3.5, x = 100 + Math.cos(a) * rr + i * -1.2, y = 100 + Math.sin(a) * rr + i * -1.2; if (a) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
    }
    // olive oil
    var oil = ctx.createRadialGradient(100, 100, 0, 100, 100, 38);
    oil.addColorStop(0, 'rgba(196,170,40,.55)'); oil.addColorStop(1, 'rgba(196,170,40,0)');
    ctx.fillStyle = oil; circle(ctx, 100, 100, 38); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,230,.45)'; ell(ctx, 92, 92, 9, 4, -0.6); ctx.fill();
    // chickpeas, paprika, parsley, pomegranate
    for (i = 0; i < 9; i++) { p = inDisc(r, 0, 100, 100, 16); var cg = ctx.createRadialGradient(p[0] - 1.5, p[1] - 1.5, 0, p[0], p[1], 5); cg.addColorStop(0, '#f6e3b8'); cg.addColorStop(1, '#c9a160'); ctx.fillStyle = cg; circle(ctx, p[0], p[1], 4.2); ctx.fill(); }
    speckle(ctx, r, 110, function () { return inDisc(r, 0, 100, 100, R - 12); }, ['#c2401f', '#d9582a', '#a8321a'], 1.2);
    for (i = 0; i < 26; i++) { p = inDisc(r, 0, 100, 100, R - 10); ctx.fillStyle = r() < 0.5 ? '#3f7a2a' : '#5c9a3a'; ctx.fillRect(p[0], p[1], 2.4, 1.6); }
    for (i = 0; i < 12; i++) { p = inDisc(r, 0, 100, 100, R - 14); aril(ctx, r, p[0], p[1], 2.5); }
  }
  function warak(ctx, r) {
    oval(ctx, r, SAGE, 94, 64, false);
    var i, j;
    for (j = 0; j < 3; j++) {
      for (i = 0; i < 6; i++) {
        var x = 52 + i * 19.5 + (j % 2) * 6, y = 72 + j * 26 + (r() - 0.5) * 3, ang = (r() - 0.5) * 0.25;
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
        var g = ctx.createLinearGradient(0, -9, 0, 9); g.addColorStop(0, '#7f8a3e'); g.addColorStop(0.5, '#5b6629'); g.addColorStop(1, '#3d461b');
        ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-8.5, -11, 17, 22, 7) : ctx.rect(-8.5, -11, 17, 22); ctx.fill();
        ctx.strokeStyle = 'rgba(200,210,140,.35)'; ctx.lineWidth = 0.8;
        for (var k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(-7, k * 6 - 3); ctx.quadraticCurveTo(0, k * 6 + 1, 7, k * 6 - 4); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,220,.25)'; ctx.fillRect(-5, -9, 3, 16);
        ctx.restore();
      }
    }
    var p;
    for (i = 0; i < 30; i++) { p = inEll(r, 100, 100, 70, 40); aril(ctx, r, p[0], p[1], 2.4); }
    // lemon slices
    [[38, 104], [162, 98]].forEach(function (c) {
      ctx.fillStyle = '#f2d54a'; circle(ctx, c[0], c[1], 9); ctx.fill();
      ctx.fillStyle = '#fbefa8'; circle(ctx, c[0], c[1], 7.4); ctx.fill();
      ctx.strokeStyle = '#f2d54a'; ctx.lineWidth = 0.8; for (var a = 0; a < 6.28; a += 0.9) { ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0] + Math.cos(a) * 7, c[1] + Math.sin(a) * 7); ctx.stroke(); }
    });
  }
  function tomato(ctx, r) {
    plate(ctx, r, COAL, 92);
    var spots = [[72, 70], [118, 66], [146, 104], [124, 140], [78, 136], [56, 102], [100, 102]];
    spots.forEach(function (c, n) {
      var R = n === 6 ? 20 : 21 + r() * 2;
      var g = ctx.createRadialGradient(c[0] - 4, c[1] - 4, 2, c[0], c[1], R);
      g.addColorStop(0, '#f6845d'); g.addColorStop(0.7, '#e2492c'); g.addColorStop(1, '#b22e1c');
      ctx.fillStyle = g; circle(ctx, c[0], c[1], R); ctx.fill();
      // seed chambers
      for (var k = 0; k < 4; k++) {
        var a = k * 1.57 + r() * 0.4;
        ctx.fillStyle = 'rgba(255,170,110,.75)'; ell(ctx, c[0] + Math.cos(a) * R * 0.48, c[1] + Math.sin(a) * R * 0.48, R * 0.24, R * 0.16, a); ctx.fill();
        ctx.fillStyle = 'rgba(250,220,150,.9)'; for (var s = 0; s < 3; s++) { circle(ctx, c[0] + Math.cos(a) * R * (0.4 + s * 0.08), c[1] + Math.sin(a) * R * (0.4 + s * 0.08), 0.9); ctx.fill(); }
      }
      // labneh
      var lg = ctx.createRadialGradient(c[0] - 3, c[1] - 4, 1, c[0], c[1], 11);
      lg.addColorStop(0, '#ffffff'); lg.addColorStop(1, '#e9e1d2');
      ctx.fillStyle = lg; blob(ctx, r, c[0] + 1, c[1], 9.5, 0.45, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ell(ctx, c[0] - 2, c[1] - 3, 3, 1.6, -0.5); ctx.fill();
      speckle(ctx, r, 18, function () { return inDisc(r, 0, c[0], c[1], 11); }, ['#5d5e2a', '#7a7836', '#3d3b1a'], 1.1); // za'atar
    });
    var oil = ctx.createRadialGradient(100, 100, 0, 100, 100, 80); oil.addColorStop(0, 'rgba(200,175,60,.12)'); oil.addColorStop(1, 'rgba(200,175,60,0)');
    ctx.fillStyle = oil; circle(ctx, 100, 100, 80); ctx.fill();
  }
  function makanek(ctx, r) {
    oval(ctx, r, SAGE, 86, 62, true);
    var i, rows = [[78, 6], [96, 7], [114, 6], [130, 4]];
    rows.forEach(function (row, ri) {
      for (var k = 0; k < row[1]; k++) {
        var x = 100 + (k - (row[1] - 1) / 2) * 18 + (r() - 0.5) * 4, y = row[0] - 6 + (r() - 0.5) * 4, ang = 1.2 + (r() - 0.5) * 0.9, L = 21 + r() * 4, W = 10;
        if (((x - 100) / 64) * ((x - 100) / 64) + ((y - 100) / 44) * ((y - 100) / 44) > 1) continue;
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
        ctx.fillStyle = 'rgba(40,10,5,.35)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-L / 2 + 1.5, -W / 2 + 2, L, W, W / 2) : ctx.rect(-L / 2, -W / 2, L, W); ctx.fill();
        var g = ctx.createLinearGradient(0, -W / 2, 0, W / 2); g.addColorStop(0, '#cf5a33'); g.addColorStop(0.45, '#9a3018'); g.addColorStop(1, '#5c1a0b');
        ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-L / 2, -W / 2, L, W, W / 2) : ctx.rect(-L / 2, -W / 2, L, W); ctx.fill();
        ctx.strokeStyle = 'rgba(255,225,195,.6)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-L / 2 + 4, -W / 4); ctx.lineTo(L / 2 - 4, -W / 4); ctx.stroke();
        ctx.restore();
      }
    });
    for (i = 0; i < 6; i++) { var t = inEll(r, 100, 100, 54, 32), tg = ctx.createRadialGradient(t[0] - 2, t[1] - 2, 0, t[0], t[1], 7); tg.addColorStop(0, '#ff8a6a'); tg.addColorStop(1, '#c92b1a'); ctx.fillStyle = tg; circle(ctx, t[0], t[1], 6.2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(ctx, t[0] - 2, t[1] - 2.2, 1.3); ctx.fill(); }
    [[42, 100, -0.3], [158, 100, 3.4]].forEach(function (c) { // lemon wedges at the ends
      ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(c[2]);
      ctx.fillStyle = '#efcf3c'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(12, 0, 0, 12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fbeea2'; ctx.beginPath(); ctx.moveTo(1, -9); ctx.quadraticCurveTo(9, 0, 1, 9); ctx.closePath(); ctx.fill(); ctx.restore();
    });
    var gl = ctx.createRadialGradient(100, 100, 0, 100, 100, 70); gl.addColorStop(0, 'rgba(120,20,30,.18)'); gl.addColorStop(1, 'rgba(120,20,30,0)');
    ctx.fillStyle = gl; ell(ctx, 100, 100, 70, 46); ctx.fill();
  }
  function grill(ctx, r) {
    oval(ctx, r, COAL, 97, 70, false);
    var i, p;
    // fries along the bottom edge
    for (i = 0; i < 26; i++) {
      p = inEll(r, 100, 128, 56, 14);
      ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate((r() - 0.5) * 1.2 + (r() < 0.5 ? 0 : 1.57));
      var fg = ctx.createLinearGradient(0, -2.5, 0, 2.5); fg.addColorStop(0, '#ffe08a'); fg.addColorStop(1, '#d99a32');
      ctx.fillStyle = fg; ctx.fillRect(-11, -2.4, 22, 4.8); ctx.fillStyle = 'rgba(160,90,20,.5)'; ctx.fillRect(9, -2.4, 2, 4.8); ctx.restore();
    }
    // three skewers: tawouk, meat, tawouk
    function skewer(y, kind) {
      ctx.strokeStyle = '#c9c9c4'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(26, y); ctx.lineTo(174, y); ctx.stroke();
      for (var k = 0; k < 7; k++) {
        var x = 44 + k * 19 + (r() - 0.5) * 3, s = 8 + r() * 2;
        ctx.save(); ctx.translate(x, y + (r() - 0.5) * 2); ctx.rotate((r() - 0.5) * 0.5);
        var c1 = kind === 't' ? ['#f2a55a', '#d97a2c', '#9e4a17'] : ['#9a5a37', '#6f3a20', '#3e1d0d'];
        var g = ctx.createLinearGradient(-s, -s, s, s); g.addColorStop(0, c1[0]); g.addColorStop(0.6, c1[1]); g.addColorStop(1, c1[2]);
        ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-s, -s, s * 2, s * 2, 3.5) : ctx.rect(-s, -s, s * 2, s * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(40,15,5,.6)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-s + 2, -2); ctx.lineTo(s - 2, -5); ctx.moveTo(-s + 2, 4); ctx.lineTo(s - 2, 1); ctx.stroke();
        ctx.fillStyle = 'rgba(255,230,180,.25)'; ctx.fillRect(-s + 2, -s + 2, s * 0.8, s * 0.5);
        ctx.restore();
      }
    }
    skewer(70, 't'); skewer(94, 'm'); skewer(117, 't');
    // grilled tomatoes and onion
    [[34, 86], [166, 112]].forEach(function (c) { var g = ctx.createRadialGradient(c[0] - 3, c[1] - 3, 1, c[0], c[1], 11); g.addColorStop(0, '#ff7a55'); g.addColorStop(0.8, '#c4321c'); g.addColorStop(1, '#5a1a0c'); ctx.fillStyle = g; circle(ctx, c[0], c[1], 11); ctx.fill(); ctx.strokeStyle = 'rgba(30,10,5,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(c[0] - 7, c[1] - 2); ctx.lineTo(c[0] + 6, c[1] - 5); ctx.stroke(); });
    ctx.fillStyle = '#efe6d2'; circle(ctx, 162, 80, 10); ctx.fill(); ctx.strokeStyle = 'rgba(120,80,40,.5)'; ctx.lineWidth = 1; for (i = 3; i < 10; i += 3) { circle(ctx, 162, 80, i); ctx.stroke(); }
    // saj triangles with za'atar on top of the skewers
    for (i = 0; i < 3; i++) {
      ctx.save(); ctx.translate(70 + i * 30, 52 + (i % 2) * 6); ctx.rotate(-0.4 + i * 0.35);
      ctx.fillStyle = 'rgba(232,196,138,.96)'; ctx.beginPath(); ctx.moveTo(-16, 8); ctx.lineTo(0, -14); ctx.lineTo(16, 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(160,110,50,.5)'; for (var k = 0; k < 6; k++) { circle(ctx, (r() - 0.5) * 16, (r() - 0.2) * 10, 1.2); ctx.fill(); }
      ctx.fillStyle = '#4c6b2a'; for (k = 0; k < 10; k++) ctx.fillRect((r() - 0.5) * 18, (r() - 0.3) * 10, 2, 1.4);
      ctx.restore();
    }
    // garlic sauce in a small sage bowl
    ctx.save(); ctx.translate(150, 54);
    var bg = ctx.createRadialGradient(-3, -3, 1, 0, 0, 15); bg.addColorStop(0, '#dfe2c8'); bg.addColorStop(1, '#9ea27c');
    ctx.fillStyle = 'rgba(0,0,0,.3)'; circle(ctx, 2, 3, 15); ctx.fill();
    ctx.fillStyle = bg; circle(ctx, 0, 0, 15); ctx.fill();
    var tg = ctx.createRadialGradient(-3, -3, 0, 0, 0, 11); tg.addColorStop(0, '#ffffff'); tg.addColorStop(1, '#eee8dc');
    ctx.fillStyle = tg; circle(ctx, 0, 0, 11); ctx.fill(); ctx.restore();
    // parsley
    for (i = 0; i < 24; i++) { p = inEll(r, 100, 96, 70, 46); ctx.fillStyle = r() < 0.5 ? '#3f7a2a' : '#5f9a3a'; ctx.fillRect(p[0], p[1], 2.4, 1.6); }
  }

  var DISHES = {
    fattoush: { draw: fattoush, x: 0.27, y: 0.28, s: 0.31, rot: -12 },
    tabbouleh: { draw: tabbouleh, x: 0.725, y: 0.255, s: 0.28, rot: 18 },
    hummus: { draw: hummus, x: 0.165, y: 0.585, s: 0.26, rot: -8 },
    warak: { draw: warak, x: 0.825, y: 0.555, s: 0.27, rot: 76 },
    tomato: { draw: tomato, x: 0.335, y: 0.815, s: 0.275, rot: 10 },
    makanek: { draw: makanek, x: 0.69, y: 0.815, s: 0.265, rot: -14 },
    grill: { draw: grill, x: 0.5, y: 0.53, s: 0.43, rot: -4 }
  };

  /* ------------------------------------------------------- table top */
  function drawTop(cv, D) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(D * dpr); cv.height = Math.round(D * dpr);
    var ctx = cv.getContext('2d'); ctx.setTransform(D * dpr / 200, 0, 0, D * dpr / 200, 0, 0);
    var r = rng(77);
    var g = ctx.createRadialGradient(84, 78, 10, 100, 100, 100);
    g.addColorStop(0, '#7a7771'); g.addColorStop(0.7, '#62605b'); g.addColorStop(1, '#4b4a46');
    ctx.fillStyle = g; circle(ctx, 100, 100, 100); ctx.fill();
    ctx.save(); circle(ctx, 100, 100, 99); ctx.clip();
    // soft mottling of the stone
    for (var i = 0; i < 26; i++) {
      var mx = r() * 200, my = r() * 200, mr = 10 + r() * 34;
      var mg = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
      var light = r() < 0.5;
      mg.addColorStop(0, light ? 'rgba(255,255,255,.045)' : 'rgba(0,0,0,.06)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = mg; circle(ctx, mx, my, mr); ctx.fill();
    }
    // two faint long veins
    ctx.lineCap = 'round';
    for (i = 0; i < 2; i++) {
      ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-10, 40 + i * 90); ctx.bezierCurveTo(60, 20 + i * 100, 120, 90 + i * 40, 210, 60 + i * 80); ctx.stroke();
    }
    for (i = 0; i < 2200; i++) { var p = inDisc(r, 0, 100, 100, 100); ctx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.07)'; ctx.fillRect(p[0], p[1], 0.7, 0.7); }
    ctx.restore();
    // bevelled edge
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(100, 100, 98.6, Math.PI * 0.95, Math.PI * 1.75); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(100, 100, 98.6, Math.PI * 0.05, Math.PI * 0.85); ctx.stroke();
    // a linen napkin with two rose-gold forks, like theirs
    ctx.save(); ctx.translate(30, 152); ctx.rotate(-0.85);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-15, -27, 34, 56);
    ctx.fillStyle = '#ece6dc'; ctx.fillRect(-17, -30, 34, 56);
    ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 0.6; for (i = -28; i < 26; i += 3) { ctx.beginPath(); ctx.moveTo(-17, i); ctx.lineTo(17, i); ctx.stroke(); }
    function fork(x) {
      var fg = ctx.createLinearGradient(x - 3, 0, x + 3, 0); fg.addColorStop(0, '#b08a5a'); fg.addColorStop(0.5, '#f1d9a8'); fg.addColorStop(1, '#a37b4a');
      ctx.fillStyle = fg; ctx.fillRect(x - 1.4, -6, 2.8, 34); ctx.fillRect(x - 3.6, -12, 7.2, 7);
      for (var t = 0; t < 4; t++) ctx.fillRect(x - 3.6 + t * 2.1, -24, 1.1, 13);
    }
    fork(-5); fork(6);
    ctx.restore();
  }

  /* ------------------------------------------------------------ build */
  function build(table) {
    var top = table.querySelector('[data-tabletop]');
    var made = {};
    function render() {
      var D = table.getBoundingClientRect().width;
      if (!D) return;
      drawTop(top, D);
      Object.keys(DISHES).forEach(function (k, n) {
        var d = DISHES[k], el = made[k];
        if (!el) {
          el = document.createElement('div'); el.className = 'dish'; el.setAttribute('data-dish-el', k); el.tabIndex = -1;
          el.innerHTML = '<canvas></canvas><span class="dish__tag"></span>';
          var S2 = d.s * 1.12; el.style.left = (d.x - S2 / 2) * 100 + '%'; el.style.top = (d.y - S2 / 2) * 100 + '%';
          el.style.width = S2 * 100 + '%'; el.style.height = S2 * 100 + '%';
          var li = document.querySelector('[data-dish="' + k + '"] h3');
          el.querySelector('.dish__tag').textContent = li ? li.textContent : k;
          table.appendChild(el); made[k] = el;
        }
        var cv = el.querySelector('canvas'), dpr = Math.min(window.devicePixelRatio || 1, 2), px = Math.round(d.s * 1.12 * D * dpr);
        cv.width = px; cv.height = px;
        var ctx = cv.getContext('2d');
        ctx.setTransform(px / 224, 0, 0, px / 224, 0, 0);
        ctx.translate(112, 112); ctx.rotate(d.rot * Math.PI / 180); ctx.translate(-100, -100);
        d.draw(ctx, rng(1000 + n * 37));
      });
    }
    render();
    var last = table.getBoundingClientRect().width, t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () { var w = table.getBoundingClientRect().width; if (Math.abs(w - last) > 8) { last = w; render(); } }, 200);
    });
    return { order: ['fattoush', 'tabbouleh', 'hummus', 'warak', 'tomato', 'makanek', 'grill'], el: made };
  }

  window.LoungeTable = { build: build, DISHES: DISHES };
})();
