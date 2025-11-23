# Crazy Snake

Arcade-inspired snake that starts chill and ramps up fast. Built with [Paper.js](https://paperjs.org/) for buttery drawing and [Alpine.js](https://alpinejs.dev/) for the reactive HUD.

## Overview
- Square shaped arena snake that accelerates and smooths its path the longer you survive.
- Heads-up display tracks score, apples, elapsed time, best, and last run.
- Touch-friendly controls (left/right half screen) plus keyboard and pause/reset hotkeys.
- Local high score persistence using `localStorage`.

> [!TIP]
> Want to clear the high score? Remove the `crazy-snake-best` key from your browser storage.

## Features
- **Adaptive speed & turning**: Hold turns to tighten the curve while the base speed keeps climbing.
- **Self-collision detection**: Paper.js vector math trims the tail and ends the round on impact.
- **Responsive HUD**: Alpine.js keeps the overlay, stats, and prompts in sync with game state.
- **Mobile-ready input**: Pointer events translate taps and drags into steering with haptic-friendly targets.

## Controls
- `Space`: start / restart
- `←` / `→`: steer
- `P`: pause (while playing)
- `R`: return to intro screen
- Touch: tap/drag left or right half of the screen to turn

## Quick Start
1. Clone the repo: `git clone https://github.com/danielmroczek/crazy-snake.git`
2. Open the folder: `cd crazy-snake`
3. Serve the files (pick one):
   - `npx serve .`
   - `python -m http.server 4173`
   - Any static host (GitHub Pages, Vercel, etc.)
4. Visit the printed URL (or open `index.html` directly for local play). Press `Space` to begin.

> [!IMPORTANT]
> Paper.js requires a canvas context initialized from the same origin. Always use a local server for reliable asset loading and to avoid browser security prompts.

## Project Structure
```
├─ index.html     # Shell that wires Alpine.js HUD + Paper.js canvas
├─ app.js         # Game loop, controls, scoring, persistence helpers
├─ style.css      # Retro HUD + layout styling
└─ LICENSE
```

## Development Notes
- Paper.js is imported from CDN and initialized in `window.onload`; resize handling keeps the arena square across viewports.
- HUD state lives in `hudState` and broadcasts through `window.gameAPI` so the Alpine component stays framework-agnostic.
- Apples spawn away from borders and nudge snake length + score; smoothing (`path.smooth`) is applied each frame for the neon-look trail.

> [!WARNING]
> This project ships without a bundler. If you add modules or TypeScript, introduce a build step (Vite, Parcel, etc.) to keep the HTML lean.

Happy hacking and watch those corners! 🎮
