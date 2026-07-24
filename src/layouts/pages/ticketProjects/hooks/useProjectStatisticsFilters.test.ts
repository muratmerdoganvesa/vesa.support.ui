import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StatsBoardItem } from "../types";
import { useProjectStatisticsFilters } from "./useProjectStatisticsFilters";

const item: StatsBoardItem = {
  kind: "project",
  id: "project-1",
  projectId: "project-1",
  customerName: "Vesa",
  projectDescription: "Destek",
  modules: [],
  projectManager: { id: "alice", fullName: "Alice" },
  employees: [{ id: "bob", fullName: "Bob" }],
};

const departments = new Map([
  ["alice", "Engineering"],
  ["bob", "Sales"],
]);

const levels = new Map([
  ["alice", "Junior"],
  ["bob", "Senior"],
]);

describe("useProjectStatisticsFilters option counts", () => {
  it("does not count departments or people belonging to a different level", () => {
    const { result } = renderHook(() =>
      useProjectStatisticsFilters([item], departments, levels),
    );

    act(() => result.current.handleLevelSelect("Senior"));

    expect(
      result.current.uniqueDepartments.find(({ name }) => name === "Engineering")?.count,
    ).toBe(0);
    expect(result.current.uniquePersons.find(({ id }) => id === "alice")?.count).toBe(0);
    expect(result.current.uniquePersons.find(({ id }) => id === "bob")?.count).toBe(1);
  });

  it("does not count levels belonging to a different department", () => {
    const { result } = renderHook(() =>
      useProjectStatisticsFilters([item], departments, levels),
    );

    act(() => result.current.handleDepartmentSelect("Engineering"));

    expect(result.current.uniqueLevels.find(({ name }) => name === "Senior")?.count).toBe(0);
    expect(result.current.uniqueLevels.find(({ name }) => name === "Junior")?.count).toBe(1);
  });
});
