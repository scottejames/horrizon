import { describe, expect, it } from "vitest";
import { legacyHorizonFix, toHorizon, toTaskNotes } from "./guards";

describe("toTaskNotes", () => {
  const note = { at: "2026-10-08T09:00:00.000Z", text: "Emailed supplier" };

  it("parses the JSON string an a.json() field comes back as", () => {
    expect(toTaskNotes(JSON.stringify([note]))).toEqual([note]);
  });

  it("accepts an already-parsed array", () => {
    expect(toTaskNotes([note])).toEqual([note]);
  });

  it("treats a missing field (rows written before notes existed) as no notes", () => {
    expect(toTaskNotes(null)).toEqual([]);
    expect(toTaskNotes(undefined)).toEqual([]);
  });

  it("drops malformed entries and unparseable JSON instead of throwing", () => {
    expect(toTaskNotes([note, { at: 1, text: "bad" }, "junk", null])).toEqual([note]);
    expect(toTaskNotes("{not json")).toEqual([]);
    expect(toTaskNotes('{"at":"x","text":"not an array"}')).toEqual([]);
  });
});

describe("legacy Next Week horizon", () => {
  it("reads a stored 'week' horizon as Someday", () => {
    expect(toHorizon("week")).toBe("someday");
  });

  it("moves a Next Week row to Someday without touching anything else", () => {
    expect(legacyHorizonFix({ horizon: "week", deferredFrom: "today" })).toEqual({
      horizon: "someday",
    });
  });

  it("drops a 'deferred from Next Week' tag, which has no equivalent any more", () => {
    expect(legacyHorizonFix({ horizon: "someday", deferredFrom: "week" })).toEqual({
      deferredFrom: null,
    });
  });

  it("leaves current rows alone", () => {
    expect(legacyHorizonFix({ horizon: "tomorrow", deferredFrom: "today" })).toBeNull();
    expect(legacyHorizonFix({ horizon: "today", deferredFrom: null })).toBeNull();
  });
});
