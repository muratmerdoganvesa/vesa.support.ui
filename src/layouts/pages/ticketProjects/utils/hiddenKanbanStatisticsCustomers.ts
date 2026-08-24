/** Yalnızca `/projectsKanbanStatistics` sayfasından gizlenen müşteri. */
export const HIDDEN_KANBAN_STATISTICS_COMPANY_ID =
  "2e5c2ba5-3eb8-414d-8bc7-08dd44716854";

const HIDDEN_KANBAN_STATISTICS_CUSTOMER_NAME = "vesa danışmanlık";

export const isHiddenKanbanStatisticsCustomer = (item: {
  workCompanyId?: string | null;
  customerName?: string | null;
}): boolean => {
  if (item.workCompanyId?.trim().toLowerCase() === HIDDEN_KANBAN_STATISTICS_COMPANY_ID) {
    return true;
  }

  const customerName = item.customerName?.trim().toLocaleLowerCase("tr-TR");
  return customerName === HIDDEN_KANBAN_STATISTICS_CUSTOMER_NAME;
};
