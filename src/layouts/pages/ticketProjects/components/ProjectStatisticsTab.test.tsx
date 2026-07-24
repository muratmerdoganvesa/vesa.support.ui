import { fireEvent, render, screen } from "@testing-library/react";
import { ProjectTypes } from "api/generated";
import { describe, expect, it, vi } from "vitest";
import {
  getProjectTypeColumns,
  type ProjectTypeColumnKey,
} from "../projectTypeHelpers";
import type { StatsBoardItem } from "../types";
import {
  getStatisticsSearchCopy,
  MobileBoard,
  StatisticsLoadError,
} from "./ProjectStatisticsTab";

const createGroupedItems = (): Record<ProjectTypeColumnKey, StatsBoardItem[]> => {
  const columns = getProjectTypeColumns();
  const groups = Object.fromEntries(columns.map((column) => [column.key, []])) as Record<
    ProjectTypeColumnKey,
    StatsBoardItem[]
  >;

  groups[ProjectTypes.NUMBER_5] = [
    {
      kind: "kalem",
      id: "done-item",
      projectId: "project-1",
      customerName: "Vesa",
      projectDescription: "Tamamlanan proje",
      modules: [],
      employees: [],
      projectStatus: ProjectTypes.NUMBER_5,
    },
  ];

  return groups;
};

describe("MobileBoard", () => {
  it("opens the column selected by the status filter", () => {
    const columns = getProjectTypeColumns();
    const groupedItems = createGroupedItems();
    const { rerender } = render(
      <MobileBoard columns={columns} groupedItems={groupedItems} selectedStatus="All" />,
    );

    expect(screen.queryByText("Tamamlanan proje")).not.toBeInTheDocument();

    rerender(
      <MobileBoard
        columns={columns}
        groupedItems={groupedItems}
        selectedStatus={ProjectTypes.NUMBER_5}
      />,
    );

    expect(screen.getByText("Tamamlanan proje")).toBeInTheDocument();
  });
});

describe("StatisticsLoadError", () => {
  it("invokes retry from the persistent error state", () => {
    const handleRetry = vi.fn();

    render(<StatisticsLoadError onRetry={handleRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));

    expect(handleRetry).toHaveBeenCalledOnce();
  });
});

describe("getStatisticsSearchCopy", () => {
  it("describes person-only search in the people view", () => {
    expect(getStatisticsSearchCopy("people")).toEqual({
      placeholder: "Kişi ara...",
      ariaLabel: "Kişilerde ara",
    });
  });

  it("describes module-only search in the modules view", () => {
    expect(getStatisticsSearchCopy("modules")).toEqual({
      placeholder: "Modül ara...",
      ariaLabel: "Modüllerde ara",
    });
  });
});
