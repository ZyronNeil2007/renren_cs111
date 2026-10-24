# Rivera CS111 — Personal Memories Website

A static, multi-page personal website for the CS111 Introduction to Computing activity. It uses HTML, CSS, and vanilla JavaScript, with no build step or external dependencies.

**Version:** 1.0.0

## Project structure

```text
renren_cs111/
├── .gitignore
├── Childhood.html.txt        # Empty pre-existing file, retained
├── index.html
├── README.md
├── pages/
│   ├── childhood_memories.html
│   ├── family_relatives.html
│   ├── me_and_my_love.html
│   ├── my_favorite_food.html
│   ├── my_favorite_movie.html
│   ├── my_friends.html
│   ├── my_song.html
│   ├── joke_time.html
│   └── welcome.html
├── css/
│   └── style.css
├── js/
│   ├── home.js
│   └── lightbox.js
├── img/
│   ├── Childhood Memories/
│   ├── Joke Time/
│   ├── Me & My Love/
│   ├── My Family & Relatives/
│   ├── My favorite Food/
│   ├── My favorite Movie/
│   ├── My Friends/
│   ├── My Song/
│   └── icon/
├── assets/
│   └── fonts/
├── audio/
├── videos/
```

The original content-folder names are retained under `img/`. Self-hosted fonts remain in `assets/fonts/` because they are font files, not images. `.gitkeep` markers retain the currently empty song/movie collections and media folders in Git.

## Run locally

Open `index.html` in a modern browser, or serve the project root with any static file server. For example, if Python is installed:

```sh
python -m http.server 8000
```

Then visit `http://localhost:8000/`.

## Features

- Eight linked content pages and a responsive homepage.
- Shared site styling in `css/style.css`.
- Homepage interactions in `js/home.js`.
- Image lightbox in `js/lightbox.js`.
- Native browser audio and video controls.

## Media note

Song and movie media files are not included in this release. The pages retain their native audio/video players and image references, but the missing tracks, posters, and trailers will not load until appropriately licensed files are added to `audio/`, `videos/`, or the corresponding `img/` folder.

## Deployment

Deploy the project root to any static web host. Keep the relative folder layout intact; there is no build or dependency-install step.

## Attribution

Prepared for Mark Lawrence M. Rivera's CS111 Introduction to Computing project.
