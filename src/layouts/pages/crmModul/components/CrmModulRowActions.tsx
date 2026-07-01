import { Pencil, Trash2 } from "lucide-react";

type CrmModulRowActionsProps = {
  onEdit: () => void;
  onDelete?: () => void;
  size?: "sm" | "md";
  variant?: "default" | "light";
};

export const CrmModulRowActions = ({
  onEdit,
  onDelete,
  size = "md",
  variant = "default",
}: CrmModulRowActionsProps) => {
  const buttonClass = size === "sm" ? "size-7" : "size-8";
  const iconClass = size === "sm" ? "size-3.5" : "size-4";
  const light = variant === "light";

  return (
    <div className="flex items-center justify-start gap-1">
      <button
        type="button"
        onClick={onEdit}
        className={`inline-flex items-center justify-center rounded-md transition-colors ${buttonClass} ${
          light
            ? "text-white/80 hover:bg-white/20 hover:text-white"
            : "text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
        }`}
        title="Düzenle"
        aria-label="Düzenle"
      >
        <Pencil className={iconClass} />
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={`inline-flex items-center justify-center rounded-md transition-colors ${buttonClass} ${
            light
              ? "text-white/80 hover:bg-white/20 hover:text-white"
              : "text-slate-400 hover:bg-red-50 hover:text-red-600"
          }`}
          title="Sil"
          aria-label="Sil"
        >
          <Trash2 className={iconClass} />
        </button>
      )}
    </div>
  );
};
