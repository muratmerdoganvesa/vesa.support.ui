import { describe, expect, it } from "vitest";
import { readProjectTaskChecklist } from "./projectTaskChecklist";

describe("readProjectTaskChecklist", () => {
  it("reads only the six statuses bound to the list item", () => {
    expect(
      readProjectTaskChecklist({
        SystemAccess: 4,
        conceptualApproval: "2",
        UATTestScenarios: null,
        masterDataTemplate: 9,
        authorization: "",
        Integration: 3,
      }),
    ).toEqual({
      systemAccess: 4,
      conceptualApproval: 2,
      uatTestScenarios: null,
      masterDataTemplate: null,
      authorization: null,
      integration: 3,
    });
  });
});
