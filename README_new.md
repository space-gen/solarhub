Hi, I'm Soumyadip Karforma, founder of SolarHub.

SolarHub is a small, open-source citizen-science observatory I built to make solar research accessible. It lets volunteers inspect real images from NASA's Solar Dynamics Observatory (SDO) and submit annotations that feed into the aurora project’s training pipeline. Annotations are created as GitHub issues so the data is transparent and reusable by researchers.

Why I built this

I believe accessible tools and community effort accelerate science. SolarHub lowers the barrier to contributing useful labels to solar researchers while teaching contributors about real space data.

Quick start

1. Clone the repo

   git clone https://github.com/space-gen/solarhub.git
   cd solarhub

2. Install and run locally

   npm install
   npm run dev

3. Configure GitHub OAuth

Edit src/config/endpoints.ts and set AUTH_CONFIG.clientId to your GitHub OAuth Client ID. See the original project docs for Device Flow details.

Support / Funding

[![Support my work](/funding)](/funding)

If you'd rather reach me directly: <mailto:soumyadip@users.noreply.github.com?subject=Support%20SolarHub>

Support my work — your contributions pay for hosting, data access, and my time building and maintaining this project.

Founder

I'm Soumyadip Karforma. If you'd like to include my photo on the site, add a PNG named "soumyadipkarforma.png" to public/images/ so the file path is:

  public/images/soumyadipkarforma.png

Recommended: a square PNG (e.g. 400×400). You can upload it via the GitHub web UI (Add file → Upload files) or place it locally and commit:

  mkdir -p public/images && cp /path/to/soumyadipkarforma.png public/images/ && git add public/images/soumyadipkarforma.png && git commit -m "chore: add founder image"

How to contribute

I welcome issues and pull requests. Good first contributions:

- Report issues or ideas
- Fix typos and docs
- Improve tests or add examples

Please follow the repo's TypeScript and formatting conventions. Open a PR and describe the change — I’ll review and merge.

Social

- GitHub: https://github.com/soumyadipkarforma
- LinkedIn: https://www.linkedin.com/in/soumyadipkarforma
- Twitter: https://twitter.com/soumyadipkarforma

License

SolarHub is open-source. Solar images are provided by NASA's SDO and are public domain.

