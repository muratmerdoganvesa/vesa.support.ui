import getConfiguration from "confiuration";
import {
  TicketApi,
  TicketTeamApi,
  TicketTeamListDto,
  UserApi,
  UserAppDtoOnlyNameId,
  WorkFlowDefinationApi,
  WorkCompanyApi,
  TicketDepartmentsApi,
  TicketRuleEngineApi,
  WorkCompanySystemInfoApi,
} from "api/generated/api";
import { Configuration } from "api/generated/configuration";

// caching yapıp tekrar tekrar api çağırmamak için
let cachedTeamData: TicketTeamApi | null = null;
let cachedUserData: UserApi | null = null;
let cachedWorkFlowData: WorkFlowDefinationApi | null = null;
let cachedTicketData: TicketApi | null = null;
let cachedCompanyData: WorkCompanyApi | null = null;
let cachedTicketDepartmentData: TicketDepartmentsApi | null = null;
let cachedTicketRuleEngineData: TicketRuleEngineApi | null = null;
let cachedWorkCompanySystemData: WorkCompanySystemInfoApi | null = null;

class FetchSettings<T> {
  api: T;

  constructor(apiType: new (conf: Configuration) => T) {
    const conf = getConfiguration();
    this.api = new apiType(conf); // dinamik api oluşturma
  }
}

const fetchTicketRuleEngineData = async (): Promise<TicketRuleEngineApi> => {
  if (!cachedTicketRuleEngineData) {
    cachedTicketRuleEngineData = new FetchSettings<TicketRuleEngineApi>(TicketRuleEngineApi).api;
  }
  return cachedTicketRuleEngineData;
};

const fetchTeamData = async (): Promise<TicketTeamApi> => {
  if (!cachedTeamData) {
    cachedTeamData = new FetchSettings<TicketTeamApi>(TicketTeamApi).api;
  }
  return cachedTeamData;
};

const fetchUserData = async (): Promise<UserApi> => {
  if (!cachedUserData) {
    cachedUserData = new FetchSettings<UserApi>(UserApi).api;
  }
  return cachedUserData;
};

const fetchWorkFlowData = async (): Promise<WorkFlowDefinationApi> => {
  if (!cachedWorkFlowData) {
    cachedWorkFlowData = new FetchSettings<WorkFlowDefinationApi>(WorkFlowDefinationApi).api;
  }
  return cachedWorkFlowData;
};

const fetchTicketData = async (): Promise<TicketApi> => {
  if (!cachedTicketData) {
    cachedTicketData = new FetchSettings<TicketApi>(TicketApi).api;
  }
  return cachedTicketData;
};

const fetchCompanyData = async (): Promise<WorkCompanyApi> => {
  if (!cachedCompanyData) {
    cachedCompanyData = new FetchSettings<WorkCompanyApi>(WorkCompanyApi).api;
  }
  return cachedCompanyData;
};

const fetchTicketDepartmentData = async (): Promise<TicketDepartmentsApi> => {
  if (!cachedTicketDepartmentData) {
    cachedTicketDepartmentData = new FetchSettings<TicketDepartmentsApi>(TicketDepartmentsApi).api;
  }
  return cachedTicketDepartmentData;
};

const fetchWorkCompanySystemData = async (): Promise<WorkCompanySystemInfoApi> => {
  if (!cachedWorkCompanySystemData) {
    cachedWorkCompanySystemData = new FetchSettings<WorkCompanySystemInfoApi>(WorkCompanySystemInfoApi).api;
  }
  return cachedWorkCompanySystemData;
}

export {
  fetchTeamData,
  fetchUserData,
  fetchWorkFlowData,
  fetchTicketData,
  fetchCompanyData,
  fetchTicketDepartmentData,
  fetchTicketRuleEngineData,
  fetchWorkCompanySystemData,
};
