import { describe, expect, it } from "vitest";
import {
  HIDDEN_KANBAN_STATISTICS_COMPANY_ID,
  isHiddenKanbanStatisticsCustomer,
} from "./hiddenKanbanStatisticsCustomers";

describe("isHiddenKanbanStatisticsCustomer", () => {
  it("hides the Vesa Danışmanlık company by id", () => {
    expect(
      isHiddenKanbanStatisticsCustomer({
        workCompanyId: "2E5C2BA5-3EB8-414D-8BC7-08DD44716854",
        customerName: "Başka Bir İsim",
      }),
    ).toBe(true);
    expect(
      isHiddenKanbanStatisticsCustomer({
        workCompanyId: HIDDEN_KANBAN_STATISTICS_COMPANY_ID,
        customerName: "Vesa Danışmanlık",
      }),
    ).toBe(true);
  });

  it("hides simulated cards that only have the customer name", () => {
    expect(
      isHiddenKanbanStatisticsCustomer({
        workCompanyId: null,
        customerName: "Vesa Danışmanlık",
      }),
    ).toBe(true);
  });

  it("does not hide other customers", () => {
    expect(
      isHiddenKanbanStatisticsCustomer({
        workCompanyId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        customerName: "Acme",
      }),
    ).toBe(false);
  });
});
