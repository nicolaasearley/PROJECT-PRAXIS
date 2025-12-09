# Stores

- `useUserStore`: Manages the authenticated profile, onboarding preferences, strength numbers, readiness logs, and PR history. Preferences are always writable even before a profile exists, preventing onboarding dead-ends. Distance units are tracked alongside unit system for UI consistency.
- `usePlanStore`: Centralizes workout plans with helpers for setting full plans, looking up days by date/ID, and selecting the current workout. A `getTodayPlan` helper simplifies home and recovery screens.
- `useSessionStore`: Handles the active workout lifecycle, logging strength sets/conditioning rounds, and archiving sessions into history when finished.

Access stores via absolute imports (e.g., `import { useUserStore } from '@/core/store';`) and prefer selectors to avoid unnecessary rerenders.
