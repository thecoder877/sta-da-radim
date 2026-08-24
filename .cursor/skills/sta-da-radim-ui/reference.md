# Page and component layouts

Read this when polishing a specific surface. Keep product rules in [SKILL.md](SKILL.md).

---

# Navbar

Navbar should look like a polished travel product.

Desktop layout:

Left:
logo / “Šta da radim?”

Center or left-middle:

* Istraži
* Planiraj
* Sačuvano when relevant

Right:

* user profile
* primary CTA if useful

Use a restrained sticky header if appropriate.

Navbar should:

* remain clean
* have strong spacing
* use subtle border/background when sticky
* not become oversized

Logged-in user should show:

avatar + display name / username

not email.

User dropdown should feel compact and polished.

---

# Homepage

Homepage must immediately communicate the value.

Do not overload it with features.

Recommended structure:

1. Hero
2. Planner input or CTA
3. Popular / recommended destinations
4. Categories
5. How it works
6. Curated discovery section
7. Community/local knowledge section
8. Final CTA
9. Footer

---

# Homepage Hero

The hero should feel travel-oriented, not SaaS-oriented.

Possible layout:

Left:
headline + short explanation + CTA/planner

Right:
beautiful destination imagery / collage / map preview

OR:

Full-width photographic hero with planner card layered over it.

Headline should be short.

Example direction:

“Gde sledeće?”

or

“Otkrij Srbiju po svom ritmu.”

Subtext:

Explain personalized planning clearly.

Avoid:

“Revolutionize your travel with AI-powered experiences.”

No generic AI buzzwords.

If AI is not currently implemented, do not imply that it is.

---

# Planner Card

The planner is one of the product's most important components.

Make it feel simple despite having many inputs.

Use:

* strong labels
* clear grouping
* friendly selectors
* large enough controls
* clean hierarchy

Avoid one giant vertical form on desktop if information can be grouped.

Desktop could use grouped rows/cards:

```txt
Odakle
Kada
Trajanje
Prevoz
```

then:

```txt
Budžet
Interesovanja
Dodatne opcije
```

Primary CTA should be visually dominant.

Example:

“Napravi plan”

Use subtle helper text:

“Prvi plan možeš da napraviš bez naloga.”

Do not clutter it.

---

# Explore Page

Explore should feel like a modern discovery/search experience.

Desktop:

Prefer a map/list layout where appropriate.

Possible:

Left:
results

Right:
sticky map

or map toggle.

Top controls:

* search
* filter button
* categories
* sort

Avoid showing 12 filter dropdowns simultaneously.

Use a compact filter system.

On mobile:

* search at top
* horizontal filter chips
* list
* floating “Mapa” toggle

---

# Place Cards

Place cards are critical.

Avoid generic equal-height SaaS cards.

Recommended elements:

* strong image
* place name
* city/region
* category
* rating if available
* short useful metadata
* maybe duration / cost
* save action

Image should be visually dominant.

Desktop grid card:

image ratio around:

```txt
4:3
or
3:2
```

Use consistent image cropping.

Metadata should not overwhelm title.

Example:

```txt
Banjska stena
Tara • Vidikovac

★ 4.8 · 126 recenzija
1–2 h · Besplatno
```

Avoid six chips under every card.

---

# Place Page

Place detail page should feel editorial and trustworthy.

Recommended structure:

## Hero

* title
* location
* rating/reviews
* category
* save/share actions

## Image gallery

Use a modern gallery layout.

Desktop possible:

one large hero image + smaller side images

Mobile:
swipeable gallery

## Main body

Two-column desktop layout.

Left:

* description
* details
* reviews
* community content

Right:
sticky info card with:

* opening hours
* price
* address
* phone
* website
* map
* trip actions

Do not put every piece of metadata in separate large cards.

---

# Place Information

Present practical information compactly.

Good layout:

```txt
Radno vreme     09:00–18:00
Cena             500 RSD
Parking          Dostupan
Trajanje         1–2 sata
```

Use icons sparingly.

Missing information can say:

“Nije poznato”

with small CTA:

“Dodaj informaciju”

This should feel helpful, not like a broken database.

---

# Ratings and Reviews

Reviews must feel credible.

Place summary:

Large rating number.

Example:

```txt
4.7
★★★★★
128 recenzija
```

Show rating distribution where useful.

Review cards should NOT look like ecommerce product reviews.

Use:

* avatar
* display name
* date
* stars
* review title
* review body
* optional images
* useful structured tags
* helpful controls

Structured tags can include:

* Parking lak
* Velika gužva
* Dobro za parove

Use them sparingly.

---

# Review Images

Use clean responsive photo grids.

One image:
large preview

2–4:
balanced grid

5+:
show first group + “+3”

Click opens lightbox/gallery.

Avoid forcing all images into tiny squares.

---

# Helpful / Not Helpful

Use subtle actions:

```txt
👍 Korisno 24
👎 Nije korisno 2
```

Do not make them giant colored buttons.

Selected state should be clear.

---

# Replies

One-level replies should visually appear subordinate to the review.

Use:

* slight indentation
* lighter background or left border
* smaller spacing

Do not make replies look like a nested forum.

---

# Add Place Flow

“Dodaj mesto” should feel approachable.

Avoid giant government-style form.

Use step-based sections if the form is long.

Possible:

1. Osnovno
2. Lokacija
3. Korisne informacije
4. Fotografije
5. Pregled

A full multi-step wizard is optional.

If current form is already manageable, use section cards instead.

---

# Place Edit Suggestions

The “Predloži izmenu” experience should highlight current vs proposed information.

Example:

```txt
Radno vreme

Trenutno
Nije poznato

Tvoj predlog
09:00–18:00
```

This improves trust.

---

# User Profile

Public user profile should feel lightweight.

Top:

avatar
display name
@username
bio

Stats:

* recenzije
* odobrene lokacije
* korisni glasovi

Then contributions.

Avoid turning this into a social network profile.

---

# Saved Trips

Saved trips should look like travel plans, not database records.

Card should include:

* destination/title
* date
* number of days
* starting point
* small route/place imagery
* distance
* estimated cost

Actions can sit in overflow menu:

* Podeli
* Isključi deljenje
* Obriši

Primary click opens trip.

---

# Trip Result Page

This is one of the most important screens.

Desktop:

Preferred:

```txt
Itinerary panel 40–45%
Map 55–60%
```

Map should remain visible/sticky.

Trip header:

* title
* dates
* duration
* distance
* cost
* save/share

Timeline:

Clear chronological structure.

Avoid excessive card nesting.

Example:

```txt
09:30
│
● Stražilovo
  1h 30min
  Kratki opis...
│
12:00
● Sremski Karlovci
```

Use visual timeline.

Accommodation stop should visually differ subtly.

---

# Map Design

Map should feel integrated with the product.

Do not place map inside a tiny rounded card unnecessarily.

For map-heavy pages, let map breathe.

Controls:

* clear but compact
* avoid duplicate zoom controls if not needed
* marker styles consistent with brand

Trip markers:

A = origin

1,2,3 = destinations

H = accommodation

Use custom marker visuals where appropriate, but keep them highly legible.

---

# System details

# Forms

Forms should feel high quality.

Use:

* visible labels
* strong focus states
* useful helper text
* clear validation

Input heights should be consistent.

Suggested control height:

40–48px

Avoid placeholder-only forms.

Required fields should be clear.

Error text should be concise.

---

# Buttons

Define consistent variants.

Primary:
brand-colored solid

Secondary:
neutral outlined/subtle

Tertiary:
text/ghost

Destructive:
red only for destructive actions

Avoid having 5 visually equal buttons in the same area.

Each section should have obvious primary action.

---

# Modals

Modals should:

* have clear title
* short supporting text
* strong primary CTA
* secondary action
* reasonable max width

Auth modal must preserve context.

Avoid oversized fullscreen modals on desktop unless necessary.

On mobile, bottom-sheet behavior may be appropriate.

---

# Empty States

Empty states should be useful.

Bad:

“Nema podataka.”

Better:

“Još nemaš sačuvanih putovanja.”

“Isplaniraj prvo putovanje i sačuvaj ga ovde.”

CTA:
“Planiraj putovanje”

Use tasteful simple visuals/icons if needed.

---

# Loading States

Prefer:

* skeletons
* map placeholders
* subtle spinner for actions

Avoid blocking entire pages with giant centered spinners.

Trip generation can show rotating human-readable statuses.

Example:

“Tražimo zanimljiva mesta…”

“Povezujemo rutu…”

“Sastavljamo plan…”

Do not use fake exact percentages.

---

# Mobile Design

Mobile is critical.

Many users will use the site while traveling.

Test carefully at:

```txt
320px
375px
390px
430px
```

Requirements:

* no horizontal overflow
* easy tap targets
* no tiny dropdowns
* maps usable
* sticky controls must not cover content
* cards must not become cramped
* text must remain readable

For map/list screens:

Use toggle:

```txt
Lista | Mapa
```

or floating map action.

---

# Desktop Design

Do not simply stretch mobile layouts.

Desktop should use the available space intelligently.

Use:

* split layouts
* multi-column galleries
* sticky sidebars
* richer cards
* wider map surfaces

Avoid 600px-wide centered content on a 1440px screen when a richer layout is appropriate.

---

# Responsive Breakpoints

Use the project's existing Tailwind breakpoints unless there is a strong reason otherwise.

Think intentionally about:

* mobile
* tablet
* laptop
* large desktop

Do not rely only on:

mobile → everything instantly becomes 3 columns at `md`.

---

# Images

Travel products need strong imagery.

Use image areas prominently.

Do not show distorted images.

Always use appropriate:

* object-cover
* aspect ratio
* loading behavior
* responsive sizing

Provide fallback image states where required.

Do not use random unrelated stock imagery.

---

# Iconography

Use one icon library consistently, e.g. Lucide.

Do not mix multiple icon styles.

Icons should supplement labels, not replace important text.

Avoid putting icons in every line of metadata.

---

# Animations

Use subtle motion only.

Good:

* card hover lift
* fade/slide modal
* button transition
* image hover
* tab indicator
* skeleton

Bad:

* bouncing buttons
* excessive scroll animations
* floating gradients
* constant motion
* animations delaying interaction

Respect reduced-motion preferences.

---

# Hover States

Desktop interactive elements need polished hover states.

Examples:

Place card:
slight image scale + subtle elevation

Button:
small tone change

Text link:
underline or color change

Do not make cards jump noticeably.

---

# Focus States

Keyboard focus must remain visible.

Do not remove outlines without replacing them.

Use brand-colored focus rings.

---

# Accessibility

Maintain:

* accessible contrast
* keyboard navigation
* form labels
* meaningful alt text
* semantic headings
* appropriate ARIA only where needed

Do not sacrifice usability for visual minimalism.

---

# Serbian Copy

User-facing UI should use natural Serbian Latin.

Avoid overly formal or machine-translated phrases.

Examples:

Good:

“Planiraj putovanje”

“Sačuvaj”

“Podeli”

“Predloži izmenu”

“Dodaj mesto”

“Napiši recenziju”

“Prikaži na mapi”

“Još nema recenzija”

Avoid awkward translations.

---

# Professional Content Density

Do not over-simplify so much that useful information disappears.

Travel users often need:

* price
* distance
* duration
* rating
* opening hours
* map
* practical details

Present these clearly without clutter.

Use hierarchy instead of deleting useful information.

---

# Admin UI

Admin interface may be more utilitarian.

Use:

* clear sidebar/navigation
* data tables
* filters
* moderation queues
* status badges

But still maintain:

* consistent typography
* spacing
* responsive behavior
* professional controls

Admin does not need travel-editorial styling.

---

# Homepage Success Criteria

Homepage should answer in under five seconds:

* What is this?
* Why would I use it?
* What can I do now?

The primary action must be obvious.

Travel imagery should make the experience desirable.

---

# Explore Success Criteria

User should quickly understand:

* what places exist
* how to search
* how to filter
* where places are
* which place is worth opening

Cards and map should cooperate.

---

# Place Page Success Criteria

User should quickly know:

* what the place is
* why it is interesting
* where it is
* rating
* practical information
* photos
* what other visitors think
* how to add it to a trip

---

# Trip Page Success Criteria

User should immediately know:

* where they are going
* in what order
* how long it takes
* approximate cost
* route on map
* what to do at each stop

The map and itinerary should feel like one product.

---

# UX Microcopy

Use short labels.

Prefer:

“Sačuvaj”

over:

“Sačuvaj ovo putovanje na svoj nalog”

when context is obvious.

Use helper copy only when needed.

Avoid explaining obvious UI excessively.

---

# Trust Signals

The product involves practical travel information.

Use clear source/freshness cues where available.

Examples:

“Potvrđeno pre 14 dana”

“Na osnovu 82 recenzije”

“Informacija korisnika — čeka proveru”

Do not visually imply unverified information is authoritative.

---

# Community Visual Distinction

Differentiate:

Canonical verified information

from:

Community suggestion

from:

User review

Example:

Verified:
normal info styling

Pending community data:
subtle amber “Čeka proveru”

Review:
user/avatar styling

Do not blend all information into one undifferentiated block.

---

# Performance

Visual polish must not destroy performance.

Avoid:

* unnecessary large client bundles
* loading Leaflet on pages without maps
* dozens of full-resolution images
* layout shifts

Use:

* dynamic imports where useful
* Next/Image where appropriate
* image sizing
* lazy loading

---


# Page-by-Page Priority

When improving the entire site, prioritize in this order:

1. Navbar / global shell
2. Homepage
3. Planner
4. Trip result
5. Explore
6. Place page
7. Reviews/community
8. Saved trips
9. Profile/contributions
10. Auth
11. Admin

Do not spend hours polishing admin before core public flows feel professional.

---

