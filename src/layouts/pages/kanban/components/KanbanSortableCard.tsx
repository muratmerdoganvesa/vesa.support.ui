import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanTasksListDtoFixed } from "../utils/fetchKanbanData";
import KanbanCard from "./KanbanCard";

interface KanbanSortableCardProps {
  card: KanbanTasksListDtoFixed;
  onCardClick: (card: KanbanTasksListDtoFixed) => void;
}

const KanbanSortableCard = ({ card, onCardClick }: KanbanSortableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.Id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onCardClick(card)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onCardClick(card);
      }}
      tabIndex={0}
      aria-label={`Görev: ${card.Summary}`}
      className={`
        border my-1 border-slate-200 bg-white shadow-sm overflow-hidden
        cursor-grab active:cursor-grabbing
        transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70 hover:border-indigo-300
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
        ${isDragging ? "opacity-40 shadow-none scale-[0.98]" : "opacity-100"}
      `}
    >
      <KanbanCard data={card} />
    </div>
  );
};

export default KanbanSortableCard;
