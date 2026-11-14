-- ============================================================================
-- MIGRATION 033: permanently free Academy products
-- ============================================================================
-- Adds products.is_free. A product that is free, active and published grants
-- its capabilities to EVERY signed-in user, with no purchase and no
-- entitlement row. Everything that already asks has_active_capability()
-- (the RLS policies on lessons/assessments/questions from 020/023/024 and
-- the practice/mock-exam RPCs) follows automatically.
--
-- Unchanged:
--  - Anonymous visitors: has_active_capability() stays EXECUTE-able by
--    `authenticated` only, and the free branch also requires a user id.
--  - Admins: still pass every capability (026).
--  - Paid products: is_free defaults to false, so nothing changes until a
--    product is explicitly marked free. Entitlement-based access is kept.
--  - Capabilities only come from the free product's OWN capability rows, so
--    marking one product free never opens another product's capabilities.
--
-- This migration changes schema and the function only; which products are
-- free is a data decision made separately per environment.
-- Idempotent: safe to re-run.
-- ============================================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.has_active_capability(p_user_id UUID, p_capability TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT
    COALESCE(get_user_role() = 'admin'::user_role, false)
    OR (
      p_user_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM products p
        JOIN product_capabilities pc ON pc.product_id = p.id
        WHERE p.is_free
          AND p.is_active
          AND p.is_published
          AND pc.capability = p_capability
      )
    )
    OR EXISTS (
      SELECT 1
      FROM entitlements e
      JOIN product_capabilities pc ON pc.product_id = e.product_id
      WHERE e.user_id = p_user_id
        AND e.status = 'active'
        AND (e.expires_at IS NULL OR e.expires_at > now())
        AND pc.capability = p_capability
    );
$$;

REVOKE ALL ON FUNCTION public.has_active_capability(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_capability(UUID, TEXT) TO authenticated;

-- ============================================================================
-- END OF MIGRATION 033
-- ============================================================================
