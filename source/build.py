#!/usr/bin/env python3
"""Builds site/index.html from template.html.

Fills in the traced The Lounge logo (logo_parts.json), the jeetak symbols and
the jeetak band scene (taken from the other Upper Metn sites), and the icons.
Run from the repo root:  python3 source/build.py https://your-domain/
It writes index.html and deploy/the-lounge-site.zip.
"""
import json, re, sys, pathlib

HERE = pathlib.Path(__file__).parent
SITE = HERE.parent
SITE_URL = sys.argv[1] if len(sys.argv) > 1 else ''

parts = json.load(open(HERE / 'logo_parts.json'))
# order: 0 L·o, 5 u·n, 6 g, 7 e, then "The": 1 T, 2 h stem, 3 h arch, 4 e
order = [0, 5, 6, 7, 1, 2, 3, 4]
stagger = {0: 0, 5: 1, 6: 2, 7: 3, 1: 4, 2: 5, 3: 5, 4: 6}
all_d = ''.join(p['d'] for p in parts)

LOGO_SYMBOL = '<symbol id="tl-logo" viewBox="14 13.5 579 225"><path fill-rule="evenodd" d="%s"/></symbol>' % all_d
HERO_LOGO = '\n'.join('            <path class="lg__p" fill-rule="evenodd" style="--i:%d" d="%s"/>' % (stagger[i], parts[i]['d']) for i in order)

ICONS = {
    'i-down': '<path d="M12 5v14M5 12l7 7 7-7"/>',
    'i-arrow': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'i-left': '<path d="M15 5l-7 7 7 7"/>',
    'i-right': '<path d="M9 5l7 7-7 7"/>',
    'i-x': '<path d="M6 6l12 12M18 6L6 18"/>',
    'i-pin': '<path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    'i-ig': '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>',
    'i-copy': '<rect x="8.5" y="8.5" width="11" height="11" rx="2.4"/><path d="M15.5 8.5V6.9a2.4 2.4 0 0 0-2.4-2.4H6.9a2.4 2.4 0 0 0-2.4 2.4v6.2a2.4 2.4 0 0 0 2.4 2.4h1.6"/>',
    'i-check': '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
}
icon_syms = '\n'.join('<symbol id="%s" viewBox="0 0 24 24">%s</symbol>' % (k, v) for k, v in ICONS.items())
pin_solid = '<symbol id="i-pin-solid" viewBox="0 0 24 32"><path fill-rule="evenodd" d="M12 31.5C12 31.5 1.5 19.8 1.5 11.8 1.5 5.9 6.2 1.5 12 1.5s10.5 4.4 10.5 10.3C22.5 19.8 12 31.5 12 31.5zM12 16.2a4.4 4.4 0 1 0 0-8.8 4.4 4.4 0 0 0 0 8.8z"/></symbol>'

jk_symbols = (HERE / 'jk_symbols.svgfrag').read_text()
SYMBOLS = '\n'.join([LOGO_SYMBOL, jk_symbols.strip(), icon_syms, pin_solid])

scene = (HERE / 'jk_scene.svgfrag').read_text()
store_old = re.search(r'  <g transform="translate\(-250 -175\)">.*?</g></g>\n', scene, re.S)
assert store_old, 'store badge not found'
store_new = ('  <g transform="translate(-250 -175)"><g class="jk__store"><circle r="119" class="jk__storering"/>'
             '<circle r="103" class="jk__storebg"/><circle r="94" class="jk__storeline"/>'
             '<svg x="-80" y="-48" width="160" height="62" viewBox="0 0 579 225" class="jk__storelogo"><use href="#tl-logo"/></svg>'
             '<text y="42" text-anchor="middle" class="jk__storetxt">FALOUGHA</text></g></g>\n')
scene = scene.replace(store_old.group(0), store_new)

html = (HERE / 'template.html').read_text()
html = (html.replace('{{SYMBOLS}}', SYMBOLS)
            .replace('{{HERO_LOGO}}', HERO_LOGO)
            .replace('{{JK_SCENE}}', scene.rstrip('\n'))
            .replace('{{SITE_URL}}', SITE_URL))
if not SITE_URL:
    html = re.sub(r'<meta property="og:url" content="">\n', '', html)
    html = html.replace('"url":"",', '')
assert '{{' not in html, re.findall(r'\{\{[A-Z_]+\}\}', html)
# full document for a normal web server
cut = html.index('<svg width="0" height="0"')
head, body = html[:cut], html[cut:]
full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        + head + '</head>\n<body>\n' + body + '</body>\n</html>\n')
(SITE / 'index.html').write_text(full)
print('index.html', len(full), 'bytes')

# the zip Hostinger unpacks with its static archive deploy
import zipfile, os
zpath = SITE / 'deploy' / 'the-lounge-site.zip'
zpath.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for name in ['index.html', 'site.webmanifest', '.htaccess']:
        z.write(SITE / name, name)
    for root, dirs, files in os.walk(SITE / 'assets'):
        dirs.sort()
        for f in sorted(files):
            p = pathlib.Path(root) / f
            z.write(p, p.relative_to(SITE).as_posix())
print('deploy/the-lounge-site.zip', zpath.stat().st_size, 'bytes')
