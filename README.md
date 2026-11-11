# Rivera CS111 - Life Craft: Memories Edition

A static, Minecraft-inspired personal memories website for the CS111 Introduction to Computing activity.

**Version:** 1.1.0

## Features

- Title screen and eight linked chapter pages.
- Responsive, pixel-art styling with animated navigation and keyboard chapter shortcuts.
- Photo galleries with a fullscreen lightbox; the Me & My Love gallery includes six photos.
- Food pages with recipes, interactive movie details, five karaoke tracks, and a joke collection.
- Built with HTML, CSS, and vanilla JavaScript. No build step or npm dependencies are required.
- Google Fonts are used when online; the site includes fallback fonts.

## Run locally

Open `index.html` in a modern browser, or serve the project root with a static file server. For example:

```sh
python -m http.server 8000
```

Then visit `http://localhost:8000/`.

## Project layout

- `index.html` - title screen
- `pages/` - welcome screen and eight chapters
- `css/style.css` - shared styling
- `js/` - navigation, transitions, lightbox, and page interactions
- `img/` - photos, movie cover art, and karaoke audio
- `assets/fonts/` - licensed font files and their license notices
- `videos/` - optional movie clip files; the pages show a note when a clip is absent

Keep the relative folder layout intact when deploying to a static web host. Karaoke tracks are included under `img/My Song/`; optional movie clips are not included.

## Attribution

Prepared for Mark Lawrence M. Rivera's CS111 Introduction to Computing project.
