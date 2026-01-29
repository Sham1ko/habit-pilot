# Page Specification — Plan

## 1. Purpose

The **Plan** page is the strategic planning surface of Habit Pilot.  
Its purpose is to help the user **distribute habits across the week** within a fixed weekly capacity, preventing overload before it happens.

Unlike the _Today_ page (execution-focused), _Plan_ is **anticipatory and corrective**.

---

## 2. User Goals (Top Tasks)

- See the full week with capacity distribution per day
- Add habits to specific days of the week
- Rebalance the plan to stay within weekly capacity
- Detect overload early and resolve it proactively
- Adjust plans without losing progress or motivation

---

## 3. Page Structure

### 3.1 Header (Week Context)

- Title: `Plan — Week <ISO Week Number> (<Date Range>)`
- Weekly Capacity Summary:
  - Weekly Capacity: `<Total CU>`
  - Planned Load: `<Planned CU>`
  - Capacity Meter:
    - Green: ≤ 90%
    - Yellow: ≤ 100%
    - Red: > 100%

Optional helper text:

> “Your weekly capacity defines how much you can realistically commit.”

---

### 3.2 Weekly Grid (Core Area)

A horizontal or vertical representation of the 7-day week.

Each day column/card includes:

- Day name + date
- Daily planned load (CU)
- Visual day-level load indicator
- List of planned habits (`PlannedOccurrence`)

Each habit item shows:

- Habit title
- Habit weight (CU)
- Optional context tag

---

### 3.3 Planning Interactions

Supported interactions:

- Add habit to a day
- Move habit between days
- Remove habit from a day
- Adjust occurrence context (optional)

Interaction mechanisms may include:

- Drag-and-drop
- Quick-assign buttons
- “Suggest day” action (heuristic-based)

All interactions must update capacity indicators in real time.

---

### 3.4 Overload Resolution Panel (Conditional)

Displayed only when weekly capacity is exceeded.

Contents:

- Clear overload message (e.g., “You are over capacity by +6 CU”)
- Suggested actions:
  - Move habits to lighter days
  - Replace full habit with micro-step
  - Temporarily skip planning a habit this week

Actions must be reversible.

---

## 4. Functional Requirements

- **FR-P1:** The system shall display the current week with all planned habit occurrences.
- **FR-P2:** The user shall be able to assign a habit to one or more days.
- **FR-P3:** The system shall continuously calculate daily and weekly planned load.
- **FR-P4:** Over-capacity situations shall be detected immediately.
- **FR-P5:** The system shall provide actionable overload resolution suggestions.
- **FR-P6:** Changes made in Plan shall affect Today and Progress views.

---

## 5. States & Edge Cases

### 5.1 Empty Week State

Condition:

- No habits planned for the selected week.

UI:

- Message: “Your week is not planned yet.”
- CTA: `Add habits` or `Create first habit`

---

### 5.2 Over-Capacity State

Condition:

- Planned weekly load exceeds weekly capacity.

UI:

- Capacity Meter in red
- Overload Resolution Panel visible
- Non-blocking warning (planning still allowed)

---

### 5.3 Partial Week / Midweek Planning

Condition:

- User opens Plan mid-week.

Behavior:

- Past days are visually muted or locked
- Planning focuses on today → end of week
- Past occurrences remain visible but non-editable

---

## 6. Non-Functional Requirements

- **Performance:**  
  Rebalancing interactions ≤ 300 ms feedback time.

- **UX:**  
  Planning actions must be reversible (undo-friendly).

- **Accessibility:**  
  All actions accessible without drag-and-drop (keyboard / buttons).

- **Responsiveness:**  
  Desktop: multi-column grid  
  Mobile: vertical day cards with horizontal habit scrolling

---

## 7. Navigation & Integration

- Accessible from main navigation (`Plan`).
- Related pages:
  - `Today` — execution of today’s plan
  - `Progress` — evaluation of plan outcomes

Uses data from:

- `Habit`
- `PlannedOccurrence`
- `CapacityPlan`

Updates propagate to:

- Capacity Meter (global)
- Today page list
- Progress analytics

---

## 8. Planning Logic (High-Level)

- Weekly Planned Load = Σ (habit weight × planned occurrences)
- Daily Load = Σ (weights per day)
- Capacity thresholds:
  - ≤ 0.9 × Weekly Capacity → safe
  - ≤ 1.0 × Weekly Capacity → warning
  - > 1.0 × Weekly Capacity → overload

The system favors **early redistribution** over post-failure recovery.

---

## 9. Design Rationale

The Plan page shifts responsibility from discipline to design.  
By enforcing a visible weekly capacity and highlighting overload _before execution_, Habit Pilot reduces failure probability and emotional fatigue.

Planning is treated as a **protective mechanism**, not a commitment trap.

This directly supports the core product rule:

> users cannot plan more than their realistic weekly capacity without being warned and supported.
