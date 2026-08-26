import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getQuestionImagePublicUrl } from "./imageUrls";

describe("getQuestionImagePublicUrl", () => {
  const original = process.env.NEXT_PUBLIC_SUPABASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  });
  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = original;
  });

  it("builds the real Supabase Storage public URL from a stored object key, not a bare relative path", () => {
    const url = getQuestionImagePublicUrl("question_images/Q000009.png");
    expect(url).toBe("https://example.supabase.co/storage/v1/object/public/question-images/question_images/Q000009.png");
  });

  it("strips a leading slash so the path never becomes a double-slash in the URL", () => {
    const url = getQuestionImagePublicUrl("/question_images/Q000009.png");
    expect(url).toBe("https://example.supabase.co/storage/v1/object/public/question-images/question_images/Q000009.png");
  });
});
