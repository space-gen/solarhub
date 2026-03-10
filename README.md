# SolarHub – Citizen Science Solar Observatory

SolarHub is a citizen-science web application that lets anyone help classify real solar observations from NASA's Solar Dynamics Observatory (SDO). Users view solar images, identify phenomena (sunspots, solar flares, coronal holes), and submit their annotations to an open, auditable dataset hosted on GitHub Issues.

## 🌟 Features

- **Real NASA Data** – images sourced directly from SDO's public feed
- **AI + Human Intelligence** – ML model makes an initial prediction; citizens validate and improve it
- **Open Science** – annotations stored as public GitHub Issues for transparency
- **Dark cosmic UI** – glassmorphism cards, solar-orange gradients, Framer Motion animations throughout
- **Offline-first** – annotations are always saved locally first; GitHub submission is a bonus

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 🏗️ Architecture

```
src/
├── config/
│   └── endpoints.ts        – API URLs (tasks JSON, GitHub Issues)
├── styles/
│   └── globals.css         – Tailwind directives + custom CSS (glassmorphism, star field, glow effects)
├── animations/
│   ├── pageTransitions.ts  – Framer Motion page/list variants
│   └── hoverAnimations.ts  – Button/card hover + glow variants
├── utils/
│   ├── helpers.ts          – Pure utility functions (cache keys, task type colours, etc.)
│   └── formatters.ts       – Display formatting (points, dates, confidence %)
├── services/
│   ├── taskService.ts      – Task fetching with localStorage TTL cache + mock fallback
│   └── annotationService.ts– Annotation submission (local + GitHub Issues)
├── hooks/
│   └── useTasks.ts         – React hook wrapping task fetch, navigation, progress tracking
├── components/
│   ├── NavigationBar.tsx   – Glassmorphism nav with animated sun logo
│   ├── LoadingScreen.tsx   – Full-screen animated solar loading overlay
│   ├── PointsDisplay.tsx   – Animated count-up points badge / card
│   ├── TaskViewer.tsx      – Solar image viewer with zoom lightbox + ML prediction panel
│   └── AnnotationPanel.tsx – Classification form (label, confidence slider, comments)
└── pages/
    ├── Home.tsx            – Hero page with animated sun, feature cards, how-it-works
    ├── Home.stardata.ts    – Deterministic star position data for the hero background
    └── Classify.tsx        – Classification workflow (task viewer + annotation form)
```

## 📦 Tech Stack

| Concern          | Library                      |
|------------------|------------------------------|
| Framework        | React 18 (concurrent mode)   |
| Language         | TypeScript 5 (strict)        |
| Build tool       | Vite 5                       |
| Routing          | React Router v6 (HashRouter) |
| Animations       | Framer Motion 11             |
| Styling          | TailwindCSS 3                |
| CSS pipeline     | PostCSS + Autoprefixer       |

## 🗂️ Task Loading System

1. On mount, `useTasks` calls `taskService.fetchTasks()`.
2. `fetchTasks` checks localStorage for a key like `solarhub:tasks:2024-01-15` (date-keyed = daily TTL).
3. On cache miss it fetches from `ENDPOINTS.TASKS` (the raw JSON URL in solarhub-data).
4. If the network request fails (offline, 404, etc.) it returns `MOCK_TASKS` — six real SDO image URLs — so the app is always usable.
5. The loaded tasks are passed back to `useTasks` which manages cursor position and completed-task tracking.

## ✏️ Annotation Workflow

1. User views the solar image in **TaskViewer** (shows ML prediction + confidence bar).
2. User selects a label in **AnnotationPanel** (sunspot / solar flare / coronal hole).
3. User sets confidence (0–100%) and optionally adds comments.
4. On "Submit":
   - The annotation is saved to `localStorage` immediately.
   - `annotationService.submitAnnotation()` attempts to POST a GitHub Issue to `solarhub-data`.
   - If no GitHub token is stored (`localStorage.solarhub_gh_token`), the local save is the record.
   - The parent awards +10 points and advances to the next task.

## 🌐 Deployment on GitHub Pages

The project is configured for GitHub Pages deployment out of the box:

- `vite.config.ts` sets `base: '/solarhub/'` so asset paths are correct.
- `HashRouter` is used so navigation works without server-side URL rewriting.

To deploy:

```bash
npm run build
# Then push the contents of dist/ to the gh-pages branch, or use a GitHub Actions workflow
```

A typical workflow file (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 📄 License

SolarHub is open-source.  Solar images are courtesy of NASA's Solar Dynamics Observatory and are in the public domain.
