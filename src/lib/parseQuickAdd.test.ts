import { describe, expect, it } from "vitest";
import { parseQuickAdd } from "./parseQuickAdd";

describe("parseQuickAdd", () => {
  it("defaults to today with no priority or project for plain text", () => {
    expect(parseQuickAdd("Buy stamps")).toEqual({
      description: "Buy stamps",
      priority: null,
      project: null,
      horizon: "today",
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

  it("parses priority, project, and schedule together regardless of order", () => {
    expect(parseQuickAdd("Call tile supplier !high #KIT tomorrow")).toEqual({
      description: "Call tile supplier",
      priority: "high",
      project: "KIT",
      horizon: "tomorrow",
    });
  });

  it("collapses extra whitespace left behind after removing tokens", () => {
    expect(parseQuickAdd("  Fix   the   sink   !low   #HOM   ")).toMatchObject({
      description: "Fix the sink",
    });
  });

  it("returns an empty description for blank input", () => {
    expect(parseQuickAdd("   ")).toMatchObject({ description: "" });
  });
});
