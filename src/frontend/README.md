# React + Vite

## Frontend tests

Install dependencies with `npm ci`. Install the Chromium browser once with `npm run e2e:install`, then run the Playwright suite with `npm run e2e`. The suite starts Vite and a disposable backend automatically, so it does not require a separately running backend or external AI credentials. Use `npm run e2e:ui` for interactive debugging.

The E2E suite starts a disposable FastAPI/SQLite backend and uses `AI_MOCK_MODE=true`; it does not use production data or external AI credentials.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
