import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const requireRoleMock = vi.fn();
vi.mock("@/lib/auth/requireRole", () => ({ requireRole: (...args: unknown[]) => requireRoleMock(...args) }));

const generateStructuredMock = vi.fn();
const getLLMProviderMock = vi.fn(() => ({ defaultModel: "gpt-4o-2024-08-06", generateStructured: generateStructuredMock }));
vi.mock("@scripts/question-generation/llm", () => ({ getLLMProvider: () => getLLMProviderMock() }));

const { generateCourseDraft, saveApprovedCourse } = await import("./aiCourseBuilderService");

const VALID_INPUT = {
  title_en: "PMP Certification Prep",
  modules: [
    { title_en: "Module 1", lessons: [{ title_en: "Lesson 1.1" }, { title_en: "Lesson 1.2" }] },
    { title_en: "Module 2", lessons: [{ title_en: "Lesson 2.1" }] },
  ],
};

const VALID_RAW_RESPONSE = {
  slug: "pmp-certification-prep",
  description_en: "A course description.",
  modules: [
    {
      description_en: "Module 1 description.",
      lessons: [
        { description_en: "Lesson 1.1 description.", learning_objectives_en: ["Objective A"], duration_minutes: 10 },
        { description_en: "Lesson 1.2 description.", learning_objectives_en: ["Objective B"], duration_minutes: 15 },
      ],
    },
    {
      description_en: "Module 2 description.",
      lessons: [{ description_en: "Lesson 2.1 description.", learning_objectives_en: ["Objective C"], duration_minutes: 20 }],
    },
  ],
};

describe("generateCourseDraft", () => {
  beforeEach(() => {
    requireRoleMock.mockReset().mockResolvedValue({ user: { id: "admin-1" } });
    generateStructuredMock.mockReset();
  });

  it("rejects an empty course title without calling the LLM", async () => {
    const result = await generateCourseDraft({ title_en: "  ", modules: VALID_INPUT.modules });
    expect(result.success).toBe(false);
    expect(generateStructuredMock).not.toHaveBeenCalled();
  });

  it("rejects a course with no modules without calling the LLM", async () => {
    const result = await generateCourseDraft({ title_en: "Title", modules: [] });
    expect(result.success).toBe(false);
    expect(generateStructuredMock).not.toHaveBeenCalled();
  });

  it("rejects a module with no lesson titles without calling the LLM", async () => {
    const result = await generateCourseDraft({ title_en: "Title", modules: [{ title_en: "M1", lessons: [] }] });
    expect(result.success).toBe(false);
    expect(generateStructuredMock).not.toHaveBeenCalled();
  });

  it("maps the AI response onto the admin's input titles/order by index", async () => {
    generateStructuredMock.mockResolvedValue({ data: VALID_RAW_RESPONSE, usage: { promptTokens: 1, completionTokens: 1 }, model: "gpt-4o" });

    const result = await generateCourseDraft(VALID_INPUT);

    expect(result.success).toBe(true);
    expect(result.draft?.title_en).toBe("PMP Certification Prep");
    expect(result.draft?.slug).toBe("pmp-certification-prep");
    expect(result.draft?.modules[0].title_en).toBe("Module 1");
    expect(result.draft?.modules[0].lessons[1].title_en).toBe("Lesson 1.2");
    expect(result.draft?.modules[0].lessons[1].description_en).toBe("Lesson 1.2 description.");
    expect(result.draft?.modules[1].lessons[0].duration_minutes).toBe(20);
  });

  it("fails closed when the AI returns a different number of modules than requested", async () => {
    generateStructuredMock.mockResolvedValue({
      data: { ...VALID_RAW_RESPONSE, modules: VALID_RAW_RESPONSE.modules.slice(0, 1) },
      usage: { promptTokens: 1, completionTokens: 1 },
      model: "gpt-4o",
    });

    const result = await generateCourseDraft(VALID_INPUT);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/number of modules/);
  });

  it("fails closed when the AI returns a different number of lessons for a module", async () => {
    const badResponse = {
      ...VALID_RAW_RESPONSE,
      modules: [
        { ...VALID_RAW_RESPONSE.modules[0], lessons: VALID_RAW_RESPONSE.modules[0].lessons.slice(0, 1) },
        VALID_RAW_RESPONSE.modules[1],
      ],
    };
    generateStructuredMock.mockResolvedValue({ data: badResponse, usage: { promptTokens: 1, completionTokens: 1 }, model: "gpt-4o" });

    const result = await generateCourseDraft(VALID_INPUT);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/number of lessons/);
  });

  it("returns a generic error and never throws when the LLM call itself fails", async () => {
    generateStructuredMock.mockRejectedValue(new Error("provider timeout"));

    const result = await generateCourseDraft(VALID_INPUT);
    expect(result.success).toBe(false);
    expect(result.error).toBe("AI generation failed. Please try again.");
  });
});

describe("saveApprovedCourse", () => {
  const DRAFT = {
    title_en: "PMP Certification Prep",
    slug: "pmp-certification-prep",
    description_en: "Course description.",
    modules: [
      {
        title_en: "Module 1",
        description_en: "Module description.",
        order_index: 0,
        lessons: [
          { title_en: "Lesson 1.1", description_en: "Lesson desc.", learning_objectives_en: ["A"], duration_minutes: 10, order_index: 0 },
        ],
      },
    ],
  };

  function buildSupabaseMock() {
    const inserts: { table: string; payload: Record<string, unknown> }[] = [];
    return {
      from: (table: string) => ({
        insert: (payload: Record<string, unknown>) => {
          inserts.push({ table, payload });
          return {
            select: () => ({
              single: async () => ({ data: { id: `${table}-id-1` }, error: null }),
            }),
          };
        },
      }),
      inserts,
    };
  }

  beforeEach(() => {
    requireRoleMock.mockReset();
  });

  it("always inserts the course with is_published forced to false, regardless of the draft", async () => {
    const supabase = buildSupabaseMock();
    requireRoleMock.mockResolvedValue({ supabase });

    const result = await saveApprovedCourse(DRAFT);

    expect(result.success).toBe(true);
    const courseInsert = supabase.inserts.find((i) => i.table === "courses");
    expect(courseInsert?.payload.is_published).toBe(false);
    const moduleInsert = supabase.inserts.find((i) => i.table === "modules");
    expect(moduleInsert?.payload.is_published).toBe(false);
    const lessonInsert = supabase.inserts.find((i) => i.table === "lessons");
    expect(lessonInsert?.payload.is_published).toBe(false);
  });

  it("rejects an invalid slug before touching the database", async () => {
    const supabase = buildSupabaseMock();
    requireRoleMock.mockResolvedValue({ supabase });

    const result = await saveApprovedCourse({ ...DRAFT, slug: "Not A Valid Slug!" });

    expect(result.success).toBe(false);
    expect(supabase.inserts).toHaveLength(0);
  });
});
