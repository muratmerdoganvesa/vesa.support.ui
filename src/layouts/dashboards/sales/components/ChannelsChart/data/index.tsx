import {
  DashboardsApi,
  GetSumTicketDto,
  TicketDepartmensListDto,
  TicketDepartmentsApi,
} from "api/generated";
import getConfiguration from "confiuration";


export const fetchChartData = async (id?: string, isAllData?: boolean, isOpenTicket?: boolean, startDate?: string, endDate?: string) => {


  const conf = getConfiguration();
  const api = new DashboardsApi(conf);
  if (isOpenTicket && !isAllData) {
    if (id === undefined || id === null || id === "") {
      return {
        labels: [],
        datasets: {
          label: "Projects",
          backgroundColors: ["info", "primary", "dark", "secondary"],
          data: [],
        },
      };
    }

    const response = await api.apiDashboardsGetUserCompanyTicketInfoCountGet(id, startDate, endDate);

    const newTableData = response.data.filter((item) => item.openCount > 0).map((item) => ({
      Müşteri: item.companyName,
      "Toplam Talep": item.ticketCount,
      "Açık Talep": item.openCount,
      "Çözümlü Talep": item.resolvedCount,
    }));
    
    const hasTickets = newTableData.some((item) => item["Açık Talep"] > 0);

    const filteredData = newTableData.filter((item) => item["Açık Talep"] > 0);

    if (!hasTickets || filteredData.length === 0) {
      return {
        labels: ["Veri Yok"],
        datasets: {
          label: "Projects",
          backgroundColors: ["dark"],
          data: [1],
          isEmpty: true,
        },
      };
    }
    return {
      labels: newTableData.map((item) => item.Müşteri),
      datasets: {
        label: "Projects",
        backgroundColors: [
          "info",
          "primary",
          "dark",
          "secondary",
          "error",
          "warning",
          "success",
          "light",
          "grey",
        ],
        data: newTableData.map((item) => item["Açık Talep"]),
      },
    };
  } else {
    if (id === undefined || id === null || id === "") {
      return {
        labels: [],
        datasets: {
          label: "Projects",
          backgroundColors: ["info", "primary", "dark", "secondary"],
          data: [],
        },
      };
    }
    const response = await api.apiDashboardsGetUserCompanyAllTicketCountGet(id, startDate, endDate);
    const hasTickets = response.data.some((item) => item.ticketCount > 0);
    const filteredData = response.data.filter((item) => item.ticketCount > 0);

    if (!hasTickets || filteredData.length === 0) {
      return {
        labels: ["Veri Yok"],
        datasets: {
          label: "Projects",
          backgroundColors: ["dark"],
          data: [1],
          isEmpty: true,
        },
      };
    }

    return {
      labels: response.data.map((item) => item.companyName),
      datasets: {
        label: "Projects",
        backgroundColors: ["info", "primary", "dark", "secondary"],
        data: response.data.map((item) => item.ticketCount),
      },
    };

  }
};

var channelChartData = {
  labels: [] as string[],
  datasets: {
    label: "Projects",
    backgroundColors: ["info", "primary", "dark", "secondary"],
    data: [] as number[],
  },
};

export default channelChartData;
