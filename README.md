# ☀️ SolarHub

**Citizen Science Solar Classification Platform**

SolarHub is a modern, open-source citizen-science web application that lets volunteers classify solar observation images — sunspots, solar flares, coronal holes, prominences, and filaments. Every classification helps train better AI models and advances space weather research.

---

## 🚀 Live Demo

Deployed at: **https://soumyadipkarforma.github.io/solarhub/**

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Animation | Framer Motion 11 |
| Styling | TailwindCSS 3 |
| Routing | React Router 6 |
| Hosting | GitHub Pages (static) |

---

## 📁 Project Structure

```
solarhub/
├── src/
│   ├── components/
│   │   ├── TaskViewer.tsx       # Solar image viewer with pagination
│   │   ├── AnnotationPanel.tsx  # Classification form + submission
│   │   ├── NavigationBar.tsx    # Responsive animated navigation
│   │   ├── PointsDisplay.tsx    # Animated points counter
│   │   └── LoadingScreen.tsx    # Full-screen animated loading state
│   ├── pages/
│   │   ├── Home.tsx             # Hero, stats, and feature overview
│   │   ├── Classify.tsx         # Main classification workflow
│   │   └── Leaderboard.tsx      # Contributor rankings
│   ├── services/
│   │   ├── taskService.ts       # Task fetching with caching
│   │   ├── annotationService.ts # GitHub Issues annotation submission
│   │   └── leaderboardService.ts # Leaderboard data fetching
│   ├── hooks/
│   │   ├── useTasks.ts          # Task state management hook
│   │   └── useLeaderboard.ts    # Leaderboard data hook
│   ├── animations/
│   │   ├── pageTransitions.ts   # Framer Motion page variants
│   │   └── hoverAnimations.ts   # Interactive hover animations
│   ├── utils/
│   │   ├── helpers.ts           # General utility functions
│   │   └── formatters.ts        # Display formatting utilities
│   ├── config/
│   │   └── endpoints.ts         # API endpoint configuration
│   └── styles/
│       └── globals.css          # Global styles + Tailwind base
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## 🏗️ Architecture

### Task Loading System

Tasks are fetched from the SolarHub data repository:

```
https://raw.githubusercontent.com/solarhub/solarhub-data/main/data/tasks.json
```

Each task has the structure:

```json
{
  "id": "task001",
  "url": "https://solar-data-source/image.jpg",
  "task_type": "sunspot",
  "ml_prediction": "sunspot",
  "confidence": 0.92,
  "points": 10
}
```

Tasks are cached in `sessionStorage` for 5 minutes to minimise network requests. When the remote endpoint is unreachable, the app automatically falls back to a built-in demo dataset so the UI remains fully functional.

### Annotation Workflow

1. User opens the **Classify** page.
2. `useTasks` hook fetches and caches the task list.
3. User views the solar image in `TaskViewer`.
4. User selects a label, adjusts confidence, and optionally adds comments in `AnnotationPanel`.
5. On submit, `annotationService.submitAnnotation()` posts a GitHub Issue to the `solarhub-data` repository with:
   - Task ID
   - User label
   - Confidence percentage
   - Comments
6. If no GitHub token is configured, the annotation is saved locally via `saveAnnotationLocally()`.

To enable GitHub Issue submission, store your personal access token:

```js
localStorage.setItem('solarhub_gh_token', 'github_pat_...')
```

---

## 🎨 Design System

- **Dark theme** by default — space-inspired colour palette.
- **Glassmorphism** cards with `backdrop-blur` and subtle borders.
- **Solar colour scale** (`solar-300` → `solar-700`) for interactive elements.
- **Framer Motion** for all transitions: page changes, hover lifts, stagger reveals, loading states.
- **TailwindCSS** utility classes with custom extensions.

---

## 🖥️ Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🚢 Deployment (GitHub Pages)

The app is configured with `base: '/solarhub/'` in `vite.config.ts`.

To deploy manually:

```bash
npm run build
# Deploy the `dist/` folder to the gh-pages branch
```

Or use the included GitHub Actions workflow (`.github/workflows/deploy.yml` — add as needed).

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Commit your changes: `git commit -m 'Add my feature'`.
4. Push and open a pull request.

---

## 📄 License

MIT © SolarHub Contributors