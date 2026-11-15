# Rivera CS111 – Life Craft: Memories Edition

[![Version](https://img.shields.io/badge/version-v1.3.0-5d9b3a.svg?style=flat-square)](https://github.com/ZyronNeil2007/renren_cs111)
[![Website](https://img.shields.io/badge/demo-renrencs111.vercel.app-1f6a2a.svg?style=flat-square)](https://renrencs111.vercel.app/)
[![Project Type](https://img.shields.io/badge/type-Static%20Website-3b3b3b.svg?style=flat-square)](https://github.com/ZyronNeil2007/renren_cs111)
[![Technologies](https://img.shields.io/badge/tech-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-5fa0ff.svg?style=flat-square)](https://github.com/ZyronNeil2007/renren_cs111)

> An immersive, Minecraft-inspired personal memories website featuring layered biome scenery, interactive 3D skin models, custom pixel art, in-world mini-games, and authentic blocky nostalgia.

**Live Deployment:** [https://renrencs111.vercel.app/](https://renrencs111.vercel.app/)

**Current Version:** `v1.3.0`

---

## Table of Contents

- [About the Project](#about-the-project)
- [What's New in v1.3.0](#whats-new-in-v130)
- [Features](#features)
- [Biomes and Dimensions](#biomes-and-dimensions)
- [Mini-Games](#mini-games)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation and Local Development](#installation-and-local-development)
- [Accessibility and Performance](#accessibility-and-performance)
- [Credits and Attribution](#credits-and-attribution)
- [Changelog](#changelog)

---

## About the Project

**Life Craft: Memories Edition** is an interactive, multi-page static website created for the **CS111 (Introduction to Computing)** course. Developed for **Mark Lawrence M. Rivera**, the project serves as a personal digital archive documenting early childhood memories, cherished family bonds, friendships, special milestones, comfort foods, favorite movies, karaoke music tracks, and jokes.

Instead of presenting memories as a plain portfolio, the project reimagines the digital archive through a creative **Minecraft aesthetic**. Every page is realized as its own distinct in-game biome or dimension—complete with parallax scenery, atmospheric pixel particles, interactive in-world objects, and an authentic 3D blocky character.

---

## What's New in v1.3.0

The `v1.3.0` release introduces a complete environmental and visual overhaul, transforming flat card layouts into an expansive, living Minecraft world:

- **Individual Minecraft Biomes & Dimensions:** Every chapter now exists in an authentic Minecraft environment (Plains, Cherry Grove, Lush Caves, Jungle, Warm Ocean, Badlands, The End, Soul Sand Valley, and Mushroom Fields).
- **Layered Parallax Scenery Engine:** A dynamic scenery system (`css/scene.css`, `js/scene.js`) featuring independent background layers (sky, canopy/ceiling, far mountains, mid-ground foliage, and foreground terrain) driven by smooth requestAnimationFrame scrolling and pointer parallax.
- **Atmospheric Particle Generator:** Living environmental effects per biome—including drifting cherry petals, glowing cave spores, falling jungle leaves, rising ocean bubbles with swimming fish, badlands dust devils, End void sparks, and floating Nether embers.
- **In-World Decorations & Objects:** Content is embedded into Minecraft objects (`css/world-objects.css`) such as oak item frames with 3D tilt, canopy rope bridges, camp chests, smelting furnaces, Nether jukeboxes, and crafting tables.
- **Teleport-Style Page Transitions:** Destination-themed teleport sequences (`js/transition.js`) featuring biome color washes, particle explosions, directional wipes, and in-game travel banners.
- **True 3D Skin Hero Character:** An interactive CSS 3D player model (`js/hero.js`) rendered from Mark's real 64x64 Minecraft skin (`skins/mark.png`), featuring limb swinging, jumping physics, waving, randomized dialogue bubbles, and a "renren" player nametag.
- **Mobile Touch D-Pad:** Full on-screen touch controls (◀, ▶, ▲) with multi-touch support for handheld devices.
- **Local Pixel Typography:** Bundled authentic Minecraft font (`assets/fonts/minecraft.woff2`) for consistent pixel-art presentation across all devices without external font dependencies.
- **Mobile & Framing Optimizations:** Responsive title screen scaling, safe-area inset handling for notched phones, and portrait-preserving photo framing (`object-position: top center`).

---

## Features

### Navigation and User Experience
- **Interactive Title Screen:** Animated sky, drifting pixel clouds, interactive 3D character, randomized splash text, and quick-start actions.
- **Central Plains Hub:** Minecraft item-frame chapter block cards with 3D perspective tilt and dynamic "look toward a biome" diorama preview.
- **Keyboard Shortcuts:** Press `Enter` to start on the title screen; press keys `1` through `8` anywhere on the hub to instantly teleport to chapters.
- **Teleport Transitions:** Smooth, biome-themed transition overlays with custom particle bursts and destination labels.

### Minecraft-Inspired Visual Design
- **Authentic Pixel Art:** Crisp SVG vector artwork (`shape-rendering="crispEdges"`) across biomes, particles, pixel icons, and UI borders.
- **Texture Gradients:** 64x64 pixelated textures for dirt, cobblestone, oak planks, and grass.
- **In-Game Name Tags:** Translucent player name tags styled after Minecraft's multiplayer HUD.
- **Reading Plates:** High-contrast textured parchment and dark stone panels designed for readability (contrast ratio ≥ 4.5:1).

### Photo Galleries
- **Framed Memories:** Photo cards styled with wooden frames, corner pegs, and drop shadows.
- **Portrait Preservation:** `object-position: top center` ensures faces and heads remain fully visible in 4:3 cropped containers.
- **Fullscreen Lightbox:** Zoom into any memory photo with caption displays, keyboard escape handling, and backdrop dismissal.

### Interactive Content
- **Recipe Cards:** Expandable cooking instructions with ingredient checklists and secret chef tips.
- **Interactive Film Cards:** Film selector with synopsis, trivia tabs, and embedded HTML5 video players.
- **Jukebox & Karaoke Player:** Interactive music player featuring animated spinning vinyl discs, audio level visualizers, and playback scrubbers.
- **Interactive Joke Book:** Click-to-reveal punchline mechanics with retro pop-in animations.

### Mini-Games
- Nine custom, playable mini-games integrated across every page with persistent high scores saved via `localStorage`.

### Responsive Design and Accessibility
- **Full Mobile Support:** Dedicated touch D-pad, tap-to-walk ground interaction, responsive button sizing, and safe-area padding.
- **Reduced-Motion Support:** Full `@media (prefers-reduced-motion: reduce)` compliance that disables particles, transforms, and transitions.
- **Keyboard & Screen-Reader Accessible:** Visible high-contrast focus rings (`#ffff55`), skip-to-content links, semantic HTML5 landmarks, and ARIA labels.

---

## Biomes and Dimensions

| # | Page | Destination | Biome / Dimension | Atmosphere & Environmental Features |
|---|------|-------------|-------------------|--------------------------------------|
| — | `index.html` | Title Screen | **The Overworld** | Blue skies, drifting pixel clouds, grassy terrain, 3D character |
| 0 | `pages/welcome.html` | Chapter Hub | **The Plains** | Rolling green pastures, wooden signposts, live diorama preview |
| 1 | `pages/childhood_memories.html` | Childhood Memories | **Cherry Grove** | Pastel pink skies, falling cherry blossoms, cherry wood frames |
| 2 | `pages/family_relatives.html` | My Family & Relatives | **Lush Caves** | Mossy cavern ceilings, glowing spore particles, campfires & lanterns |
| 3 | `pages/my_friends.html` | My Friends | **The Jungle** | Deep jungle canopy, drifting vine leaves, suspension rope bridge |
| 4 | `pages/me_and_my_love.html` | Me & My Love | **Warm Ocean** | Turquoise water depths, floating air bubbles, swimming tropical fish |
| 5 | `pages/my_favorite_food.html` | My Favorite Food | **The Badlands** | Terracotta mesa strata, blowing desert dust, camp cooking furnace |
| 6 | `pages/my_favorite_movie.html` | My Favorite Movie | **The End** | Obsidian void sky, floating end stone isles, sparkling void motes |
| 7 | `pages/my_song.html` | My Song | **Soul Sand Valley** | Eerie blue soul sand, rising soul embers, falling ash, Nether jukebox |
| 8 | `pages/joke_time.html` | Joke Time | **Mushroom Fields** | Giant red mushrooms, mycelium spores, crafting table workstation |

---

## Mini-Games

Each page features a built-in mini-game created in `js/games.js`. High scores are automatically tracked in the browser's `localStorage`.

| Page | Game Name | Objective & Mechanics | Controls |
|------|-----------|------------------------|----------|
| **Title Screen** | *Mark the Adventurer* | Explore the title screen, jump, wave, and trigger speech dialogues. | Arrow keys / `A` `D` walk, `Space` / `W` jump, click Mark; Mobile: on-screen ◀ ▶ ▲ pad |
| **Welcome Hub** | *Mine a Block* | Break blocks through multiple stages to mine rare ores from stone to netherite. | Click / tap block repeatedly |
| **1 Childhood Memories** | *Memory Match* | Flip cards to find matching pairs of childhood photos in the fewest moves. | Click / tap cards to reveal |
| **2 Family & Relatives** | *Family Echo* | Simon-style pattern recall. Watch and repeat the growing 4-color sequence. | Click pads or press keys `1`–`4` |
| **3 My Friends** | *Torch Grab* | Click lit redstone and wood torches before they burn out within a 30-second timer. | Click / tap illuminated holes |
| **4 Me & My Love** | *Catch the Hearts* | Catch falling hearts to score points while dodging dangerous creeping mobs (3 lives). | Click / tap falling items |
| **5 My Favorite Food** | *Cook It Right* | Puzzle game: sequence the steps of traditional Filipino recipes in the correct order. | Click / tap recipe action steps |
| **6 My Favorite Movie** | *Movie Quiz* | Trivia challenge: answer 8 randomized multiple-choice questions about featured films. | Click / tap choice options |
| **7 My Song** | *Beat Tapper* | Rhythm precision game: tap the beat button when the moving marker enters the green hit zone. | Spacebar or tap "TAP" button |
| **8 Joke Time** | *Tic-Tac-Toe vs. Creeper* | Classic 3x3 strategy match against Creeper AI. Win a round to unlock bonus jokes. | Click / tap grid cells |

---

## Technology Stack

- **Markup:** Pure Semantic HTML5 (`<header>`, `<main>`, `<section>`, `<nav>`, `<figure>`, `<figcaption>`, `<audio>`, `<video>`)
- **Styling:** Modern Vanilla CSS3
  - Custom Properties (CSS variables for biome theming)
  - CSS 3D Transforms (`perspective`, `transform-style: preserve-3d`)
  - CSS Grid and Flexbox layouts
  - CSS Masks for crisp vector pixel icons
  - CSS animations with hardware acceleration (`transform`, `opacity`)
- **Scripting:** Pure Vanilla JavaScript (ES6+, zero dependencies, zero build step)
  - `requestAnimationFrame` render loops
  - Pointer Events API with multi-touch pointer capture
  - HTML5 Web Storage API (`localStorage` score persistence)
  - IntersectionObserver API for performance management
- **Typography:** Local bundled Web Open Font Format (`assets/fonts/minecraft.woff2`)
- **Assets:** Scalable Vector Graphics (SVG with `shape-rendering="crispEdges"`), PNG skin textures, MP3 audio

---

## Project Structure

```text
renren_cs111/
├── index.html                   # Title screen with 3D skin hero & touch controls
├── README.md                    # Comprehensive documentation and changelog
├── project-structure.txt        # Legacy structure reference
├── .gitignore                   # Git ignore specifications
├── assets/
│   └── fonts/                   # Local fonts (minecraft.woff2, Barlow Condensed, Inter)
├── audio/
│   └── .gitkeep                 # Audio assets directory
├── css/
│   ├── style.css                # Global styles, UI controls, components, and media queries
│   ├── biomes.css               # Biome color palettes, ink variables, and gradients
│   ├── scene.css                # Parallax layer engine, particle systems, and sky styling
│   └── world-objects.css        # In-world decorations, item frames, and reading plates
├── img/
│   ├── biomes/                  # SVG pixel art backgrounds, layers, and particle sprites
│   ├── icon/                    # Pixel art icons and badges
│   ├── skin-sheet.png           # 2D Minecraft skin reference sheet
│   ├── Childhood Memories/      # Photo memories gallery assets
│   ├── My Family & Relatives/   # Family photo memories
│   ├── My Friends/              # Friends group photos
│   ├── Me & My Love/            # Milestone and personal photos
│   ├── My favorite Food/        # Food pictures and dish photos
│   ├── My favorite Movie/       # Movie cover posters
│   ├── My Song/                 # Karaoke audio tracks (.mp3) and liner notes
│   └── Joke Time/               # Joke markdown reference
├── js/
│   ├── hero.js                  # 3D CSS skin model, physics, animation, and touch controls
│   ├── home.js                  # Title splash quotes, keyboard shortcuts, and card tilt
│   ├── games.js                 # 9 playable interactive mini-games and score persistence
│   ├── scene.js                 # Parallax layer engine, particle generator, and diorama preview
│   ├── transition.js            # Biome-themed teleport page transitions and particle wash
│   ├── lightbox.js              # Fullscreen image viewer for photo galleries
│   └── pages.js                 # Subpage interactions
├── pages/
│   ├── welcome.html             # Plains hub: chapter item frames and diorama preview
│   ├── childhood_memories.html  # Ch. 1: Cherry Grove gallery & Memory Match
│   ├── family_relatives.html    # Ch. 2: Lush Caves gallery & Family Echo
│   ├── my_friends.html          # Ch. 3: Jungle canopy gallery & Torch Grab
│   ├── me_and_my_love.html      # Ch. 4: Warm Ocean memories & Catch the Hearts
│   ├── my_favorite_food.html    # Ch. 5: Badlands recipes & Cook It Right
│   ├── my_favorite_movie.html   # Ch. 6: The End cinema & Movie Quiz
│   ├── my_song.html             # Ch. 7: Soul Sand Valley jukebox & Beat Tapper
│   └── joke_time.html           # Ch. 8: Mushroom Fields joke book & Tic-Tac-Toe
├── skins/
│   ├── mark.png                 # Authentic 64x64 Minecraft player skin
│   └── mark_rivera_skin.png     # Full-resolution skin asset
└── videos/
    └── .gitkeep                 # Optional video clip directory
```

---

## Installation and Local Development

Because this project is built entirely with native web standards, **no build step, package manager, or external dependencies are required**.

### Running with a Local Static Server

1. **Clone the repository:**
   ```sh
   git clone https://github.com/ZyronNeil2007/renren_cs111.git
   cd renren_cs111
   ```

2. **Start a local HTTP server:**
   - Using Python 3:
     ```sh
     python -m http.server 8000
     ```
   - Using Node.js (npx):
     ```sh
     npx serve .
     ```
   - Using PHP:
     ```sh
     php -S localhost:8000
     ```

3. **Open the site in your browser:**
   Navigate to `http://localhost:8000/`.

*Note: Running through an HTTP server is recommended to avoid browser CORS restrictions when loading local font files, audio tracks, and SVG masks.*

---

## Accessibility and Performance

- **Reduced Motion Support:** Users with `prefers-reduced-motion: reduce` enabled receive zero ambient parallax, instant non-animated transitions, and static particles without visual disruption.
- **Performance Optimization:**
  - Ambient particle and parallax animation loops automatically pause when a tab is hidden or when a mini-game is in the viewport via `IntersectionObserver`.
  - Layer transforms use hardware-accelerated `translate3d()` and `transform` properties exclusively, avoiding layout recalculations.
  - Redundant DOM writes are skipped when values remain unchanged.
- **Keyboard Navigation:** Full tab order with visible outline focus indicators (`outline: 4px solid #ffff55`). Global keyboard shortcuts for game actions and page navigation.
- **Touch & Mobile Ergonomics:** Zero double-tap zoom delay (`touch-action: manipulation`), hold-to-walk touch pad buttons using pointer capture, and speech bubble viewport boundary clamping.

---

## Credits and Attribution

- **Creator & Subject:** Mark Lawrence M. Rivera
- **Academic Course:** CS111 — Introduction to Computing
- **Repository Maintainer:** [ZyronNeil2007](https://github.com/ZyronNeil2007)
- **Audio Tracks:** Karaoke and instrumental versions curated for personal academic demonstration.
- **Fonts:** Authentic Minecraft typeface bundled locally under `assets/fonts/`.
- **Media & Photos:** All personal photographs belong to Mark Lawrence M. Rivera and respective family/friends.

---

# Changelog

All notable changes to this project are documented in this section. The project adheres to [Semantic Versioning](https://semver.org/).

## [1.3.0] - 2026-11-15

### Added
- **Minecraft Biome & Dimension Environments:** Rebuilt every page as an authentic Minecraft environment (Plains hub, Cherry Grove, Lush Caves, Jungle, Warm Ocean, Badlands, The End, Soul Sand Valley, Mushroom Fields) with custom color themes in `css/biomes.css`.
- **Layered Parallax Scenery Engine (`css/scene.css`, `js/scene.js`):** Implemented multi-layered visual depth (sky, canopy/ceiling, far mountains, mid-ground foliage, foreground terrain) driven by scroll and pointer parallax.
- **Atmospheric Particle Generator:** Added ambient biome-specific particle effects (floating cherry petals, lush glow spores, jungle leaves, ocean bubbles and fish, badlands dust, End sparks, soul embers, and mushroom spores) with performance caps and reduced-motion support.
- **In-World Content Decorations (`css/world-objects.css`):** Replaced generic cards with in-world structures including oak item frames with 3D hover tilt, canopy rope bridges, camp chests, smelting furnaces, Nether jukebox, and crafting table.
- **Teleport Transitions (`js/transition.js`):** Biome-themed teleport sequence with custom wash gradients, SVG particles, direction wipes, and destination banners.
- **3D Minecraft Player Skin Model (`js/hero.js`, `skins/mark.png`):** True 3D CSS model textured from authentic 64x64 skin with limb walking physics, waving animations, jump dynamics, speech bubble quotes, and "renren" player nametag.
- **Mobile Touch Controls:** Added on-screen touch D-pad (◀, ▶, ▲) with multi-touch pointer capture for mobile devices.
- **Local Minecraft Typography:** Bundled `assets/fonts/minecraft.woff2` locally and applied site-wide with fallback stacks.
- **In-Game Name Tags:** Added authentic Minecraft translucent multiplayer nametag styling to player hero and top navigation bar.

### Changed
- Redesigned the welcome hub (`pages/welcome.html`) chapter blocks into Minecraft item frames featuring 3D perspective tilt and interactive diorama biome preview.
- Replaced flat title screen sprite with interactive 3D skinned character.
- Updated title screen splash quotes with randomized Minecraft easter eggs.
- Replaced online Google Font reliance with local bundled Minecraft pixel font.

### Improved
- **Mobile Responsiveness:** Scaled title screen Play button, logo clamp, and title layout padding for narrow mobile viewports (`max-width: 560px` and `max-height: 520px`).
- **Photo Gallery Framing:** Anchored photo gallery images to `object-position: top center` to ensure portrait photos do not crop faces or heads in 4:3 frame containers.
- **Safe-Area Insets:** Added `viewport-fit=cover` and safe-area inset padding on mobile touch controls.
- **Performance:** Motion loops automatically pause when the tab is hidden or when mini-games are in viewport via `IntersectionObserver`; DOM writes are skipped when state has not changed.
- **Accessibility:** Visible high-contrast focus rings (`#ffff55`), skip navigation link, keyboard shortcuts (`Enter` to start, `1`–`8` chapter jump), and full `prefers-reduced-motion` fallbacks.

### Fixed
- Fixed mobile index layout where desktop title button and spacing changes were not reflected on mobile screens.
- Fixed photo gallery portrait cropping that cut off subjects' heads in 4:3 frame containers.

---

## [1.2.0] - 2026-11-11

### Added
- **Interactive Mini-Games (`js/games.js`):** Introduced a custom playable mini-game on every page:
  - *Title Screen:* Mark (character controller with touch and keyboard controls)
  - *Welcome Hub:* Mine a Block (progressive ore mining from stone to netherite)
  - *1 Childhood Memories:* Memory Match (4x4 photo card flip pair matching)
  - *2 Family & Relatives:* Family Echo (Simon-style 4-color pattern sequence)
  - *3 My Friends:* Torch Grab (30-second reflex torch clicker)
  - *4 Me & My Love:* Catch the Hearts (heart collection reflex game with 3 lives and creeper obstacles)
  - *5 My Favorite Food:* Cook It Right (recipe step sequencing puzzle)
  - *6 My Favorite Movie:* Movie Quiz (8-question randomized trivia challenge)
  - *7 My Song:* Beat Tapper (rhythm timing bar challenge)
  - *8 Joke Time:* Tic-Tac-Toe vs. the Creeper (3x3 grid game unlocking a bonus joke)
- **High Score Persistence:** Integrated browser `localStorage` to save best scores across sessions.
- **Sound & Accessibility:** Retro sound toggle via Web Audio API with full support for reduced-motion preferences.

---

## [1.1.0] - 2026-11-11

### Added
- **Life Craft Memories Theme:** Complete overhaul from standard HTML into a Minecraft-inspired pixel-art visual theme.
- **Dynamic Navigation:** Added numeric keyboard shortcuts (`1`–`8`) for instant chapter navigation and `Enter` for title screen start.
- **Media Integration:** Added 5 karaoke audio tracks with custom player controls, interactive film synopses with video player support, and fullscreen photo lightbox.
- **Responsive Layout:** Responsive CSS Grid and Flexbox layouts, styled buttons, and pixel-art panel borders.

---

## [1.0.0] - 2026-10-24

### Added
- **Initial Website Release:** Multi-page personal memories website developed for CS111 (Introduction to Computing).
- **Eight Dedicated Chapter Pages:** Childhood Memories, Family & Relatives, My Friends, Me & My Love, Favorite Food, Favorite Movie, My Song, and Joke Time.
- **Pure Semantic HTML5:** Structured strictly with semantic markup (`<header>`, `<main>`, `<section>`, `<nav>`, `<figure>`, `<figcaption>`, `<table>`, `<audio>`, `<video>`) without external CSS or JavaScript frameworks.
