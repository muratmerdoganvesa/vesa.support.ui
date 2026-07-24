import { describe, expect, it } from "vitest";
import type { StatsBoardItem } from "../types";
import {
  getHighlightPersonIds,
  getMatchingItemPersonIds,
  type PersonFilterCriteria,
} from "./projectStatisticsPersonFilters";

const createItem = (): StatsBoardItem => ({
  kind: "project",
  id: "project-1",
  projectId: "project-1",
  customerName: "Vesa",
  projectDescription: "Destek",
  modules: [],
  projectManager: { id: "alice", fullName: "Alice" },
  employees: [
    { id: "alice", fullName: "Alice" },
    { id: "bob", fullName: "Bob" },
  ],
});

const criteria: PersonFilterCriteria = {
  selectedPersonId: "All",
  selectedDepartment: "Engineering",
  selectedLevel: "Senior",
};

describe("getMatchingItemPersonIds", () => {
  it("rejects an item when department and level match different people", () => {
    const departments = new Map([
      ["alice", "Engineering"],
      ["bob", "Sales"],
    ]);
    const levels = new Map([
      ["alice", "Junior"],
      ["bob", "Senior"],
    ]);

    expect(getMatchingItemPersonIds(createItem(), criteria, departments, levels)).toEqual([]);
  });

  it("returns each person once when that person satisfies every active criterion", () => {
    const departments = new Map([
      ["alice", "Engineering"],
      ["bob", "Sales"],
    ]);
    const levels = new Map([
      ["alice", "Senior"],
      ["bob", "Senior"],
    ]);

    expect(getMatchingItemPersonIds(createItem(), criteria, departments, levels)).toEqual([
      "alice",
    ]);
  });
});

describe("getHighlightPersonIds", () => {
  it("highlights only people satisfying all active person criteria", () => {
    const departments = new Map([
      ["alice", "Engineering"],
      ["bob", "Sales"],
    ]);
    const levels = new Map([
      ["alice", "Senior"],
      ["bob", "Senior"],
    ]);

    expect(
      getHighlightPersonIds([createItem()], criteria, departments, levels),
    ).toEqual(new Set(["alice"]));
  });

  it("disables highlighting when no person criterion is active", () => {
    const noCriteria: PersonFilterCriteria = {
      selectedPersonId: "All",
      selectedDepartment: "All",
      selectedLevel: "All",
    };

    expect(getHighlightPersonIds([createItem()], noCriteria, new Map(), new Map())).toBeNull();
  });
});
