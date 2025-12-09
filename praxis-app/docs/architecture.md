# Project Praxis Architecture

- **App shell**: Expo Router drives entry points in `/app` with a shared `ThemeProvider` wrapping the stack layout.
- **Core domain**: Business logic and types live in `src/core`, including engine utilities (`src/core/engine`) and typed global stores (`src/core/store`).
- **Components**: Reusable UI sits in `src/components` and is theme-aware via `useTheme`.
- **Theme**: Defined in `src/theme` with colors, spacing, typography, and provider helpers.
- **Navigation**: Legacy React Navigation screens live under `src/screens` and compose flows for onboarding, workouts, and settings.
- **Utilities**: Shared helpers live in `src/utils` and align with the `@` import alias.

The project favors absolute imports (`@/…`) configured through `tsconfig.json` and `babel.config.js`. State is colocated under `src/core/store` to simplify selector usage and future persistence.
