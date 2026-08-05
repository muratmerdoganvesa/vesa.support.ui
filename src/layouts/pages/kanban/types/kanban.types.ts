export interface KanbanCard {
    Id: number;
    Status: 'Backlog' | 'Realization' | 'UAT' | 'Preparation' | 'Done';
    Summary: string;
    Description?: string;
    Type: 'Task' | 'Proje Planlama';
    Priority: 'Low' | 'Normal' | 'High' | 'Critical' | 'Release Breaker';
    Tags: string;
    Assignee: string;
    AssigneeId: string;
    RankId: number;
}

export interface KanbanColumn {
    headerText: string;
    keyField: string;
    allowToggle?: boolean;
    isExpanded?: boolean;
    minCount?: number;
    maxCount?: number;
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
    { headerText: 'Analiz', keyField: 'Backlog', allowToggle: true },
    { headerText: 'Realization', keyField: 'Realization', allowToggle: true },
    { headerText: 'UAT', keyField: 'UAT', allowToggle: true },
    { headerText: 'Cutover', keyField: 'Preparation', allowToggle: true },
    { headerText: 'Done', keyField: 'Done', allowToggle: true,isExpanded: true }
];

/** API / keyField değerleri — değiştirmeyin */
export const STATUS_OPTIONS = ['Backlog', 'Realization', 'UAT', 'Preparation', 'Done'] as const;

/** Kullanıcıya gösterilen etiketler */
export const STATUS_LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
    Backlog: 'Analiz',
    Realization: 'Realization',
    UAT: 'UAT',
    Preparation: 'Cutover',
    Done: 'Done',
};

export const getStatusLabel = (status?: string | null): string => {
    if (!status) return STATUS_LABELS.Backlog;
    return STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status;
};

export const PRIORITY_OPTIONS = ['Low', 'Normal', 'High', 'Critical', 'Release Breaker'];
export const TYPE_OPTIONS = ['Task', 'Proje Planlama', 'Ticket'];