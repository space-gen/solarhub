# SolarHub – Citizen Science Solar Observatory

SolarHub is the citizen-science frontend for the [**aurora**](https://github.com/space-gen/aurora) backend platform. Users classify real solar observations from NASA's Solar Dynamics Observatory (SDO). Each annotation is submitted as a **GitHub Issue on `space-gen/aurora`**, where the nightly aurora pipeline picks it up, parses it, and feeds it into the ML training cycle.

Authentication is handled via **GitHub OAuth** — no passwords, no registration. Cloud annotation backup is provided by **[Puter.js](https://puter.com/)** — no separate backend required.

## 🌟 Features

- **Real NASA Data** — images sourced directly from SDO's public feed
- **Two-step classification** — task type then aurora-compatible sub-label
- **GitHub OAuth** — users sign in once; annotations are submitted under their GitHub identity
- **Issues on aurora** — every submission becomes a parseable GitHub Issue (`space-gen/aurora`)
- **Puter.js cloud** — annotations backed up to Puter KV; GitHub token is stored in the user’s Puter KV (best-effort)
- **Offline-first** — localStorage copy always written before any network call

---

## 🔐 GitHub OAuth App Setup

This site is deployed as a **static GitHub Pages** app. To avoid shipping a client secret (and to avoid any backend/worker), SolarHub uses GitHub OAuth **Device Flow**.

### Register at GitHub

Go to **[github.com/settings/applications/new](https://github.com/settings/applications/new)** and fill in:

| Field | Value |
|-------|-------|
| **Application name** | `SolarHub Citizen Science` |
| **Homepage URL** | Your deployed site URL (e.g. `https://space-gen.github.io/solarhub/`) |
| **Application description** | `Classify real solar observations from NASA's SDO and contribute to open space science.` |
| **Authorization callback URL** | Same as Homepage URL (required by the form; not used by device flow) |

After registering, copy the **Client ID**.

### Enable Device Flow

In your OAuth app settings, enable **Device Flow** (required by GitHub).

### Configure client ID + scopes

Edit `src/config/endpoints.ts`:

- `AUTH_CONFIG.clientId` → your GitHub OAuth **Client ID**
- `AUTH_CONFIG.scopes` → requested scopes (default: `public_repo`)

### How sign-in works (Device Flow)

```
User clicks "Sign in to Puter"
  → Puter auth (so we can use puter.net.fetch for CORS-bypassing calls)
User clicks "Connect GitHub"
  → POST https://github.com/login/device/code (client_id + scope)
  → UI shows user_code + opens https://github.com/login/device
  → app polls POST https://github.com/login/oauth/access_token (client_id + device_code)
  → token stored in user's Puter KV (best-effort) + localStorage cache
  → GET https://api.github.com/user (to display GitHub account)
  → Submit → POST https://api.github.com/repos/space-gen/aurora/issues
```

---

## ☁️ Puter.js Cloud

[Puter.js](https://docs.puter.com/) is loaded via CDN (`<script src="https://js.puter.com/v2/">`).  
It provides two things in this app:

| Feature | Use |
|---------|-----|
| `puter.net.fetch()` | Call GitHub OAuth Device Flow endpoints (which don't send CORS headers) |
| `puter.kv` | Cloud key-value store — backs up annotations and stores the user's GitHub access token |

Users are prompted to sign into Puter (free, one click) the first time an annotation is saved to cloud storage.  The prompt is non-blocking — the annotation is always saved locally first.

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Set your GitHub OAuth **Client ID** in `src/config/endpoints.ts` before running locally.

```bash
npm run build    # production build → dist/
npm run preview  # preview the build locally
```

---

## 🏗️ Architecture

```
src/
├── config/
│   └── endpoints.ts          – aurora repo URLs (space-gen/aurora)
├── types/
│   └── puter.d.ts            – TypeScript ambient declarations for window.puter
├── services/
│   ├── githubAuthService.ts  – GitHub OAuth Device Flow (client-id only) via puter.net.fetch
│   ├── annotationService.ts  – Issue creation (aurora format) + Puter KV backup
│   └── taskService.ts        – Task fetching with localStorage cache + mock fallback
├── hooks/
│   ├── useGitHubAuth.ts      – OAuth callback detection, token exchange, user state
│   └── useTasks.ts           – Task fetch, navigation, progress tracking
├── components/
│   ├── NavigationBar.tsx     – Nav with Sign-in / avatar / logout
│   ├── AnnotationPanel.tsx   – Two-step form: task type → sub-label → submit
│   ├── TaskViewer.tsx        – Solar image viewer with ML prediction panel
│   ├── PointsDisplay.tsx     – Animated points badge
│   └── LoadingScreen.tsx     – Full-screen loading overlay
└── pages/
    ├── Home.tsx              – Hero landing page
    └── Classify.tsx          – Classification workflow
```

### Annotation Issue Format

Issues are created on `space-gen/aurora` with the `annotation` label.  
The body uses `### Heading` sections parsed by aurora's `parse_issue_annotation.py`:

```markdown
### Image URL
https://sdo.gsfc.nasa.gov/…

### Task Type
sunspot

### Record ID
sdo-2024-0001

### Serial Number
1

### Your Label
active_region

### Pixel Coordinates (optional)
_No response_

### Notes (optional)
Large sunspot group near the equator.
```

---

## 🌐 Deployment

### GitHub Pages

This is a fully static deployment — no runtime secrets are required for GitHub auth (Device Flow uses **client_id only**).

```yaml
# .github/workflows/deploy.yml
name: Deploy
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

### Render Static Site

1. Connect your repo in the Render dashboard.
2. Build command: `npm install && npm run build`
3. Publish directory: `dist`

---

## 📦 Tech Stack

| Concern | Library |
|---------|---------|
| Framework | React 18 |
| Language | TypeScript 5 (strict) |
| Build | Vite 5 |
| Routing | React Router v6 (HashRouter) |
| Animations | Framer Motion 11 |
| Styling | TailwindCSS 3 |
| Cloud | Puter.js (CDN) |
| Auth | GitHub OAuth 2.0 |

## 📄 License

SolarHub is open-source. Solar images are courtesy of NASA's SDO and are in the public domain.

