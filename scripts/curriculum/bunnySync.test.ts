import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SyncRow } from "./bunnySync";

const fromMock = vi.fn();
vi.mock("../../src/lib/supabase/admin", () => ({
  supabaseAdmin: { from: (...args: unknown[]) => fromMock(...args) },
}));

const {
  computeMatchStatus,
  parseArgs,
  filterByModule,
  flattenCurriculum,
  matchKeys,
  findCandidates,
  buildIndex,
  applyMatches,
  main,
} = await import("./bunnySync");
const { TOTAL_CURRICULUM_LESSONS, PMP_CURRICULUM } = await import("./pmpCurriculum");

function video(overrides: Partial<{ guid: string; title: string; length: number; status: number }> = {}) {
  return { guid: "guid-1", title: "module3-part1.mp4", length: 120, status: 4, ...overrides };
}

function row(overrides: Partial<SyncRow> = {}): SyncRow {
  return {
    moduleNumber: 3,
    moduleSlug: "agile-and-hybrid-mastery",
    moduleTitleEn: "Agile and Hybrid Mastery",
    n: 1,
    titleEn: "Agile and Hybrid Mastery",
    bunnyReferenceName: "module3-part1.mp4",
    lessonId: "lesson-1",
    currentProvider: "none",
    currentVideoUrl: null,
    computed: { status: "MISSING" },
    ...overrides,
  };
}

describe("computeMatchStatus", () => {
  it("is MATCH when there is exactly one finished candidate and no existing video", () => {
    const v = video();
    const result = computeMatchStatus([v], { provider: "none", videoUrl: null });
    expect(result.status).toBe("MATCH");
    expect(result.matchedVideo).toEqual(v);
  });

  it("is ALREADY_CORRECT when the lesson already has the exact same bunny guid attached", () => {
    const v = video({ guid: "same-guid" });
    const result = computeMatchStatus([v], { provider: "bunny", videoUrl: "same-guid" });
    expect(result.status).toBe("ALREADY_CORRECT");
  });

  it("is CONFLICT when the lesson has a different bunny guid attached", () => {
    const v = video({ guid: "new-guid" });
    const result = computeMatchStatus([v], { provider: "bunny", videoUrl: "old-different-guid" });
    expect(result.status).toBe("CONFLICT");
  });

  it("is CONFLICT when the lesson has a completely different provider attached (e.g. youtube)", () => {
    const v = video();
    const result = computeMatchStatus([v], { provider: "youtube", videoUrl: "https://youtube.com/embed/abc" });
    expect(result.status).toBe("CONFLICT");
  });

  it("is MISSING when no Bunny video matches the reference at all", () => {
    const result = computeMatchStatus([], { provider: "none", videoUrl: null });
    expect(result.status).toBe("MISSING");
  });

  it("is MISSING (not attachable) when the only match hasn't finished processing yet", () => {
    const v = video({ status: 1 }); // still processing
    const result = computeMatchStatus([v], { provider: "none", videoUrl: null });
    expect(result.status).toBe("MISSING");
  });

  it("is AMBIGUOUS when more than one Bunny video matches the same reference", () => {
    const result = computeMatchStatus([video({ guid: "a" }), video({ guid: "b" })], { provider: "none", videoUrl: null });
    expect(result.status).toBe("AMBIGUOUS");
    expect(result.ambiguousCandidates).toHaveLength(2);
  });

  it("never treats an ambiguous match as attachable, even if the lesson has no existing video", () => {
    const result = computeMatchStatus([video({ guid: "a" }), video({ guid: "b" })], { provider: "none", videoUrl: null });
    expect(result.status).not.toBe("MATCH");
  });
});

describe("parseArgs", () => {
  it("defaults to entire-curriculum, dry-run when no flags are given", () => {
    expect(parseArgs([])).toEqual({ moduleNumber: undefined, apply: false });
  });

  it("parses --module <n> into a 1-based module number", () => {
    expect(parseArgs(["--module", "3"])).toEqual({ moduleNumber: 3, apply: false });
  });

  it("parses --apply as a boolean flag with no value", () => {
    expect(parseArgs(["--apply"])).toEqual({ moduleNumber: undefined, apply: true });
  });

  it("parses --module and --apply together, in either order", () => {
    expect(parseArgs(["--module", "3", "--apply"])).toEqual({ moduleNumber: 3, apply: true });
    expect(parseArgs(["--apply", "--module", "3"])).toEqual({ moduleNumber: 3, apply: true });
  });

  it("rejects a non-numeric or non-positive --module value rather than silently ignoring it", () => {
    expect(() => parseArgs(["--module", "abc"])).toThrow();
    expect(() => parseArgs(["--module", "0"])).toThrow();
    expect(() => parseArgs(["--module", "-1"])).toThrow();
  });
});

describe("flattenCurriculum / filterByModule (module scope)", () => {
  it("flattens the entire curriculum with stable, absolute 1-based module numbers", () => {
    const entries = flattenCurriculum();
    expect(entries).toHaveLength(TOTAL_CURRICULUM_LESSONS);
    expect(entries.filter((e) => e.moduleNumber === 3)[0].moduleSlug).toBe(PMP_CURRICULUM[2].slug);
  });

  it("entire-course mode (no --module) returns every lesson, unfiltered", () => {
    const entries = flattenCurriculum();
    expect(filterByModule(entries, undefined)).toHaveLength(TOTAL_CURRICULUM_LESSONS);
  });

  it("module-scoped sync restricts entries to exactly one module's lessons", () => {
    const entries = flattenCurriculum();
    const scoped = filterByModule(entries, 3);
    expect(scoped.length).toBe(PMP_CURRICULUM[2].lessons.length);
    expect(scoped.every((e) => e.moduleNumber === 3)).toBe(true);
  });
});

describe("matchKeys / findCandidates (existing exact-normalization matching, preserved)", () => {
  it("matches case/whitespace-insensitively", () => {
    const index = buildIndex([video({ guid: "x", title: "Module3-Part1.MP4" })]);
    expect(findCandidates(index, "module3-part1.mp4")).toHaveLength(1);
  });

  it("matches with or without a trailing extension on either side", () => {
    const index = buildIndex([video({ guid: "x", title: "module3-part1" })]);
    expect(findCandidates(index, "module3-part1.mp4")).toHaveLength(1);
  });

  it("does not fuzzy/partial match an unrelated title", () => {
    const index = buildIndex([video({ guid: "x", title: "module3-part10.mp4" })]);
    expect(findCandidates(index, "module3-part1.mp4")).toHaveLength(0);
  });
});

describe("applyMatches (apply safety + conflict protection)", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("writes only MATCH rows, leaving ALREADY_CORRECT/MISSING/AMBIGUOUS/CONFLICT completely untouched", async () => {
    const updateCalls: { table: string; payload: unknown; id: string }[] = [];
    fromMock.mockImplementation((table: string) => ({
      update: (payload: unknown) => ({
        eq: (_col: string, id: string) => {
          updateCalls.push({ table, payload, id });
          return Promise.resolve({ error: null });
        },
      }),
    }));

    const rows: SyncRow[] = [
      row({ n: 1, lessonId: "lesson-1", computed: { status: "MATCH", matchedVideo: video({ guid: "g1" }) } }),
      row({ n: 2, lessonId: "lesson-2", computed: { status: "ALREADY_CORRECT", matchedVideo: video({ guid: "g2" }) } }),
      row({ n: 3, lessonId: "lesson-3", computed: { status: "MISSING" } }),
      row({ n: 4, lessonId: "lesson-4", computed: { status: "AMBIGUOUS", ambiguousCandidates: [video(), video()] } }),
      row({ n: 5, lessonId: "lesson-5", computed: { status: "CONFLICT", matchedVideo: video({ guid: "g5" }) } }),
    ];

    const { applied, errors } = await applyMatches(rows);

    expect(errors).toEqual([]);
    expect(applied).toHaveLength(1);
    expect(applied[0].n).toBe(1);
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].id).toBe("lesson-1");
    expect(updateCalls[0].payload).toMatchObject({ video_provider: "bunny", video_url: "g1" });
  });

  it("never calls update for a CONFLICT row, even though a candidate video exists", async () => {
    const updateFn = vi.fn(() => ({ eq: () => Promise.resolve({ error: null }) }));
    fromMock.mockImplementation(() => ({ update: updateFn }));

    const rows: SyncRow[] = [row({ computed: { status: "CONFLICT", matchedVideo: video() } })];
    const { applied } = await applyMatches(rows);

    expect(applied).toHaveLength(0);
    expect(updateFn).not.toHaveBeenCalled();
  });

  it("leaves a MISSING lesson's row completely unchanged (no update call at all)", async () => {
    const updateFn = vi.fn(() => ({ eq: () => Promise.resolve({ error: null }) }));
    fromMock.mockImplementation(() => ({ update: updateFn }));

    const rows: SyncRow[] = [row({ computed: { status: "MISSING" } })];
    const { applied } = await applyMatches(rows);

    expect(applied).toHaveLength(0);
    expect(updateFn).not.toHaveBeenCalled();
  });

  it("is idempotent: re-applying an already-attached (ALREADY_CORRECT) row writes nothing", async () => {
    const updateFn = vi.fn(() => ({ eq: () => Promise.resolve({ error: null }) }));
    fromMock.mockImplementation(() => ({ update: updateFn }));

    const rows: SyncRow[] = [row({ computed: { status: "ALREADY_CORRECT", matchedVideo: video() } })];
    const { applied } = await applyMatches(rows);

    expect(applied).toHaveLength(0);
    expect(updateFn).not.toHaveBeenCalled();
  });
});

describe("main() dry-run guarantee (integration-level)", () => {
  const originalArgv = process.argv;
  const originalApiKey = process.env.BUNNY_STREAM_API_KEY;
  const originalLibraryId = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID;

  beforeEach(() => {
    fromMock.mockReset();
    process.env.BUNNY_STREAM_API_KEY = "test-key-not-real";
    process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID = "12345";
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.env.BUNNY_STREAM_API_KEY = originalApiKey;
    process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID = originalLibraryId;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("performs zero database writes when --apply is not passed, even with a perfectly matchable video available", async () => {
    const updateFn = vi.fn(() => ({ eq: () => Promise.resolve({ error: null }) }));
    fromMock.mockImplementation((table: string) => {
      if (table === "courses") return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: "course-1" } }) }) }) };
      if (table === "modules") return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: "module-3-id" } }) }) }) }) };
      if (table === "lessons") {
        return {
          select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: "lesson-1", video_provider: "none", video_url: null } }) }) }) }),
          update: updateFn,
        };
      }
      return {};
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ totalItems: 1, currentPage: 1, itemsPerPage: 100, items: [{ guid: "g1", title: "module3-part1.mp4", length: 120, status: 4 }] }),
          { status: 200 }
        )
      )
    );

    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    process.argv = ["node", "bunnySync.ts", "--module", "3"];

    await main();

    expect(updateFn).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});
