# Stabilization sprint — status (branch `stabilization/functional-sweep`)

This document tracks the state of the functional-stabilization work done on
this branch, ahead of merging into `alpha-platform`. It is updated as work on
this branch progresses - it is not a historical changelog.

## Payment reliability (Ziina)

**Live in production today:** `startZiinaCheckout` (checkout creation) and
`verifyAndFulfillZiinaPurchase` via `/checkout/success` and `/checkout/cancel`
(`src/features/commerce/services/checkoutService.ts`). This is the only
payment path currently active - it has no dependency on `ZIINA_WEBHOOK_SECRET`
or `CRON_SECRET`.

**Implemented, tested, and NOT yet active in production (intentionally
deferred):**

- A signed Ziina webhook receiver, `src/app/api/webhooks/ziina/route.ts`
  (verifies `X-Hmac-Signature` per Ziina's official docs, looks up the
  purchase by `provider_reference`, then reconciles it).
- A reconciliation cron endpoint, `src/app/api/cron/reconcile-purchases/route.ts`
  (sweeps purchases still `pending` after 30 minutes).
- Both are built on one shared, authoritative `reconcilePurchase(purchaseId)`
  in `checkoutService.ts`, so activating them later duplicates no business
  logic - see that file's header comment for the full three-caller
  architecture.
- Full regression coverage exists for all of the above (see `checkoutService.test.ts`,
  `src/app/api/webhooks/ziina/route.test.ts`,
  `src/app/api/cron/reconcile-purchases/route.test.ts`) - mocks/fixtures only,
  no live payment infrastructure is ever called from tests.

Both routes fail closed (HTTP 503, no side effects) if their secret env var
is unset, and `vercel.json` currently has no cron entry - so this deferral is
inert by construction, not just by convention: nothing currently invokes
either route in production.

### Interim mitigation while webhook/cron are deferred

Until either is activated, a purchase whose browser never returns to
`/checkout/success` (closed tab, dropped connection, failed redirect) has no
automatic path to completion. As an interim mitigation, `BuyNowButton`
(`src/features/commerce/components/BuyNowButton.tsx`) now shows a bilingual,
non-alarming notice directly under the "Buy Now" button, before the customer
ever leaves for Ziina's hosted checkout page, asking them not to close the
payment page/browser until payment completes and they're returned to
ZentexAI with access confirmed (`commerce.card.payment_stay_on_page_notice`
in `src/lib/translations.ts`, EN and AR).

### Future payment-hardening task (not yet scheduled)

When this phase is picked up:

1. Register the webhook with Ziina: `POST /webhook` with `url =
   https://<production-domain>/api/webhooks/ziina` and a chosen secret.
2. Set `ZIINA_WEBHOOK_SECRET` (that same secret) and `CRON_SECRET` (any
   strong random value) in the Vercel project's environment variables.
3. Re-add a `crons` entry to `vercel.json` pointing at
   `/api/cron/reconcile-purchases` (a daily schedule, e.g. `0 3 * * *`, is
   safe on every Vercel plan; tighter schedules require a Pro-or-higher plan).
4. Once both are live, the bilingual "stay on this page" notice on
   `BuyNowButton` can be reconsidered (kept as a defense-in-depth UX cue, or
   removed) - it is not required for correctness once the webhook/cron are
   active, only while they are deferred.

No code changes should be required to activate this - only the three
production configuration steps above.

## Mock Exam - single active attempt (migration 030)

`migrations/030_mock_exam_single_active_attempt.sql` adds a partial unique
index on `mock_exam_attempts(user_id) WHERE status IN ('active', 'on_break')`,
enforcing at the database level what was previously only a UI convention.

**Status: applied to production (2026-09-25).** The read-only preflight query
in that migration file was run first and returned no conflicting rows (no
pre-existing user held more than one active/on_break attempt), consistent
with there being no real customer purchases yet. The migration was then
applied and the resulting index verified present.

Application-level handling for a lost race (two concurrent `create`/`retake`
calls) is implemented in `examAttemptService.ts` (`resolveCreateAttemptResult`)
and covered by regression tests in `examAttemptService.test.ts`.

## Production RLS verification (migrations 023/024/026)

`scripts/db/verify_rls_023_024_026.sql` is a read-only script that checks RLS
is enabled and every expected policy/function from migrations 023
(question-bank/simulator-session entitlement RLS), 024 (course-assessment
entitlement RLS + the bank-question course-access extension), and 026 (admin
full-PMP-access bypass in `has_active_capability`) is present.

**Result (2026-09-25): 34/34 checks PASS.** All expected RLS policies, the
RLS-enabled flag on every relevant table, both helper functions
(`has_active_capability`, `has_course_assessment_access`), the admin-bypass
branch in `has_active_capability`, and the migration-024 course-assessment
branch on the `questions` SELECT policy are confirmed present in production.

## Abandoned Mock Exam attempts

Inspected, not changed. `mock_exam_attempts.status` includes an `'abandoned'`
value in its enum, but no code path currently transitions a row into it -
the only automatic status change is lazy expiry (`isExamExpired`, checked
on-read in `submitMockExam`/the attempt-read path), which correctly and
safely self-heals a stale `'active'`/`'on_break'` row to `'expired'` the next
time the user (or migration 030's race-resolution path) actually reads it.
An attempt a user never returns to at all simply stays `'active'` in the
database indefinitely with no functional impact (it is still correctly
resumable, and correctly expires on that resume). Building a scheduled
reaper to proactively mark such rows `'abandoned'` was decided against for
this pass - no functional bug, and not enough business value yet to justify
new scheduled infrastructure for it (see "Do not build unnecessary scheduled
infrastructure" in the sprint brief).

## Merge recommendation

**SAFE TO MERGE INTO `alpha-platform`.** The live payment flow, the mock-exam
DB invariant, and the RLS security migrations have all been verified in
production or by full regression coverage; the webhook/cron code is present
but inert (fails closed, not scheduled) until the future hardening phase
above is deliberately activated.
