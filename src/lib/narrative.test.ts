import { describe, expect, it } from "vitest";
import { appendNarrativeEntry, compressNarrative, describeCompletedBatch } from "./narrative";

describe("describeCompletedBatch", () => {
  const fixedDate = new Date("2026-07-31T12:00:00Z");

  it("returns an empty string for no descriptions", () => {
    expect(describeCompletedBatch([], fixedDate)).toBe("");
  });

  it("describes a single completed task", () => {
    expect(describeCompletedBatch(["Call tile supplier"], fixedDate)).toBe(
      '31 Jul: wrapped up "Call tile supplier".',
    );
  });

  it("joins two tasks with 'and'", () => {
    expect(describeCompletedBatch(["Call tile supplier", "Order mulch"], fixedDate)).toBe(
      '31 Jul: wrapped up "Call tile supplier" and "Order mulch".',
    );
  });

  it("joins three or more tasks with commas and a trailing 'and'", () => {
    expect(
      describeCompletedBatch(["Call tile supplier", "Order mulch", "Buy stamps"], fixedDate),
    ).toBe('31 Jul: wrapped up "Call tile supplier", "Order mulch", and "Buy stamps".');
  });
});

describe("appendNarrativeEntry", () => {
  it("returns the existing narrative unchanged if there's nothing new", () => {
    expect(appendNarrativeEntry("Jul 30: wrapped up \"X\".", "")).toBe('Jul 30: wrapped up "X".');
  });

  it("becomes the entry itself when the narrative was empty", () => {
    expect(appendNarrativeEntry("", '31 Jul: wrapped up "X".')).toBe('31 Jul: wrapped up "X".');
  });

  it("appends as a new line, keeping earlier entries intact", () => {
    expect(appendNarrativeEntry('Jul 30: wrapped up "X".', '31 Jul: wrapped up "Y".')).toBe(
      'Jul 30: wrapped up "X".\n31 Jul: wrapped up "Y".',
    );
  });
});

describe("compressNarrative", () => {
  it("leaves an empty narrative unchanged", () => {
    expect(compressNarrative("", 0)).toBe("");
  });

  it("leaves a single-entry narrative unchanged — nothing meaningful to compress yet", () => {
    expect(compressNarrative('31 Jul: wrapped up "X".', 1)).toBe('31 Jul: wrapped up "X".');
  });

  it("collapses multiple entries into a tally plus the most recent entry", () => {
    const narrative = 'Jul 30: wrapped up "X".\n31 Jul: wrapped up "Y".';
    expect(compressNarrative(narrative, 5)).toBe(
      '5 tasks completed so far. Most recently — 31 Jul: wrapped up "Y".',
    );
  });

  it("uses singular phrasing for a count of exactly one", () => {
    const narrative = 'Jul 30: wrapped up "X".\n31 Jul: wrapped up "Y".';
    expect(compressNarrative(narrative, 1)).toBe(
      '1 task completed so far. Most recently — 31 Jul: wrapped up "Y".',
    );
  });
});
