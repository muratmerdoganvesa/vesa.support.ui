import { KanbanApi, UserApi, UserAppDto, UserAppDtoWithoutPhoto, UserCalendarApi } from "api/generated";
import getConfiguration from "confiuration";


const fetchUserData = async (): Promise<UserAppDtoWithoutPhoto[]> => {
    try {
        let config = getConfiguration();
        let api = new KanbanApi(config);
        let response = await api.apiKanbanGetUsersByAdminAndManagerGet();
       

        return response.data;

    } catch (error) {
        console.log(error);
        return [];
    }
}

export default fetchUserData;