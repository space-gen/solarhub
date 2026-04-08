# SolarHub Frontend

SolarHub is a static React + TypeScript app hosted on GitHub Pages.

User progress is persisted serverlessly in a public GitHub repository:

- Repo name: `solarhub-data`
- Owner: the currently signed-in GitHub user
- File updated on each successful submit: `progress.json`
- Storage model: single-file JSON with one cursor per task type

## What gets stored in progress.json

`progress.json` is the source of truth for progress UI in the frontend:

- `schemaVersion`: currently `2`
- `points`: current total points
- `streak`: current daily streak
- `lastActiveDate`: latest UTC date with activity
- `lastCompletedIdsByType`: cursor map keyed by task type, where each value is the most recent completed task id for that type
- `updatedAt`: ISO timestamp of last write

The app does not store a global completion history. It only remembers the latest completed id for each task type, so progress for `sunspot` does not overwrite `magnetogram`, and vice versa.

## Why this works on GitHub Pages (serverless)

The app uses GitHub REST Contents API from the browser:

- `GET /repos/{owner}/{repo}/contents/progress.json`
- `PUT /repos/{owner}/{repo}/contents/progress.json`

The update request includes Base64 content and the previous file `sha` when updating, which is GitHub's required optimistic concurrency mechanism.

This is a good fit for static hosting because no app server is required for data persistence.

## Important OAuth/CORS note

GitHub OAuth Device Flow endpoints (`github.com/login/...`) are not directly browser-CORS-friendly. For production, use a small proxy for these two endpoints:

- `POST /login/device/code`
- `POST /login/oauth/access_token`

The project already supports proxy URLs via `src/config/endpoints.ts`.

## Local development

```bash
git clone https://github.com/space-gen/solarhub.git
cd solarhub
npm install
npm run dev
```

## Configuration

Edit `src/config/endpoints.ts`:

- `AUTH_CONFIG.clientId`: your GitHub OAuth App client ID
- `AUTH_CONFIG.scopes`: includes `public_repo` for writing `progress.json` in a public repo
- `AUTH_CONFIG.deviceCodeUrl`: your proxy route for device code exchange
- `AUTH_CONFIG.accessTokenUrl`: your proxy route for token exchange
- `AUTH_CONFIG.fallbackCorsProxyUrl`: optional best-effort fallback

## First sign-in behavior

When a user signs in:

1. App fetches authenticated user login.
2. App creates or reuses `{login}/solarhub-data` as a public repo.
3. App creates `progress.json` if missing.
4. App loads `progress.json` to initialize points/streak/completed IDs.

## Submit behavior

On successful submit:

1. UI advances immediately to the next task in the current JSONL file.
2. Progress object is updated in memory (`points`, `streak`, `lastCompletedIdsByType[taskType]`).
3. Updated `progress.json` is pushed to GitHub with Contents API `PUT`.
4. The next time that task type opens, the app resumes from the next available id after the stored cursor.

## Expected contents of user solarhub-data repo

The repo is intended to contain only one tracked data file:

- `progress.json`

Example document:

```json
{
	"schemaVersion": 2,
	"points": 17,
	"streak": 4,
	"lastActiveDate": "2026-04-08",
	"lastCompletedIdsByType": {
		"sunspot": "20260408_000123_Ic",
		"magnetogram": "20260408_000044_Mg"
	},
	"updatedAt": "2026-04-08T12:34:56.000Z"
}
```

Missing task types default to `null` in the app. New task types can be added without changing the storage shape.

## How task rotation works

SolarHub fetches the per-type `.jsonl` files from Aurora at runtime. For the selected type:

1. The app loads that task type's JSONL file.
2. The app loads `progress.json`.
3. The app finds the stored cursor for the selected type.
4. The UI starts at the first task after that cursor.
5. On submit, the app writes the submitted task id back into `lastCompletedIdsByType[taskType]`.

This means each type advances independently and the next item is always chosen from the current file order, not from a shared global completion list.

## Repository layout

The public `solarhub-data` repo should contain:

- `progress.json`

No annotations, no task history, and no SQLite database are required.

## Build

```bash
npm run build
```

## Hosted App

https://space-gen.github.io/solarhub/

## License

See `LICENSE`.
