# FFXIV Radar — UI/UX Audit & Remediation Task List

**Audited:** 2026-07-26 · **Scope:** all 12 routes at 1440px (desktop), 900px (tablet), 375px (mobile)

Findings were gathered by running the dev server and inspecting the live DOM, computed styles, and
accessibility tree, then cross-checked against source. Every claim below is backed by a measured
value or a verified file reference — nothing is inferred from appearance alone.

---

## Executive summary

| Tier | Theme | Count |
|---|---|---|
| **P0** | Functional bugs — broken today | 7 — **4 done**, 3 open |
| **P1** | Keyboard & screen-reader access | 11 |
| **P2** | Mobile & touch | 6 |
| **P3** | Polish, consistency, dead code | 8 |
| | **Total** | **32 — 4 done, 28 open** |

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

- [ ] **`<main>` collapses to 12px at every viewport.**
      `src/style/style.scss:109` — `height: calc($trackingbarHeight + 200px - 100vh)` evaluates to
      `70px + 200px - 100vh`, which is negative on any viewport taller than 270px. Measured
      `computed height: 12px` at 1440×900, 900×800 and 375×812. Page content is visible only because
      children overflow the collapsed box.
      → Almost certainly intended as `min-height: calc(100vh - ($trackingbarHeight + 200px))`. Fix the
      operand order and verify no layout depends on the broken value.

- [ ] **"View Details" is a dead control on tablet.**
      At 900px the tables render **50 visible details buttons**, but `src/App.vue:48` gates the pane on
      `windowWidth !== 'tablet' && windowWidth !== 'mobile'`. Verified by clicking one and confirming
      `.details` never enters the DOM. Buttons are correctly hidden on mobile but not on tablet.
      → Either hide the button at tablet width to match mobile, or (better, see P2) let the pane render
      at tablet width.

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

The largest tier and the highest-impact work. Tasks are ordered by payoff.

- [ ] **Convert the three core controls from `<div>`/`<li>` to `<button>`.** *(single highest-impact task)*
      - `src/components/ui/buttons/toggleTracking.vue:2` — root is `<div class="trackingTriggerBtn">`
      - `src/components/ui/buttons/toggleDetailMenu.vue` — same pattern
      - `.pagenation_item` `<li>`s in `2_TimedMiningBotany.vue` / `10_TimedFishing.vue`
        (verified: `<li class="pagenation_item pageActive">1</li>`, **0 focusable children**)

      None are focusable, none expose a role, none have an accessible name, none respond to Enter or
      Space. Measured on `/timedNodes`: **212 non-native controls, 25 tab stops.**
      → Use real `<button type="button">` with `aria-label` (see the tooltip task below for the label
      source). Add `aria-pressed` to the track toggle and `aria-current="page"` to the active page
      number.

- [ ] **The mobile navigation trigger is unreachable by keyboard.**
      `.menu_Btn` is a 32×32 `<div>` with `tabIndex: -1`. On mobile and tablet the sidebar defaults to
      hidden, so this is the *only* route to navigation — and keyboard users cannot reach it.
      → `<button type="button" aria-label="Toggle navigation menu" aria-expanded="…">`.

- [ ] **Data tables carry no table semantics.**
      All pages build tables as `<ul class="rdrTable_body">` / `<li class="rdrTable_row">`
      (verified: `semanticTables: 0`, `rowTag: LI`). Screen readers announce "list, 50 items" with no
      column association, so a timer value is read with no indication of which column it belongs to.
      → Add ARIA grid roles (`role="table"` / `rowgroup` / `row` / `columnheader` / `cell`) to the
      existing markup. This preserves the CSS-grid layout and is far cheaper than restructuring to
      `<table>`. `2_TimedMiningBotany.vue` is the canonical page — fix it first and mirror.

- [ ] **Filter buttons signal state with a non-standard attribute.**
      `src/components/ui/buttons/toggleFilter.vue:2` uses `:enabled="enabled"`, styled via
      `&[enabled]` at line 62. Measured: **12 filter buttons, 0 with `aria-pressed`.** `enabled` is not
      a valid HTML attribute and conveys nothing to assistive tech — a screen-reader user cannot tell
      which filters are active.
      → Add `:aria-pressed="!!enabled"` and switch the CSS to `&[aria-pressed="true"]`.

- [ ] **Icon-only controls are labelled by a hover-only CSS tooltip.**
      **150–200 elements per page** carry `data-context`, rendered via `.hasContext::before`. Values
      include `"Track Node"`, `"View Details"`, `"Mining"`, and full material lists. Because it is a
      CSS `::before` on `:hover`, it is invisible to screen readers **and** unreachable on touch — the
      icon chips in the Attributes column have no other label at all.
      → Move the string into `aria-label` (or visually-hidden text) on the control and keep
      `data-context` purely decorative.

- [ ] **Search input has no label and steals focus.**
      `src/components/ui/buttons/inputSearchBar.vue:2` — `<input id="searchBox" type="text">` with a
      placeholder only, no `<label>`, no `aria-label`. Line 17 calls `searchBox.value?.focus()` on
      mount, which on mobile opens the keyboard and scrolls the page on every visit.
      → Add a visually-hidden `<label for="searchBox">`, use `type="search"`, and remove the autofocus
      (or make it opt-in via prop). Consider debouncing — filtering currently runs on every keystroke
      across ~550 rows.

- [ ] **Zone picker is an inaccessible custom dropdown.**
      `src/components/views/1_EorzeaOverview.vue:30-39`. The trigger `<button>` has no
      `aria-expanded`, `aria-haspopup`, or `aria-controls`; the panel has no `role="listbox"` and the
      options no `role="option"`. There is no arrow-key navigation, no Escape-to-close, no focus move
      into the panel and no focus restore on close.
      Also: the `▾` arrow is a **`<span>` sibling outside the button** (line 39) — clicking the arrow,
      the obvious affordance, does nothing.
      → Move the arrow inside the `<button>`, add the listbox ARIA pattern and key handling.

- [ ] **The vista lightbox is a modal with no modal behaviour.**
      `src/components/layouts/ExpandVistaImg.vue` — a `z-index: 15000` full-screen overlay with **no
      `role="dialog"`, no `aria-modal`, no close button, no Escape handler, no focus trap, no focus
      restore, and no background scroll lock**. The only dismissal is clicking the overlay, and since
      the image sits inside the clickable overlay, clicking the image dismisses it too.
      → Add a real close button, `role="dialog" aria-modal="true"`, Escape handling, focus trap and
      restore, and stop propagation on the image.

- [ ] **Add a skip link.** Measured: no skip link on any page. With a persistent sidebar of 10 links
      plus a tracking bar, keyboard users traverse the same ~13 stops before reaching content on every
      navigation.
      → `<a class="skip-link" href="#main">Skip to content</a>` as the first focusable element.

- [ ] **Fix duplicate `<h1>` and unlabelled landmarks.**
      Every page renders two `<h1>`s — the tracking-bar wordmark "FFXIV Radar" and the page title —
      plus two unlabelled `<header>` and two unlabelled `<footer>` landmarks.
      → Demote the wordmark to a `<p>`/`<span>` (or `<div role="banner">` without heading semantics),
      leave one `<h1>` per page, and add `aria-label` to distinguish the landmarks. Wrap the sidebar
      link list in a `<nav aria-label="Main">` — it currently sits bare inside `<aside>`.

- [ ] **162 of 211 images have no `alt`.**
      `src/components/api/iconImg.vue` generates a random DOM id and assigns `src` imperatively but
      never sets `alt`, so every item, job, expansion and weather icon is unlabelled.
      → Accept an `alt` prop; pass `alt=""` for decorative icons that sit beside a text label (most of
      them), and a real string where the icon is the only content.

---

## P2 — Mobile & touch

- [ ] **254 of 257 pointer targets are under 44×44px at 375px wide.**
      The track toggle is 26×26 (`toggleTracking.vue:19-20`), sidebar link rows are 200×40. WCAG 2.2
      AA requires 24×24 minimum; 44×44 is the usability standard.
      → Raise the icon buttons to a 44×44 hit area (padding, not icon size — keep the 18px glyph).

- [ ] **Detail data is entirely unavailable on mobile.**
      `src/App.vue:48` suppresses the pane on mobile, and the tables hide the details button to match.
      Coordinates, bait and mooch chains, aetherial reduction yields, and weather chains are therefore
      unreachable on phones — the device most likely to be in hand while playing.
      → Render the details pane as a full-screen sheet or bottom drawer on mobile/tablet rather than
      hiding the feature.

- [ ] **The tracking bar is 71px of dead chrome on mobile.**
      The bar keeps its full height while `style.scss` sets its items to `display: none`, so it
      occupies ~9% of a 812px-tall viewport showing only the wordmark. Tracking is the app's key
      retention feature and it is invisible on mobile.
      → Either collapse the bar to the wordmark height, or make tracked items a horizontally
      scrollable strip.

- [ ] **The filter bar consumes 404px on a 375px viewport** — more than half the screen before any
      data is visible, because 12 filter pills plus search wrap into many rows.
      → Collapse filters into an expandable "Filters" disclosure on mobile, showing the active count.

- [ ] **Search input has a hard `min-width: 300px`** (`inputSearchBar.vue:22`), leaving 75px of margin
      on a 375px screen and forcing the filter bar to wrap.
      → Use `width: 100%; max-width: 300px`.

- [ ] **Table text drops to 12px on mobile** (measured on `.rdrTable_row`). Below the ~16px baseline
      that avoids iOS zoom-on-focus and hard to read for dense numeric data like timers.
      → Raise to at least 14px, and 16px for the search input specifically.

---

## P3 — Polish, consistency & dead code

- [ ] **Add a global focus-visible system.** Only 4 `:focus` rules exist in the entire codebase, all
      page-scoped (`10_TimedFishing.vue:316`, `2_TimedMiningBotany.vue:316`,
      `1_EorzeaOverview.vue:1324` and `:1508`). There is no app-wide focus indicator.
      → Add one `:focus-visible` rule in `style.scss` using `$teal` with a 2px offset outline. Pairs
      with the P1 button conversions — those controls cannot show focus until they are focusable.

- [ ] **Add a `prefers-reduced-motion` guard.** Zero blocks repo-wide, while four infinite keyframe
      loops (`timerActiveAnimation`, `rowActiveAnimation`, two map-icon pulses) run continuously — 4
      animating elements measured on a default page load, more as nodes go active.
      → Wrap the loops in `@media (prefers-reduced-motion: no-preference)`, or disable
      `animation-iteration-count` under `reduce`. Also covers `toggleFilter.vue:76`'s
      `transform: scale(1.05)` hover.

- [ ] **Every route has the same `<title>`.** All 12 routes report `"FFXIV Radar"`. Bookmarks, history
      and open tabs are indistinguishable, and it costs organic search traffic.
      → Add `meta.title` per route in `src/main.ts` and set it in an `afterEach` guard; add per-route
      meta descriptions for the content-heavy pages.

- [ ] **Overview page copy promises features that don't exist.**
      Its tagline reads *"…switch between **tabs** to view mining nodes… Use the **search tab** to find
      any resource across all zones by name."* There are **0 search inputs on that page**, and the
      layer switcher is a radio group, not tabs.
      → Either build the cross-zone search (genuinely valuable — it's the one thing the app can't do)
      or correct the copy. Shipping copy that describes absent features erodes trust immediately.

- [ ] **Disabled filter buttons are effectively invisible.**
      `toggleFilter.vue:64` sets `opacity: 0.1`, dropping the label far below any legibility threshold.
      → Use `opacity: 0.4` plus `cursor: not-allowed`, and keep the label readable.

- [ ] **Home "Quick access" is missing two pages.** The grid omits **Timed Fishing** and **Weather
      Patterns**, both of which are in the sidebar. Fishing is one of the app's two headline features.
      → Add both cards.

- [ ] **Inconsistent route casing and control semantics.**
      - `/eorzeaoverview` is all-lowercase while every other multi-word route is camelCase
        (`/aetherCurrents`, `/timedFishing`). → Normalise, with a redirect from the old path.
      - The donate control is a `<button>` in `Sidebar.vue` but an `<a href>` in the home footer, for
        the same PayPal destination. → Use `<a>` in both; it is navigation, not an action.
      - `Private Policy` should read **Privacy Policy** (the home footer already says "Privacy Policy",
        the sidebar says "Private Policy").

- [ ] **Delete dead code.** None of these are imported anywhere:
      `layouts/MapDisplay.vue`, `layouts/zoneSelection.vue`, `layouts/searchSelection.vue`,
      `ui/buttons/toggleMenu.vue`, `ui/displayWeather.vue`, `ui/displayAreaText.vue`,
      `api/mapImg.vue`, `api/weatherForecast.vue`, and all five `ui/overviewListItem/*` components.
      The `.overviewListItem` styles still ship in `style.scss` and can go with them.
      Also `style.scss` has `.tug { color: lime }` — a raw named colour outside the palette; replace
      with a token from `variables.scss`.

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
  vitest, `@vue/test-utils`, jsdom, a `vitest.config.ts`, and two existing tests
  (`src/components/api/itemIcon.test.ts`, `src/components/ui/displayItemName.test.ts`). Run with
  `npm test`. Worth correcting that section before starting.
- **`.claude/launch.json` pins port 6020**, but 6020 was occupied and Vite actually served **6021**.
- No automated accessibility tooling is wired up. Adding `vitest-axe` to the existing vitest setup
  would keep the P1 fixes from regressing.
