import { describe, it, expect, vi } from "vitest";

const rpcMock = vi.fn();
vi.mock("../question-bank/supabaseAdminClient", () => ({
  supabaseAdmin: { rpc: (...args: unknown[]) => rpcMock(...args) },
}));

const { allocateQuestionId } = await import("./questionIdAllocator");

describe("allocateQuestionId", () => {
  it("calls the next_ai_question_id RPC and returns its result verbatim", async () => {
    rpcMock.mockResolvedValueOnce({ data: "AIQ000042", error: null });
    const id = await allocateQuestionId();
    expect(id).toBe("AIQ000042");
    expect(rpcMock).toHaveBeenCalledWith("next_ai_question_id");
  });

  it("throws rather than falling back to a computed ID when the RPC errors", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "connection refused" } });
    await expect(allocateQuestionId()).rejects.toThrow(/connection refused/);
  });

  it("throws when the RPC returns no data even without an explicit error", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await expect(allocateQuestionId()).rejects.toThrow(/no ID returned/);
  });
});
