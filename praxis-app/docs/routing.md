# Routing

- **Expo Router**: The `/app` directory defines the root stack via `_layout.tsx` and the home entry at `index.tsx`. All screens wrapped in `ThemeProvider`.
- **React Navigation (legacy)**: Existing flows under `src/navigation` and `src/screens` rely on stack + bottom tabs. When migrating to Expo Router fully, mirror routes under `/app` using the same screen components.
- **Params**: Use strongly typed route params through `StackNavigationProp` generics (React Navigation) or generated Expo Router types when adding new routes.

Prefer absolute imports for navigation helpers and co-locate route-specific utilities next to screens.
