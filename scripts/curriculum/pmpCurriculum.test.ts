import { describe, it, expect } from "vitest";
import { PMP_CURRICULUM, TOTAL_CURRICULUM_LESSONS, lessonSlug } from "./pmpCurriculum";

describe("PMP_CURRICULUM", () => {
  it("has exactly 6 modules and 62 total lesson slots, matching the confirmed curriculum count", () => {
    expect(PMP_CURRICULUM).toHaveLength(6);
    expect(TOTAL_CURRICULUM_LESSONS).toBe(62);
  });

  it("has the exact 6 owner-approved module slugs, in the exact database order", () => {
    expect(PMP_CURRICULUM.map((m) => m.slug)).toEqual([
      "course-introduction",
      "project-management-foundations",
      "agile-and-hybrid-mastery",
      "people-domain",
      "process-domain",
      "business-environment-domain",
    ]);
  });

  it("every module and lesson slug is globally unique (safe as an idempotent upsert key)", () => {
    const moduleSlugs = PMP_CURRICULUM.map((m) => m.slug);
    expect(new Set(moduleSlugs).size).toBe(moduleSlugs.length);

    const lessonSlugs = PMP_CURRICULUM.flatMap((m) => m.lessons.map((l) => lessonSlug(m.slug, l.n)));
    expect(new Set(lessonSlugs).size).toBe(lessonSlugs.length);
  });

  it("every module and lesson slug matches the lowercase-alnum-hyphen format required by the DB check constraint", () => {
    const slugPattern = /^[a-z0-9-]+$/;
    for (const mod of PMP_CURRICULUM) {
      expect(mod.slug).toMatch(slugPattern);
      for (const lesson of mod.lessons) {
        expect(lessonSlug(mod.slug, lesson.n)).toMatch(slugPattern);
      }
    }
  });

  it("every lesson has a non-empty bilingual title and a non-empty Bunny reference name", () => {
    for (const mod of PMP_CURRICULUM) {
      for (const lesson of mod.lessons) {
        expect(lesson.titleEn.trim().length).toBeGreaterThan(0);
        expect(lesson.titleAr.trim().length).toBeGreaterThan(0);
        expect(lesson.bunnyReferenceName.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("Module 5 (process-domain) has exactly 11 lessons, with only lesson 11 unpublished", () => {
    const processDomain = PMP_CURRICULUM.find((m) => m.slug === "process-domain")!;
    expect(processDomain.lessons).toHaveLength(11);

    const unpublished = processDomain.lessons.filter((l) => !l.isPublished);
    expect(unpublished).toHaveLength(1);
    expect(unpublished[0].n).toBe(11);
  });

  it("Module 5 lesson 11 carries the exact placeholder title text supplied by the course owner - never an invented title", () => {
    const processDomain = PMP_CURRICULUM.find((m) => m.slug === "process-domain")!;
    const lesson11 = processDomain.lessons.find((l) => l.n === 11)!;

    expect(lesson11.titleEn).toBe("TITLE PENDING — DO NOT INVENT");
    expect(lesson11.titleAr).toBe("العنوان قيد التحديد — لا تخمّنه");
    expect(lesson11.bunnyReferenceName).toBe("module 5 vid 10 compressed");
  });

  it("every lesson other than Module 5 lesson 11 is published", () => {
    for (const mod of PMP_CURRICULUM) {
      for (const lesson of mod.lessons) {
        const isTheOneKnownException = mod.slug === "process-domain" && lesson.n === 11;
        if (!isTheOneKnownException) {
          expect(lesson.isPublished).toBe(true);
        }
      }
    }
  });
});

describe("lessonSlug", () => {
  it("builds a stable, module-scoped slug from the module slug and lesson number", () => {
    expect(lessonSlug("course-introduction", 1)).toBe("course-introduction-lesson-1");
    expect(lessonSlug("process-domain", 11)).toBe("process-domain-lesson-11");
  });
});
