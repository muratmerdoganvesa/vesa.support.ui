import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronDown, ChevronRight, InboxIcon } from "lucide-react";
import { KanbanTasksListDtoFixed } from "../utils/fetchKanbanData";
import KanbanSortableCard from "./KanbanSortableCard";
import { cn } from "lib/utils";

interface KanbanColumnProps {
  id: string;
  title: string;
  cards: KanbanTasksListDtoFixed[];
  allowToggle?: boolean;
  defaultExpanded?: boolean;
  onCardClick: (card: KanbanTasksListDtoFixed) => void;
  isAnyDragging?: boolean;
}

const COLUMN_COLORS: Record<string, { header: string; badge: string; dot: string }> = {
  Backlog:     { header: "border-t-slate-400",   badge: "bg-slate-100 text-slate-600",   dot: "bg-slate-400"   },
  Realization: { header: "border-t-blue-500",    badge: "bg-blue-50 text-blue-700",      dot: "bg-blue-500"    },
  UAT:         { header: "border-t-violet-500",  badge: "bg-violet-50 text-violet-700",  dot: "bg-violet-500"  },
  Preparation: { header: "border-t-amber-500",   badge: "bg-amber-50 text-amber-700",    dot: "bg-amber-500"   },
  Done:        { header: "border-t-emerald-500", badge: "bg-emerald-50 text-emerald-700",dot: "bg-emerald-500" },
};

const KanbanColumn = ({
  id,
  title,
  cards,
  allowToggle = false,
  defaultExpanded = true,
  onCardClick,
  isAnyDragging = false,
}: KanbanColumnProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const { setNodeRef, isOver } = useDroppable({ id });

  const color = COLUMN_COLORS[title] ?? {
    header: "border-t-slate-300",
    badge: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  };

  const cardIds = cards.map((c) => c.Id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col overflow-hidden border min-w-[210px] w-full transition-all duration-150",
        "border-t-[3px]",
        color.header,
        isExpanded
          ? "bg-white/40 backdrop-blur-sm shadow-sm border-slate-200/80"
          : "bg-transparent shadow-none border-slate-200/50",
        isOver && "bg-indigo-50/50 border-indigo-300/80 shadow-indigo-100"
      )}
    >
      {/* Column header */}
      <div className={cn(
        "flex items-center justify-between px-3 py-3 bg-white/60",
        isExpanded ? "border-b border-slate-200/70" : ""
      )}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("w-2 h-2 rounded-full shrink-0", color.dot)} />
          <h3 className="text-sm font-semibold text-slate-700 truncate">{title}</h3>
          <span
            className={cn(
              "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold",
              color.badge
            )}
          >
            {cards.length}
          </span>
        </div>
        {allowToggle && (
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
            aria-label={isExpanded ? "Kolonu daralt" : "Kolonu genişlet"}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Cards drop zone */}
      {isExpanded && (
        <div
          className={cn(
            "flex-1 bg-gray-50 flex flex-col gap-2 p-2 min-h-[80px] transition-colors duration-100",
            isOver && "bg-indigo-50/40"
          )}
        >
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {cards.map((card) => (
              <KanbanSortableCard
                key={card.Id}
                card={card}
                onCardClick={onCardClick}
                isAnyDragging={isAnyDragging}
              />
            ))}
          </SortableContext>

          {cards.length === 0 && (
            <div
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed min-h-[72px] transition-colors duration-150",
                isOver
                  ? "border-indigo-300 bg-indigo-50/60"
                  : "border-slate-200/80 bg-slate-50/40"
              )}
            >
              <InboxIcon className={cn("w-4 h-4", isOver ? "text-indigo-400" : "text-slate-300")} />
              <span className={cn("text-[11px] font-medium", isOver ? "text-indigo-500" : "text-slate-400")}>
                {isOver ? "Buraya bırak" : "Kart yok"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KanbanColumn;
