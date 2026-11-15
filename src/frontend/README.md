# CareerConnect frontend

This React application uses [Vite+](https://viteplus.dev/) 1.6.0 as its
unified JavaScript toolchain. Vite+ provides the Vite development server and
build, Oxlint linting, Oxfmt formatting, and Vitest-compatible unit testing
through one pinned CLI. Node 24 is pinned in `.node-version` and npm 11.20.0
is recorded in `package.json`.

## Install and develop

From this directory, install the lockfile exactly with:

```sh
vp install --frozen-lockfile
```

Use these Vite+ commands during development:

```sh
vp dev                 # start the Vite development server
vp build               # create a production build
vp preview             # preview the production build
vp lint                # run Oxlint through Vite+
vp fmt                 # format with Oxfmt through Vite+
vp fmt --check         # verify formatting without writing files
vp test --run          # run unit tests (Vitest-compatible)
vp test watch          # run tests in watch mode
vp test --run --coverage
vp check               # format, lint, and type checks
```

The equivalent npm scripts are available for editors and existing automation
(`npm run build`, `npm run lint`, `npm test`, and so on); they delegate to the
same `vp` commands. `vp test --run` allows an empty test set while the base
application has no unit-test files, and runs all `*.test.*` and `*.spec.*`
files when they are present.

## TypeScript migration

Source files under `src/` are TypeScript or TSX and JavaScript loading is
disabled in `tsconfig.json`. Run `npm run typecheck` (or `vp check`) for the
strict compiler pass. API models, clients, page components, shared components,
utilities, and tests use explicit TypeScript types with `noImplicitAny` and
`strictNullChecks` enabled.

## Browser E2E compatibility

Playwright browser tests remain a separate tool because Vite+ does not replace
the Playwright runner. If the Playwright suite is enabled for a checkout,
install its browser with `vp exec playwright install --with-deps chromium` and
run it with `vp exec playwright test`. The Vite+ build, lint, format, and unit
test commands do not install or invoke Playwright.
