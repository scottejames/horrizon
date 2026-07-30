import { describe, expect, it } from "vitest";
import { parseQuickAdd } from "./parseQuickAdd";

describe("parseQuickAdd", () => {
  it("defaults to today with no priority, project, or commitment for plain text", () => {
    expect(parseQuickAdd("Buy stamps")).toEqual({
      description: "Buy stamps",
      priority: null,
      project: null,
      horizon: "today",
      commitment: null,
    });
  });

  it("extracts a full-word priority", () => {
    expect(parseQuickAdd("Call supplier !high")).toMatchObject({
      description: "Call supplier",
      priority: "high",
    });
  });

  it("extracts a shorthand priority", () => {
    expect(parseQuickAdd("Call supplier !m")).toMatchObject({
      priority: "med",
    });
  });

  it("extracts and uppercases a project code", () => {
    expect(parseQuickAdd("Order mulch #grd")).toMatchObject({
      description: "Order mulch",
      project: "GRD",
    });
  });

  it("recognizes every schedule keyword", () => {
    expect(parseQuickAdd("Task today")).toMatchObject({ horizon: "today" });
    expect(parseQuickAdd("Task tomorrow")).toMatchObject({ horizon: "tomorrow" });
    expect(parseQuickAdd("Task next week")).toMatchObject({ horizon: "week" });
    expect(parseQuickAdd("Task someday")).toMatchObject({ horizon: "someday" });
  });

  it("recognizes both commitment keywords", () => {
    expect(parseQuickAdd("Task @work")).toMatchObject({ commitment: "work" });
    expect(parseQuickAdd("Task @personal")).toMatchObject({ commitment: "personal" });
  });

  it("parses priority, project, schedule, and commitment together regardless of order", () => {
    expect(parseQuickAdd("Call tile supplier !high #KIT tomorrow @work")).toEqual({
      description: "Call tile supplier",
      priority: "high",
      project: "KIT",
      horizon: "tomorrow",
      commitment: "work",
    });
  });

  it("collapses extra whitespace left behind after removing tokens", () => {
    expect(parseQuickAdd("  Fix   the   sink   !low   #HOM   @personal   ")).toMatchObject({
      description: "Fix the sink",
    });
  });

  it("returns an empty description for blank input", () => {
    expect(parseQuickAdd("   ")).toMatchObject({ description: "" });
  });
});
