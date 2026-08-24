---
name: sta-da-radim-ui
description: Upgrades visual design, UX, layout, responsiveness, hierarchy, and polish of the Šta da radim? Serbia travel planner so it feels like a polished consumer travel platform. Use when improving the UI, redesigning or polishing a page, working on homepage, planner, Explore, place pages, trip results, maps, reviews, saved trips, navbar, auth, or admin, or when the user asks to make the site more professional, modern, premium, or better UX.
---

# Skill: Professional Modern UI Upgrade for “Šta da radim?”

Use this skill whenever improving the visual design, UX, layout, responsiveness, hierarchy, or polish of the existing **“Šta da radim?”** Serbia travel planner.

The goal is to make the product feel like a polished, modern, trustworthy consumer travel platform — not a generic developer MVP, dashboard, template, or AI-generated SaaS page.

Do not change business logic unless required for UX.

Do not break existing functionality.

Do not replace working features with mockups.

Read [reference.md](reference.md) for page layouts (navbar, homepage, planner, Explore, cards, place pages, reviews, trips, maps) and for forms, buttons, empty/loading states, responsive rules, copy, trust signals, and performance.

---

# Product Context

“Šta da radim?” is a travel and local discovery platform for Serbia.

Core features include:

* trip planning
* Explore
* place pages
* maps
* routes
* saved trips
* public trip sharing
* user accounts
* reviews
* ratings
* user photos
* community place submissions
* place edit suggestions
* moderation/admin tools

Tech stack may include:

* Next.js
* React
* TypeScript
* Tailwind
* Supabase
* Leaflet
* OpenStreetMap
* CARTO
* OSRM

Treat the public-facing product as a **consumer travel platform**.

The admin area may be more functional and dashboard-like, but the public product should not look like an admin interface.

---

# Main Design Direction

The product should feel:

* modern
* premium
* trustworthy
* warm
* easy to explore
* travel-oriented
* visually rich
* clean
* responsive
* slightly editorial
* highly usable

Reference the general quality level of modern products such as:

* Airbnb
* Booking
* Wanderlog
* Google Travel
* Tripadvisor
* GetYourGuide
* modern map-based discovery apps

Do NOT copy these products directly.

Use them only as quality references for:

* spacing
* hierarchy
* cards
* visual density
* map/list UX
* imagery
* typography
* mobile responsiveness
* filters
* navigation

---

# Avoid These Visual Problems

Avoid:

* generic AI startup gradients
* glowing purple/blue backgrounds
* excessive glassmorphism
* giant gradient blobs
* excessive rounded cards everywhere
* every section inside a bordered box
* dashboard-style homepage
* overuse of shadows
* excessive icons
* too many badge pills
* tiny text
* weak gray-on-gray contrast
* layouts with no clear hierarchy
* giant empty whitespace with little content
* over-animated elements
* random accent colors
* visually inconsistent buttons
* excessive centered text
* generic shadcn default appearance
* generic Tailwind starter-template styling
* every card having exactly the same layout
* fake premium appearance through gradients alone

Do not make the site look like:

“an AI generated SaaS landing page”.

---

# Visual Identity

Use one primary brand accent color.

Recommended direction:

* warm green
* forest green
* muted emerald
* deep teal-green

This suits:

* nature
* Serbia
* travel
* maps
* exploration

Possible conceptual palette:

Primary:
deep natural green

Background:
warm off-white / near white

Cards:
white

Text:
near-black charcoal

Secondary text:
muted neutral gray

Borders:
very subtle neutral

Optional warm accent:
sand / muted ochre

Do not use many competing colors.

Use semantic colors only where useful:

* green = positive/approved
* amber = pending
* red = destructive/rejected
* blue = informational

Do not hardcode arbitrary colors repeatedly.

Use design tokens / CSS variables.

---

# Typography

Typography must immediately feel more polished than a default web app.

Use a clean modern sans-serif with strong readability.

Good choices include:

* Inter
* Geist
* Manrope
* Plus Jakarta Sans
* DM Sans

Use one primary font unless there is a strong design reason otherwise.

Optional:

a subtle editorial/display font may be used ONLY for selected major marketing headings, but do not overcomplicate typography.

Hierarchy should be clear.

Example:

Hero title:
large, strong, high contrast

Page title:
32–44px desktop

Section title:
24–32px

Card title:
16–20px

Body:
15–17px

Metadata:
13–14px

Do not make body text too small.

Use comfortable line-height.

---

# Global Layout

Use a consistent page width system.

Suggested:

```txt
max-width: 1280–1440px
```

depending on page.

General content pages:

```txt
max-width: 1200–1280px
```

Map-heavy pages may use nearly full width.

Use consistent horizontal padding:

Mobile:
16px

Tablet:
24px

Desktop:
32px+

Do not allow different pages to feel like unrelated templates.

---

# Spacing System

Use a consistent spacing rhythm.

Prefer something similar to:

```txt
4
8
12
16
20
24
32
40
48
64
80
96
```

Do not use arbitrary values unless necessary.

Increase spacing between major sections.

Reduce spacing between tightly related elements.

Visual grouping should be obvious without requiring borders everywhere.

---

# Borders and Shadows

Use subtle borders.

Typical:

```txt
1px solid neutral border
```

Cards should usually rely on:

* subtle background difference
* border
* spacing

rather than heavy shadows.

Use shadows sparingly for:

* floating map cards
* dropdowns
* modals
* sticky controls
* emphasized destination cards

Do not use huge soft shadows on every component.

---

# Border Radius

Use a restrained radius system.

Suggested:

Small controls:
8–10px

Cards:
12–16px

Large image cards:
16–20px

Modals:
16–20px

Avoid making every element look like a pill.

Use full-pill shape only for:

* chips
* category selectors
* small filters
* status labels

---

# Modernization Workflow

Whenever asked to improve a page:

1. Inspect the existing page and all related reusable components.
2. Identify actual visual/UX weaknesses.
3. Preserve existing functionality.
4. Reuse established design tokens.
5. Fix hierarchy first.
6. Fix spacing second.
7. Improve typography.
8. Improve imagery/cards.
9. Improve responsive behavior.
10. Add subtle polish last.
11. Test relevant routes.
12. Run build/type checks.

Do NOT begin by rewriting everything.

---

# Refactoring Rules

If multiple pages use inconsistent:

* button styles
* containers
* cards
* typography
* section headings
* badges

extract reusable components or design tokens.

Examples:

```txt
PageContainer
SectionHeader
PlaceCard
RatingDisplay
InfoRow
EmptyState
PageHero
StickyMapLayout
```

Do not create abstractions for one-off 5-line components.

---

# Design Tokens

Centralize:

* colors
* radius
* shadows
* content widths
* typography
* background colors

Prefer CSS variables / Tailwind theme tokens.

Avoid repeated arbitrary values such as:

```txt
#16a34a
#15803d
#166534
```

scattered throughout components.

---

# Final Rule

Whenever there is a choice between:

**flashy**

and

**clear, useful and premium**

choose:

**clear, useful and premium.**

The finished product should look like a real travel startup that could be publicly launched, not a coding project demo.

---

# When Applying This Skill

If asked:

“Improve the design”

“Make this page modern”

“Polish the UI”

“Make the site more professional”

“Improve UX”

“Redesign this page”

do the following:

* inspect existing implementation
* preserve behavior
* identify visual inconsistencies
* improve the relevant page using this design system
* update shared components where beneficial
* ensure responsive behavior
* test build and relevant routes

Do not alter unrelated backend logic.

Do not replace functioning maps/planners/community systems merely for visual redesign.

At completion explain briefly:

* what visual improvements were made
* which shared components/design tokens changed
* responsive improvements
* any remaining visual inconsistencies worth addressing next
