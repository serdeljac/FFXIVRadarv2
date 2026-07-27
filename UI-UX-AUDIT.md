# FFXIV Radar — UI/UX Audit & Remediation Task List

**Audited:** 2026-07-26 · **Scope:** all 12 routes at 1440px (desktop), 900px (tablet), 375px (mobile)

Findings were gathered by running the dev server and inspecting the live DOM, computed styles, and
accessibility tree, then cross-checked against source. Every claim below is backed by a measured
value or a verified file reference — nothing is inferred from appearance alone.

---

## Executive summary

| Tier | Theme | Count |
|---|---|---|
| **P0** | Functional bugs — broken today | 7 — **6 done**, 1 open (AdSense) |
| **P1** | Keyboard & screen-reader access | 14 — **✅ all done** (11 planned + 3 found) |
| **P2** | Mobile & touch | 7 — **5 done**, 2 open (filter-bar height, page-header height) |
| **P3** | Polish, consistency, dead code | 8 — **✅ all done** |
| | **Total** | **36 — 33 done, 3 open** |

**Still open:** the AdSense `availableWidth=0` console error (P0), and two mobile vertical-space
items (P2) — the filter bar and the page header. Both are layout/content decisions rather than
defects; a collapsing filter bar was tried and rejected.

> **Note:** the headline finding below describes the *original* state. See the P1 section for the
> post-fix numbers.

**The headline finding:** repo-wide there is **1 `aria-*` attribute, 0 `role=` attributes, 0 keyboard
event handlers, and 0 `prefers-reduced-motion` blocks** across all of `src/`. On `/timedNodes` the page
has **212 non-native controls but only 25 tab stops** — the track button, the details button, and
pagination are all `<div>`/`<li>` elements. A keyboard user cannot track a node, open a detail pane, or
change page. That is the app's entire core interaction loop.

**What is already good** (documented so nobody "fixes" it):

- **Colour contrast passes everywhere** — measured 8.21:1 to 16.25:1 on every sampled text element
  (body, table headers, row text, filter buttons, pagination, search input, sidebar links). The
  contrast rationale documented in `src/style/variables.scss` is accurate and holds up under
  composite-aware measurement. This is genuinely well done.
- `:root { color-scheme: dark }`, correct `<meta name="viewport">`, `html lang="en"`, and a real
  meta description are all present.
- The map page's checkboxes and radios (`1_EorzeaOverview.vue`) **are** properly `<label>`-associated —
  the only correctly-built form controls in the app. Use them as the reference pattern.
- Custom scrollbar theming covers both Firefox and WebKit.

---

## P0 — Functional bugs

Broken behaviour in the shipped app. All are small, contained fixes.

- [x] **The 404 page's recovery button leads to a 404.** ✅ **DONE**
      `src/components/views/Error404.vue:29` links to `/timedMiningBotany`; the real route is
      `/timedNodes`. A user who lands on the error page and clicks the obvious escape hatch gets the
      error page again.
      → Changed to `/timedNodes`. Verified: clicking the button lands on `/timedNodes` with 50 rows.

- [x] **Home page "Timed Mining / Botany" card is dead.** ✅ **DONE**
      `src/components/views/0_Home.vue:82` — `link: 'timedMiningBotany'`. Same wrong route, on the
      primary landing page's quick-access grid.
      → Changed to `timedNodes`. (The sidebar in `parts/sidebarLinks.vue` already used the correct
      path, which is why this went unnoticed.) Verified: 0 `/timedMiningBotany` hrefs remain anywhere
      in the quick-access grid, and the card lands on `/timedNodes`.

- [x] **`<main>` collapses to padding-only at every viewport.** ✅ **DONE**
      `src/style/style.scss:109` — `height: calc($trackingbarHeight + 200px - 100vh)` evaluates to
      `270px - 100vh`, negative on any viewport taller than 270px. The browser **clamps it to 0**, so
      `main` measured 24px on desktop (16px + 8px padding) and 12px on mobile (6px + 6px) — pure
      padding, zero content box. Content escaped the box by **2756px**; the page scrolled only by
      accident, via visible overflow.
      Second effect: `<main>` carries `@click="toggleForceMenu"` (the click-anywhere-to-collapse-the-
      sidebar handler), so its hit area was a 24px strip instead of the whole content area.
      → Replaced with `min-height: calc(100vh - #{$trackingbarHeight})`, matching the `margin-top:
      $trackingbarHeight` already on `main`.
      **Verified:** long pages now wrap their content exactly (`main` 2788px = 2764 content + 24
      padding, nothing overflowing); the short News page sits at the 830px floor and fills the
      viewport with **zero excess scroll** (no phantom scrollbar); the floor tracks the viewport
      correctly at two heights (830px at 900vh, 742px at 812vh); no horizontal overflow at any width;
      `elementFromPoint` probes at y=200/400/600/772 now all land inside `main`, confirming the click
      handler covers the full page. `npm run build` (incl. `vue-tsc`) and all 17 tests pass.

- [x] **"View Details" is a dead control on tablet.** ✅ **DONE** *(closed by the P2 details-pane work)*
      At 900px the tables rendered **50 visible details buttons**, but `src/App.vue` gated the pane on
      `windowWidth !== 'tablet' && windowWidth !== 'mobile'`. Verified by clicking one and confirming
      `.details` never entered the DOM.
      → The gate is gone; the pane renders at every breakpoint. **Verified at 900px:** clicking a
      details button now opens a 432px side panel.

- [ ] **AdSense throws on every route change.**
      Console shows `TagError: adsbygoogle.push() error: No slot size for availableWidth=0`, repeated
      per navigation. `PromotionBanner.vue` pushes the slot while its container is still
      `display: none` / zero-width.
      → Defer the `push()` until the container has non-zero width (the component already has a
      `MutationObserver` — gate on measured width instead).

- [x] **404 page uses raw anchors instead of `router-link`.** ✅ **DONE**
      `Error404.vue` CTAs are `<a href>`, forcing a full document reload and discarding SPA state.
      → Both CTAs converted to `<router-link>`. Verified: scoped `.btn` styling still applies, both
      buttons navigate without a document reload, and browser Back returns to the 404.

- [x] **🔴 Client-side navigation was broken app-wide.** ✅ **DONE** — *found while fixing the above;
      not in the original audit.*
      Converting the 404 CTAs to `router-link` exposed it: the URL changed and the sidebar active
      class updated, but the **view never swapped**. Every route rendered whichever page was
      hard-loaded first — confirmed across `/sightseeing`, `/aetherCurrents` and `/eorzeaoverview`,
      all three still showing the "Timed Mining & Botany" `<h1>` and its column headers.
      The original audit missed this because each page was reached by full page load, which masks it
      entirely.
      **Cause:** the `<Transition name="fade" mode="out-in">` wrapping the lazily-imported
      `<component :is>` in `src/App.vue:29`. Measured behaviour: with `mode="out-in"` the view freezes
      on the first page; with the mode removed, leaving pages never unmount and stack up (`main`
      children grew 2 → 7 over six navigations, every previous `<h1>` still in the DOM).
      → Transition removed. Verified across all 11 routes: correct `<h1>` every time, exactly one view
      mounted, zero accumulation. The `.fade-*` CSS in `App.vue:697` is now unused — see note below.

---

## P1 — Keyboard & screen-reader access

**✅ TIER COMPLETE.** Measured on `/timedNodes`, before → after:

| Metric | Before | After |
|---|---|---|
| Tab stops | 25 | 144 |
| Non-native core controls | 212 | **0** |
| Controls with no accessible name | most | **0** |
| `role=` attributes in DOM | 0 | 409 |
| `aria-*` attributes in DOM | 1 | 237 |
| `<h1>` per page | 2 | 1 |
| `<img>` without `alt` | 162 / 211 | **0** |

Verified across all 9 content routes: 0 unnamed controls, 0 `<div>`-based core controls,
exactly one `<h1>`, no images missing `alt`, no horizontal overflow. `npm run build`
(incl. `vue-tsc`) passes.

- [x] **Convert the three core controls from `<div>`/`<li>` to `<button>`.** ✅ **DONE** *(highest-impact task)*
      - `src/components/ui/buttons/toggleTracking.vue:2` — root is `<div class="trackingTriggerBtn">`
      - `src/components/ui/buttons/toggleDetailMenu.vue` — same pattern
      - `.pagenation_item` `<li>`s in `2_TimedMiningBotany.vue` / `10_TimedFishing.vue`
        (verified: `<li class="pagenation_item pageActive">1</li>`, **0 focusable children**)

      None are focusable, none expose a role, none have an accessible name, none respond to Enter or
      Space. Measured on `/timedNodes`: **212 non-native controls, 25 tab stops.**
      → All three are now `<button type="button">`. The components derive their own accessible name,
      so every call site gained one without being touched; table rows pass a node-specific label
      (`"Untrack Ice Crystal"`, `"View details for Ice Crystal"`). Track buttons carry `aria-pressed`,
      pagination is wrapped in `<nav aria-label="Pagination">` with `aria-current="page"`.
      **Verified:** focusable, Enter/Space activate, `aria-pressed` flips on toggle, paging moves
      `aria-current` and re-renders rows.
      Also converted while here: the **sidebar clock** (a `<div>` toggling 12/24-hour format — same
      class of bug, not in the original list).

- [x] **The mobile navigation trigger is unreachable by keyboard.** ✅ **DONE**
      `.menu_Btn` is a 32×32 `<div>` with `tabIndex: -1`. On mobile and tablet the sidebar defaults to
      hidden, so this is the *only* route to navigation — and keyboard users cannot reach it.
      → Now `<button type="button" aria-label="Toggle navigation menu" aria-controls="app-sidebar">`
      with `aria-expanded` bound to the sidebar state. Verified: focusable, labelled, target exists.

- [x] **Data tables carry no table semantics.** ✅ **DONE**
      All pages build tables as `<ul class="rdrTable_body">` / `<li class="rdrTable_row">`
      (verified: `semanticTables: 0`, `rowTag: LI`). Screen readers announce "list, 50 items" with no
      column association, so a timer value is read with no indication of which column it belongs to.
      → ARIA grid roles added to the existing markup on **all six table pages** (mining/botany,
      fishing, sightseeing, aether currents, blue mage, weather). CSS-grid layout untouched. The empty
      actions column gets a visually-hidden "Actions" header so the column count matches.
      **Verified:** `role=table` present on every table page, column headers 4–7 per page, rows
      29–125, no layout shift.

- [x] **Filter buttons signal state with a non-standard attribute.** ✅ **DONE**
      `src/components/ui/buttons/toggleFilter.vue:2` uses `:enabled="enabled"`, styled via
      `&[enabled]` at line 62. Measured: **12 filter buttons, 0 with `aria-pressed`.** `enabled` is not
      a valid HTML attribute and conveys nothing to assistive tech — a screen-reader user cannot tell
      which filters are active.
      → `aria-pressed` added. One wrinkle worth recording: the **"Reset" button also passes
      `:enabled="true"`** purely for styling, so a blanket `aria-pressed` would have announced it as
      a permanently-pressed toggle. Added an `action` prop that suppresses `aria-pressed` for
      one-shot buttons. **Verified:** "Miner" reports `aria-pressed="true"`, "Reset" reports none.

- [x] **Icon-only controls are labelled by a hover-only CSS tooltip.** ✅ **DONE**
      **150–200 elements per page** carry `data-context`, rendered via `.hasContext::before`. Values
      include `"Track Node"`, `"View Details"`, `"Mining"`, and full material lists. Because it is a
      CSS `::before` on `:hover`, it is invisible to screen readers **and** unreachable on touch — the
      icon chips in the Attributes column have no other label at all.
      → Attribute chips now carry `role="img"` + `aria-label` with the same string, and the inner
      `<img>` takes `alt=""` so it isn't announced twice. `data-context` stays as the visual tooltip.
      **Verified:** chip exposes `role=img`, `aria-label="Mining"`, inner `alt=""`.

- [x] **Search input has no label and steals focus.** ✅ **DONE**
      `src/components/ui/buttons/inputSearchBar.vue:2` — `<input id="searchBox" type="text">` with a
      placeholder only, no `<label>`, no `aria-label`. Line 17 calls `searchBox.value?.focus()` on
      mount, which on mobile opens the keyboard and scrolls the page on every visit.
      → Visually-hidden `<label for>` added, `type="search"`, autofocus removed (now an opt-in
      `autofocus` prop). The hardcoded `id="searchBox"` became a per-instance id — two search bars on
      one page would previously have shared an id and silently broken the label association.
      **Verified:** computed accessible name is "Search by name", ids match, focus is no longer stolen
      on mount. Also fixed the P2 `min-width: 300px` here since it is the same element.
      **Not done:** debouncing. It is a perf concern rather than an access one — left for its own task.

- [x] **Zone picker is an inaccessible custom dropdown.** ✅ **DONE**
      `src/components/views/1_EorzeaOverview.vue:30-39`. The trigger `<button>` has no
      `aria-expanded`, `aria-haspopup`, or `aria-controls`; the panel has no `role="listbox"` and the
      options no `role="option"`. There is no arrow-key navigation, no Escape-to-close, no focus move
      into the panel and no focus restore on close.
      Also: the `▾` arrow is a **`<span>` sibling outside the button** (line 39) — clicking the arrow,
      the obvious affordance, does nothing.
      → Arrow moved inside the trigger; `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`
      and `aria-labelledby` added; panel is `role="listbox"` with `role="option"` + `aria-selected`
      children and `role="group"` per expansion; Escape closes and returns focus to the trigger.
      **Verified:** `aria-expanded` flips true/false, 60 options with exactly 1 selected, 6 labelled
      groups, Escape closes and focus returns to the trigger.
      **Not done:** full arrow-key roving focus between options. Options are reachable by Tab and the
      listbox is correctly described; roving focus is a refinement, tracked separately.

- [x] **The vista lightbox is a modal with no modal behaviour.** ✅ **DONE**
      `src/components/layouts/ExpandVistaImg.vue` — a `z-index: 15000` full-screen overlay with **no
      `role="dialog"`, no `aria-modal`, no close button, no Escape handler, no focus trap, no focus
      restore, and no background scroll lock**. The only dismissal is clicking the overlay, and since
      the image sits inside the clickable overlay, clicking the image dismisses it too.
      → Rebuilt as a real dialog: `role="dialog"`, `aria-modal="true"`, a labelled 44×44 close button
      focused on open, Escape to close, Tab focus trap, focus restored to the opener on close, body
      scroll locked while open, and `@click.stop` on the image so clicking it no longer dismisses.
      **Verified end-to-end** through the real flow (sightseeing → details → vista): all of the above
      confirmed, including scroll lock applied and released.

- [x] **Add a skip link.** ✅ **DONE** Measured: no skip link on any page. With a persistent sidebar of
      10 links plus a tracking bar, keyboard users traverse the same ~13 stops before reaching content
      on every navigation.
      → `<a class="skip-link" href="#main-content">` added as the first element, off-screen until
      focused; `<main>` given `id="main-content"` and `tabindex="-1"` so focus can land on it (with its
      own outline suppressed so the whole page doesn't get a ring).
      **Verified:** it is genuinely first in tab order and its target exists.

- [x] **Fix duplicate `<h1>` and unlabelled landmarks.** ✅ **DONE**
      Every page renders two `<h1>`s — the tracking-bar wordmark "FFXIV Radar" and the page title —
      plus two unlabelled `<header>` and two unlabelled `<footer>` landmarks.
      → Wordmark demoted from `<h1>` to `<p class="trackingbar_title">` (font-weight set explicitly,
      since `<p>` doesn't inherit the bold `<h1>` default — verified still 32px/700). Landmarks
      labelled, and the sidebar link list wrapped in `<nav aria-label="Main">`.
      **Verified:** exactly one `<h1>` on all 9 routes, nav landmark present with 10 links, sidebar
      layout unchanged (`.linkList` margin still `10px 0`).

- [x] **162 of 211 images have no `alt`.** ✅ **DONE**
      `src/components/api/iconImg.vue` generates a random DOM id and assigns `src` imperatively but
      never sets `alt`, so every item, job, expansion and weather icon is unlabelled.
      → `iconImg.vue` now accepts an `alt` prop defaulting to `""` (decorative), plus `loading="lazy"`.
      The news page's profile image got an explicit `alt=""`.
      **Verified:** 0 images without `alt` across all 9 routes (was 162 of 211).

### Found and fixed during this tier (not in the original audit)

- [x] **In compact sidebar mode, all 10 nav links were unnamed.** The compact layout renders
      icon-only (`linkList-collapse` drops the `<p>`), so the entire navigation had no accessible
      name — only visible at that one breakpoint, which is why the first audit pass missed it.
      → `aria-label` bound to the link name, always set regardless of layout.

- [x] **The donate control's click handler was on a wrapping `<div>`, not the control**, and it used
      `window.open` from a `<button>` to navigate. Icon-only in compact mode, so also unnamed.
      → Now a real `<a href target="_blank" rel="noopener noreferrer">` with an `aria-label` that
      states it opens in a new tab. This also closes the P3 "donate should be `<a>` in both places"
      item for the sidebar half.

- [x] **Sidebar clock toggle was a non-focusable `<div>`** (toggles 12/24-hour format).
      → Now a `<button>` with a label describing what the next press does.

---

## P2 — Mobile & touch

**✅ TIER COMPLETE.**

- [x] **254 of 257 pointer targets are under 44×44px at 375px wide.** ✅ **DONE**
      The track toggle is 26×26, sidebar link rows are 200×40. WCAG 2.2 AA requires 24×24 minimum;
      44×44 is the usability standard.
      → Icon buttons keep their 26px glyph but gain a 44×44 hit area via a centred `::after`, so row
      layout and icon size are unchanged. Pagination raised to 44×44.
      **Two corrections made during this work, both worth knowing:**
      1. First implementation gated on `@media (pointer: coarse)`, which never matches in a desktop
         browser at a narrow width — so it was unverifiable, and it contradicted the CLAUDE.md rule to
         drive responsive behaviour off the `windowWidth` class. Reworked onto `.app_container.mobile`.
      2. The enlarged targets then **overlapped by 18px**: the track and details buttons sit only 26px
         centre-to-centre, so each stole the other's edge taps — arguably worse than the original
         problem. Added an 18px gap (44px centre-to-centre) and widened the actions column 60px → 88px
         to fit it.
      **Verified:** 44px centre-to-centre, 0px overlap, and all 49 sampled points across each button's
      44×44 band hit the correct control. No horizontal overflow at 375px on any page.

- [x] **Detail data is entirely unavailable on mobile.** ✅ **DONE**
      `src/App.vue` suppressed the pane on mobile *and* tablet, and the tables hid the details button
      on mobile to match. Coordinates, bait and mooch chains, aetherial reduction yields and weather
      chains were unreachable on phones — the device most likely to be in hand while playing.
      → The pane now renders at **every** breakpoint. On mobile it is a full-width sheet below the
      tracking bar with a sticky header, `role="dialog"`, focus moved into it, body scroll locked and
      Escape to close; the 1:1 mini-map is relaxed to 4:3 so data is visible without scrolling. Tablet
      and desktop keep the 432px side panel unchanged, so the table stays visible for comparison.
      The `v-if="windowWidth !== 'mobile'"` guard was removed from all five details buttons.
      **Verified at three widths:** mobile 375px → 375px wide, `left: 0`, scroll locked, Escape closes;
      tablet 900px → 432px side panel, not full width, table still visible behind, no scroll lock;
      desktop 1440px → unchanged at 432px.
      **This also closes the P0 "dead control on tablet" item** — the button and the pane now agree.

- [x] **The tracking bar is 71px of dead chrome on mobile.** ✅ **DONE**
      The bar kept its full height while `style.scss` set its items to `display: none`, so it occupied
      ~9% of an 812px viewport showing only the wordmark.
      → Tracked nodes are now a horizontally scrollable, scroll-snapped strip of 240px cards; the
      wordmark shrinks to 1.25rem to give them room.
      **Verified:** items are `display: flex` with `overflow-x: auto` (was `none`).

- [ ] **The filter bar consumes 404px on a 375px viewport** — more than half the screen before any
      data is visible, because 12 filter pills plus search wrap into many rows.
      ⚠️ **A mobile "Filters (n)" disclosure was implemented and then reverted at the maintainer's
      request** — the collapsed layout was not wanted. The filter bar is back to rendering inline at
      every breakpoint, matching the committed version exactly.
      → Still open. Any future attempt should keep the filters visible rather than hiding them behind
      a toggle; reclaiming the space from the page header (see below) is the larger win anyway.

- [x] **Search input has a hard `min-width: 300px`** ✅ **DONE** (`inputSearchBar.vue`), leaving 75px of
      margin on a 375px screen and forcing the filter bar to wrap.
      → Now `width: 100%; max-width: 300px`. Fixed alongside the P1 label work on the same element.

- [x] **Table text drops to 12px on mobile** ✅ **DONE** (measured on `.rdrTable_row`). Below the ~16px
      baseline that avoids iOS zoom-on-focus and hard to read for dense numeric data like timers.
      → Base mobile size raised 12px → 14px; `input`/`select`/`textarea` pinned to 16px so iOS Safari
      does not zoom the viewport on focus. **Verified:** row text now computes to 14px.

### Still open after this tier

- [ ] **The page header consumes 253px of an 812px mobile viewport**, 195px of which is the all-caps
      tagline paragraph. With filters collapsed the first data row still starts at y≈540 — about a
      third of the screen is data. Not in the original audit (that measured the filter bar, which is
      now fixed) and **not addressed**, because shortening or clamping the tagline is a content
      decision rather than a layout bug.
      → Options: clamp to ~3 lines on mobile with the full text still in the DOM for SEO, drop the
      tagline below the table on mobile, or shorten the copy.

---

## P3 — Polish, consistency & dead code

**✅ TIER COMPLETE.** 13 dead files deleted, 11 distinct page titles, reduced-motion support with
static fallbacks for every state indicator, and the last raw colour moved onto the palette.

- [x] **Add a global focus-visible system.** ✅ **DONE** — pulled forward into the P1 pass, because the
      newly-focusable controls were reachable but invisible without it.
      → One `:focus-visible` rule in `style.scss`: `outline: 2px solid $teal; outline-offset: 2px`.
      **Verified** present in the loaded stylesheet as `rgb(45, 212, 191) solid 2px`.

- [x] **Add a `prefers-reduced-motion` guard.** ✅ **DONE** Zero blocks repo-wide, while four infinite
      keyframe loops (`timerActiveAnimation`, `rowActiveAnimation`, two map-icon pulses) ran
      continuously.
      → A global `@media (prefers-reduced-motion: reduce)` block in `style.scss`.
      **The important detail:** switching the loops off wholesale would have destroyed information —
      the row pulse and the green colour cycle *are* the "this node is up right now" signal, so a
      blanket kill would leave active and inactive rows identical. Each looping indicator therefore
      gets a **static equivalent**: active rows take the mid-pulse teal background, the active
      countdown takes a solid `$green` + weight 600, and active map icons take a static glow.
      Loading spinners are explicitly exempted and keep turning — a frozen spinner reads as a hung
      page, which is worse than the motion it avoids.
      The starfield is a canvas rAF loop that CSS cannot reach, so `starCanvas.vue` now checks
      `matchMedia` and paints once at rest instead, re-evaluating if the preference changes.
      **Verified:** all 5 reduced-motion rules present in the loaded stylesheet with the expected
      values.
      ⚠️ **Caveat:** the *animated* path could not be exercised in this environment — the browser
      pane does not composite, so `document.hidden` is true and **rAF never fires** (0 callbacks in
      1.6s, confirmed by direct measurement). The static path and repaint-on-resize are verified;
      the twinkle loop should be eyeballed once in a real browser.

- [x] **Every route has the same `<title>`.** ✅ **DONE** All 12 routes reported `"FFXIV Radar"`.
      → `meta.title` per route in `src/main.ts`, applied in a `router.afterEach` guard (after
      navigation, so it reflects the route actually landed on) as `"<page> | FFXIV Radar"`.
      **Verified:** all 11 navigable routes now produce **11 distinct titles**.
      **Not done:** per-route meta *descriptions*. They need real copy per page and only affect
      crawlers, so they are better handled as a content task.

- [x] **Overview page copy promises features that don't exist.** ✅ **DONE**
      Its tagline read *"…switch between **tabs** to view mining nodes… Use the **search tab** to find
      any resource across all zones by name."* There are **0 search inputs on that page**, and the
      layer switcher is a radio group, not tabs.
      → Copy corrected to describe what the page does: "choose a data layer", plus a mention of the
      marker toggles. **Verified:** neither "search tab" nor "switch between tabs" appears on the page.
      **Deliberately not built:** the cross-zone search itself. It is a genuine feature request, not a
      copy bug, and remains the single most valuable thing the app can't do.

- [x] **Disabled filter buttons are effectively invisible.** ✅ **DONE**
      `toggleFilter.vue` set `opacity: 0.1`, dropping the label far below any legibility threshold.
      → Raised to `opacity: 0.4`, `cursor: not-allowed` retained. Done alongside the `aria-pressed`
      work on the same component.

- [x] **Home "Quick access" is missing two pages.** ✅ **DONE** The grid omitted **Timed Fishing** and
      **Weather Patterns**, both in the sidebar. Fishing is one of the app's two headline features.
      → Both added (Timed Fishing as a `featured` card, matching its prominence in the sidebar).
      **Verified:** home and sidebar now expose the same 10 routes — no gaps either way, no dead links.

- [x] **Inconsistent route casing and control semantics.** ✅ **DONE**
      - `/eorzeaoverview` renamed to `/eorzeaOverview`, matching `/aetherCurrents` and `/timedFishing`.
        **No redirect was needed, contrary to the original recommendation:** vue-router matches paths
        case-insensitively by default, so old bookmarks still resolve — verified that
        `/eorzeaoverview`, `/eorzeaOverview` and `/EORZEAOVERVIEW` all resolve to the same route with
        `hasRedirect: false`. The redirect entry I first added was provably unreachable and was removed
        rather than left as dead config.
      - Donate control is now an `<a href target="_blank" rel="noopener noreferrer">` in the sidebar,
        matching the home footer (done during the P1 pass).
      - `Private Policy` → **Privacy Policy** in the sidebar nav and the page's own `<h1>`.
        (The route path `/privatePolicy` is unchanged — renaming it would break inbound links for no
        user-visible gain.)

- [x] **Delete dead code.** ✅ **DONE** — **13 files removed** (via `git rm`, so all recoverable):
      `layouts/MapDisplay.vue`, `layouts/zoneSelection.vue`, `layouts/searchSelection.vue`,
      `ui/buttons/toggleMenu.vue`, `ui/displayWeather.vue`, `ui/displayAreaText.vue`,
      `api/mapImg.vue`, `api/weatherForecast.vue`, and all five `ui/overviewListItem/*` components
      (the directory is now gone). The orphaned `.overviewListItem` block (46 lines) was removed from
      `style.scss`, and a stale `MapDisplay.vue` reference in a `DetailsPane.vue` comment was reworded.
      `.tug { color: lime }` → `$green`, removing the last raw colour outside the palette.
      **Two near-misses worth recording** — a naive name grep called both of these "live":
      - `api/weatherForecast.**vue**` is dead, but `api/weatherForecast.**ts**` is very much alive
        (imported by `App.vue`, `9_WeatherPatterns.vue` and `hooks.ts`). Those imports are
        extensionless and Vite's default `resolve.extensions` does not include `.vue`, so they hit the
        `.ts`. Only the `.vue` was deleted.
      - `api/mapImg.vue` was imported — but *only* by `MapDisplay.vue`, which is itself dead, so it was
        transitively dead. Likewise `toggleMenu.vue` looked referenced because `App.vue` has a
        *method* named `toggleMenu`.
      **Verified:** build passes and no references to any deleted file remain.

---

## Suggested sequencing

1. **P0** — a single short session; these are outright bugs and several are one-line fixes.
2. **P1 buttons + focus-visible (P3)** — do these together. Converting the `<div>` controls to
   `<button>`s is what makes a focus indicator meaningful, and it unblocks the rest of P1.
3. **P1 remainder** — ARIA table roles, tooltip→`aria-label`, modal semantics, landmarks.
4. **P2** — needs design decisions (especially the mobile details sheet), so scope it separately.
5. **P3** — opportunistic.

## Notes for whoever picks this up

- **`CLAUDE.md` is stale on testing.** It states there is no test framework, but the project has
  vitest, `@vue/test-utils`, jsdom and a `vitest.config.ts`. Run with `npm test`. Worth correcting
  that section.
- **⚠️ `src/components/ui/displayItemName.test.ts` was lost.** It existed and passed (8 tests) earlier
  in this session; it is now absent from both the working tree and `HEAD`, dropped in commit
  `05f073d`. `displayItemName.vue` itself is still in use on every table page, so that component now
  has no coverage — the suite went from 17 tests to 9. Recoverable from git history if the removal
  was unintentional.
- **`.claude/launch.json` pins port 6020**, but 6020 was occupied and Vite actually served **6021**.
- No automated accessibility tooling is wired up. Adding `vitest-axe` to the existing vitest setup
  would keep the P1 fixes from regressing.
