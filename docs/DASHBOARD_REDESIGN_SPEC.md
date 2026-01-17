# Dashboard Redesign — Design Brain Spec

**Date:** January 2025
**Mode:** MODE_SAAS
**Target Score:** ≥4.0/5

---

## Current Problems

1. **8+ cards competing for attention** — everything is equally prominent
2. **No clear primary action** — "Add Tips" is a FAB, not visible in dashboard
3. **Cognitive overload** — too much information on first view
4. **First-time user confusion** — empty states everywhere
5. **Premium features punitive** — locked icons feel gatekeeping

---

## Design Brain Principles Applied

### Dashboard Rules (from Dashboards.md)
- **Primary focus** — single most important signal
- **Secondary signals** — supporting metrics that contextualize
- **Next actions** — what user should do based on what they see
- **One dominant focal area above the fold**

### MODE_SAAS Rules
- Emphasize value and progress
- Avoid overwhelming first-time users
- Use empty states and onboarding cues
- Celebrate first success (briefly)

---

## New Dashboard Structure

```
┌─────────────────────────────────────────────────┐
│  Header: "Home"              [Sync] [Streak 🔥] │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  TODAY'S TIPS                              │  │
│  │                                            │  │
│  │      $127.50         [+ Add Tips]          │  │  ← HERO + PRIMARY CTA
│  │                                            │  │
│  │  4.5 hrs • $28.33/hr                       │  │
│  │  ▲ 15% vs yesterday                        │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  This Week              $485.00            │  │  ← SECONDARY: Week trend
│  │  ▁▂▄▃▅▆█ (sparkline)                       │  │
│  │  ▲ 12% vs last week                        │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ $28/hr  │ │ Sat     │ │ 5 day   │           │  ← TERTIARY: Quick stats
│  │ Avg rate│ │Best day │ │ Streak  │           │
│  └─────────┘ └─────────┘ └─────────┘           │
│                                                 │
│  ─────────── Below the fold ───────────────    │
│                                                 │
│  ▸ AI Insights (collapsible, premium)          │  ← Progressive disclosure
│  ▸ Recent Tips (collapsible)                   │
│  ▸ Goals (collapsible, premium)                │
│                                                 │
│  [Upgrade to Premium]  (if free user)          │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Hero Card (Above the Fold)

**What it shows:**
- Today's total tips (large, prominent)
- Hours worked + hourly rate
- Change vs yesterday (if applicable)
- **PRIMARY CTA: "Add Tips" button** (visible, not FAB)

**First-time user (empty state):**
```
No tips logged yet today

Start tracking to see your earnings grow!

[+ Log Your First Tip]
```

**Design:**
- Blue gradient background (existing)
- Add Tips button: right side of card, pill-shaped, gold accent
- CTA always visible in hero

---

### 2. Week Summary Card (Secondary)

**What it shows:**
- This week's total
- Compact sparkline (7 bars, one per day)
- % change vs last week

**Design:**
- Glass card style
- Compact: 1/3 height of hero
- Sparkline is visual, not interactive

---

### 3. Quick Stats Row (Tertiary)

**Three compact stat pills:**
1. **Avg hourly rate** (this week)
2. **Best day** (which day earned most)
3. **Streak** (days logged consecutively)

**Design:**
- Horizontal scroll if needed
- Tap to navigate to relevant detail (Analytics, Achievements)

---

### 4. Collapsible Sections (Below Fold)

Replace individual cards with collapsible sections:

**AI Insights** (Premium)
- Collapsed by default for free users (shows "Unlock AI Insights →")
- Expanded by default for premium users
- Shows prediction + daily insight combined

**Recent Tips** (All users)
- Last 3 entries
- "See all" link to History

**Goals Progress** (Premium)
- Active goals with progress bars
- "Create goal" if none

---

### 5. Upgrade Card (Free Users Only)

**Placement:** Bottom of dashboard, single card
**Design:** Subtle gold gradient, outcome-focused copy

```
"Know what you'll earn before you clock in"
Unlock AI predictions, goals, and tax reports.
[Start Free Trial]
```

---

## What Gets Removed/Relocated

| Element | Action |
|---------|--------|
| ShiftPredictionCard | → Collapsed in AI Insights section |
| DailyInsightCard | → Collapsed in AI Insights section |
| Full WeeklyTrendChart | → Replace with compact sparkline |
| QuickActionsRow | → Remove (redundant with tab bar) |
| This Month card | → Remove from dashboard (Analytics screen) |
| ReferralCard | → Move to Settings/Profile |
| GoalsSection | → Collapsed section |
| RecentEntriesSection | → Collapsed section (3 items max) |

---

## Empty State Strategy

### First-time user (no tips ever)
Hero shows:
```
Welcome to TipFly!

Track your first tip to see your earnings here.

[+ Log Your First Tip]
```

### Returning user (no tips today)
Hero shows today's earnings as $0.00, but with context:
```
$0.00
No tips logged today yet

Last shift: $85 on Saturday

[+ Add Today's Tips]
```

---

## Accessibility Considerations

- Hero card: high contrast white on blue
- CTA button: minimum 44x44 touch target
- Collapsible sections: proper aria-expanded
- Sparkline: include text alternative ("Earned $50, $75, $60, $80, $90, $45, $85 over past 7 days")

---

## Animation

- Hero card: fade-in + subtle scale on load
- Add Tip button: subtle pulse if no tips today (attention)
- Collapsible sections: smooth height animation
- Sparkline: bars animate in left-to-right on first load

---

## UX Score Target

| Dimension | Target | How |
|-----------|--------|-----|
| Clarity | 5/5 | One hero, one CTA |
| Hierarchy | 5/5 | Clear primary → secondary → tertiary |
| Speed to Action | 5/5 | Add Tips button in hero |
| State Completeness | 5/5 | All states designed |
| Cognitive Load | 5/5 | Collapsed sections reduce noise |
| Copy Quality | 5/5 | Outcome-focused, not feature-focused |
| Mode Alignment | 5/5 | SaaS-appropriate, not dense |
| Accessibility | 4/5 | Good basics |
| Originality | 4/5 | Distinctive dark theme + gold accents |

**Target Average: 4.8/5**

---

## Implementation Plan

1. Create new `DashboardScreenV2.tsx`
2. Create `WeekSparkline` component (compact chart)
3. Create `QuickStatsPill` component
4. Create `CollapsibleSection` component
5. Create `DashboardEmptyState` component
6. Wire up data fetching (reuse existing logic)
7. Add "Add Tips" button to hero
8. Test all states (empty, data, premium, free)
9. Replace old dashboard

---

## END OF SPEC
