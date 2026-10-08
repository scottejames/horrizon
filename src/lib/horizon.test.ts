import { describe, expect, it } from "vitest";
import { isDeferral } from "./horizon";

describe("isDeferral", () => {
  it("treats a move to a later horizon as a deferral", () => {
    expect(isDeferral("today", "tomorrow")).toBe(true);
    expect(isDeferral("tomorrow", "someday")).toBe(true);
  });

  it("treats a move to an earlier horizon as scheduling, not deferral", () => {
    expect(isDeferral("tomorrow", "today")).toBe(false);
    expect(isDeferral("week", "tomorrow")).toBe(false);
    expect(isDeferral("someday", "week")).toBe(false);
  });
});
