import { UserCalendarApi } from "api/generated"
import getConfiguration from "confiuration"
import { fetchCompanyData } from "layouts/pages/queryBuild/controller/custom/apiCalls"

export interface IWorkLocation {
    id: number;
    name: string;
    description: string;
}

const clientData = async () => {
    const response = (await ((await fetchCompanyData()).apiWorkCompanyGet())).data
    return response
}

const getWorkLocationData = async () => {
    try {
        let conf = getConfiguration();
        let api = new UserCalendarApi(conf);
        let response : any = await api.apiUserCalendarWorkLocationsGet();
        return response.data as IWorkLocation[];

    } catch ( error ) {
        console.log( error )
    }
    
}



export { clientData, getWorkLocationData}
