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
  "#607D8B", // 1 Draft — blue grey
  "#4CAF50", // 2 Open — green
  "#3F51B5", // 3 Assigned — indigo
  "#2196F3", // 4 ConsultantWaiting — blue
  "#9C27B0", // 5 InProgress — purple
  "#00BCD4", // 6 InternalTesting — cyan
  "#795548", // 7 CustomerTesting — brown
  "#ffaa00", // 8 WaitingForCustomer — orange
  "#009688", // 9 Resolved — teal
  "#E91E63", // 10 Cancelled — pink
  "#df1c1a", // 11 Closed — deep orange
  "#7B1FA2", // 12 InApprove
  "#1565C0", // 13 InEffortApprove
  "#00897B", // 14 EffortEntryInProgress
  "#F57C00", // 15 WaitingManagerEffortApproval
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

  if (col === "isMsp") {
    if (value !== true) return null;

    return (
      <div className="flex items-center">
        <span
          className="inline-flex items-center rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-600"
          role="status"
          aria-label="MSP müşterisi"
        >
          MSP Müşterisi
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
