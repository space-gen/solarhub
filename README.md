# SolarHub — Frontend

> **Citizen-science web client for SolarHub.**
>
> The hosted web app is the primary user-facing interface for image classification and contributor workflows.

[![Pages](https://github.com/space-gen/solarhub/actions/workflows/deploy.yml/badge.svg)](https://space-gen.github.io/solarhub/)
[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-GitHub-ff69b4?style=for-the-badge&logo=github-sponsors&logoColor=white)](https://github.com/sponsors/soumyadipkarforma)
[![Patreon](https://img.shields.io/badge/Support-Patreon-FF424D?style=for-the-badge&logo=patreon&logoColor=white)](https://www.patreon.com/SoumyadipKarforma)
[![Buy Me a Coffee](https://img.shields.io/badge/Support-Buy%20Me%20a%20Coffee-orange?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://buymeacoffee.com/soumyadipkarforma)

## Overview

This repository contains the SolarHub frontend — a React + Vite TypeScript application that provides the classification UI, contributor tools, and documentation site. The hosted GitHub Pages site provides a ready-to-use experience for most contributors.

The frontend reads task manifests (JSONL) produced by the `aurora` backend and displays them for human annotation.

## Tech Stack

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)

## Repository Structure

```
solarhub/
├── public/                 # Static assets (images, favicon)
├── src/                    # Application source (React + TypeScript)
│   ├── components/         # UI components (AnnotationPanel, NavigationBar...)
│   ├── pages/              # Route-level pages (Home, Classify, About)
│   ├── services/           # API + integration services
│   └── styles/             # Global and component styles
├── docs/                   # Documentation used for GitHub Pages
├── package.json            # Node scripts + dependencies
└── vite.config.ts          # Vite configuration
```

## Quick start (developer)

Run locally for development:

```
git clone https://github.com/space-gen/solarhub.git
cd solarhub
npm install
npm run dev
```

Configure GitHub auth in `src/config/endpoints.ts` if you plan to test the Device Flow integration.

## Hosted site

The recommended place for most contributors is the hosted site:

https://space-gen.github.io/solarhub/

## Documentation

Documentation for the frontend (Pages + usage) is available on the hosted site under the Docs section.

## How to help

- Classify images on the hosted site
- Open issues describing bugs or features
- Send PRs with documentation, accessibility improvements, or bug fixes

## Funding

Support the project:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-ff69b4?style=for-the-badge&logo=github-sponsors&logoColor=white)](https://github.com/sponsors/soumyadipkarforma)
[![Patreon](https://img.shields.io/badge/Support-Patreon-FF424D?style=for-the-badge&logo=patreon&logoColor=white)](https://www.patreon.com/SoumyadipKarforma)
[![Buy Me a Coffee](https://img.shields.io/badge/Support-Buy%20Me%20a%20Coffee-orange?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://buymeacoffee.com/soumyadipkarforma)

## Contact

[![Twitter](https://img.shields.io/badge/Twitter-@soumyadip_k-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/soumyadip_k)
[![Instagram](https://img.shields.io/badge/Instagram-@soumyadip_karforma-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/soumyadip_karforma)
[![Email](https://img.shields.io/badge/Email-soumyadipkarforma02@gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:soumyadipkarforma02@gmail.com)

## License

SolarHub is open-source. See [LICENSE](LICENSE). Solar images are provided by NASA's SDO and are public domain.
