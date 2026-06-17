import { Search, X } from "lucide-react";
import { useState } from "react";
import { Input } from "components/ui/input";
import { ProjectWorkloadSummary } from "../types";
import ProjectRowCard from "./ProjectRowCard";

interface ProjectListPanelProps {
  projects: ProjectWorkloadSummary[];
  selectedProjectId: string | null;
  onSelect: (project: ProjectWorkloadSummary) => void;
}

const ProjectListPanel = ({ projects, selectedProjectId, onSelect }: ProjectListPanelProps) => {
  const [search, setSearch] = useState("");

  const filtered = projects.filter((p) => {
    const label = p.subProjectName
      ? `${p.projectName} ${p.subProjectName}`
      : p.projectName;
    return label.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
      {/* Header */}
      <div className="border-b border-border/60 px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Projeler</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {projects.filter((p) => p.isActive).length} aktif, {projects.filter((p) => !p.isActive).length} pasif
        </p>
      </div>

      {/* Search */}
      <div className="border-b border-border/40 px-3 py-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Proje ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 pr-7 text-sm"
            aria-label="Proje ara"
          />
          {search && (
            <button
              type="button"
              aria-label="Aramayı temizle"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded text-muted-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <X className="size-3" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div
        role="listbox"
        aria-label="Proje listesi"
        className="max-h-80 overflow-y-auto overscroll-contain"
      >
        {filtered.length > 0 ? (
          filtered.map((project) => (
            <ProjectRowCard
              key={project.projectId}
              project={project}
              isSelected={selectedProjectId === project.projectId}
              onClick={onSelect}
            />
          ))
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Proje bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectListPanel;
