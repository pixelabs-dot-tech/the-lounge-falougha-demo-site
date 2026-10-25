// usage: node render_svg.js in.svg out.png width bg
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [inp, out, w, bg] = process.argv.slice(2);
  const svg = fs.readFileSync(inp, 'utf8');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: 400 }, deviceScaleFactor: 1 });
  await p.setContent(`<html><body style="margin:0;background:${bg||'#0b4135'}"><div style="width:${w}px">${svg.replace('<svg ', '<svg style="width:100%;height:auto;display:block" ')}</div></body></html>`);
  const el = await p.$('div');
  await el.screenshot({ path: out });
  await b.close();
})();
