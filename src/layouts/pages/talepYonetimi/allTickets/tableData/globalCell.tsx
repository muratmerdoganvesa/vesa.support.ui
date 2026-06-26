interface RowProps {
  id?: string;
  code?: string;
  name?: string;
  category?: string;
  status?: number;
  priority?: number;
}

interface Props {
  id?: string;
  checked?: boolean;
  value: any;
  testRow?: RowProps;
  columnName?: string;
  statusId?: string;
}

const DATE_COLUMNS = new Set([
  "createdAt",
  "createdDate",
  "endDate",
  "updatedDate",
  "workFlowItem.workflowHead.createdDate",
]);

const STATUS_COLORS = [
  "#607D8B", // blue grey
  "#4CAF50", // green
  "#3F51B5", // indigo
  "#2196F3", // blue
  "#9C27B0", // purple
  "#00BCD4", // cyan
  "#795548", // brown
  "#ffaa00", // orange
  "#009688", // teal
  "#E91E63", // pink
  "#df1c1a", // deep orange
];

const getStatusColor = (statusId?: string): string | undefined => {
  if (!statusId) return undefined;
  return STATUS_COLORS[Number(statusId) - 1];
};

const PRIORITY_COLORS: Record<number, string> = {
  1: "#4CAF50",
  2: "#ffaa00",
  3: "#F44336",
};

const PRIORITY_LABELS: Record<number, string> = {
  1: "Düşük",
  2: "Orta",
  3: "Yüksek",
};

const getPriorityColor = (priorityId?: number, priorityText?: string): string | undefined => {
  if (priorityId && PRIORITY_COLORS[priorityId]) return PRIORITY_COLORS[priorityId];

  const text = (priorityText ?? "").toLocaleLowerCase("tr-TR");
  if (text.includes("yüksek") || text.includes("yuksek")) return PRIORITY_COLORS[3];
  if (text.includes("orta")) return PRIORITY_COLORS[2];
  if (text.includes("düşük") || text.includes("dusuk")) return PRIORITY_COLORS[1];

  return undefined;
};

const getPriorityLabel = (priorityId?: number, priorityText?: string): string => {
  if (priorityText?.trim()) return priorityText.trim();
  if (priorityId && PRIORITY_LABELS[priorityId]) return PRIORITY_LABELS[priorityId];
  return "";
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const timeString = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${date.toLocaleDateString()} ${timeString}`;
};

const cellTextCls = "text-xs font-medium text-gray-700 leading-none";

function GlobalCell({ value, statusId, ...rest }: Props) {
  const col = rest.columnName;

  if (typeof value === "boolean" && (col === "isActive" || col === "showMenu")) {
    return (
      <div className="flex items-center">
        <span
          className="text-xs font-medium leading-none"
          style={{ color: value ? "#4CAF50" : "#F44336" }}
        >
          {value ? "Aktif" : "Pasif"}
        </span>
      </div>
    );
  }

  if (DATE_COLUMNS.has(col ?? "")) {
    return (
      <div className="flex items-center">
        <span className={cellTextCls}>{formatDate(value)}</span>
      </div>
    );
  }

  if (col === "statusText") {
    return (
      <div className="flex items-center">
        <span
          className="text-xs font-medium leading-none"
          style={{ color: getStatusColor(statusId) }}
        >
          {value}
        </span>
      </div>
    );
  }

  if (col === "priorityText") {
    const priorityId = rest.testRow?.priority;
    const priorityLabel = getPriorityLabel(priorityId, value);
    const priorityColor = getPriorityColor(priorityId, priorityLabel);
    return (
      <div className="flex items-center">
        <span
          className="text-xs font-medium leading-none"
          style={{ color: priorityColor }}
        >
          {priorityLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <span className={cellTextCls}>{value}</span>
    </div>
  );
}

export default GlobalCell;
