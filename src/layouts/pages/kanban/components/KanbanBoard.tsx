import { useState, useEffect, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { KanbanTasksListDtoFixed } from "../utils/fetchKanbanData";
import { KanbanColumn as KanbanColumnType } from "../types/kanban.types";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import { cn } from "lib/utils";

interface KanbanBoardProps {
  data: KanbanTasksListDtoFixed[];
  columns: KanbanColumnType[];
  isMobile: boolean;
  onCardStatusChange: (card: KanbanTasksListDtoFixed) => Promise<void>;
  onCardClick: (card: KanbanTasksListDtoFixed) => void;
}

// ─── Mobile column tab colours ────────────────────────────────────────────────

const MOBILE_TAB_COLORS: Record<string, string> = {
  Backlog:     "text-slate-600   border-slate-400",
  Realization: "text-blue-600    border-blue-500",
  UAT:         "text-violet-600  border-violet-500",
  Preparation: "text-amber-600   border-amber-500",
  Done:        "text-emerald-600 border-emerald-500",
};

const getPrevStatus = (currentStatus: string, columns: KanbanColumnType[]) => {
  const idx = columns.findIndex((c) => c.keyField === currentStatus);
  return idx > 0 ? columns[idx - 1].keyField : null;
};

const getNextStatus = (currentStatus: string, columns: KanbanColumnType[]) => {
  const idx = columns.findIndex((c) => c.keyField === currentStatus);
  return idx >= 0 && idx < columns.length - 1 ? columns[idx + 1].keyField : null;
};

// ─── Mobile board ─────────────────────────────────────────────────────────────

interface MobileBoardProps {
  data: KanbanTasksListDtoFixed[];
  columns: KanbanColumnType[];
  onCardClick: (card: KanbanTasksListDtoFixed) => void;
  onMove: (card: KanbanTasksListDtoFixed, newStatus: string) => void;
}

const MobileBoard = ({ data, columns, onCardClick, onMove }: MobileBoardProps) => {
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

      {/* Active column cards */}
      <div className="flex flex-col gap-2">
        {activeCards.length === 0 ? (
          <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-slate-200">
            <span className="text-xs text-slate-400">Bu kolonda kart yok</span>
          </div>
        ) : (
          activeCards.map((card) => {
            const prev = getPrevStatus(card.Status, columns);
            const next = getNextStatus(card.Status, columns);
            return (
              <div key={card.Id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => onCardClick(card)}
                  className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  aria-label={`Görevi düzenle: ${card.Summary}`}
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
                    aria-label={prev ? `${prev} kolonuna taşı` : "Önceki kolon yok"}
                  >
                    <ChevronLeft className="w-3 h-3" />
                    {prev ?? "—"}
                  </button>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    {card.Status}
                  </span>
                  <button
                    type="button"
                    disabled={!next}
                    onClick={() => next && onMove(card, next)}
                    className={cn(
                      "flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-colors",
                      next ? "text-slate-600 hover:bg-slate-200" : "text-slate-300 cursor-not-allowed"
                    )}
                    aria-label={next ? `${next} kolonuna taşı` : "Sonraki kolon yok"}
                  >
                    {next ?? "—"}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─── Desktop board ────────────────────────────────────────────────────────────

const KanbanBoard = ({
  data,
  columns,
  isMobile,
  onCardStatusChange,
  onCardClick,
}: KanbanBoardProps) => {
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

    const card = data.find((c) => c.Id === activeId); // use original data for status check
    if (!card) return;

    let targetStatus: string | null = null;

    if (overId.startsWith("col__")) {
      targetStatus = overId.replace("col__", "");
    } else {
      // Find the target card from original data to avoid stale optimistic status
      const overCard = data.find((c) => c.Id === overId) ?? localData.find((c) => c.Id === overId);
      if (overCard && overCard.Id !== activeId) targetStatus = overCard.Status;
    }

    if (!targetStatus) return;

    // Track the last known target status for use in handleDragEnd
    targetStatusRef.current = targetStatus;

    // Optimistic visual update
    if (card.Status !== targetStatus) {
      setLocalData((prev) =>
        prev.map((c) => (c.Id === activeId ? { ...c, Status: targetStatus! } : c))
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    const activeId = String(active.id);
    const originalCard = data.find((c) => c.Id === activeId);
    if (!originalCard) {
      targetStatusRef.current = null;
      return;
    }

    const finalStatus = targetStatusRef.current;
    targetStatusRef.current = null;

    if (!finalStatus || finalStatus === originalCard.Status) {
      // No status change — check if it's a same-column reorder
      if (over && String(over.id) !== activeId && !String(over.id).startsWith("col__")) {
        const overId = String(over.id);
        const colCards = localData.filter((c) => c.Status === originalCard.Status).map((c) => c.Id);
        const oldIdx = colCards.indexOf(activeId);
        const newIdx = colCards.indexOf(overId);
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          const reordered = arrayMove(colCards, oldIdx, newIdx);
          setLocalData((prev) => {
            const rest = prev.filter((c) => c.Status !== originalCard.Status);
            const ordered = reordered
              .map((cardId: string) => prev.find((c) => c.Id === cardId)!)
              .filter(Boolean);
            return [...rest, ...ordered];
          });
        }
      }
      return;
    }

    await onCardStatusChange({ ...originalCard, Status: finalStatus });
  };

  const handleMobileMove = async (card: KanbanTasksListDtoFixed, newStatus: string) => {
    setLocalData((prev) =>
      prev.map((c) => (c.Id === card.Id ? { ...c, Status: newStatus } : c))
    );
    await onCardStatusChange({ ...card, Status: newStatus });
  };

  if (isMobile) {
    return (
      <MobileBoard
        data={localData}
        columns={columns}
        onCardClick={onCardClick}
        onMove={handleMobileMove}
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto pb-1">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(210px, 1fr))`, minWidth: "1100px" }}
        >
          {columns.map((col) => {
            const colCards = localData.filter((c) => c.Status === col.keyField);
            return (
              <KanbanColumn
                key={col.keyField}
                id={`col__${col.keyField}`}
                title={col.headerText}
                cards={colCards}
                allowToggle={col.allowToggle}
                defaultExpanded={col.isExpanded !== false}
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

export default KanbanBoard;
