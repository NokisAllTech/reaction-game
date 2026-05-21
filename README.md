# Reaction Timer Game — Dark Focus

A clean, modern reaction timer game built as a static frontend portfolio project using **HTML**, **CSS**, **JavaScript**, and **Three.js**.

This project tests how quickly a user can react after a visual signal appears. It includes a polished dark UI, animated Three.js background visuals, reaction-time tracking, performance ratings, keyboard support, audio controls, and persistent stats using `localStorage`.

---

## Live Demo



```
https://nokisalltech.github.io/reaction-game/

```

---

## Project Purpose

This project was built as a frontend portfolio piece to demonstrate:

* Interactive UI logic
* JavaScript event handling
* Timer-based game mechanics
* DOM manipulation
* `localStorage` data persistence
* Responsive layout design
* Accessibility-conscious controls
* Three.js visual enhancement
* Clean, modern UI presentation

The goal is to show that a simple game can still be built with strong frontend fundamentals and a polished user experience.

---

## Features

### Core Game Features

* Start game button
* Random delay before the reaction signal appears
* “Wait...” state to prevent predictable timing
* “Click now!” active state
* Reaction time measured in milliseconds
* Too-soon detection
* Best time tracking
* Average reaction time
* Valid attempt counter
* Latest result display
* Performance rating system
* Reaction time guide
* Reset stats button

### Visual Features

* Dark Focus visual theme
* Clean glass-style game card
* Animated Three.js background
* Floating 3D geometric shapes
* Central animated Three.js torus knot
* Visual state changes based on gameplay:

  * Blue for idle/result
  * Yellow for waiting
  * Green for active
  * Red for too soon

### Accessibility Features

* Keyboard support using **Space** and **Enter**
* Focus-visible outlines
* Screen reader live status updates
* Reduced-motion support using `prefers-reduced-motion`
* Clear button labels
* High-contrast dark theme

### Audio Features

* Optional sound effects
* Optional background music
* Web Audio API generated tones
* Music and sound toggle buttons

---

## Tech Stack

* **HTML5**
* **CSS3**
* **Vanilla JavaScript**
* **Three.js**
* **Web Audio API**
* **LocalStorage**
* **Google Fonts**

  * Inter
  * JetBrains Mono

---

## How the Game Works

1. The user clicks **Start Game**.
2. The game enters a waiting state.
3. A random delay between 2 and 5 seconds starts.
4. When the delay ends, the game area turns green and displays **“Click now!”**.
5. The app records the exact time the signal appears using `performance.now()`.
6. When the user clicks, taps, or presses Space, the app records the reaction time.
7. The reaction time is calculated by subtracting the signal start time from the user action time.
8. The result is displayed in milliseconds.
9. Stats are updated and saved in `localStorage`.

---

## Game States

The project uses several game states to control UI behavior and logic:

| State      | Purpose                               |
| ---------- | ------------------------------------- |
| `idle`     | Default state before the game starts  |
| `waiting`  | User must wait for the signal         |
| `active`   | User should click as fast as possible |
| `result`   | Reaction time is shown                |
| `too-soon` | User clicked before the signal        |

---

## Reaction Time Categories

| Category       | Time      |
| -------------- | --------- |
| Lightning Fast | 0–180ms   |
| Sharp          | 181–250ms |
| Average        | 251–350ms |
| Needs Focus    | 351ms+    |

---

## Project Structure

This version is built as a single static HTML file.

```text
reaction-timer-game/
│
├── index.html
└── README.md
```

The `index.html` file includes:

* HTML structure
* CSS styling inside a `<style>` tag
* JavaScript logic inside a `<script type="module">` tag
* Three.js imported from a CDN

---

## Running the Project Locally

### Option 1: Open Directly

You can open `index.html` directly in your browser.

### Option 2: Use VS Code Live Server

Recommended option:

1. Open the project folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

This is recommended because the project uses a JavaScript module import for Three.js.

---

## Deployment

This project is static, so it can be deployed easily on:

* GitHub Pages
* Netlify
* Vercel

### GitHub Pages Deployment

1. Push the project to GitHub.
2. Go to the repository settings.
3. Open **Pages**.
4. Select the main branch.
5. Set the source folder to `/root`.
6. Save and wait for GitHub Pages to publish the site.

---

## Three.js Implementation

Three.js is used to add subtle animated 3D visuals behind the game interface.

The scene includes:

* A transparent WebGL canvas
* A perspective camera
* Ambient lighting
* Point lighting
* A central torus knot shape
* Floating wireframe geometric shapes

The central 3D shape changes color and animation speed based on the game state:

| Game State | Three.js Visual            |
| ---------- | -------------------------- |
| Idle       | Calm blue rotating shape   |
| Waiting    | Yellow/orange faster pulse |
| Active     | Green active glow          |
| Result     | Calm blue result state     |
| Too Soon   | Red flash/shake effect     |

---

## LocalStorage

The project saves player stats in the browser using `localStorage`.

Saved stats include:

* Best reaction time
* Total reaction time
* Valid attempts
* Latest reaction time

This allows the best score and stats to remain available even after refreshing the page.

---

## What I Learned

While building this project, I practiced:

* Building a complete static frontend project
* Managing UI state with vanilla JavaScript
* Handling timing logic accurately
* Detecting early user input
* Creating responsive layouts
* Using Three.js for visual polish
* Using the Web Audio API for generated sound
* Saving data with `localStorage`
* Improving accessibility for keyboard and screen reader users

---

## Future Improvements

Possible future upgrades:

* Add difficulty levels
* Add leaderboard support
* Add custom reaction challenges
* Add theme switching
* Add more advanced Three.js particle effects
* Add countdown mode
* Add mobile vibration feedback
* Split the code into separate `index.html`, `style.css`, and `script.js` files

---



## Portfolio Summary

**Reaction Timer Game — Dark Focus** is a static frontend project that combines interactive JavaScript logic with a polished UI and Three.js visuals. It demonstrates core frontend skills including DOM manipulation, event handling, timing logic, responsive design, accessibility, browser storage, and creative visual presentation.
