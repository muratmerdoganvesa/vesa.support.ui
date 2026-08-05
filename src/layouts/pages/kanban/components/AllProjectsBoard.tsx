import { useState, useEffect, useMemo, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronLeft, ChevronRight, Folder, InboxIcon } from "lucide-react";
import { KanbanTasksListDtoFixed } from "../utils/fetchKanbanData";
import { KanbanColumn as KanbanColumnType, getStatusLabel } from "../types/kanban.types";
import KanbanSortableCard from "./KanbanSortableCard";
import KanbanCard from "./KanbanCard";
import { cn } from "lib/utils";

interface AllProjectsBoardProps {
  data: KanbanTasksListDtoFixed[];
  columns: KanbanColumnType[];
  isMobile: boolean;
  onCardStatusChange: (card: KanbanTasksListDtoFixed) => Promise<void>;
  onCardClick: (card: KanbanTasksListDtoFixed) => void;
}

// ─── Column accent colours ─────────────────────────────────────────────────────

const COLUMN_COLORS: Record<string, { topBorder: string; badge: string; dot: string }> = {
  Backlog:     { topBorder: "border-t-slate-400",   badge: "bg-slate-100 text-slate-600",    dot: "bg-slate-400"    },
  Realization: { topBorder: "border-t-blue-500",    badge: "bg-blue-50 text-blue-700",       dot: "bg-blue-500"     },
  UAT:         { topBorder: "border-t-violet-500",  badge: "bg-violet-50 text-violet-700",   dot: "bg-violet-500"   },
  Preparation: { topBorder: "border-t-amber-500",   badge: "bg-amber-50 text-amber-700",     dot: "bg-amber-500"    },
  Done:        { topBorder: "border-t-emerald-500", badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500"  },
};

const DEFAULT_COLOR = { topBorder: "border-t-slate-300", badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };

// ─── Droppable column wrapper ──────────────────────────────────────────────────

interface DroppableColProps {
  colKey: string;
  title: string;
  cards: KanbanTasksListDtoFixed[];
  projects: { id: string; name: string }[];
  onCardClick: (card: KanbanTasksListDtoFixed) => void;
}

const DroppableCol = ({ colKey, title, cards, projects, onCardClick }: DroppableColProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: `col__${colKey}` });
  const color = COLUMN_COLORS[colKey] ?? DEFAULT_COLOR;
  const cardIds = cards.map((c) => c.Id);

  return (
    <div
      className={cn(
        "flex flex-col min-w-[210px] w-full border border-t-[3px] overflow-hidden transition-all duration-150",
        color.topBorder,
        isOver
          ? "bg-indigo-50/50 border-indigo-300/80 shadow-indigo-100"
          : "bg-white/40 backdrop-blur-sm shadow-sm border-slate-200/80"
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-3 bg-white/60 border-b border-slate-200/70">
        <span className={cn("w-2 h-2 rounded-full shrink-0", color.dot)} />
        <h3 className="text-sm font-semibold text-slate-700 truncate flex-1">{title}</h3>
        <span className={cn("inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold", color.badge)}>
          {cards.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 flex flex-col gap-1 p-2 min-h-[80px] transition-colors duration-100",
          isOver ? "bg-indigo-50/40" : "bg-gray-50"
        )}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {projects.map((project) => {
            const projectCards = cards.filter(
              (c) => (c.projectId ?? "__no_project__") === project.id
            );
            if (projectCards.length === 0) return null;
            return (
              <div key={project.id} className="mb-1">
                {/* Project sub-header */}
                <div className="flex items-center gap-1 px-1 pt-1 pb-0.5">
                  <Folder className="w-2.5 h-2.5 text-indigo-400 shrink-0" aria-hidden />
                  <span className="text-[10px] font-semibold text-slate-500 truncate flex-1">{project.name}</span>
                  <span className="text-[9px] font-semibold text-slate-400 shrink-0">{projectCards.length}</span>
                </div>
                {/* Cards */}
                {projectCards.map((card) => (
                  <KanbanSortableCard key={card.Id} card={card} onCardClick={onCardClick} />
                ))}
              </div>
            );
          })}
        </SortableContext>

        {cards.length === 0 && (
          <div
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed min-h-[72px] transition-colors duration-150",
              isOver ? "border-indigo-300 bg-indigo-50/60" : "border-slate-200/80 bg-slate-50/40"
            )}
          >
            <InboxIcon className={cn("w-4 h-4", isOver ? "text-indigo-400" : "text-slate-300")} />
            <span className={cn("text-[11px] font-medium", isOver ? "text-indigo-500" : "text-slate-400")}>
              {isOver ? "Buraya bırak" : "Kart yok"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Mobile board ──────────────────────────────────────────────────────────────

const MOBILE_TAB_COLORS: Record<string, string> = {
  Backlog:     "text-slate-600   border-slate-400",
  Realization: "text-blue-600    border-blue-500",
  UAT:         "text-violet-600  border-violet-500",
  Preparation: "text-amber-600   border-amber-500",
  Done:        "text-emerald-600 border-emerald-500",
};

const getPrevStatus = (status: string, columns: KanbanColumnType[]) => {
  const idx = columns.findIndex((c) => c.keyField === status);
  return idx > 0 ? columns[idx - 1].keyField : null;
};

const getNextStatus = (status: string, columns: KanbanColumnType[]) => {
  const idx = columns.findIndex((c) => c.keyField === status);
  return idx >= 0 && idx < columns.length - 1 ? columns[idx + 1].keyField : null;
};

interface MobileAllProjectsBoardProps {
  data: KanbanTasksListDtoFixed[];
  columns: KanbanColumnType[];
  projects: { id: string; name: string }[];
  onCardClick: (card: KanbanTasksListDtoFixed) => void;
  onMove: (card: KanbanTasksListDtoFixed, newStatus: string) => void;
}

const MobileAllProjectsBoard = ({ data, columns, projects, onCardClick, onMove }: MobileAllProjectsBoardProps) => {
  const [activeCol, setActiveCol] = useState(columns[0]?.keyField ?? "");
  const activeCards = data.filter((c) => c.Status === activeCol);

  return (
    <div className="flex flex-col gap-3">
      {/* Tab strip */}
      <div className="flex items-center overflow-x-auto scrollbar-none gap-1 pb-1">
        {columns.map((col) => {
          const count = data.filter((c) => c.Status === col.keyField).length;
          const tabColor = MOBILE_TAB_COLORS[col.keyField] ?? "text-slate-600 border-slate-400";
          const isActive = activeCol === col.keyField;
          return (
            <button
              key={col.keyField}
              type="button"
              onClick={() => setActiveCol(col.keyField)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                isActive
                  ? cn("bg-white shadow-sm border-b-2", tabColor)
                  : "bg-transparent border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              {col.headerText}
              <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-bold bg-slate-100">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active column — grouped by project */}
      <div className="flex flex-col gap-3">
        {projects.map((project) => {
          const projectCards = activeCards.filter(
            (c) => (c.projectId ?? "__no_project__") === project.id
          );
          if (projectCards.length === 0) return null;
          return (
            <div key={project.id}>
              <div className="flex items-center gap-1.5 px-1 mb-1.5">
                <Folder className="w-3 h-3 text-indigo-400 shrink-0" aria-hidden />
                <span className="text-xs font-semibold text-slate-600 truncate">{project.name}</span>
                <span className="text-[10px] text-slate-400">{projectCards.length}</span>
              </div>
              {projectCards.map((card) => {
                const prev = getPrevStatus(card.Status, columns);
                const next = getNextStatus(card.Status, columns);
                return (
                  <div key={card.Id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-2">
                    <button
                      type="button"
                      onClick={() => onCardClick(card)}
                      className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    >
                      <KanbanCard data={card} />
                    </button>
                    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={!prev}
                        onClick={() => prev && onMove(card, prev)}
                        className={cn(
                          "flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-colors",
                          prev ? "text-slate-600 hover:bg-slate-200" : "text-slate-300 cursor-not-allowed"
                        )}
                      >
                        <ChevronLeft className="w-3 h-3" />
                        {prev ? getStatusLabel(prev) : "—"}
                      </button>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {getStatusLabel(card.Status)}
                      </span>
                      <button
                        type="button"
                        disabled={!next}
                        onClick={() => next && onMove(card, next)}
                        className={cn(
                          "flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-colors",
                          next ? "text-slate-600 hover:bg-slate-200" : "text-slate-300 cursor-not-allowed"
                        )}
                      >
                        {next ? getStatusLabel(next) : "—"}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        {activeCards.length === 0 && (
          <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-slate-200">
            <span className="text-xs text-slate-400">Bu kolonda kart yok</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── AllProjectsBoard ──────────────────────────────────────────────────────────

const AllProjectsBoard = ({
  data,
  columns,
  isMobile,
  onCardStatusChange,
  onCardClick,
}: AllProjectsBoardProps) => {
  const [localData, setLocalData] = useState<KanbanTasksListDtoFixed[]>(data);
  const [activeCard, setActiveCard] = useState<KanbanTasksListDtoFixed | null>(null);
  const targetStatusRef = useRef<string | null>(null);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  // Compute sorted unique projects
  const projects = useMemo(() => {
    const map = new Map<string, string>();
    for (const card of localData) {
      const key = card.projectId ?? "__no_project__";
      if (!map.has(key)) map.set(key, card.projectName ?? "Genel");
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [localData]);

  const findCard = (id: string) => localData.find((c) => c.Id === id) ?? null;

  const handleDragStart = (event: DragStartEvent) => {
    targetStatusRef.current = null;
    setActiveCard(findCard(String(event.active.id)));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const card = data.find((c) => c.Id === activeId);
    if (!card) return;

    let targetStatus: string | null = null;

    if (overId.startsWith("col__")) {
      targetStatus = overId.replace("col__", "");
    } else {
      const overCard = data.find((c) => c.Id === overId) ?? localData.find((c) => c.Id === overId);
      if (overCard && overCard.Id !== activeId) targetStatus = overCard.Status;
    }

    if (!targetStatus) return;

    targetStatusRef.current = targetStatus;

    if (card.Status !== targetStatus) {
      setLocalData((prev) =>
        prev.map((c) => (c.Id === activeId ? { ...c, Status: targetStatus! } : c))
      );
    }
  };

  const handleDragCancel = () => {
    setActiveCard(null);
    targetStatusRef.current = null;
    setLocalData(data);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    targetStatusRef.current = null;

    const activeId = String(active.id);
    const originalCard = data.find((c) => c.Id === activeId);
    if (!originalCard) {
      setLocalData(data);
      return;
    }

    // Dropped outside any droppable (or ESC cancel) — revert optimistic UI
    if (!over) {
      setLocalData(data);
      return;
    }

    const overId = String(over.id);
    const targetStatus = overId.startsWith("col__")
      ? overId.replace("col__", "")
      : (data.find((c) => c.Id === overId) ?? localData.find((c) => c.Id === overId))?.Status ?? null;

    if (!targetStatus || targetStatus === originalCard.Status) {
      setLocalData(data);
      return;
    }

    await onCardStatusChange({ ...originalCard, Status: targetStatus });
  };

  const handleMobileMove = async (card: KanbanTasksListDtoFixed, newStatus: string) => {
    setLocalData((prev) =>
      prev.map((c) => (c.Id === card.Id ? { ...c, Status: newStatus } : c))
    );
    await onCardStatusChange({ ...card, Status: newStatus });
  };

  if (isMobile) {
    return (
      <MobileAllProjectsBoard
        data={localData}
        columns={columns}
        projects={projects}
        onCardClick={onCardClick}
        onMove={handleMobileMove}
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={(args) => {
        const within = pointerWithin(args);
        if (within.length > 0) return within;
        return rectIntersection(args);
      }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="overflow-x-auto pb-1">
        <div
          className="flex gap-3"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(210px, 1fr))`, minWidth: "1100px", display: "grid" }}
        >
          {columns.map((col) => {
            const colCards = localData.filter((c) => c.Status === col.keyField);
            return (
              <DroppableCol
                key={col.keyField}
                colKey={col.keyField}
                title={col.headerText}
                cards={colCards}
                projects={projects}
                onCardClick={onCardClick}
              />
            );
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 120, easing: "ease" }}>
        {activeCard ? (
          <div className="rounded-xl border border-indigo-300 bg-white shadow-2xl shadow-indigo-200/60 rotate-1 scale-[1.03] cursor-grabbing">
            <KanbanCard data={activeCard} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default AllProjectsBoard;
