# ClinTrace360 Deployment

ClinTrace360 is a static Vite React app. The canonical live deployment is Vercel:

```text
https://clin-trace360.vercel.app/
```

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

## Vercel

Vercel auto-deploys the `main` branch from GitHub. Pushes to `main` should be treated as production deploys.

Recommended setup if reconnecting the project:

1. Import `https://github.com/priyamthakar/ClinTrace360` into Vercel.
2. Use the default Vite build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Keep the production domain pointed at `clin-trace360.vercel.app`.

## GitHub Actions

The repository includes CI at `.github/workflows/ci.yml`.

On push and pull request, CI runs:

```powershell
npm ci
npm test
npm run build
```

GitHub Actions does not deploy the app. Deployment is handled by Vercel.

## Notes

- The Vite config uses `base: "/"` for the Vercel root deployment.
- ClinicalTrials.gov lookup depends on browser network and CORS availability.
- The app is a portfolio/training workbench, not a validated clinical system.
