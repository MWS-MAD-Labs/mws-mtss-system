# Engineering Mode Guardrails

This project now has executable guardrails for maintainability and frontend performance.

## Commands

- `npm run engineering:report`
  - Prints file-size budget status by category.
  - Prints continuous-event risk files (scroll/resize/mousemove without throttle/debounce).
- `npm run engineering:check`
  - Same as report, exits non-zero if any file exceeds its budget.
- `npm run engineering:sync-overrides`
  - Regenerates baseline overrides at `scripts/engineering-size-overrides.json`.
- `npm run perf:report`
  - Reads built files from `dist/assets` and reports raw/gzip JS/CSS sizes.
- `npm run perf:check`
  - Same as report, exits non-zero if chunk/total budgets are exceeded.

## Size Budgets

- `smart_component` (`src/pages`, `src/store/slices`): `200`
- `pure_ui_component` (`src/components`): `150`
- `custom_hook` (`src/hooks` and `use*.js/jsx`): `150`
- `util_service` (`src/services`, `src/utils`): `260`
- `default`: `220`

Existing technical debt is tracked in `scripts/engineering-size-overrides.json`.
The check fails only when files exceed either:

- their policy budget, or
- their baseline override.

## Bundle Budgets (default)

- `PERF_MAX_CHUNK_GZIP_KB=180`
- `PERF_MAX_TOTAL_JS_GZIP_KB=900`

Adjust via environment variables in CI as needed.
