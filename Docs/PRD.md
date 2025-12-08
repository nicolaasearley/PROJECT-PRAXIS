⭐ PROJECT PRAXIS — PRODUCT REQUIREMENTS DOCUMENT (PRD v1.0)

⸻

1. PRODUCT OVERVIEW

Product Name: Project Praxis

Platform: iOS + Android (React Native + Expo)

Target User: Hybrid athletes (strength + conditioning mix)

Value Proposition:

Project Praxis is an adaptive training engine that personalizes daily workouts based on athlete goals, readiness, performance trends, and available equipment.

Primary Objectives
	•	Provide personalized hybrid training programs
	•	Adapt daily workouts based on readiness and performance
	•	Track strength, conditioning, and load progression
	•	Deliver a premium, modern, athletic user experience

⸻

⭐ 2. CORE APP MODULES

The app consists of the following modules:
	1.	Onboarding
	2.	Home Dashboard
	3.	Workout Overview
	4.	Workout Session Mode
	5.	Calendar System
	6.	Progress Tracking
	7.	Profile & Settings
	8.	Adaptive Engine (backend logic)
	9.	Local + Cloud Data Sync (future)
	10.	Notifications

Each module is broken down below.

⸻

⭐ 3. USER FLOWS & FUNCTIONAL REQUIREMENTS

⸻

🔥 3.1 — ONBOARDING FLOW

Purpose:

Collect athlete preferences, experience, and training constraints to generate a personalized plan.

Steps:
	1.	Splash Screen
	•	Display logo + tagline
	•	Auto-advance
	2.	Welcome Screen
	•	CTA: Continue
	3.	Goal Selection
	•	Options: Strength / Conditioning / Hybrid / General
	•	Single select
	4.	Training Days
	•	Options: 3–7 days/week
	5.	Equipment Selection
	•	Multi-select list
	•	Must select at least one item
	6.	Experience Level
	•	Beginner / Intermediate / Advanced
	7.	Time Availability
	•	Short / Standard / Full
	8.	Optional PR Input
	•	Deadlift, squat, bench (optional)
	9.	Generating Plan Screen
	•	Animated loading state
	•	Generates initial week structure
	10.	Launch Home Dashboard

⸻

🔥 3.2 — HOME DASHBOARD

Functional Requirements:
	•	Display daily readiness score
	•	Show Today’s Workout (adaptive)
	•	Show weekly consistency badges
	•	Show PR highlights
	•	Provide Start Workout CTA
	•	Allow navigation via bottom tab bar

Adaptive Logic:

If readiness < threshold (e.g., 60), modify:
	•	strength intensity
	•	conditioning load
	•	accessory volume

⸻

🔥 3.3 — WORKOUT OVERVIEW

Functional Requirements:
	•	Display workout blocks:
	•	Warmup
	•	Strength
	•	Accessory
	•	Conditioning
	•	Cooldown
	•	Within each block:
	•	Exercises
	•	Sets/reps
	•	RPE targets
	•	Rest intervals
	•	Estimated duration
	•	CTA: Start Session
	•	User can view or edit load
	•	User can expand block details
	•	Adaptive notes appear when plan is modified

⸻

🔥 3.4 — WORKOUT SESSION MODE

Strength Sets:
	•	Input fields:
	•	weight
	•	reps
	•	RPE
	•	Auto-launch rest timer
	•	Auto-advance to next set

Accessory Sets:
	•	One-tap completion
	•	Optional rep editing

Conditioning:
	•	Intervals:
	•	Work timer
	•	Rest timer
	•	Round tracking
	•	EMOM or steady-state (future expansion)

End Session:
	•	Summary:
	•	Volume completed
	•	Session RPE
	•	PR highlights
	•	CTA: Finish → return to dashboard

⸻

🔥 3.5 — CALENDAR

Weekly View:
	•	Seven-day dot display
	•	Completed / missed / upcoming indicators
	•	Tap opens daily summary drawer

Monthly View:
	•	Grid of dots only
	•	Tapping dot opens daily drawer

Daily Drawer Includes:
	•	Workout type
	•	Completed volume
	•	PRs
	•	Link to view full workout

⸻

🔥 3.6 — PROGRESS SYSTEM

Strength Tracking:
	•	Estimated 1RM tracking
	•	Strength graphs
	•	Per-lift trend cards
	•	Highlight recent PR changes

Conditioning Tracking:
	•	Zone distribution
	•	Best interval performance
	•	Engine trend line

Readiness Tracking:
	•	Daily readiness scores
	•	Weekly and monthly trends

⸻

🔥 3.7 — SETTINGS & PROFILE

Profile:
	•	Name, email, DOB
	•	Optional photo

Preferences:
	•	Goal
	•	Experience
	•	Training days
	•	Time availability

Equipment:
	•	Multi-select editor

Units:
	•	lb / kg
	•	km / mile

Notifications:
	•	Daily reminder
	•	Missed workout
	•	PR alerts
	•	Weekly summary

Integrations:
	•	Placeholder for Apple Health
	•	Placeholder for Whoop/Garmin (future)

Adaptive Engine Controls:
	•	Conservative / Automatic / Aggressive
	•	Readiness scaling toggle

⸻

⭐ 4. TECHNICAL REQUIREMENTS

⸻

🔥 4.1 — FRONTEND (React Native + Expo)

Architecture:
	•	Component-driven UI
	•	Expo Router
	•	Recoil or Zustand for state management
	•	SVG for icons
	•	Expo AV for sound/haptics

Key Screens:
	•	Onboarding screens
	•	Dashboard
	•	Workout overview
	•	Session mode
	•	Calendar
	•	Progress graphs
	•	Settings

⸻

🔥 4.2 — BACKEND (Local + Cloud Hybrid)

The adaptive engine can run:
	•	Local-first (for speed + offline support)
	•	Cloud-calculated (for PR detection + long-term analysis)

Core Data Structures:

User Profile
{
  id,
  name,
  email,
  experienceLevel,
  goals,
  equipment[],
  trainingDays,
  timeAvailability,
  preferences,
}

Workout Block
{
  blockType: "strength" | "conditioning" | "warmup",
  title,
  durationEstimate,
  exercises: [...]
}  

Exercise
{
  name,
  sets,
  reps,
  rpe,
  rest,
  loadRecommendation
}

Session Log
{
  date,
  completedBlocks[],
  volume,
  PRs[]
}

Readiness  
{
  date,
  readinessScore,
  factors
}


🔥 4.3 — ADAPTIVE ENGINE LOGIC (High-Level)

When readiness is low:
	•	Reduce intensity
	•	Reduce volume
	•	Replace high-intensity components
	•	Add mobility or technique blocks

When readiness is high:
	•	Increase intensity
	•	Keep volume stable
	•	Add optional finisher

Every workout adapts before the user sees it.

⸻

⭐ 5. ACCEPTANCE CRITERIA

For each major feature, we specify “done when…”

Here are examples:

Onboarding
	•	User can complete onboarding end-to-end
	•	Equipment selection persists
	•	A training plan is generated based on preferences

Dashboard
	•	Readiness score loads
	•	Today’s workout displays
	•	Start Workout launches session mode

Session Mode
	•	Strength sets log correctly
	•	Rest timer functions
	•	Conditioning intervals run accurately
	•	Summary screen shows correct data

Calendar
	•	Dots update based on completion
	•	Daily drawer opens
	•	Month view toggles

Progress
	•	Strength graphs render
	•	PRs detected automatically
	•	Readiness trends update daily

Settings
	•	Changing preferences updates training plan
	•	Units toggle works across app

⸻

⭐ 6. NON-FUNCTIONAL REQUIREMENTS

Performance:
	•	App must load dashboard in < 1 second
	•	Session mode must respond to inputs instantly

Reliability:
	•	Workout logs must never be lost
	•	Offline mode must allow training

Design:
	•	UI must match the Project Praxis design system
	•	Branding must be consistent across all screens

Security:
	•	Sensitive data stored securely
	•	Email/password handled properly (if added later)

⸻

⭐ 7. FUTURE EXTENSIONS (not in v1, but planned)
	•	HealthKit syncing
	•	AI-based form cues
	•	Social XP or leaderboard
	•	Workout-sharing
	•	Coaching mode
	•	Movement library with videos
	•	Fully server-based training engine
	•	Wearable integration

These are out-of-scope for MVP but extremely valuable later.