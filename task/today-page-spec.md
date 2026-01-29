# Page Specification — Today

## 1. Purpose

The **Today** page is the primary daily interaction surface of Habit Pilot.  
Its goal is to help the user focus on _today only_, quickly execute planned habits, and maintain motivation through gentle recovery instead of punishment.

The page intentionally limits scope and information density to reduce cognitive overload.

---

## 2. User Goals (Top Tasks)

- See which habits are planned for today
- Mark habits as completed with minimal friction
- Understand today’s load in relation to weekly capacity
- Recover smoothly after a missed habit using micro-steps

---

## 3. Page Structure

### 3.1 Header (Context)

- Title: `Today — <Day, Date>`
- Optional subtitle: short motivational or status text
- Weekly Capacity Indicator (compact):
  - Used CU / Weekly CU
  - Visual meter with color states:
    - Green: ≤ 90%
    - Yellow: ≤ 100%
    - Red: > 100%

---

### 3.2 Main Content — Today List

A list of habits scheduled for the current date.

Each habit item displays:

- Habit title
- Habit weight (Capacity Units, CU)
- Optional context tag (e.g., morning, home)
- Current status

Each item provides inline actions:

- `Done`
- `Micro-done`
- `Skip`

All actions must be executable in one interaction without navigation.

---

### 3.3 Recovery Section (Conditional)

Displayed only after a habit is marked as `skipped`.

Contents:

- Short supportive message (non-judgmental)
- Suggested micro-step (reduced CU)
- Quick action: `Mark micro-done`

The recovery suggestion is generated based on:

- Original habit weight
- Available remaining capacity
- Habit context (if available)

---

## 4. Functional Requirements

- **FR-T1:** The system shall display all `PlannedOccurrence` entries for the current date.
- **FR-T2:** The user shall be able to mark a habit as `done`, `micro-done`, or `skipped` with a single action.
- **FR-T3:** Marking a habit as `skipped` shall trigger a Slip Recovery suggestion.
- **FR-T4:** Capacity usage shall be recalculated and updated immediately after each action.
- **FR-T5:** If no habits are planned for today, an empty state must be shown.

---

## 5. States & Edge Cases

### 5.1 Empty State

Condition:

- No habits planned for the current date.

UI:

- Message: “No habits planned for today.”
- Call-to-action: `Plan your week` → navigates to `Plan` page.

---

### 5.2 Over-Capacity State

Condition:

- Planned or actual load exceeds weekly capacity.

UI:

- Capacity meter highlighted in red
- Helper text suggesting micro-steps instead of full completion

---

### 5.3 Error / Offline State

- Last known state remains visible
- User is notified about synchronization issues
- Actions are retried when connectivity is restored

---

## 6. Non-Functional Requirements

- **Performance:**  
  Initial load ≤ 1s for up to 200 habit entries.

- **UX:**  
  No modal dialogs for primary actions; inline interaction preferred.

- **Accessibility:**  
  Keyboard navigation supported; sufficient color contrast (WCAG AA).

- **Responsiveness:**  
  Mobile-first layout; list adapts to narrow viewports.

---

## 7. Navigation & Integration

- Accessible via bottom navigation (mobile) or sidebar (desktop).
- Links to:
  - `Plan` — weekly planning and redistribution
  - `Progress` — aggregated analytics and reports

Uses data from:

- `Habit`
- `PlannedOccurrence`
- `HabitEntry`
- `CapacityPlan`

---

## 8. Design Rationale

The Today page avoids streak pressure and long-term statistics.  
Instead, it emphasizes **immediate action**, **bounded effort**, and **graceful recovery**.

This aligns with the core Habit Pilot principle:

> sustainable progress through capacity-aware planning and non-punitive recovery.
