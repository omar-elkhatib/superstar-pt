# Adaptive Coach App

Starter scaffold for an adaptive physiotherapy + personal training app.

## Prerequisites

- Node.js 20+

## Local setup

```bash
npm install
npm run lint
npm test
npm start
```

## Scripts

- `npm start`: run app entrypoint
- `npm run dev`: run app in watch mode
- `npm test`: run tests
- `npm run test:watch`: run tests in watch mode
- `npm run lint`: syntax check source and tests

## Initial architecture

- `src/adaptivePlan.js`: plan adaptation logic based on pain/readiness data
- `src/index.js`: entrypoint sample usage
- `test/adaptivePlan.test.js`: tests for adaptation behavior
- `.github/workflows/ci.yml`: CI running lint + tests

## Create GitHub remote

After creating an empty GitHub repository, run:

```bash
git remote add origin <your-repo-url>
git branch -M main
git add .
git commit -m "Initial scaffold: adaptive coach app"
git push -u origin main
```

