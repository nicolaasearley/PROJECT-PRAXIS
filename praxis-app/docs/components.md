# Components

- **PraxisButton**: Primary CTA button supporting variant, size, loading, and icon props. Uses theme spacing and typography.
- **Card, IconButton, Chip, Spacer**: Found in `src/components` for layout and controls; ensure future additions follow PascalCase naming.

Component guidelines:
- Always consume `useTheme` for colors/spacing.
- Prefer memoization for heavy lists or expensive render paths.
- Keep props typed explicitly; avoid `any`.
