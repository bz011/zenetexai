-- ============================================================================
-- MIGRATION 019: Academy Commerce Foundation (Sprint 10A-10C)
-- ============================================================================
-- Adds a provider-agnostic Product / Price / Purchase / Entitlement layer on
-- top of the existing content model, per the Sprint 10 owner-approved spec.
--
-- Deliberately separate from `courses`/`enrollments` (migrations 006, 013):
--   COURSE      = educational/content structure (unchanged)
--   PRODUCT     = something commercially offered
--   PRICE       = what a product costs at a given time (regular/promotional)
--   PURCHASE    = a commercial transaction/order (schema only - no live
--                 payment provider is integrated in this sprint)
--   ENTITLEMENT = authoritative access authorization (the ONLY thing any
--                 access check may trust)
--   ENROLLMENT  = learning/progress relationship (unchanged in meaning; a
--                 granted entitlement ensures a matching enrollment row for
--                 progress-tracking continuity, it does not replace it)
--
-- Access is capability-based (e.g. 'course:pmp', 'practice:pmp',
-- 'mock_exam:pmp') via product_capabilities, rather than one-off booleans -
-- a product grants a set of capabilities, and any access check just asks
-- "does this user hold an active, unexpired entitlement to a product that
-- grants capability X". No payment provider, subscription billing, coupon
-- engine, or usage-quota system is introduced here - out of scope per spec.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PRODUCTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  type TEXT NOT NULL CHECK (type IN ('course', 'simulator', 'bundle')),
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT false,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_products_updated_at ON products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- PRODUCT CAPABILITIES
-- ----------------------------------------------------------------------------
-- What a product grants access to, expressed as typed capability strings
-- (convention: "<resource>:<scope>", e.g. "course:pmp") rather than a
-- brittle boolean per feature. For a 'course:<slug>' capability, <slug> is
-- the matching courses.slug - this lightweight convention (not a foreign
-- key) is what lets a free/paid grant ensure the right `enrollments` row
-- without a separate product->course link table, while keeping the
-- capability model generic enough to cover non-course resources too.
CREATE TABLE IF NOT EXISTS product_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  capability TEXT NOT NULL CHECK (capability ~ '^[a-z_]+:[a-z0-9_-]+$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, capability)
);

CREATE INDEX IF NOT EXISTS idx_product_capabilities_product ON product_capabilities(product_id);
CREATE INDEX IF NOT EXISTS idx_product_capabilities_capability ON product_capabilities(capability);

-- ----------------------------------------------------------------------------
-- PRICES
-- ----------------------------------------------------------------------------
-- A product may have multiple price rows (a standing 'regular' price plus,
-- optionally, one or more time-boxed 'promotional' prices). The regular
-- price is never deleted/overwritten to run a promotion - the effective
-- price is resolved at read time (see productService.resolveEffectivePrice
-- in the application layer, and grant_free_enrollment() below for the
-- server-authoritative equivalent used by the free-enrollment path).
--
-- A promotional price MUST declare a concrete valid_from/valid_until window
-- - this is a hard constraint, not just a convention, specifically so an
-- admin can never accidentally create an indefinite/instantly-active
-- AED 0 promotion by leaving the dates blank.
CREATE TABLE IF NOT EXISTS prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('regular', 'promotional')),
  currency TEXT NOT NULL DEFAULT 'AED',
  amount_minor_units INT NOT NULL CHECK (amount_minor_units >= 0),
  -- NULL = lifetime access. Populated for all three Sprint 10 products (365
  -- days / "12 months"). Never hard-code a duration in application code -
  -- always read it from here.
  access_duration_days INT CHECK (access_duration_days IS NULL OR access_duration_days > 0),
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT promotional_requires_window CHECK (
    kind = 'regular' OR (valid_from IS NOT NULL AND valid_until IS NOT NULL AND valid_until > valid_from)
  )
);

CREATE INDEX IF NOT EXISTS idx_prices_product ON prices(product_id);

-- ----------------------------------------------------------------------------
-- PURCHASES
-- ----------------------------------------------------------------------------
-- Order/transaction record. No payment provider is integrated in Sprint
-- 10A-10C - this table exists so a future payment sprint is a code change
-- (new provider adapter + webhook handler writing here), not another schema
-- migration. Nothing in this sprint inserts a 'completed' row here; the
-- free-course promotion grants an entitlement directly (see
-- grant_free_enrollment()) without a purchase record, since no money moves.
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  price_id UUID NOT NULL REFERENCES prices(id),
  provider TEXT,
  provider_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  amount_minor_units INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (provider, provider_reference)
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product ON purchases(product_id);

-- ----------------------------------------------------------------------------
-- ENTITLEMENTS
-- ----------------------------------------------------------------------------
-- The single authoritative access table. Every access check (lesson,
-- practice, mock exam, dashboard ownership) reads from here - never from
-- `purchases` or `enrollments` directly.
CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  source TEXT NOT NULL CHECK (source IN ('purchase', 'free_promotion', 'admin_grant', 'legacy_enrollment')),
  purchase_id UUID REFERENCES purchases(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  granted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entitlements_user ON entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_product ON entitlements(product_id);

-- At most one ACTIVE entitlement per (user, product) - this is what makes
-- both the free-enrollment path and admin grants idempotent at the database
-- level, not just by application convention: a duplicate click, a replayed
-- request, or a concurrent race can insert/upsert against this index but
-- can never create two simultaneously-active entitlements for the same
-- product. A revoked/expired-and-superseded row does not count, so a user
-- can be re-granted access later without violating this.
CREATE UNIQUE INDEX IF NOT EXISTS idx_entitlements_active_unique
  ON entitlements(user_id, product_id) WHERE status = 'active';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;

-- PRODUCTS: public catalog data. Anyone (including anon) may read a
-- published product; only admins see/manage unpublished/draft products.
DROP POLICY IF EXISTS "Anyone can view published products" ON products;
CREATE POLICY "Anyone can view published products"
  ON products FOR SELECT
  USING (is_published = true OR get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins manage products" ON products;
CREATE POLICY "Admins manage products"
  ON products FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins update products" ON products;
CREATE POLICY "Admins update products"
  ON products FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- PRODUCT CAPABILITIES: not sensitive (no user data) - needed publicly so a
-- product page can truthfully list what a bundle includes without a
-- separate authenticated call.
DROP POLICY IF EXISTS "Anyone can view product capabilities" ON product_capabilities;
CREATE POLICY "Anyone can view product capabilities"
  ON product_capabilities FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage product capabilities" ON product_capabilities;
CREATE POLICY "Admins manage product capabilities"
  ON product_capabilities FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- PRICES: active prices are public (needed to render pricing/promotion on
-- the storefront without auth); admins also see inactive/historical prices
-- to manage them.
DROP POLICY IF EXISTS "Anyone can view active prices" ON prices;
CREATE POLICY "Anyone can view active prices"
  ON prices FOR SELECT
  USING (is_active = true OR get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins manage prices" ON prices;
CREATE POLICY "Admins manage prices"
  ON prices FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins update prices" ON prices;
CREATE POLICY "Admins update prices"
  ON prices FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- PURCHASES: private. Owning user (and admin) can read; no INSERT/UPDATE
-- policy for `authenticated` at all in this sprint - nothing in Sprint
-- 10A-10C is authorized to create a purchase row (no live payment provider
-- yet), and a future payment webhook will write here via the service-role
-- client, which bypasses RLS entirely.
DROP POLICY IF EXISTS "Users view own purchases" ON purchases;
CREATE POLICY "Users view own purchases"
  ON purchases FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR get_user_role() = 'admin');

-- ENTITLEMENTS: private, server-authoritative. Owning user (and admin) can
-- read. Regular authenticated users have NO insert/update policy - the only
-- way a non-admin can ever obtain a row here is the grant_free_enrollment()
-- SECURITY DEFINER function below, which independently re-verifies the
-- promotion server-side before writing (it runs as the function owner, so
-- it bypasses these RLS policies by design - that is the one deliberate,
-- narrow exception, not a gap). Admin manual grants go through the
-- INSERT/UPDATE policies here directly.
DROP POLICY IF EXISTS "Users view own entitlements" ON entitlements;
CREATE POLICY "Users view own entitlements"
  ON entitlements FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins create entitlements" ON entitlements;
CREATE POLICY "Admins create entitlements"
  ON entitlements FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins update entitlements" ON entitlements;
CREATE POLICY "Admins update entitlements"
  ON entitlements FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================================
-- grant_free_enrollment(): the ONLY way a non-admin user can ever receive an
-- entitlement in this sprint. Re-derives and re-verifies every commercial
-- fact server-side - a client can submit nothing but a product slug. Never
-- trusts a client-submitted price, "free" flag, or promotion claim.
-- Idempotent: repeated calls for a product the caller already actively
-- holds return already_enrolled=true and never extend expires_at.
-- ============================================================================
CREATE OR REPLACE FUNCTION grant_free_enrollment(p_product_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_product RECORD;
  v_promo RECORD;
  v_existing RECORD;
  v_entitlement_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_course_slug TEXT;
  v_course_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT id, is_active, is_published INTO v_product
  FROM products WHERE slug = p_product_slug;

  IF NOT FOUND OR NOT v_product.is_active OR NOT v_product.is_published THEN
    RETURN jsonb_build_object('success', false, 'error', 'product_unavailable');
  END IF;

  -- The effective price must independently resolve to a currently-valid,
  -- AED 0 promotion. A promotional row with a NULL window can never exist
  -- (see promotional_requires_window above), so this can never match an
  -- indefinite/accidental free promotion.
  SELECT * INTO v_promo FROM prices
  WHERE product_id = v_product.id AND kind = 'promotional' AND is_active
    AND now() BETWEEN valid_from AND valid_until
  ORDER BY created_at DESC LIMIT 1;

  IF NOT FOUND OR v_promo.amount_minor_units <> 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_active_free_promotion');
  END IF;

  SELECT id, expires_at INTO v_existing FROM entitlements
  WHERE user_id = v_user_id AND product_id = v_product.id AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now());

  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'already_enrolled', true, 'expires_at', v_existing.expires_at);
  END IF;

  v_expires_at := CASE WHEN v_promo.access_duration_days IS NOT NULL
    THEN now() + (v_promo.access_duration_days || ' days')::interval
    ELSE NULL END;

  INSERT INTO entitlements (user_id, product_id, source, status, granted_at, expires_at)
  VALUES (v_user_id, v_product.id, 'free_promotion', 'active', now(), v_expires_at)
  ON CONFLICT (user_id, product_id) WHERE status = 'active' DO NOTHING
  RETURNING id INTO v_entitlement_id;

  IF v_entitlement_id IS NULL THEN
    -- Lost a concurrent race (duplicate click/retry) - another request
    -- already created the active entitlement. Idempotent, not an error.
    RETURN jsonb_build_object('success', true, 'already_enrolled', true);
  END IF;

  FOR v_course_slug IN
    SELECT split_part(capability, ':', 2) FROM product_capabilities
    WHERE product_id = v_product.id AND capability LIKE 'course:%'
  LOOP
    SELECT id INTO v_course_id FROM courses WHERE slug = v_course_slug;
    IF FOUND THEN
      INSERT INTO enrollments (user_id, course_id, status)
      VALUES (v_user_id, v_course_id, 'active')
      ON CONFLICT (user_id, course_id) DO NOTHING;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'already_enrolled', false, 'expires_at', v_expires_at);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION grant_free_enrollment(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION grant_free_enrollment(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION grant_free_enrollment(TEXT) TO authenticated;

-- ============================================================================
-- SEED: the three owner-approved commercial products.
-- Idempotent (ON CONFLICT DO NOTHING / DO UPDATE on slug) so re-running this
-- migration file never duplicates or wipes admin edits made after launch.
-- No promotional price is seeded here - the owner has not finalized launch
-- dates. The launch-promotion price row must be added later, by an admin,
-- through the new admin commerce screen (Section on Admin Configuration in
-- the completion report covers exactly how).
-- ============================================================================

INSERT INTO products (slug, type, title_en, title_ar, description_en, description_ar, is_active, is_published, order_index)
VALUES
  (
    'pmp-mastery-program', 'course',
    'PMP Mastery Program', 'برنامج احتراف PMP',
    'A structured PMP course covering the curriculum module by module, with lesson checkpoints and module assessments.',
    'دورة PMP منظمة تغطي المنهج وحدة تلو الأخرى، مع اختبارات قصيرة لكل درس وتقييمات لكل وحدة.',
    true, true, 1
  ),
  (
    'pmp-exam-simulator', 'simulator',
    'PMP Exam Simulator', 'محاكي اختبار PMP',
    'Practice Mode and full-length Mock Exam drawn from the approved PMP question bank, with bilingual EN/AR delivery, results review, and attempt history.',
    'وضع التدريب واختبار محاكاة كامل من بنك أسئلة PMP المعتمد، بتجربة ثنائية اللغة (إنجليزي/عربي)، مع مراجعة النتائج وسجل المحاولات.',
    true, true, 2
  ),
  (
    'pmp-complete-package', 'bundle',
    'PMP Complete Package', 'الباقة الكاملة لـ PMP',
    'The PMP Mastery Program and PMP Exam Simulator together, at a combined price.',
    'برنامج احتراف PMP بالإضافة إلى محاكي اختبار PMP معًا، بسعر مجمّع.',
    true, true, 3
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_capabilities (product_id, capability)
SELECT p.id, c.capability
FROM products p
JOIN (VALUES
  ('pmp-mastery-program', 'course:pmp'),
  ('pmp-exam-simulator', 'practice:pmp'),
  ('pmp-exam-simulator', 'mock_exam:pmp'),
  ('pmp-complete-package', 'course:pmp'),
  ('pmp-complete-package', 'practice:pmp'),
  ('pmp-complete-package', 'mock_exam:pmp')
) AS c(slug, capability) ON c.slug = p.slug
ON CONFLICT (product_id, capability) DO NOTHING;

-- Regular prices. amount_minor_units is AED fils (1 AED = 100 fils).
-- access_duration_days = 365 for the approved "12 months access" policy.
INSERT INTO prices (product_id, kind, currency, amount_minor_units, access_duration_days, is_active)
SELECT p.id, 'regular', 'AED', v.amount, 365, true
FROM products p
JOIN (VALUES
  ('pmp-mastery-program', 35000),
  ('pmp-exam-simulator', 35000),
  ('pmp-complete-package', 50000)
) AS v(slug, amount) ON v.slug = p.slug
WHERE NOT EXISTS (
  SELECT 1 FROM prices existing WHERE existing.product_id = p.id AND existing.kind = 'regular'
);

-- ============================================================================
-- END OF MIGRATION 019
-- ============================================================================
