# SolarHub – Citizen Science Solar Observatory

SolarHub is the citizen-science frontend for the [**aurora**](https://github.com/space-gen/aurora) backend platform. Users classify real solar observations from NASA's Solar Dynamics Observatory (SDO). Each annotation is submitted as a **GitHub Issue on `space-gen/aurora`**, where the nightly aurora pipeline picks it up, parses it, and feeds it into the ML training cycle.

Authentication is handled via **GitHub OAuth** — no passwords, no registration. Cloud annotation backup is provided by **[Puter.js](https://puter.com/)** — no separate backend required.

## 🌟 Features

- **Real NASA Data** — images sourced directly from SDO's public feed
- **Two-step classification** — task type then aurora-compatible sub-label
- **GitHub OAuth** — users sign in once; annotations are submitted under their GitHub identity
- **Issues on aurora** — every submission becomes a parseable GitHub Issue (`space-gen/aurora`)
- **Puter.js cloud** — annotations backed up to Puter KV; `puter.net.fetch()` proxies the OAuth token exchange (no backend server needed)
- **Offline-first** — localStorage copy always written before any network call

---

## 🔐 GitHub OAuth App Setup

You must register a **GitHub OAuth App** before deploying.

### Register at GitHub

Go to **[github.com/settings/applications/new](https://github.com/settings/applications/new)** and fill in:

| Field | Value |
|-------|-------|
| **Application name** | `SolarHub Citizen Science` |
| **Homepage URL** | Your deployed site URL (e.g. `https://space-gen.github.io/solarhub/`) |
| **Application description** | `Classify real solar observations from NASA's SDO and contribute to open space science.` |
| **Authorization callback URL** | Same as Homepage URL (e.g. `https://space-gen.github.io/solarhub/`) |

After registering, copy the **Client ID** and generate a **Client Secret**.

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

```env
VITE_GITHUB_CLIENT_ID=your_client_id_here
VITE_GITHUB_CLIENT_SECRET=your_client_secret_here

# Must exactly match the Authorization callback URL in the OAuth App settings
VITE_GITHUB_REDIRECT_URI=https://space-gen.github.io/solarhub/
```

> **Security note:** `VITE_GITHUB_CLIENT_SECRET` is bundled into the static JS.  
> For this app the OAuth scope is `public_repo` only, and the target repo is already public,  
> so the exposure risk is minimal and is the accepted trade-off for a backend-free static site.

### How the OAuth flow works (no backend needed)

```
User clicks "Sign in"
  → redirect to github.com/login/oauth/authorize
  → GitHub redirects back to REDIRECT_URI?code=…&state=…
  → puter.net.fetch() proxies POST to github.com/login/oauth/access_token
      (bypasses browser CORS restriction via Puter's servers)
  → token stored in localStorage
  → GET api.github.com/user (api.github.com has CORS — plain fetch works)
  → user avatar + login shown in navbar
  → Submit button → POST api.github.com/repos/space-gen/aurora/issues
```

---

## ☁️ Puter.js Cloud

[Puter.js](https://docs.puter.com/) is loaded via CDN (`<script src="https://js.puter.com/v2/">`).  
It provides two things in this app:

| Feature | Use |
|---------|-----|
| `puter.net.fetch()` | Proxy GitHub's OAuth token endpoint — bypasses CORS with zero backend |
| `puter.kv` | Cloud key-value store — backs up every annotation to the user's Puter account |

Users are prompted to sign into Puter (free, one click) the first time an annotation is saved to cloud storage.  The prompt is non-blocking — the annotation is always saved locally first.

---

## 🚀 Quick Start

```bash
cp .env.example .env.local   # fill in VITE_GITHUB_CLIENT_ID + SECRET
npm install
npm run dev
```

Open `http://localhost:5173/`. Remember to add `http://localhost:5173/` as an **Authorization callback URL** in your OAuth App settings (GitHub allows multiple).

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
│   ├── githubAuthService.ts  – OAuth redirect + puter.net.fetch token exchange
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
        env:
          VITE_GITHUB_CLIENT_ID:     ${{ secrets.VITE_GITHUB_CLIENT_ID }}
          VITE_GITHUB_CLIENT_SECRET: ${{ secrets.VITE_GITHUB_CLIENT_SECRET }}
          VITE_GITHUB_REDIRECT_URI:  https://space-gen.github.io/solarhub/
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Add `VITE_GITHUB_CLIENT_ID` and `VITE_GITHUB_CLIENT_SECRET` as **repository secrets** under Settings → Secrets → Actions.

### Render Static Site

1. Connect your repo in the Render dashboard.
2. Build command: `npm install && npm run build`
3. Publish directory: `dist`
4. Add environment variables in Render's dashboard:
   - `VITE_GITHUB_CLIENT_ID`
   - `VITE_GITHUB_CLIENT_SECRET`
   - `VITE_GITHUB_REDIRECT_URI` → your Render URL

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

