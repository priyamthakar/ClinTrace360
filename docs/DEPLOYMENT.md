# ClinTrace360 Deployment

ClinTrace360 is a static Vite React app and can be deployed to any static host.

## Local Build

```powershell
npm install
npm run build
```

The production output is written to `dist/`.

## Local Preview

```powershell
npm run preview -- --port 4173
```

## GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

Recommended setup:

1. Push the repository to GitHub.
2. In GitHub, open repository settings.
3. Go to **Pages**.
4. Set source to **GitHub Actions**.
5. Push to `main`.

The workflow installs dependencies, builds the Vite app, uploads `dist/`, and deploys it to Pages.

## Notes

- The Vite config uses `base: "./"` so the built app can work under a repository subpath.
- ClinicalTrials.gov lookup depends on browser network and CORS availability.
- The app is a portfolio/training workbench, not a validated clinical system.
