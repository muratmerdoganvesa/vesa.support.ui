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
    { headerText: 'Backlog', keyField: 'Backlog', allowToggle: true },
    { headerText: 'Realization', keyField: 'Realization', allowToggle: true },
    { headerText: 'UAT', keyField: 'UAT', allowToggle: true },
    { headerText: 'Preparation', keyField: 'Preparation', allowToggle: true },
    { headerText: 'Done', keyField: 'Done', allowToggle: true,isExpanded: true }
];

export const STATUS_OPTIONS = ['Backlog', 'Realization', 'UAT', 'Preparation', 'Done'];
export const PRIORITY_OPTIONS = ['Low', 'Normal', 'High', 'Critical', 'Release Breaker'];
export const TYPE_OPTIONS = ['Task', 'Proje Planlama', 'Ticket'];