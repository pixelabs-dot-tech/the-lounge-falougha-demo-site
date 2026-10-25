const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 1 });
  const fav = fs.readFileSync('/home/claude/lounge/site/assets/img/favicon.svg', 'utf8');
  const icon = fs.readFileSync('/home/claude/lounge/work/icon.svg', 'utf8');
  const font = "@font-face{font-family:Jost;src:url('file:///home/claude/lounge/site/assets/fonts/jost-latin-wght-normal.woff2')}";
  for (const [svg, size, out, round] of [[fav, 32, 'favicon-32.png', 0], [icon, 180, 'apple-touch-icon.png', 0], [icon, 192, 'icon-192.png', 0], [icon, 512, 'icon-512.png', 0]]) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<html><head><style>${font} body{margin:0;background:transparent} svg{width:${size}px;height:${size}px;display:block}</style></head><body>${svg}</body></html>`);
    await p.waitForTimeout(200);
    await p.screenshot({ path: '/home/claude/lounge/site/assets/img/' + out, omitBackground: true });
  }
  await b.close();
})();
