⭐ Part 2 — Theme + Design System

The design system must be done EARLY so every component inherits brand rules.

Ask Cursor:

“Create /theme/colors.ts, /theme/spacing.ts, /theme/typography.ts, /theme/radius.ts, and /theme/shadows.ts using the Project Praxis design system.”

Paste the exact values we defined.

Then ask Cursor:

“Create a <ThemeProvider> component that injects these design tokens globally.”

⸻

⭐ Part 3 — Navigation Setup

Ask Cursor:

**“Create AppNavigator.tsx containing:
	•	NavigationContainer
	•	AuthStack (Onboarding)
	•	MainTabs (Home, Calendar, Start, Progress, Profile).
Use icons from react-native-vector-icons or Expo.”**

Make Cursor create only the skeleton navigation first.

⸻

⭐ Part 4 — Core Data Models (TypeScript)

Ask Cursor:

“Inside /core/types/index.ts, create all TypeScript interfaces described below.”

Paste the complete interface block I created in Phase 4.

This ensures:
	•	The app compiles
	•	All screens know the structure of workouts
	•	Cursor references correct shapes everywhere

⸻

⭐ Part 5 — Engine Stub Implementation

We DO NOT write the full logic yet—just the function signatures.

Ask Cursor:

“Create empty engine modules with exported functions using the signatures below. Do not implement logic yet, only the function signatures and comments.”

Paste:
	•	calculateReadiness
	•	generateInitialPlan
	•	adjustWorkoutForToday
	•	detectNewPRs
	•	estimate1RM

This ensures everything compiles before logic begins.

⸻

⭐ Part 6 — Zustand State Stores

Ask Cursor:

“Create /core/store/useUserStore.ts, /core/store/usePlanStore.ts, and /core/store/useSessionStore.ts using Zustand. Include setters and states from our data models.”

This gives Cursor structure before UI begins.

⸻

⭐ Part 7 — SCREENS: Create Empty Skeleton Components

We scaffold ALL screens before writing logic.

Ask Cursor:

“Create empty component files for each screen in /screens. Each screen should export a simple View with a Text placeholder. No logic yet.”

Example:
	•	HomeScreen
	•	WorkoutOverviewScreen
	•	WorkoutSessionScreen
	•	CalendarScreen
	•	ProgressScreen
	•	SettingsScreen
	•	All onboarding screens

This prevents Cursor from improvising structure later.

⸻

⭐ Part 8 — Build UI Components (Reusable)

Ask Cursor:

“Create reusable components: Card.tsx, PraxisButton.tsx, Chip.tsx, Spacer.tsx, IconButton.tsx. Use theme values.”

This allows UI screens to remain clean and consistent.

⸻

⭐ Part 9 — Build Onboarding Flow FIRST

Now you ask Cursor:

“Implement the onboarding screens one at a time in this order.”
	1.	SplashScreen
	2.	Welcome
	3.	Goal
	4.	Days per week
	5.	Equipment
	6.	Experience
	7.	Time
	8.	PR input
	9.	Generating plan
	10.	Return to Home

Each screen should:
	•	use Zustand to store selections
	•	use navigation to move forward
	•	pull from theme tokens
	•	reflect the UI spec we already wrote

YOU MUST give Cursor each screen one at a time.

⸻

⭐ Part 10 — Build Home Dashboard

Ask Cursor:

**“Using the design spec, implement HomeScreen.tsx with:
	•	Readiness card
	•	Today’s workout card
	•	Weekly consistency component
	•	PR highlights
	•	Start button
Pull real data from Zustand stores.”**

Cursor will need the exact layout—we already designed it.

⸻

⭐ Part 11 — Workout Overview + Session Mode

In this order:

Ask Cursor:

1. “Implement WorkoutOverviewScreen.tsx based on our block UI.”
2. “Implement WorkoutSessionScreen.tsx with strength logging UI.”
3. “Add rest timer component.”
4. “Add accessory logging component.”
5. “Add interval timer component.”
6. “Add end-of-session summary screen.”

This must be done step-by-step or Cursor will hallucinate.

⸻

⭐ Part 12 — Calendar

Ask Cursor:

“Build CalendarScreen.tsx with weekly dots and daily drawer.”

Keep it simple; monthly view can come after.

⸻

⭐ Part 13 — Progress

Ask Cursor:

“Implement simple Strength Progress UI with dummy graph first. Later we integrate real PR detection.”

Cursor should NOT implement real analytics yet — just the UI and placeholder charts.

⸻

⭐ Part 14 — Settings

Ask Cursor:

**“Implement SettingsScreen.tsx with:
	•	Profile block
	•	Training preferences list
	•	Equipment list
	•	Units toggle
	•	Notifications toggle
	•	Adaptive engine controls”**

Make each item open a separate modal screen.

⸻

⭐ Part 15 — Supabase Integration (Backend)

Ask Cursor:

“Setup Supabase client under /core/api/supabaseClient.ts.
Configure tables for: users, profiles, readiness, workout_sessions, pr_records.”

Then:

“Add functions to save session logs and load past sessions.”

Finally:

“Sync onboarding preferences to Supabase when onboarding completes.”

⸻

⭐ Part 16 — Adaptive Engine Integration

Now you tell Cursor to:

“Implement calculateReadiness, adjustWorkoutForToday, and detectNewPRs using the rules from our PRD + architecture.”

You must provide rules in plain English.

Cursor turns them into logic.

⸻

⭐ Part 17 — QA & Cleanup

Ask Cursor to:
	•	scan for unused imports
	•	apply consistent formatting
	•	validate navigation
	•	ensure all screens work with mock data
