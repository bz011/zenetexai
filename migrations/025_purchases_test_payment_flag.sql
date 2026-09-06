-- ============================================================================
-- MIGRATION 025: Distinguish test-mode Ziina purchases from future live ones
-- ============================================================================
-- Production incident (2026-09-06): with Ziina still in test mode
-- (ZIINA_TEST_MODE, ziinaClient.ts) and no restriction on who could reach
-- checkout, a completed TEST payment on the real production domain granted
-- a genuine, durable practice:pmp + mock_exam:pmp entitlement - Ziina's
-- test-mode hosted checkout accepts arbitrary card input as a simulated
-- success, since it never talks to a real card network. The fix (an
-- admin/instructor-only gate on startZiinaCheckout while ZIINA_TEST_MODE is
-- true - see checkoutService.ts) closes the exposure itself. This column
-- is the separate, explicitly-requested audit-trail requirement: "test-mode
-- transactions must be distinguishable from future live transactions."
--
-- Every purchases row that exists today was created while ZIINA_TEST_MODE
-- has always been true (live payments have never been enabled in this
-- codebase) - DEFAULT true backfills every existing row correctly, not
-- just new ones. Going forward, checkoutService.ts sets this explicitly
-- from the SAME ZIINA_TEST_MODE constant used for the actual Ziina API
-- call, so the two can never drift out of sync.
-- ============================================================================

ALTER TABLE purchases ADD COLUMN IF NOT EXISTS is_test_payment BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN purchases.is_test_payment IS 'True when this purchase was created while Ziina was in test mode (ZIINA_TEST_MODE in ziinaClient.ts) - never real money. Every row predating this column is backfilled true, since live payments have never been enabled.';

CREATE INDEX IF NOT EXISTS idx_purchases_is_test_payment ON purchases(is_test_payment);

-- ============================================================================
-- END OF MIGRATION 025
-- ============================================================================
