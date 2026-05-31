import { Field, Rule, RuleType } from "react-querybuilder";
import {
  fetchTeamData,
  fetchUserData,
  fetchWorkFlowData,
  fetchTicketData,
  fetchCompanyData,
  fetchWorkCompanySystemData
} from "./custom/apiCalls";

const UserData = async (isEmail?: boolean) => {
  try {
    let response = (await (await fetchUserData()).apiUserGetAllWithOuthPhotoGet()).data;
    if (isEmail) {
      return {
        name: "email",
        label: "Kullanıcı Maili",
        valueEditorType: (operator: string) => {
          return operator === "contains" ? "text" : "select";
        },
        values: response.map((u) => ({
          label: u.email,
          value: u.email,
        })),
        operators: [
          { name: "=", label: "Equal to" },
          { name: "!=", label: "Not equal to" },
          { name: "contains", label: "Contains" },
        ],
      } as Field;
    }

    return {
      name: "UserAppId",
      label: "Kullanıcı",
      valueEditorType: (operator: string) => {
        return operator === "contains" ? "text" : "select";
      },
      values: response.map((u) => ({
        label: `${u.firstName} ${u.lastName}`,
        value: u.id,
      })),
      operators: [
        { name: "=", label: "Equal to" },
        { name: "!=", label: "Not equal to" },
        { name: "contains", label: "Contains" },
        // { name: "beginsWith", label: "Begins with" },
        // { name: "endsWith", label: "Ends with" },
        // { name: "in", label: "In" },
        // { name: "notIn", label: "Not in" },
      ],
    } as Field;
  } catch (error) {
    console.error("Error loading user data:", error);
  }
};

const TeamData = async () => {
  try {
    let response = (await (await fetchTeamData()).apiTicketTeamWithoutTeamGet()).data;

    return {
      name: "teamId",
      label: "Atanan-Takım",
      valueEditorType: (operator: string) => {
        return operator === "contains" ? "text" : "select";
      },
      values: response.map((t) => ({
        label: t.name,
        value: t.id,
      })),
      operators: [
        { name: "=", label: "Equal to" },
        { name: "!=", label: "Not equal to" },
        { name: "contains", label: "Contains" },
        // { name: "beginsWith", label: "Begins with" },
        // { name: "endsWith", label: "Ends with" },
        // { name: "in", label: "In" },
        // { name: "notIn", label: "Not in" },
      ],
    } as Field;
  } catch (error) {
    console.error("Error loading user data:", error);
  }
};

const TicketStatusData = async () => {
  try {
    let response = (await (await fetchTicketData()).apiTicketTicketStatusGet()).data as any;
    return {
      name: "statusId",
      label: "Durum",
      valueEditorType: (operator: string) => {
        return operator === "contains" ? "text" : "select";
      },
      values: response.map((s: any) => ({
        label: s.name,
        value: `${s.id}`,
      })),
      operators: [
        { name: "=", label: "Equal to" },
        { name: "!=", label: "Not equal to" },
        { name: "contains", label: "Contains" },
        // { name: "beginsWith", label: "Begins with" },
        // { name: "endsWith", label: "Ends with" },
        // { name: "in", label: "In" },
        // { name: "notIn", label: "Not in" },
      ],
    } as Field;
  } catch (error) {
    console.error("Error loading user data:", error);
  }
};

const TicketPriorityData = async () => {
  try {
    let response = (await (await fetchTicketData()).apiTicketTicketPrioritiesGet()).data as any;
    return {
      name: "Priority",
      label: "Öncelik",
      valueEditorType: (operator: string) => {
        return operator === "contains" ? "text" : "select";
      },
      values: response.map((p: any) => ({
        label: p.name,
        value: `${p.id}`,
      })),
      operators: [
        { name: "=", label: "Equal to" },
        { name: "!=", label: "Not equal to" },
        { name: "contains", label: "Contains" },
        // { name: "beginsWith", label: "Begins with" },
        // { name: "endsWith", label: "Ends with" },
        // { name: "in", label: "In" },
        // { name: "notIn", label: "Not in" },
      ],
    } as Field;
  } catch (e) {
    console.log("error : ", e);
  }
};

const TicketTypeData = async () => {
  try {
    let response = (await (await fetchTicketData()).apiTicketTicketTypeGet()).data as any;
    return {
      name: "Type",
      label: "Tip",
      valueEditorType: (operator: string) => {
        return operator === "contains" ? "text" : "select";
      },
      values: response.map((t: any) => ({
        label: t.name,
        value: `${t.id}`,
      })),
      operators: [
        { name: "=", label: "Equal to" },
        { name: "!=", label: "Not equal to" },
        { name: "contains", label: "Contains" },
        // { name: "beginsWith", label: "Begins with" },
        // { name: "endsWith", label: "Ends with" },
        // { name: "in", label: "In" },
        // { name: "notIn", label: "Not in" },
      ],
    } as Field;
  } catch (error) {
    console.error("Error loading user data:", error);
  }
};

const TicketSlaData = async () => {
  try {
    let response = (await (await fetchTicketData()).apiTicketTicketSLAGet()).data as any;
    return {
      name: "TicketSLA",
      label: "SLA",
      valueEditorType: (operator: string) => {
        return operator === "contains" ? "text" : "select";
      },
      values: response.map((s: any) => ({
        label: s.name,
        value: `${s.id}`,
      })),
      operators: [
        { name: "=", label: "Equal to" },
        { name: "!=", label: "Not equal to" },
        { name: "contains", label: "Contains" },
        // { name: "beginsWith", label: "Begins with" },
        // { name: "endsWith", label: "Ends with" },
        // { name: "in", label: "In" },
        // { name: "notIn", label: "Not in" },
      ],
    } as Field;
  } catch (error) {
    console.error("Error loading user data:", error);
  }
};

const TicketSubjectData = async () => {
  try {
    let response = (await (await fetchTicketData()).apiTicketTicketSubjectGet()).data as any;
    console.log("response : ", response);
    return {
      name: "TicketSubject",
      label: "Konu",
      valueEditorType: (operator: string) => {
        return operator === "contains" ? "text" : "select";
      },
      values: response.map((s: any) => ({
        label: s.description,
        value: `${s.id}`,
      })),
      operators: [
        { name: "=", label: "Equal to" },
        { name: "!=", label: "Not equal to" },
        { name: "contains", label: "Contains" },
        // { name: "beginsWith", label: "Begins with" },
        // { name: "endsWith", label: "Ends with" },
        // { name: "in", label: "In" },
        // { name: "notIn", label: "Not in" },
      ],
    } as Field;
  } catch (error) {
    console.error("Error loading user data:", error);
  }
};

const TicketClientData = async () => {
  try {
    let response = (await (await fetchCompanyData()).apiWorkCompanyGetAssingListGet()).data;

    return {
      name: "CustomerRefId",
      label: "Müşteri",
      valueEditorType: (operator: string) => {
        return operator === "contains" ? "text" : "select";
      },
      values: response.map((c) => ({
        label: c.name,
        value: c.id,
      })),
      operators: [
        { name: "=", label: "Equal to" },
        { name: "!=", label: "Not equal to" },
        { name: "contains", label: "Contains" },
        // { name: "beginsWith", label: "Begins with" },
        // { name: "endsWith", label: "Ends with" },
        // { name: "in", label: "In" },
        // { name: "notIn", label: "Not in" },
      ],
    } as Field;
  } catch (error) {
    console.error("Error loading user data:", error);
  }
};

const TicketCompanyData = async () => {
  try {
    let response = (await (await fetchCompanyData()).apiWorkCompanyGetAssingListGet()).data;
    return {
      name: "WorkCompanyId",
      label: "Şirket",
      valueEditorType: (operator: string) => {
        return operator === "contains" ? "text" : "select";
      },
      values: response.map((c: any) => ({
        label: c.name,
        value: c.id,
      })),
      operators: [
        { name: "=", label: "Equal to" },
        { name: "!=", label: "Not equal to" },
        { name: "contains", label: "Contains" },
        // { name: "beginsWith", label: "Begins with" },
        // { name: "endsWith", label: "Ends with" },
        // { name: "in", label: "In" },
        // { name: "notIn", label: "Not in" },
      ],
    } as Field;
  } catch (error) {
    console.error("Error loading user data:", error);
  }
};

const WorkCompanyIdSystemData = async (id: string) => {
  try {
    let response = (await (await fetchWorkCompanySystemData()).apiWorkCompanySystemInfoByCompanyIdIdGet(id)).data;
    return {
      name: "WorkCompanySystemInfoId",
      label: "Sistem",
      valueEditorType: (operator: string) => {
        return operator === "contains" ? "text" : "select";
      },
      values: response.map((c: any) => ({
        label: c.name,
        value: c.id,
      })),
      operators: [
        { name: "=", label: "Equal to" },
        { name: "!=", label: "Not equal to" },
        { name: "contains", label: "Contains" },
        // { name: "beginsWith", label: "Begins with" },
        // { name: "endsWith", label: "Ends with" },
        // { name: "in", label: "In" },
        // { name: "notIn", label: "Not in" },
      ],
    } as Field;
  } catch (error) {
    console.error("Error loading user data:", error);
  }
};

const WorkFlowData = async () => {
  try {
    let response = (
      await (await fetchWorkFlowData()).apiWorkFlowDefinationGetWorkFlowListByMenuGet()
    ).data as any;
    return {
      name: "workFlowId",
      label: "İş Akışı",
      valueEditorType: (operator: string) => {
        return operator === "contains" ? "text" : "select";
      },
      values: response.data.map((w: any) => ({
        label: w.workflowName,
        value: w.id,
      })),
      operators: [
        { name: "=", label: "Equal to" },
        { name: "!=", label: "Not equal to" },
        { name: "contains", label: "Contains" },
        // { name: "beginsWith", label: "Begins with" },
        // { name: "endsWith", label: "Ends with" },
        // { name: "in", label: "In" },
        // { name: "notIn", label: "Not in" },
      ],
    } as Field;
  } catch (error) {
    console.error("Error loading user data:", error);
  }
};

export {
  UserData,
  TeamData,
  WorkFlowData,
  TicketStatusData,
  TicketPriorityData,
  TicketTypeData,
  TicketSlaData,
  TicketSubjectData,
  TicketClientData,
  TicketCompanyData,
  WorkCompanyIdSystemData,
};
