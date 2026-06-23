import { KanbanApi, KanbanTasksListDto } from "api/generated";
import getConfiguration from "confiuration";

export interface KanbanTasksListDtoFixed  {
    Id: string;
    Priority: string;
    RankId: string;
    Status: string;
    Summary: string;
    Tags: string;
    Type: string;
    Description: string;
    Assignee: string;
    AssigneeId: string;
    creatorId: string;
    createdBy?: string | null;
    creatorName?: string | null;
    projectId?: string | null;
    createdDate?: string | null;
    projectName?: string | null;
    dueDate?: string | null;
}

export const mapKanbanItem = (item: KanbanTasksListDto): KanbanTasksListDtoFixed => ({
    Id: item.id,
    Assignee: `${item.assignee?.firstName ?? ""} ${item.assignee?.lastName ?? ""}`.trim(),
    AssigneeId: item.assignee?.id ?? "",
    RankId: item.rankId,
    Priority: item.priority,
    Status: item.status,
    Tags: item.tags,
    Type: item.type,
    Description: item.description,
    Summary: item.summary,
    creatorId: item.creatorId,
    createdBy: item.createdBy ?? null,
    creatorName: item.creator
        ? `${item.creator.firstName ?? ""} ${item.creator.lastName ?? ""}`.trim()
        : item.createdBy ?? null,
    projectId: item.projectId,
    createdDate: item.createdDate ?? null,
    projectName: item.projectName ?? null,
    dueDate: item.dueDate ?? null,
});

const fetchKanbanDataForAll = async (): Promise<KanbanTasksListDtoFixed[]> => {
    try{
        let config = getConfiguration();
        let api = new KanbanApi(config);
        let response = await api.apiKanbanGet();
        if(response.data.length > 0){
        let fixedData = response.data.map((item : KanbanTasksListDto) => mapKanbanItem(item))
            return fixedData;
        }
        return [];
    }catch(error){
        console.error('Error fetching kanban data:', error);
        throw error;
    }
}

export default fetchKanbanDataForAll;