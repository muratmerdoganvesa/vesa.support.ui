import { fireEvent, render, screen } from "@testing-library/react";
import { ProjectTypes } from "api/generated";
import { describe, expect, it, vi } from "vitest";
import type { StatsBoardItem } from "../types";
import ProjectStatsKanbanCard from "./ProjectStatsKanbanCard";

const kalemItem: StatsBoardItem = {
  kind: "kalem",
  id: "task-1",
  projectId: "project-1",
  customerName: "Armada",
  projectDescription: "Armada - armadaya proje ekliyorum",
  modules: [],
  employees: [],
  taskId: 12,
  kalemName: "New Task",
  projectStatus: ProjectTypes.NUMBER_1,
  taskChecklist: {
    systemAccess: 4,
    conceptualApproval: 2,
    uatTestScenarios: null,
    masterDataTemplate: 1,
    authorization: 3,
    integration: null,
  },
};

const projectItem: StatsBoardItem = {
  kind: "project",
  id: "project-1",
  projectId: "project-1",
  customerName: "Armada",
  projectDescription: "armadaya proje ekliyorum",
  modules: [],
  employees: [],
};

describe("ProjectStatsKanbanCard checklist", () => {
  it("hides task questions until the card is expanded", () => {
    const handleToggleExpand = vi.fn();

    render(
      <ProjectStatsKanbanCard
        item={kalemItem}
        cardBorderClass="border-l-slate-400"
        isExpanded={false}
        onToggleExpand={handleToggleExpand}
      />,
    );

    expect(screen.queryByText("Sisteme giriş sağlandı mı?")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /kartını genişlet/i }));
    expect(handleToggleExpand).toHaveBeenCalledWith("task-1");
  });

  it("shows the bound task questions and answers when expanded", () => {
    render(
      <ProjectStatsKanbanCard
        item={kalemItem}
        cardBorderClass="border-l-slate-400"
        isExpanded
        onToggleExpand={vi.fn()}
      />,
    );

    expect(screen.getByText("Sisteme giriş sağlandı mı?")).toBeInTheDocument();
    expect(screen.getByText("Tamamlandı")).toBeInTheDocument();
    expect(screen.getByText("Kavramsal onay alındı mı?")).toBeInTheDocument();
    expect(screen.getByText("Danışmanda Devam Ediyor")).toBeInTheDocument();
    expect(screen.getByText("UAT test senaryoları müşteriye atıldı mı?")).toBeInTheDocument();
    expect(screen.getByText("Ana veri format müşteriye atıldı mı?")).toBeInTheDocument();
    expect(screen.getByText("Başlanmadı")).toBeInTheDocument();
    expect(screen.getByText("Yetkilendirme")).toBeInTheDocument();
    expect(screen.getByText("Müşteride Devam Ediyor")).toBeInTheDocument();
    expect(screen.getByText("Entegrasyon çalışmaları")).toBeInTheDocument();
    expect(screen.getAllByText("Seçilmedi")).toHaveLength(2);
  });

  it("does not show task questions on a project card that has no kalem", () => {
    render(
      <ProjectStatsKanbanCard
        item={projectItem}
        cardBorderClass="border-l-slate-400"
        isExpanded
        onToggleExpand={vi.fn()}
      />,
    );

    expect(screen.queryByText("Sisteme giriş sağlandı mı?")).not.toBeInTheDocument();
  });
});
