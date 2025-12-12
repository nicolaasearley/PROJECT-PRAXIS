Roadmap for Dec 10 — Clean, Focused, High-Impact

Tomorrow’s work should be laser-focused on creating a real, polished, functional Today experience.

PHASE 1 — UI Foundation (Low risk, high payoff)

✅ Step 1 — Build “Daily Summary Card”

Data shown:
	•	Greeting (“Good morning, Nic”)
	•	Training focus: hybrid / strength / conditioning
	•	Estimated duration
	•	Recovery score placeholder (static for now)
	•	Small icon representing the day’s pattern (squat / hinge / push / pull)

This card sets the tone of the app.
It makes the world feel alive.

⸻

PHASE 2 — Workout Preview

✅ Step 2 — Render Block Previews

From the generated workout, show:

Main Lift Block
	•	Exercise name
	•	Sets × reps × RPE or %
	•	Small icon (barbell, dumbbell, kettlebell, etc.)

Accessory Block
	•	List of the chosen 2–3 exercises
	•	Info: “3 rounds”, “10 reps”, etc.
(We already generate these.)

Conditioning Block
	•	Rowing intervals / run / bike, etc.
	•	Work/rest preview

CTA: Start Workout

Big juicy button → /workout/active

⸻

PHASE 3 — Workflow Integration

Step 3 — Connect navigation

Pressing:
	•	“Start Workout” → begin session
	•	Accessories → open modal (later)
	•	Main lift → open expanded view (later)

This makes the app feel like a real product for the first time.

⸻

PHASE 4 — Internal correctness

Step 4 — Verify Plan Store Consistency

Now that UI is added, we’ll tighten:
	•	hydration state
	•	getTodayPlan logic
	•	date matching edge cases
	•	how the engine picks the correct workout

This ensures UI doesn’t silently break.

⸻

PHASE 5 — Visual polish

Step 5 — Make it pretty 😎

With Electric Cyan theme active:
	•	consistent spacing
	•	rounded cards
	•	shadows
	•	icons
	•	hierarchy

This makes the Today screen feel premium.