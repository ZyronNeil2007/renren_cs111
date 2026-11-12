# Rivera CS111 - Life Craft: Memories Edition

A static, Minecraft-inspired personal memories website for the CS111 Introduction to Computing activity.

**Version:** 1.2.0

## Features

- Title screen and eight linked chapter pages.
- Responsive, pixel-art styling with animated navigation and keyboard chapter shortcuts.
- Photo galleries with a fullscreen lightbox; the Me & My Love gallery includes six photos.
- Food pages with recipes, interactive movie details, five karaoke tracks, and a joke collection.
- A playable mini-game on every page (see below); best scores are remembered in the browser.
- Built with HTML, CSS, and vanilla JavaScript. No build step or npm dependencies are required.
- Google Fonts are used when online; the site includes fallback fonts.

## Mini-games

| Page | Game | How to play |
|------|------|-------------|
| Title | Mark (title screen) | Arrow keys / A D walk, Space jumps, click the character; on phones: on-screen ◀ ▶ ▲ buttons and tap the ground |
| Welcome | Mine a Block | Click the block until it breaks; rarer ores take more hits |
| 1 Childhood Memories | Memory Match | Flip cards to match pairs (uses the chapter photos) |
| 2 Family & Relatives | Family Echo | Repeat the growing colour pattern (keys 1-4 also work) |
| 3 My Friends | Torch Grab | Click each lit torch before it burns out (30 s) |
| 4 Me & My Love | Catch the Hearts | Click hearts, avoid creepers (3 lives) |
| 5 My Favorite Food | Cook It Right | Put a recipe's steps in the correct order |
| 6 My Favorite Movie | Movie Quiz | 8 random questions about the five films |
| 7 My Song | Beat Tapper | Tap when the marker is in the green zone |
| 8 Joke Time | Tic-Tac-Toe vs. the Creeper | Win to unlock a bonus joke |

Games live in `js/games.js` and use the "MINI GAMES" and "GAME ADDITIONS" sections of `css/style.css`. Each page has a `<section class="panel game" data-game="...">`; sound can be switched off with the Sound button, and games respect reduced-motion settings.

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
- `js/` - navigation, transitions, lightbox, page interactions, title-screen character (`hero.js`), and mini-games (`games.js`)
- `img/` - photos, movie cover art, and karaoke audio
- `assets/fonts/` - licensed font files and their license notices
- `videos/` - optional movie clip files; the pages show a note when a clip is absent

Keep the relative folder layout intact when deploying to a static web host. Karaoke tracks are included under `img/My Song/`; optional movie clips are not included.

## Attribution

Prepared for Mark Lawrence M. Rivera's CS111 Introduction to Computing project.
