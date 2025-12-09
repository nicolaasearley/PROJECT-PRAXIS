# Theming

- The theme lives in `src/theme` with tokens for `colors`, `spacing`, `radius`, `shadows`, and `typography`.
- `ThemeProvider` wraps the app and exposes `useTheme` for runtime access. Always pull spacing and colors from the hook instead of hardcoding.
- Components should import `useTheme` from `@/theme` and avoid inline numeric spacing unless converted from tokens.
- Shadows and text styles are centralized; extend `typography.sizes` and `typography.fonts` before adding custom font weights.
