## SolarHub — by Soumyadip Karforma (SpaceGen)

Hi, I'm Soumyadip Karforma. I built SolarHub to open solar research to anyone curious enough to look.

SolarHub is the lightweight React frontend for the Aurora pipeline. Volunteers inspect real images from NASA's Solar Dynamics Observatory (SDO) and submit annotations that the Aurora backend ingests (annotations are submitted as GitHub Issues on `space-gen/aurora`). The aim is simple: make it easy to collect high-quality labels for scientific use while keeping everything transparent and reproducible.

What I changed recently
- Reorganized the classification UI for clearer guidance and inline label reference.
- Switched runtime task data to be loaded from the `data` branch (stable raw URLs).
- Improved OAuth device-flow handling and added smooth-scroll UX for guide links.

Quick start
-----------

Clone and run locally:

```bash
git clone https://github.com/space-gen/solarhub.git
cd solarhub
npm install
npm run dev
```

Before running locally set your GitHub OAuth `client_id` in `src/config/endpoints.ts`.

How it works (short)
--------------------

- The app loads per-task JSONL files from the Aurora repo (`space-gen/aurora`) and shows one task at a time.
- Users authenticate via GitHub Device Flow (client_id only) and submit annotations.
- Submissions become GitHub Issues on `space-gen/aurora` and are processed by Aurora's nightly pipeline.

Design goals (in my words)
--------------------------

- Transparent: all labels are public issues so researchers can audit or reuse data.
- Low friction: no account creation — sign in with GitHub and contribute immediately.
- Reproducible: data and processing live in GitHub so the training pipeline is auditable.

Auth and cloud backup
----------------------

We use GitHub OAuth Device Flow for sign-in. For CORS-sensitive exchanges we use a small proxy or Puter.js helpers when available. Annotations are backed up locally first; optional cloud backup uses Puter KV (best-effort).

Developer notes
---------------

- Main config: `src/config/endpoints.ts`
- Task fetcher: `src/services/auroraService.ts` (now points to raw `refs/heads/data` URLs)
- Annotation submission: `src/services/githubSyncService.ts` and `src/services/annotationService.ts`
- UI entrypoints: `src/pages/Home.tsx`, `src/pages/Classify.tsx`

Deploy
------

The project is a static Vite app. Deploy to GitHub Pages or any static host. CI example (GitHub Actions) builds `dist/` and publishes it.

Contributing
------------

I welcome issues and PRs. If you want to help, open an issue describing what you'd like to change and I’ll review. Good first tasks: improve docs, tidy UI copy, add tests.

Contact and support
-------------------

If you'd like to support the project or sponsor my work, email me at soumyadip@users.noreply.github.com or open an issue and I'll provide funding links.

License
-------

SolarHub is open-source. Solar images are provided by NASA's SDO and are in the public domain.

---

## Founder note — summary of recent updates

The site now includes a short founder message and funding/support links. Summary:

- SolarHub is an open-source citizen-science observatory for labeling NASA SDO images.
- Founder message encourages contributions and offers ways to support the project.
- Quick start and config steps (clone, npm install, run locally, set GitHub OAuth client ID) are provided.
- Contact and social links are included for the founder.

If you want the full founder text preserved as a separate file, see `README_new.md` in the repo history (removed to keep a single README). If you'd like that content merged in-line instead, tell me where to place it and I'll update the README accordingly.

