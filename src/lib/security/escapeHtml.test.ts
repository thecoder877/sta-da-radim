import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { escapeHtml } from "./escapeHtml.ts";

describe("escapeHtml", () => {
  it("escapes tags and quotes", () => {
    assert.equal(escapeHtml(`<img src=x onerror="alert(1)">`), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });
});
