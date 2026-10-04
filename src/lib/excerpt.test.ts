import { describe, it, expect } from "vitest";
import { markdownExcerpt, markdownToPlainText } from "./excerpt";

describe("markdownToPlainText", () => {
  it("strips a leading heading marker without gluing it to the next paragraph", () => {
    const md = "## The Question Most Businesses Skip\n\nMost conversations about AI automation start with the technology.";
    expect(markdownToPlainText(md)).toBe(
      "The Question Most Businesses Skip Most conversations about AI automation start with the technology."
    );
  });

  it("strips bold, italic, and link syntax while keeping the visible text", () => {
    const md = "Some **bold** and _italic_ and a [link](https://example.com) too.";
    expect(markdownToPlainText(md)).toBe("Some bold and italic and a link too.");
  });

  it("separates list items with spaces instead of gluing them together", () => {
    const md = "- First\n- Second\n- Third";
    expect(markdownToPlainText(md)).toBe("First Second Third");
  });

  it("handles Arabic text unchanged beyond structural stripping", () => {
    const md = "## لماذا لا يكفي قراءة المحتوى فقط؟\n\nكثير من المتقدمين لاختبار PMP يقضون وقتاً طويلاً في القراءة.";
    expect(markdownToPlainText(md)).toBe(
      "لماذا لا يكفي قراءة المحتوى فقط؟ كثير من المتقدمين لاختبار PMP يقضون وقتاً طويلاً في القراءة."
    );
  });

  it("does not leave raw markdown artifacts (#, *, _, [, \\n) in the output", () => {
    const md = "## Heading\n\nA paragraph with **bold**, _italic_, and a [link](https://x.com).\n\n- one\n- two";
    const text = markdownToPlainText(md);
    expect(text).not.toMatch(/[#*_\[\]]/);
    expect(text).not.toContain("\n");
  });
});

describe("markdownExcerpt", () => {
  it("truncates at maxLen and appends an ellipsis", () => {
    const md = "## Heading\n\n" + "word ".repeat(50).trim();
    const text = markdownExcerpt(md, 20);
    expect(text.length).toBeLessThanOrEqual(21);
    expect(text.endsWith("…")).toBe(true);
  });

  it("returns the full plain text unchanged when under maxLen", () => {
    const md = "## Short\n\nA short paragraph.";
    expect(markdownExcerpt(md, 200)).toBe("Short A short paragraph.");
  });
});
