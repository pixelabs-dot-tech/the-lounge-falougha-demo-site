# The Lounge demo site

Pitch website for The Lounge, a resto-bar in Falougha ([@thelounge.falougha](https://www.instagram.com/thelounge.falougha/)), built by [Pixelabs](https://pixelabs.tech). Ordering goes through [jeetak](https://jeetaklb.com).

Preview: https://dimgrey-buffalo-431530.hostingersite.com

- `index.html`, `assets/`, `.htaccess`, `site.webmanifest`: the static site (no build step needed to host it)
- `assets/js/menu.js`: the menu. It shows eight favourites for now; swap in the full menu when it arrives
- `assets/img/dish/`: menu photos (`NAME.webp`) and thumbnails (`NAME-t.webp`)
- `assets/js/site.js`: links (the jeetak store link is at the top), scroll effects, the menu and the day-into-night section
- `assets/js/scenes.js`: the drawn view from Falougha (it follows the real sun), the rope curtain, embers, the map and the stone wall
- `assets/js/table.js`: the illustrated mezze table
- `deploy/the-lounge-site.zip`: the same files, used for Hostinger's static archive deploy
- `source/`: the page template, the traced logo and `build.py`, which builds `index.html` and the zip (`python3 source/build.py https://your-domain/`). `source/tools/` holds the scripts used to trace the logo, cut the video clips and render the icons and link preview
