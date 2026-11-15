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

## Runtime schemas

Zod schemas live in `src/api/schemas.ts`. Use them at external boundaries:
`apiRequest` requires a response schema for JSON payloads, and form components
parse user input before making API calls. Prefer `z.infer` or schema-compatible
domain types over unchecked casts. Add endpoint-specific schemas when response
shapes differ, and surface parse failures through the existing error UI.

## Frontend architecture

`App.tsx` owns authentication state and route composition. URL parsing lives in
`src/routes.ts`, where route variants are represented as a discriminated union
before pages receive them. Page components compose feature sections and keep
their markup close to the user flow; reusable cards and rows live beside them
in `components/` and expose callbacks instead of owning page navigation.

Async loading that needs cancellation or stale-response protection uses the
generic `useAsyncResource` hook in `src/hooks/`. Feature hooks such as
`useCandidateJobMetadata` combine related API requests while keeping transport
details in the API modules. New hooks should accept a loader and return an
explicit loading/success/error contract, and should never update state after an
abort or unmount.

API modules are grouped by feature under `src/api/`, while shared domain types
and schemas remain in `types.ts` and `schemas.ts`. Components should call those
feature APIs rather than issuing fetch requests directly. Preserve stable
accessibility labels and test selectors when extracting markup.

## Browser E2E compatibility

Playwright browser tests remain a separate tool because Vite+ does not replace
the Playwright runner. If the Playwright suite is enabled for a checkout,
install its browser with `vp exec playwright install --with-deps chromium` and
run it with `vp exec playwright test`. The Vite+ build, lint, format, and unit
test commands do not install or invoke Playwright.
