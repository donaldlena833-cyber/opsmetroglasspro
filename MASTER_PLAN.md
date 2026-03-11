# MetroGlassOps Master Plan

## Current State

The app already has strong business coverage for jobs, expenses, invoices, reminders, clients, and reports. The biggest gaps are not missing pages. They are stability, consistency, and workflow polish:

- Production build was brittle because the root layout depended on a remote Google Font.
- `npm run lint` is not usable yet because the repo has no ESLint setup.
- The visual system drifted away from the MetroGlass Pro site, with mixed navy/orange/rainbow accents and inconsistent surface styling.
- Shared UI primitives still carry too many hardcoded presentation choices, which makes theme changes expensive.
- Some high-traffic screens are visually cramped on mobile, especially summary cards and action-heavy views.
- Large route components mix data fetching, business rules, and rendering, which will slow future feature work.

## Completed In This Pass

- Removed the remote font dependency so offline/restricted builds are no longer blocked by Google Fonts.
- Shifted the shared palette toward cream, charcoal, and muted bronze.
- Restyled shared surfaces, buttons, inputs, badges, dialogs, and sheets for a calmer branded look.
- Polished the login experience, bottom navigation, quick actions sheet, and dashboard stat cards.
- Fixed the dashboard stat grid so it does not cram three cards into tiny mobile columns.

## Phase 1: Stabilize The Foundation

Goal: make the app safe to build, debug, and change quickly.

- Add ESLint with `next/core-web-vitals` and make `npm run lint` non-interactive.
- Add environment validation for Supabase and service-role variables so config failures are explicit.
- Add route-level `error.tsx` boundaries for protected sections.
- Standardize loading, empty, and error states across jobs, clients, invoices, expenses, and reports.
- Add a small seeded QA dataset or fixture strategy so UI changes can be verified without real production data.
- Audit package vulnerabilities and upgrade only the packages that are low-risk to move.

## Phase 2: Workflow And UX Cleanup

Goal: make daily use smoother for office and field workflows.

- Rework screen headers so every major page has the same hierarchy: title, context, primary action.
- Add consistent search, filtering, sorting, and saved views on jobs, invoices, clients, and expenses.
- Promote the most-used job actions into clearer contextual actions inside job detail, not only the global quick sheet.
- Improve mobile spacing and information density on lists, especially job cards and invoice rows.
- Make reminders more actionable with overdue, due-soon, and completed groupings.
- Tighten settings and reports navigation so secondary screens feel easier to find.

## Phase 3: Code Organization And Maintainability

Goal: reduce future change cost.

- Split large route components into feature folders by domain: `jobs`, `expenses`, `invoices`, `clients`, `reports`.
- Move Supabase queries into typed data helpers so view components stop mixing fetch logic with presentation.
- Centralize semantic UI tokens for statuses, payment states, and reminders instead of scattering color strings.
- Extract reusable mobile list card patterns and confirmation flows.
- Remove duplicated formatting logic by consolidating shared helpers.

## Phase 4: High-Value Feature Additions

Goal: add the features that will make the app feel like an operations hub instead of a record system.

- Global search across jobs, clients, invoices, and reminders.
- Calendar-style install schedule view.
- Recurring reminders and follow-up templates.
- Photo and document attachments on jobs, expenses, and invoices.
- Better invoice generation controls: template variants, terms, tax presets, and payment links.
- Push/email notifications for due reminders, unpaid invoices, and upcoming installs.
- Role-aware access if office staff and field staff should not see the same controls.

## Phase 5: QA, Performance, And Release Discipline

Goal: stop regressions before they reach the team.

- Add Playwright smoke tests for login, today dashboard, create job, add payment, create invoice, and log expense.
- Add a lightweight visual regression pass for login, dashboard, jobs list, and invoice detail.
- Track slow Supabase queries and pages with high server latency.
- Audit PWA behavior, install prompts, and offline fallbacks.
- Add a release checklist for schema migrations, environment updates, and post-deploy verification.

## Recommended Order

1. Finish Phase 1 before adding major features.
2. Pair Phase 2 and Phase 3 so UX cleanup happens while the code is being modularized.
3. Start Phase 4 only after the lint/build/test baseline exists.
4. Keep Phase 5 running continuously once the first smoke tests land.
