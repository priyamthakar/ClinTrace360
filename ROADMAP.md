# ClinTrace360 — Forward Roadmap & Milestones (to completion)

> Companion to `HANDOVER.md` (current state) and `ClinTrace360_PROJECT_PLAN.md` (original product spec).
> This file is the **future-looking plan**: every milestone from where we are now (2026-06-20) through the project's natural end state.
> Status legend: ☐ not started · ◐ partial · ✅ done

---

## Where we are

Original Phases 1–4 of `ClinTrace360_PROJECT_PLAN.md` are **functionally complete and live** on Vercel. The app has all 5 modules, deterministic engines, exports, local history, responsive CSS, and honest limitations. What follows is everything that turns a "built demo" into a **finished, recruiter-grade, defensible portfolio artifact** — and the optional stretch work beyond that.

The roadmap is organized into **milestones M0–M9**, ordered by dependency and value. M0–M3 are the realistic "definition of done" for the portfolio goal. M4–M7 add depth and credibility. M8–M9 are stretch/optional.

---

## M0 — Clean baseline (immediate, blocking)

**Goal:** Working tree is clean, committed, and pushed; nothing half-finished sits uncommitted.

- ✅ Decide with user: commit the 3 uncommitted files (responsive CSS + `.gitignore` + `PROJECT_CONTEXT.md`).
  - Committed as `670c914` — "Add responsive CSS hardening; add handover and roadmap docs" (5 files, +416/−5).
- ✅ `npm run build` green (verified: ✓ 2340 modules, 8.79s, no warnings).
- ✅ Push to `main` → origin in sync (`528b0f8..670c914`); Vercel auto-deploy triggered.
- ✅ `git status` clean afterward; branch up to date with `origin/main`.

**Exit criteria:** MET — `git status` clean, origin in sync, live site shows the responsive changes.
**Note:** pushing `main` = production deploy. Confirmed with user before push.

---

## M1 — Visual proof (screenshots & demo assets)

**Goal:** README and repo carry real visuals; a recruiter sees the app without running it.

- ☐ Capture screenshots of all 5 modules from the **live Vercel site** (headless Chromium crashes locally — do not retry headless here; use the real browser or ask the user).
  - Data Review Dashboard (show the injected anomalies: SITE-103 ALT signal, SITE-104 zero-AE, SITE-105 implausible HGB).
  - SAE/Lab Reconciliation (a populated query log).
  - Protocol→DQP (a generated DQP package).
  - CRF→SDTM Mapper (a mapping table with confidence column).
  - Rule Library.
- ☐ Capture at least one **mobile-width** screenshot to prove responsive work.
- ☐ Save to `docs/screenshots/` (directory exists, currently empty).
- ☐ Embed in `README.md` under a "Screenshots" section.
- ☐ Optional: a short GIF/screen recording of clicking through modules.

**Exit criteria:** `docs/screenshots/` populated; README renders images on GitHub.

---

## M2 — Visual & responsive QA

**Goal:** Confirm the app actually looks right, not just that it builds.

- ☐ Eyeball desktop (≥1280px), tablet (768px), mobile (480px and ~375px) on the live site.
- ☐ Verify: tab rows scroll horizontally; card-head actions wrap; mobile nav works; tables scroll; no horizontal page overflow.
- ☐ Check charts (Recharts) resize cleanly at small widths.
- ☐ Verify dark theme contrast is legible (accent `#5E6AD2` on `#0E0F11`).
- ☐ Cross-browser smoke test: Chrome, Edge, Firefox, mobile Safari if possible.
- ☐ Log any defects as issues; fix layout regressions in `src/styles.css`.

**Exit criteria:** No layout breakage at any tested width; documented QA pass.

---

## M3 — Test coverage (credibility floor)

**Goal:** The deterministic logic is verified by automated tests — the single biggest credibility gap for a data-quality tool.

- ✅ Add a test runner (Vitest — native to Vite, lowest friction). Add `npm test` script.
- ✅ Refactor minimally if needed so pure functions are importable (`generateSyntheticTrialData`, `generateFindings`, `generateReconciliation`, CRF mapping, DQP generation). Kept the single-file artifact and added named helper exports.
- ◐ Unit tests for **the rule engine** (`generateFindings`): key seeded checks now covered; exhaustive clean/dirty fixtures for every rule are still pending.
  - ALT >3× ULN, implausible HGB, missing visit, visit-window, AE-before-dose, AE-end-before-start, zero-AE site, age eligibility, consent-date, placebo-dose, dose inconsistency.
- ✅ Unit tests for **reconciliation** (`generateReconciliation`): each mismatch category is produced (MISSING_IN_AE, MISSING_IN_SAFETY, TERM/DATE mismatch, reporting breach, lab missing/value/unit mismatch).
- ✅ Unit tests for **determinism**: same generation → identical output (seed stability).
- ✅ Unit tests for **CRF→SDTM** presets map to expected domains/variables.
- ✅ Unit tests for **DQP generation** produces all required sections.
- ☐ Wire tests into CI (see M4).

**Current verification:** `npm test` green (8 tests) and `npm run build` green after test/export changes. Tests caught and fixed: SITE-104 zero-AE seed contamination, unreachable SAE date-mismatch classification.
**Exit criteria:** `npm test` green; rule/recon engines have meaningful coverage; tests run in CI.

---

## M4 — CI/CD hardening

**Goal:** Every push is automatically built and tested; deploy story is unambiguous.

- ✅ GitHub Actions workflow: on push/PR → `npm ci`, `npm test`, `npm run build`.
- ✅ Reconcile deploy story: Vercel is canonical production deploy; GitHub Actions is CI only.
- ✅ Add a build/test status badge to `README.md`.
- ☐ Branch protection optional: require CI green before merge to `main`.

**Exit criteria:** Green CI badge on README; one documented deploy path.

---

## M5 — Content depth & clinical realism

**Goal:** Deepen the domain content so a CDM reviewer finds it convincing, not thin.

- ☐ Expand `RULE_LIBRARY` with more standard edit checks (date logic, range checks per analyte, cross-domain consistency) and ensure each maps to a real ICH/FDA/CDISC basis.
- ☐ Add MedDRA/WHO-DD **coding** touchpoint to the DQP output (the JD calls out coding activities) — at minimum a documented coding plan section and version references.
- ☐ Add a **Database Lock checklist** view or section (already named in the DQP spec §107) as a first-class, visible artifact.
- ☐ Strengthen CRF→SDTM with a few more domains (MH, DS, SC) and clearer SDTMIG section references.
- ☐ Verify all CDISC references cite a specific SDTMIG version (e.g., v3.4) and CT date.
- ☐ Add inline tooltips/help explaining *why* each finding matters (regulatory rationale).

**Exit criteria:** Each module shows depth a CDM would recognize; no placeholder-feeling content.

---

## M6 — UX polish & states

**Goal:** Production-feel interactions; no rough edges.

- ☐ Loading / empty / error states across modules (especially NCT lookup which depends on network + CORS).
- ☐ Graceful failure + retry messaging for ClinicalTrials.gov fetch.
- ☐ Sortable/filterable findings and query tables (spec'd in original plan §404).
- ☐ Drill-down interactions: click a site bar → site detail; click a finding → record detail popup (spec'd but verify implemented).
- ☐ Keyboard accessibility & ARIA review (nav already has aria-labels; extend to tables/dialogs).
- ☐ Persist active module / user inputs across reload where sensible.

**Exit criteria:** No dead-end states; interactions feel complete; basic a11y pass.

---

## M7 — Documentation & narrative (recruiter-facing)

**Goal:** The repo tells a complete, honest, role-aligned story.

- ☐ README: ensure the JD skill-evidence mapping is current and each of the 5 modules maps to a named JD requirement (eCRF design input, DQP prep, UAT, data review incl. local lab, SAE reconciliation, coding, GCP/audit readiness).
- ☐ Keep `PROJECT_CONTEXT.md` (current state) and this `ROADMAP.md` (future) in sync after each milestone.
- ☐ Update `docs/DATA_MODEL.md` if data model changes during M5.
- ☐ Add a short "How to evaluate this in 5 minutes" path for a hiring manager (which anomalies to look for, where).
- ☐ Ensure the in-app Methodology/About panel matches the README limitations exactly.
- ☐ Write a 2–3 line LinkedIn/portfolio blurb the user can reuse.

**Exit criteria:** A reviewer can understand purpose, scope, and honest limits in minutes.

---

## ✅ Definition of Done (portfolio goal)

The project is **complete for its stated purpose** when M0–M7 are done:
clean repo, live deploy, real screenshots, responsive-verified, tested engines, green CI, deep/honest content, polished UX, and a recruiter-ready narrative. **This is the realistic end of the project.** M8–M9 below are optional stretch work the user may choose not to pursue.

---

## M8 — Optional: LLM-assisted modules (stretch)

**Goal:** Add genuine NLP assistance for ambiguous, sponsor-specific content — the original plan's vision for Modules 1 & 2.

- ☐ Decision gate with user: this introduces an **API dependency and key management** the project deliberately avoided. Only proceed if the user wants it.
- ☐ If yes: use the latest Claude model (default to the newest Opus/Sonnet at build time; check `claude-api` skill for current model IDs). Never hardcode an outdated model ID.
- ☐ Protocol→DQP: optional LLM extraction path for free-text protocols that don't fit the deterministic parser, with the rule-based path as fallback.
- ☐ CRF→SDTM: optional LLM mapping for non-standard/custom CRF fields, with confidence and a "human review required" flag.
- ☐ Keep a clear toggle: deterministic mode (no key) vs LLM-assisted mode (key required).
- ☐ Secure key handling (never commit keys; use env / serverless proxy, not client-exposed keys).
- ☐ Update limitations: LLM outputs are drafts requiring qualified CDM review.

**Exit criteria:** LLM features are additive, optional, fall back gracefully, and never expose secrets.

---

## M9 — Optional: future enhancements (long-tail / stretch)

Pursue any of these only if the user wants to keep extending the project:

- ☐ CSV/file **import** so a user can run the review engine on their own (synthetic) dataset.
- ☐ Validation narrative: a documented "test protocol" mapping each rule to expected behavior (mimics CDM validation documentation — strong portfolio signal).
- ☐ Query lifecycle simulation: open → answered → closed state transitions with timestamps.
- ☐ Additional SDTM domains and a fuller controlled-terminology reference.
- ☐ Print/PDF export of the DQP package (beyond TXT).
- ☐ Theme/accessibility: light mode, high-contrast option.
- ☐ Analytics-free usage notes; performance budget check on bundle size (charts chunk is ~384 kB).
- ☐ Internationalization of date handling / units if expanding examples.
- ☐ A short technical blog post / case study writeup linked from README.

**Exit criteria:** None required — this is open-ended extension territory.

---

## Suggested execution order (one-line summary)

```
M0 commit/push  →  M1 screenshots  →  M2 responsive QA  →  M3 tests  →
M4 CI/CD  →  M5 content depth  →  M6 UX polish  →  M7 docs/narrative
   ────────────────  Definition of Done  ────────────────
→ (optional) M8 LLM assist  →  (optional) M9 long-tail enhancements
```

## Guardrails that apply to every milestone

- Keep the **single-file React artifact** (`ClinTrace360.jsx`) unless a milestone genuinely requires a split (M3 may need a tiny export).
- Prefer **deterministic, transparent, rule-based** logic; reserve LLM for M8 and gate it behind user opt-in.
- Never claim production validation, real patient data, or real EDC integration.
- Pushing to `main` is a **production deploy** — confirm before pushing.
- Never import a Lucide icon that shadows a JS built-in (`Map`, `Set`, `URL`) without aliasing.
- After each milestone, update `PROJECT_CONTEXT.md` and check this roadmap's status boxes.
```
