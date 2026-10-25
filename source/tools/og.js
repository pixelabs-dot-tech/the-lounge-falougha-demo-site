const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.addInitScript(`(() => { const fixed = new Date('2026-10-24T18:45:00Z').getTime(); const D = Date; const start = D.now();
    class FD extends D { constructor(...a) { if (a.length) super(...a); else super(fixed + (D.now() - start)); } static now() { return fixed + (D.now() - start); } }
    window.Date = FD; })();`);
  await page.goto('http://localhost:8765/_full.html', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.nav,.hero__now,.hero__lede,.hero__ctas,.hero__modes,.hero__cue,.sip{display:none!important} .hero{min-height:0!important;height:630px!important} .hero__in{padding:40px!important} .hero__title{width:600px!important} .hero__rb{font-size:15px!important;margin-top:22px!important}' });
  await page.waitForTimeout(2600);
  await page.screenshot({ path: '/home/claude/lounge/work/og.png' });
  await b.close();
})();
