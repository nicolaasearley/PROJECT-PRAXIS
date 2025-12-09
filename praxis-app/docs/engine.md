# Training Engine

- **Readiness**: `calculateReadiness` blends sleep, energy, soreness, stress, and time availability into a 0–100 score with clamped weightings.
- **Planning**: `generateInitialPlan` builds a small cycle based on training days, time availability, and goal. Plans are deterministic for predictable testing.
- **Adjustment**: `adjustWorkoutForToday` scales intensity/volume using readiness and adaptation mode, while preserving structure.
- **Progression**: `estimate1RM` combines Epley and Brzycki formulas with RPE modifiers; `detectNewPRs` compares completed sets to prior PRs.

Future enhancements: dynamic exercise libraries, equipment-aware swaps, and caching warm-up templates.
