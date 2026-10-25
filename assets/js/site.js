/* =========================================================================
   THE LOUNGE · FALOUGHA — site behaviour
   ========================================================================= */
(function () {
  'use strict';

  /* ---- Edit these to update the site ---- */
  var CONFIG = {
    jeetak: 'https://jeetaklb.com',   // swap for The Lounge's store link inside jeetak
    instagram: 'https://www.instagram.com/thelounge.falougha/',
    maps: 'https://www.google.com/maps/search/?api=1&query=33.842438%2C35.734297'
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var G = window.gsap, ST = window.ScrollTrigger, SC = window.LoungeScenes;
  var hasGsap = !!(G && ST);
  if (hasGsap) { G.registerPlugin(ST); ST.config({ ignoreMobileResize: true }); }
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var smooth = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

  $$('[data-link]').forEach(function (a) { var u = CONFIG[a.getAttribute('data-link')]; if (u) a.href = u; });

  /* =====================================================================
     SMOOTH SCROLL
     ===================================================================== */
  var lenis = null;
  if (!RM && hasGsap && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
  }
  function scrollToEl(target) {
    if (target === 'top') { if (lenis) lenis.scrollTo(0, { duration: 1.8 }); else window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); return; }
    var off = target.id === 'menu' || target.id === 'visit' || target.id === 'instagram' ? -64 : 0;
    if (lenis) lenis.scrollTo(target, { offset: off, duration: 1.5 });
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset + off, behavior: RM ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    e.preventDefault();
    closeMenu();
    if (id === 'top') { scrollToEl('top'); return; }
    var t = document.getElementById(id);
    if (t) scrollToEl(t);
  });

  /* =====================================================================
     NAV + MOBILE MENU
     ===================================================================== */
  var nav = $('[data-nav]'), lastY = 0;
  function onScroll() {
    var y = window.pageYOffset;
    var heroEnd = heroWrap ? heroWrap.offsetHeight - window.innerHeight * 0.6 : 200;
    nav.classList.toggle('is-solid', y > heroEnd);
    if (!document.documentElement.classList.contains('is-locked')) {
      if (y > heroEnd + 300 && y > lastY + 6) nav.classList.add('is-hidden');
      else if (y < lastY - 6 || y < heroEnd) nav.classList.remove('is-hidden');
    }
    lastY = y;
    sipUpdate(y);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  var burger = $('[data-burger]'), mnav = $('[data-mnav]');
  function openMenu() {
    burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Close the menu');
    mnav.classList.add('is-open'); document.documentElement.classList.add('is-locked'); nav.classList.remove('is-hidden');
    if (lenis) lenis.stop();
  }
  function closeMenu() {
    if (!burger || burger.getAttribute('aria-expanded') !== 'true') return;
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open the menu');
    mnav.classList.remove('is-open'); document.documentElement.classList.remove('is-locked');
    if (lenis) lenis.start();
  }
  if (burger) burger.addEventListener('click', function () { burger.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); closeViewer(); } });

  // underline the section in view
  if ('IntersectionObserver' in window) {
    var links = $$('.nav__links a');
    var secIO = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        links.forEach(function (l) { l.classList.toggle('is-here', l.getAttribute('href') === '#' + x.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['menu', 'mezze', 'grill', 'evenings', 'visit'].forEach(function (id) { var s = document.getElementById(id); if (s) secIO.observe(s); });
  }

  /* =====================================================================
     HERO: the live sky over Falougha, and the rope curtain
     ===================================================================== */
  var heroWrap = $('[data-hero-wrap]'), hero = $('[data-hero]'), heroIn = $('[data-hero-in]');
  var sky = null, ropes = null;
  function phaseText(now, alt) {
    var h = SC.localHour(now), times = SC.sunTimes(now), t = SC.fmtTime(now) + ' in Falougha';
    if (alt >= 8) return t + (times.set ? ' · Sunset at ' + SC.fmtTime(times.set) : '');
    if (alt >= 0) return t + (h >= 12 ? ' · Golden hour' : ' · Morning light');
    if (alt >= -6) return t + (h >= 12 ? ' · Just after sunset' : ' · First light');
    if (h < 12 && times.rise) return t + ' · Sunrise at ' + SC.fmtTime(times.rise);
    return t + ' · Stars are out';
  }
  function initHero() {
    if (!hero || !SC) return;
    var skyCv = $('[data-sky]', hero), ropeCv = $('[data-ropes]', hero), nowEl = $('[data-now-text]', hero);
    sky = new SC.Sky(skyCv, { horizon: 0.64, seed: 7 });
    ropes = new SC.Ropes(ropeCv);
    function setNow() {
      var now = new Date(), p = SC.sunPos(now);
      sky.setSun(p.alt, p.az);
      var day = p.alt > -1.5;
      hero.classList.toggle('is-day', day);
      nav.classList.toggle('is-day', day);
      hero.style.setProperty('--now-dot', day ? '#f2b23b' : p.alt > -6 ? '#ff9f6e' : '#f5c47c');
      if (nowEl) nowEl.textContent = phaseText(now, p.alt);
    }
    setNow(); setInterval(setNow, 30000);

    var lastPX = 0, lastPY = 0;
    window.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      if (e.clientY > r.bottom) return;
      var x = e.clientX, y = e.clientY - r.top;
      sky.pointer(x / r.width - 0.5, y / r.height - 0.5);
      ropes.pointer(x, y, clamp(x - lastPX, -40, 40), clamp(y - lastPY, -40, 40));
      lastPX = x; lastPY = y;
    }, { passive: true });
    window.addEventListener('pointerleave', function () { ropes.pointer(-9999, -9999, 0, 0); });

    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { ropes.layout(); }, 150); });

    function heroProgress() {
      var max = heroWrap.offsetHeight - window.innerHeight;
      return max > 0 ? clamp(window.pageYOffset / max, 0, 1) : 0;
    }
    if (RM) { sky.draw(0); ropes.step(0.016, 0); ropes.draw(); return; }
    SC.whileVisible(hero, function (dt, time) {
      var p = heroProgress();
      ropes.part = smooth(p * 1.25);
      sky.lift = -0.07 * p;
      heroIn.style.transform = 'translate3d(0,' + (-p * 90).toFixed(1) + 'px,0)';
      heroIn.style.opacity = (1 - smooth((p - 0.3) / 0.5)).toFixed(3);
      sky.draw(time);
      ropes.step(dt, time); ropes.draw();
    });
  }

  /* =====================================================================
     REVEALS (primed only just before they scroll in, so nothing far down
     the page is ever left hidden)
     ===================================================================== */
  function initReveals() {
    $$('[data-reveal]').forEach(function (el) {
      el.innerHTML = '<span class="rv__in">' + el.innerHTML + '</span>';
      el.classList.add('rv');
    });
    if (RM || !('IntersectionObserver' in window)) return;
    var show = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        show.unobserve(x.target);
        var el = x.target, d = +(el.getAttribute('data-delay') || 0);
        setTimeout(function () { el.classList.remove('is-pre'); }, d);
      });
    }, { threshold: 0.12 });
    var prime = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        prime.unobserve(x.target);
        if (x.boundingClientRect.top > window.innerHeight - 10) {
          x.target.classList.add('is-pre');
          void x.target.offsetWidth;
          show.observe(x.target);
        }
      });
    }, { rootMargin: '0px 0px 55% 0px' });
    // stagger siblings
    $$('.title').forEach(function (t) { $$('.rv', t).forEach(function (r, i) { r.setAttribute('data-delay', i * 120); }); });
    $$('.rv, [data-fade]').forEach(function (el) { prime.observe(el); });
  }

  /* =====================================================================
     VIDEOS: load and play only while on screen
     ===================================================================== */
  function initVideos() {
    var vids = $$('video[data-src]');
    if (!('IntersectionObserver' in window)) { vids.forEach(function (v) { v.src = v.getAttribute('data-src'); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        var v = x.target;
        if (x.isIntersecting) {
          if (!v.src) { v.src = v.getAttribute('data-src'); v.load(); }
          if (!RM) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        } else if (!v.paused) v.pause();
      });
    }, { rootMargin: '120px 0px' });
    vids.forEach(function (v) { io.observe(v); });
  }

  /* =====================================================================
     PARALLAX
     ===================================================================== */
  function initParallax() {
    if (RM || !hasGsap) return;
    $$('[data-parallax]').forEach(function (el) {
      var k = parseFloat(el.getAttribute('data-parallax')) || 0;
      G.fromTo(el, { yPercent: -k * 100 }, { yPercent: k * 100, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* =====================================================================
     THE MEZZE TABLE
     ===================================================================== */
  function initMezze() {
    var sec = $('[data-mezze]');
    if (!sec || !window.LoungeTable) return;
    var table = $('[data-table]', sec);
    var built = window.LoungeTable.build(table);
    var items = $$('[data-dishes] li', sec);
    var els = built.order.map(function (k) { return built.el[k]; });
    // hover / tap names
    els.forEach(function (el, i) {
      el.addEventListener('click', function () {
        els.forEach(function (o) { o.classList.remove('is-tag'); });
        el.classList.add('is-tag'); setTimeout(function () { el.classList.remove('is-tag'); }, 1800);
      });
    });
    if (RM || !hasGsap) { sec.classList.add('is-done'); return; }
    sec.classList.add('is-live');
    var pinEl = $('[data-mezze-pin]', sec), r = SC.rng(4);
    var tl = G.timeline({ defaults: { ease: 'none' } });
    els.forEach(function (el, i) {
      var big = i === els.length - 1;
      tl.fromTo(el,
        { yPercent: big ? -200 : -240, xPercent: (r() - 0.5) * 40, rotation: (r() - 0.5) * 50, scale: 1.3, autoAlpha: 0 },
        { yPercent: 0, xPercent: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: 0.85, ease: 'back.out(1.6)' }, i);
    });
    tl.to({}, { duration: 1.2 });
    var cur = -1;
    function setActive(idx) {
      if (idx === cur) return; cur = idx;
      items.forEach(function (li, i) { li.classList.toggle('is-on', i === idx); });
    }
    setActive(0);
    ST.create({
      trigger: sec, pin: pinEl, start: 'top top',
      end: function () { return '+=' + Math.round(window.innerHeight * (window.innerWidth < 960 ? 2.6 : 2.3)); },
      scrub: 0.6, animation: tl, invalidateOnRefresh: true,
      onUpdate: function (self) {
        var t = self.progress * tl.duration();
        setActive(clamp(Math.floor(t - 0.15), 0, items.length - 1));
        sec.classList.toggle('is-done', t > els.length + 0.1);
      }
    });
  }

  /* =====================================================================
     DAY INTO NIGHT
     ===================================================================== */
  function initEve() {
    var sec = $('[data-eve]');
    if (!sec || !SC) return;
    var cv = $('[data-eve-sky]', sec), panels = $$('[data-panel]', sec), dots = $$('[data-eve-dots] i', sec), sign = $('[data-sign]', sec);
    var esky = new SC.Sky(cv, { horizon: 0.7, seed: 19, moon: [0.52, 0.22] });
    var wall = $('[data-wall]', sec);
    SC.stoneWall($('[data-wall-canvas]', sec));
    var KEYS = [[0, 34], [0.3, 17], [0.42, 8], [0.6, -0.5], [0.72, -6], [1, -16]];
    function altAt(p) {
      for (var i = 1; i < KEYS.length; i++) if (p <= KEYS[i][0]) { var a = KEYS[i - 1], b = KEYS[i], t = (p - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * t; }
      return KEYS[KEYS.length - 1][1];
    }
    var cur = 0, lit = false;
    function setPanel(i) {
      if (i === cur) return;
      panels.forEach(function (p, k) { p.classList.toggle('is-on', k === i); p.classList.toggle('is-past', k < i); });
      dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
      cur = i;
    }
    function progress() {
      var r = sec.getBoundingClientRect(), max = r.height - window.innerHeight;
      return max > 0 ? clamp(-r.top / max, 0, 1) : 0;
    }
    function apply(p, time) {
      var alt = altAt(p), az = 205 + 58 * p;
      esky.setSun(alt, az);
      wall.style.setProperty('--night', smooth((-alt - 1) / 7).toFixed(3));
      esky.draw(time);
      setPanel(p < 0.34 ? 0 : p < 0.67 ? 1 : 2);
      var shouldLight = alt < -2.5;
      if (shouldLight !== lit) {
        lit = shouldLight;
        sign.classList.toggle('is-lit', lit);
        if (lit && !RM) { sign.classList.remove('is-flick'); void sign.offsetWidth; sign.classList.add('is-flick'); }
      }
    }
    if (RM) { esky.setSun(-1, 250); esky.draw(0); wall.style.setProperty('--night', 1); sign.classList.add('is-lit'); panels.forEach(function (p) { p.classList.add('is-on'); }); return; }
    SC.whileVisible(sec, function (dt, time) { apply(progress(), time); });
  }

  /* =====================================================================
     MENU
     ===================================================================== */
  var viewer = null;
  function money(v) { return '$' + (Math.round(v * 100) / 100).toString().replace(/\.(\d)$/, '.$10'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function initMenu() {
    var data = window.LOUNGE_MENU, cats = $('[data-cats]'), box = $('[data-items]');
    if (!data || !cats || !box) return;
    var cards = data.layout === 'cards';
    if (data.sub) { var sub = $('[data-menu-sub]'); if (sub) sub.textContent = data.sub; }
    var secs = data.sections.filter(function (s) { return data.items.some(function (it) { return it.s === s.id; }); });
    if (!secs.length) { box.innerHTML = '<p class="menu__empty">The menu is being updated. Order on jeetak to see today\'s dishes.</p>'; cats.hidden = true; return; }
    cats.innerHTML = secs.map(function (s, i) {
      return '<button type="button" role="tab" id="tab-' + s.id + '" aria-controls="panel-' + s.id + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '" data-cat="' + s.id + '">' + esc(s.label) + '</button>';
    }).join('');
    if (secs.length < 2) cats.hidden = true;
    box.classList.toggle('items--cards', cards);
    box.innerHTML = secs.map(function (s, i) {
      var its = data.items.filter(function (it) { return it.s === s.id; });
      return '<div class="items__sec" role="' + (secs.length > 1 ? 'tabpanel' : 'region') + '" id="panel-' + s.id + '" aria-labelledby="tab-' + s.id + '"' + (i ? ' hidden' : '') + '>' +
        (s.title && !cards ? '<h3 class="items__h">' + esc(s.title) + '</h3>' : '') +
        (s.note ? '<p class="item__desc" style="margin-bottom:6px">' + esc(s.note) + '</p>' : '') +
        '<div class="items__grid">' + its.map(cards ? cardHtml : itemHtml).join('') + '</div></div>';
    }).join('');
    function priceOf(it) {
      return it.sizes ? it.sizes.map(function (z) { return z[0] + ' ' + money(z[1]); }).join(' · ') : (it.price != null ? money(it.price) + (it.unit ? ' <small>' + esc(it.unit) + '</small>' : '') : '');
    }
    function itemHtml(it) {
      var tags = (it.tags || []).map(function (t) { return '<span class="item__tag">' + esc(t) + '</span>'; }).join('');
      var ph = it.img ? '<button type="button" class="item__ph" data-ph="' + esc(it.img) + '" data-name="' + esc(it.name) + '" data-desc="' + esc(it.desc || '') + '" aria-label="See a photo of ' + esc(it.name) + '"><img src="assets/img/dish/' + esc(it.img) + '-t.webp" alt="" loading="lazy" decoding="async" width="128" height="128"></button>' : '';
      return '<article class="item' + (it.img ? '' : ' item--nophoto') + '">' + ph +
        '<div><div class="item__top"><h4 class="item__name">' + esc(it.name) + tags + '</h4><span class="item__lead" aria-hidden="true"></span><span class="item__price">' + priceOf(it) + '</span></div>' +
        (it.desc ? '<p class="item__desc">' + esc(it.desc) + '</p>' : '') + '</div></article>';
    }
    function cardHtml(it) {
      var p = priceOf(it);
      return '<article class="mcard"><button type="button" class="mcard__ph" data-ph="' + esc(it.img) + '" data-name="' + esc(it.name) + '" data-desc="' + esc(it.desc || '') + '" aria-label="See a bigger photo of ' + esc(it.name) + '"><img src="assets/img/dish/' + esc(it.img) + '.webp" alt="' + esc(it.name) + '" loading="lazy" decoding="async" width="640" height="672"></button>' +
        '<div class="mcard__body"><h4 class="mcard__name">' + esc(it.name) + '</h4>' + (p ? '<span class="mcard__price">' + p + '</span>' : '') +
        (it.desc ? '<p class="mcard__desc">' + esc(it.desc) + '</p>' : '') + '</div></article>';
    }
    var tabs = $$('button', cats);
    function select(btn, focus) {
      tabs.forEach(function (b) { var on = b === btn; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; $('#panel-' + b.getAttribute('data-cat')).hidden = !on; });
      if (focus) btn.focus();
      btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: RM ? 'auto' : 'smooth' });
      if (hasGsap && !RM) G.fromTo($$('.item, .mcard', $('#panel-' + btn.getAttribute('data-cat'))), { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.025, ease: 'power3.out', overwrite: true });
      if (hasGsap) ST.refresh();
    }
    cats.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) select(b); });
    cats.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement); if (i < 0) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); select(tabs[(i + 1) % tabs.length], true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); select(tabs[(i - 1 + tabs.length) % tabs.length], true); }
    });
    box.addEventListener('click', function (e) { var b = e.target.closest('[data-ph]'); if (b) openViewer(b); });
  }
  function openViewer(b) {
    if (!viewer) {
      viewer = document.createElement('div'); viewer.className = 'pv'; viewer.setAttribute('role', 'dialog'); viewer.setAttribute('aria-modal', 'true'); viewer.setAttribute('aria-label', 'Dish photo');
      viewer.innerHTML = '<div class="pv__box"><img alt=""><div class="pv__body"><p class="pv__name"></p><p class="pv__desc"></p></div><button class="pv__close" type="button" aria-label="Close"><svg class="ico" aria-hidden="true"><use href="#i-x"/></svg></button></div>';
      document.body.appendChild(viewer);
      viewer.addEventListener('click', function (e) { if (e.target === viewer || e.target.closest('.pv__close')) closeViewer(); });
    }
    $('img', viewer).src = 'assets/img/dish/' + b.getAttribute('data-ph') + '.webp';
    $('img', viewer).alt = b.getAttribute('data-name');
    $('.pv__name', viewer).textContent = b.getAttribute('data-name');
    $('.pv__desc', viewer).textContent = b.getAttribute('data-desc');
    viewer.classList.add('is-open'); viewer._from = b;
    if (lenis) lenis.stop();
    $('.pv__close', viewer).focus();
  }
  function closeViewer() {
    if (!viewer || !viewer.classList.contains('is-open')) return;
    viewer.classList.remove('is-open');
    if (lenis) lenis.start();
    if (viewer._from) viewer._from.focus();
  }

  /* =====================================================================
     JEETAK BAND (same as the other Upper Metn sites)
     ===================================================================== */
  function initJeetak() {
    var band = $('[data-jkband]');
    if (!band) return;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { nav.classList.toggle('is-jk', en[0].isIntersecting); }, { threshold: 0.25 }).observe(band);
    }
    var scene = $('[data-jkscene]', band);
    var motion = scene && scene.querySelector('animateMotion');
    if (RM || !('IntersectionObserver' in window)) { band.classList.add('is-in'); return; }
    band.classList.add('is-armed');
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      band.classList.add('is-in');
      if (motion && motion.beginElementAt) { try { motion.beginElementAt(0.6); } catch (e) { /* no SMIL */ } }
    }, { threshold: 0.3 });
    io.observe(scene || band);
  }

  /* =====================================================================
     VISIT: copy the plus code
     ===================================================================== */
  function initCopy() {
    $$('[data-copy]').forEach(function (b) {
      var label = $('[data-copy-l]', b);
      b.addEventListener('click', function () {
        var text = b.getAttribute('data-copy');
        function done(ok) { label.textContent = ok ? 'Copied' : 'Selected'; setTimeout(function () { label.textContent = 'Copy'; }, 1800); }
        function fallback() { var c = $('[data-code]'); var sel = window.getSelection(), rg = document.createRange(); rg.selectNodeContents(c); sel.removeAllRanges(); sel.addRange(rg); done(false); }
        try { navigator.clipboard.writeText(text).then(function () { done(true); }, fallback); } catch (e) { fallback(); }
      });
    });
  }

  /* =====================================================================
     BACK TO TOP: the latte empties as you scroll
     ===================================================================== */
  var sip = $('[data-sip]'), drink = $('[data-sip-drink]');
  function sipUpdate(y) {
    if (!sip) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? clamp(y / max, 0, 1) : 0;
    sip.classList.toggle('is-on', y > window.innerHeight * 1.4);
    drink.setAttribute('transform', 'translate(0 ' + (p * 50).toFixed(2) + ')');
  }

  /* =====================================================================
     BOOT
     ===================================================================== */
  initHero();
  initReveals();
  initVideos();
  initParallax();
  initMezze();
  if (SC) {
    SC.embers($('[data-embers]'));
    SC.crumbs($('[data-crumbs]'));
    SC.topo($('[data-topo-canvas]'));
  }
  initMenu();
  initEve();
  initJeetak();
  initCopy();
  onScroll();

  if (hasGsap) {
    window.addEventListener('load', function () { ST.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  }
})();
