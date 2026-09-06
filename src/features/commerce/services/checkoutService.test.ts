import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const requireProfileMock = vi.fn();
vi.mock("@/lib/auth/requireRole", () => ({ requireProfile: (...args: unknown[]) => requireProfileMock(...args) }));

const adminFromMock = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from: (...args: unknown[]) => adminFromMock(...args) } }));

const createIntentMock = vi.fn();
const getIntentMock = vi.fn();
vi.mock("./ziinaClient", () => ({
  createZiinaPaymentIntent: (...args: unknown[]) => createIntentMock(...args),
  getZiinaPaymentIntent: (...args: unknown[]) => getIntentMock(...args),
  // Matches the real ziinaClient.ts constant - kept true here deliberately,
  // since the whole point of the staff-only-checkout tests below is to
  // verify behavior WHILE test mode is active.
  ZIINA_TEST_MODE: true,
}));

const checkRateLimitMock = vi.fn();
vi.mock("@/lib/upstashRateLimit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
  getHashedClientIp: () => "hashed-test-ip",
}));

const { startZiinaCheckout, verifyAndFulfillZiinaPurchase } = await import("./checkoutService");

type Op = "select" | "insert" | "update" | null;

/** Faithful-enough fake of a supabase-js query builder: every method
 * mutates and returns `this`, and the object itself is thenable (so code
 * that awaits mid-chain, e.g. `await supabaseAdmin.from(t).update(x).eq(...)`
 * with no terminal `.select()`, works exactly like the real client). Each
 * table gets its own `resolver(op, payload, filters)` that decides what
 * comes back, and can also record what was inserted/updated for assertions. */
class FakeQuery implements PromiseLike<{ data: unknown; error: unknown }> {
  private op: Op = null;
  private payload: unknown = null;
  private filters: Record<string, unknown> = {};

  constructor(private resolver: (op: Op, payload: unknown, filters: Record<string, unknown>) => { data: unknown; error: unknown }) {}

  select(_cols?: string) {
    if (!this.op) this.op = "select";
    return this;
  }
  insert(row: unknown) {
    this.op = "insert";
    this.payload = row;
    return this;
  }
  update(patch: unknown) {
    this.op = "update";
    this.payload = patch;
    return this;
  }
  eq(col: string, val: unknown) {
    this.filters[col] = val;
    return this;
  }
  async single() {
    return this.resolver(this.op, this.payload, this.filters);
  }
  async maybeSingle() {
    return this.resolver(this.op, this.payload, this.filters);
  }
  then<TResult1, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.resolver(this.op, this.payload, this.filters)).then(onfulfilled, onrejected);
  }
}

type Resolver = (op: Op, payload: unknown, filters: Record<string, unknown>) => { data: unknown; error: unknown };

function mockAdminTables(tables: Record<string, Resolver>) {
  adminFromMock.mockImplementation((table: string) => {
    const resolver = tables[table];
    if (!resolver) throw new Error(`Unexpected admin table in test mock: ${table}`);
    return new FakeQuery(resolver);
  });
}

const PRODUCT_ID = "product-simulator-1";
const USER_ID = "user-1";
const PRICE_ROW = {
  id: "price-1",
  product_id: PRODUCT_ID,
  kind: "regular",
  currency: "AED",
  amount_minor_units: 35000,
  access_duration_days: 365,
  valid_from: null,
  valid_until: null,
  is_active: true,
};

function buildRlsSupabase(config: { existingEntitlement?: { id: string; expires_at: string | null } | null; priceRows?: unknown[] }) {
  return {
    from: (table: string) => {
      if (table === "products") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: { id: PRODUCT_ID, is_active: true, is_published: true }, error: null }) }),
          }),
        };
      }
      if (table === "entitlements") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({ maybeSingle: async () => ({ data: config.existingEntitlement ?? null, error: null }) }),
              }),
            }),
          }),
        };
      }
      if (table === "prices") {
        return { select: () => ({ eq: async () => ({ data: config.priceRows ?? [PRICE_ROW], error: null }) }) };
      }
      throw new Error(`Unexpected table in RLS supabase mock: ${table}`);
    },
  };
}

describe("startZiinaCheckout", () => {
  beforeEach(() => {
    requireProfileMock.mockReset();
    adminFromMock.mockReset();
    createIntentMock.mockReset();
    checkRateLimitMock.mockReset();
    checkRateLimitMock.mockResolvedValue({ allowed: true, configured: true });
  });

  it("rejects the request BEFORE any purchase row is created or Ziina is ever called, when the per-user or per-IP rate limit is exceeded", async () => {
    requireProfileMock.mockResolvedValue({ supabase: buildRlsSupabase({}), user: { id: USER_ID }, profile: { role: "admin" } });
    checkRateLimitMock.mockImplementation((bucket: string) =>
      Promise.resolve(bucket === "checkout-create" ? { allowed: false, configured: true, retryAfterSeconds: 42 } : { allowed: true, configured: true })
    );

    const result = await startZiinaCheckout("pmp-exam-simulator");

    expect(result).toEqual({ success: false, error: "rate_limited" });
    expect(adminFromMock).not.toHaveBeenCalled();
    expect(createIntentMock).not.toHaveBeenCalled();
  });

  it("also rejects on the per-IP bucket alone, even when the per-user bucket is still within its limit", async () => {
    requireProfileMock.mockResolvedValue({ supabase: buildRlsSupabase({}), user: { id: USER_ID }, profile: { role: "admin" } });
    checkRateLimitMock.mockImplementation((bucket: string) =>
      Promise.resolve(bucket === "checkout-create-ip" ? { allowed: false, configured: true, retryAfterSeconds: 10 } : { allowed: true, configured: true })
    );

    const result = await startZiinaCheckout("pmp-exam-simulator");

    expect(result).toEqual({ success: false, error: "rate_limited" });
    expect(createIntentMock).not.toHaveBeenCalled();
  });

  // --- Production incident 2026-09-06: a completed Ziina TEST payment on
  // the live domain granted a real practice:pmp + mock_exam:pmp
  // entitlement to an ordinary account, since checkout itself was reachable
  // by anyone while Ziina is (and must remain) in test mode. Fix: while
  // ZIINA_TEST_MODE is true, only admin/instructor may reach checkout at
  // all - a test-mode "payment" can never even be attempted by an ordinary
  // user, so it can never accidentally become a real production
  // entitlement for one. ---

  it("refuses checkout for an ordinary student while Ziina is in test mode, before any purchase row is created or Ziina is ever called", async () => {
    requireProfileMock.mockResolvedValue({ supabase: buildRlsSupabase({}), user: { id: USER_ID }, profile: { role: "student" } });

    const result = await startZiinaCheckout("pmp-exam-simulator");

    expect(result).toEqual({ success: false, error: "checkout_unavailable" });
    expect(adminFromMock).not.toHaveBeenCalled();
    expect(createIntentMock).not.toHaveBeenCalled();
  });

  it("refuses checkout for a caller with no profile row at all (fails closed, never assumes staff)", async () => {
    requireProfileMock.mockResolvedValue({ supabase: buildRlsSupabase({}), user: { id: USER_ID }, profile: null });

    const result = await startZiinaCheckout("pmp-exam-simulator");

    expect(result).toEqual({ success: false, error: "checkout_unavailable" });
    expect(createIntentMock).not.toHaveBeenCalled();
  });

  it("still allows an instructor to checkout while Ziina is in test mode (controlled staff testing remains possible)", async () => {
    requireProfileMock.mockResolvedValue({ supabase: buildRlsSupabase({}), user: { id: USER_ID }, profile: { role: "instructor" } });
    mockAdminTables({
      purchases: (op) => (op === "insert" ? { data: { id: "purchase-instructor-1" }, error: null } : { data: null, error: null }),
    });
    createIntentMock.mockResolvedValue({ id: "ziina-intent-instructor", redirect_url: "https://pay.ziina.com/payment_intent/ziina-intent-instructor" });

    const result = await startZiinaCheckout("pmp-exam-simulator");

    expect(result.success).toBe(true);
  });

  it("creates a pending purchase, calls Ziina in test mode, and returns its redirect_url", async () => {
    requireProfileMock.mockResolvedValue({ supabase: buildRlsSupabase({}), user: { id: USER_ID }, profile: { role: "admin" } });
    const inserted: unknown[] = [];
    const updates: unknown[] = [];
    mockAdminTables({
      purchases: (op, payload) => {
        if (op === "insert") {
          inserted.push(payload);
          return { data: { id: "purchase-1" }, error: null };
        }
        if (op === "update") {
          updates.push(payload);
          return { data: null, error: null };
        }
        throw new Error(`unexpected op ${op}`);
      },
    });
    createIntentMock.mockResolvedValue({ id: "ziina-intent-1", redirect_url: "https://pay.ziina.com/payment_intent/ziina-intent-1" });

    const result = await startZiinaCheckout("pmp-exam-simulator");

    expect(result).toEqual({ success: true, redirectUrl: "https://pay.ziina.com/payment_intent/ziina-intent-1" });
    expect(inserted[0]).toMatchObject({
      user_id: USER_ID,
      product_id: PRODUCT_ID,
      price_id: "price-1",
      provider: "ziina",
      status: "pending",
      amount_minor_units: 35000,
      currency: "AED",
      // Every purchase created while Ziina is in test mode must be
      // explicitly flagged as such (migration 025) - never inferred later.
      is_test_payment: true,
    });
    // The amount/currency Ziina is told to charge come from the server-resolved
    // price row, never from anything the client could have supplied.
    expect(createIntentMock).toHaveBeenCalledWith(
      expect.objectContaining({ amountMinorUnits: 35000, currencyCode: "AED", test: true })
    );
    expect(updates[0]).toEqual({ provider_reference: "ziina-intent-1" });
  });

  it("refuses to start checkout when the user already actively owns the product", async () => {
    requireProfileMock.mockResolvedValue({
      supabase: buildRlsSupabase({ existingEntitlement: { id: "ent-1", expires_at: null } }),
      user: { id: USER_ID },
      profile: { role: "admin" },
    });

    const result = await startZiinaCheckout("pmp-exam-simulator");

    expect(result).toEqual({ success: false, error: "already_owned" });
    expect(createIntentMock).not.toHaveBeenCalled();
  });

  it("allows starting checkout again once a previous entitlement has expired", async () => {
    requireProfileMock.mockResolvedValue({
      supabase: buildRlsSupabase({ existingEntitlement: { id: "ent-1", expires_at: "2020-01-01T00:00:00.000Z" } }),
      user: { id: USER_ID },
      profile: { role: "admin" },
    });
    mockAdminTables({
      purchases: (op) => (op === "insert" ? { data: { id: "purchase-2" }, error: null } : { data: null, error: null }),
    });
    createIntentMock.mockResolvedValue({ id: "ziina-intent-2", redirect_url: "https://pay.ziina.com/payment_intent/ziina-intent-2" });

    const result = await startZiinaCheckout("pmp-exam-simulator");

    expect(result.success).toBe(true);
  });

  it("refuses to start a paid checkout when the resolved price is free (that path is grant_free_enrollment's job)", async () => {
    requireProfileMock.mockResolvedValue({
      supabase: buildRlsSupabase({ priceRows: [{ ...PRICE_ROW, amount_minor_units: 0 }] }),
      user: { id: USER_ID },
      profile: { role: "admin" },
    });

    const result = await startZiinaCheckout("pmp-mastery-program");

    expect(result).toEqual({ success: false, error: "not_payable" });
    expect(createIntentMock).not.toHaveBeenCalled();
  });

  it("marks the purchase failed and reports checkout_unavailable when the Ziina API call throws", async () => {
    requireProfileMock.mockResolvedValue({ supabase: buildRlsSupabase({}), user: { id: USER_ID }, profile: { role: "admin" } });
    const updates: unknown[] = [];
    mockAdminTables({
      purchases: (op, payload) => {
        if (op === "insert") return { data: { id: "purchase-3" }, error: null };
        if (op === "update") {
          updates.push(payload);
          return { data: null, error: null };
        }
        throw new Error(`unexpected op ${op}`);
      },
    });
    createIntentMock.mockRejectedValue(new Error("network error"));

    const result = await startZiinaCheckout("pmp-exam-simulator");

    expect(result).toEqual({ success: false, error: "checkout_unavailable" });
    expect(updates).toEqual([{ status: "failed" }]);
  });
});

describe("verifyAndFulfillZiinaPurchase", () => {
  beforeEach(() => {
    adminFromMock.mockReset();
    getIntentMock.mockReset();
  });

  const BASE_PURCHASE = {
    id: "purchase-1",
    user_id: USER_ID,
    product_id: PRODUCT_ID,
    price_id: "price-1",
    status: "pending",
    amount_minor_units: 35000,
    currency: "AED",
    provider_reference: "ziina-intent-1",
    // Every purchase this app has ever created was made while Ziina is in
    // test mode - matches reality (see ZIINA_TEST_MODE, ziinaClient.ts).
    is_test_payment: true,
  };

  function mockPurchaseFlow(opts: {
    purchase?: Record<string, unknown> | null;
    productSlug?: string;
    onPurchaseUpdate?: (payload: unknown, filters: Record<string, unknown>) => void;
    entitlementInsertResult?: { data: unknown; error: unknown };
    onEntitlementInsert?: (payload: unknown) => void;
    accessDurationDays?: number | null;
    existingActiveExpiresAt?: string | null;
    /** The purchase OWNER's profile role, as it is RIGHT NOW at verification
     * time (not necessarily what it was when the purchase was created) -
     * defaults to "admin" so every pre-existing test in this block, none of
     * which is about the staff-only-test-entitlement rule, keeps
     * representing a legitimate staff-owned test purchase unchanged. */
    ownerRole?: string | null;
  }) {
    const purchaseRow = opts.purchase === undefined ? BASE_PURCHASE : opts.purchase;
    mockAdminTables({
      purchases: (op, payload, filters) => {
        if (op === "select") return { data: purchaseRow, error: null };
        if (op === "update") {
          opts.onPurchaseUpdate?.(payload, filters);
          return { data: { id: BASE_PURCHASE.id }, error: null };
        }
        throw new Error(`unexpected purchases op ${op}`);
      },
      products: () => ({ data: { slug: opts.productSlug ?? "pmp-exam-simulator" }, error: null }),
      prices: () => ({ data: { access_duration_days: opts.accessDurationDays ?? 365 }, error: null }),
      profiles: () => ({ data: opts.ownerRole === null ? null : { role: opts.ownerRole ?? "admin" }, error: null }),
      entitlements: (op, payload) => {
        if (op === "select") return { data: { expires_at: opts.existingActiveExpiresAt ?? null }, error: null };
        if (op === "insert") {
          opts.onEntitlementInsert?.(payload);
          return opts.entitlementInsertResult ?? { data: { expires_at: "2027-01-01T00:00:00.000Z" }, error: null };
        }
        throw new Error(`unexpected entitlements op ${op}`);
      },
    });
  }

  it("returns not_found for an unknown purchase id and never calls Ziina", async () => {
    mockPurchaseFlow({ purchase: null });

    const result = await verifyAndFulfillZiinaPurchase("missing", USER_ID);

    expect(result.status).toBe("not_found");
    expect(getIntentMock).not.toHaveBeenCalled();
  });

  it("returns forbidden when the purchase belongs to a different user, and never calls Ziina", async () => {
    mockPurchaseFlow({ purchase: { ...BASE_PURCHASE, user_id: "someone-else" } });

    const result = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);

    expect(result.status).toBe("forbidden");
    expect(getIntentMock).not.toHaveBeenCalled();
  });

  it("is idempotent: replaying success_url for an already-completed purchase returns completed without calling Ziina again or re-granting", async () => {
    mockPurchaseFlow({ purchase: { ...BASE_PURCHASE, status: "completed" }, existingActiveExpiresAt: "2027-06-01T00:00:00.000Z" });

    const result = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);

    expect(result).toEqual({ status: "completed", expiresAt: "2027-06-01T00:00:00.000Z", productSlug: "pmp-exam-simulator" });
    expect(getIntentMock).not.toHaveBeenCalled();
  });

  it("grants a purchase-sourced entitlement (practice:pmp + mock_exam:pmp come from this product's capabilities, never listed here) with 12-month expiry when Ziina confirms status completed and amount/currency match", async () => {
    let insertedEntitlement: unknown = null;
    let purchaseUpdatedTo: unknown = null;
    mockPurchaseFlow({
      onEntitlementInsert: (payload) => (insertedEntitlement = payload),
      onPurchaseUpdate: (payload, filters) => {
        if ((payload as { status?: string }).status === "completed") purchaseUpdatedTo = filters;
      },
    });
    getIntentMock.mockResolvedValue({ id: "ziina-intent-1", status: "completed", amount: 35000, currency_code: "AED" });

    const result = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);

    expect(result.status).toBe("completed");
    expect(result.expiresAt).toBeTruthy();
    expect(insertedEntitlement).toMatchObject({
      user_id: USER_ID,
      product_id: PRODUCT_ID,
      source: "purchase",
      purchase_id: "purchase-1",
      status: "active",
    });
    // The conditional UPDATE only ever claims a row that is still 'pending'.
    expect(purchaseUpdatedTo).toMatchObject({ id: "purchase-1", status: "pending" });
  });

  it("fails closed (no grant) when Ziina reports completed but the amount doesn't match what we told it to charge", async () => {
    let entitlementInsertCalled = false;
    mockPurchaseFlow({ onEntitlementInsert: () => (entitlementInsertCalled = true) });
    getIntentMock.mockResolvedValue({ id: "ziina-intent-1", status: "completed", amount: 1, currency_code: "AED" });

    const result = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);

    expect(result.status).toBe("failed");
    expect(entitlementInsertCalled).toBe(false);
  });

  it("fails closed (no grant) when Ziina reports completed but the currency doesn't match", async () => {
    let entitlementInsertCalled = false;
    mockPurchaseFlow({ onEntitlementInsert: () => (entitlementInsertCalled = true) });
    getIntentMock.mockResolvedValue({ id: "ziina-intent-1", status: "completed", amount: 35000, currency_code: "USD" });

    const result = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);

    expect(result.status).toBe("failed");
    expect(entitlementInsertCalled).toBe(false);
  });

  it("maps Ziina's 'canceled' status to the local 'cancelled' purchase status without granting anything", async () => {
    let entitlementInsertCalled = false;
    mockPurchaseFlow({ onEntitlementInsert: () => (entitlementInsertCalled = true) });
    getIntentMock.mockResolvedValue({ id: "ziina-intent-1", status: "canceled", amount: 35000, currency_code: "AED" });

    const result = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);

    expect(result.status).toBe("cancelled");
    expect(entitlementInsertCalled).toBe(false);
  });

  it("maps Ziina's 'failed' status straight through and grants nothing", async () => {
    let entitlementInsertCalled = false;
    mockPurchaseFlow({ onEntitlementInsert: () => (entitlementInsertCalled = true) });
    getIntentMock.mockResolvedValue({ id: "ziina-intent-1", status: "failed", amount: 35000, currency_code: "AED" });

    const result = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);

    expect(result.status).toBe("failed");
    expect(entitlementInsertCalled).toBe(false);
  });

  it.each(["requires_payment_instrument", "requires_user_action", "pending"] as const)(
    "treats Ziina status '%s' as still in progress - never grants, never marks the purchase terminal",
    async (status) => {
      let entitlementInsertCalled = false;
      let purchaseUpdateCalled = false;
      mockPurchaseFlow({
        onEntitlementInsert: () => (entitlementInsertCalled = true),
        onPurchaseUpdate: () => (purchaseUpdateCalled = true),
      });
      getIntentMock.mockResolvedValue({ id: "ziina-intent-1", status, amount: 35000, currency_code: "AED" });

      const result = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);

      expect(result.status).toBe("pending");
      expect(entitlementInsertCalled).toBe(false);
      expect(purchaseUpdateCalled).toBe(false);
    }
  );

  it("never calls Ziina when the purchase has no provider_reference yet, and reports pending", async () => {
    mockPurchaseFlow({ purchase: { ...BASE_PURCHASE, provider_reference: null } });

    const result = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);

    expect(result.status).toBe("pending");
    expect(getIntentMock).not.toHaveBeenCalled();
  });

  // --- Fulfillment-boundary safety gate (2026-09-06 incident follow-up):
  // the checkout-CREATION gate stops an ordinary user from starting a new
  // test checkout, but an old pending purchase or a stale success-URL
  // created before that fix shipped could still reach fulfillment
  // directly. These 5 tests are the exact scenarios requested. ---

  it("1. student with an OLD PENDING test purchase who now completes the Ziina test payment gets NO entitlement", async () => {
    let entitlementInsertCalled = false;
    mockPurchaseFlow({ ownerRole: "student", onEntitlementInsert: () => (entitlementInsertCalled = true) });
    getIntentMock.mockResolvedValue({ id: "ziina-intent-1", status: "completed", amount: 35000, currency_code: "AED" });

    const result = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);

    expect(result).toEqual({ status: "failed", productSlug: "pmp-exam-simulator" });
    expect(entitlementInsertCalled).toBe(false);
    // The whole point of this gate is that it never needs to ask Ziina at
    // all for a non-staff test purchase - blocked before that call.
    expect(getIntentMock).not.toHaveBeenCalled();
  });

  it("2. student whose test purchase is ALREADY marked completed (e.g. granted by a pre-fix bug) gets NO entitlement/expiry reported on a fresh verification call", async () => {
    mockPurchaseFlow({
      purchase: { ...BASE_PURCHASE, status: "completed" },
      ownerRole: "student",
      existingActiveExpiresAt: "2027-09-06T00:00:00.000Z", // an entitlement DOES exist in the DB from before this fix
    });

    const result = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);

    // Never confirms/re-affirms the pre-existing entitlement to the caller,
    // and never leaks that one technically exists.
    expect(result).toEqual({ status: "failed", productSlug: "pmp-exam-simulator" });
  });

  it("3. an admin's controlled test purchase still fulfills normally (the staff carve-out works)", async () => {
    let insertedEntitlement: unknown = null;
    mockPurchaseFlow({ ownerRole: "admin", onEntitlementInsert: (p) => (insertedEntitlement = p) });
    getIntentMock.mockResolvedValue({ id: "ziina-intent-1", status: "completed", amount: 35000, currency_code: "AED" });

    const result = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);

    expect(result.status).toBe("completed");
    expect(insertedEntitlement).toMatchObject({ user_id: USER_ID, status: "active" });
  });

  it("3b. an instructor's controlled test purchase also fulfills normally", async () => {
    let insertedEntitlement: unknown = null;
    mockPurchaseFlow({ ownerRole: "instructor", onEntitlementInsert: (p) => (insertedEntitlement = p) });
    getIntentMock.mockResolvedValue({ id: "ziina-intent-1", status: "completed", amount: 35000, currency_code: "AED" });

    const result = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);

    expect(result.status).toBe("completed");
    expect(insertedEntitlement).toMatchObject({ status: "active" });
  });

  it("4. a future non-test (live) purchase is NOT blocked merely because is_test_payment is false, even for an ordinary student", async () => {
    let insertedEntitlement: unknown = null;
    mockPurchaseFlow({
      purchase: { ...BASE_PURCHASE, is_test_payment: false },
      ownerRole: "student",
      onEntitlementInsert: (p) => (insertedEntitlement = p),
    });
    getIntentMock.mockResolvedValue({ id: "ziina-intent-1", status: "completed", amount: 35000, currency_code: "AED" });

    const result = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);

    expect(result.status).toBe("completed");
    expect(insertedEntitlement).toMatchObject({ status: "active" });
  });

  it("5. repeated verification cannot bypass the rule - calling it 3 times in a row for a student's test purchase never grants anything, ever", async () => {
    let entitlementInsertCalled = false;
    mockPurchaseFlow({ ownerRole: "student", onEntitlementInsert: () => (entitlementInsertCalled = true) });
    getIntentMock.mockResolvedValue({ id: "ziina-intent-1", status: "completed", amount: 35000, currency_code: "AED" });

    const first = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);
    const second = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);
    const third = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);

    expect([first.status, second.status, third.status]).toEqual(["failed", "failed", "failed"]);
    expect(entitlementInsertCalled).toBe(false);
  });

  it("never exposes the role/security reason in the result - the failure looks identical to any other declined payment", async () => {
    mockPurchaseFlow({ ownerRole: "student" });
    getIntentMock.mockResolvedValue({ id: "ziina-intent-1", status: "completed", amount: 35000, currency_code: "AED" });

    const result = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);

    expect(Object.keys(result).sort()).toEqual(["productSlug", "status"]);
    expect(result.status).toBe("failed");
  });

  it("also blocks a test purchase whose owner has no profile row at all (fails closed, never assumes staff)", async () => {
    let entitlementInsertCalled = false;
    mockPurchaseFlow({ ownerRole: null, onEntitlementInsert: () => (entitlementInsertCalled = true) });
    getIntentMock.mockResolvedValue({ id: "ziina-intent-1", status: "completed", amount: 35000, currency_code: "AED" });

    const result = await verifyAndFulfillZiinaPurchase("purchase-1", USER_ID);

    expect(result.status).toBe("failed");
    expect(entitlementInsertCalled).toBe(false);
  });
});
