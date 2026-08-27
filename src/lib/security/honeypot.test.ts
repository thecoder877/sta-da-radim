import { describe, expect, it } from "vitest";
import { isBotSubmission } from "./honeypot";

describe("isBotSubmission", () => {
  it("treats a filled honeypot field as a bot", () => {
    expect(isBotSubmission({ company: "Acme", startedAt: Date.now() - 5_000 })).toBe(
      true,
    );
  });

  it("allows a fast human or password-manager submit", () => {
    expect(isBotSubmission({ company: "", startedAt: Date.now() - 100 })).toBe(false);
    expect(isBotSubmission({ company: "  ", startedAt: undefined })).toBe(false);
  });
});
