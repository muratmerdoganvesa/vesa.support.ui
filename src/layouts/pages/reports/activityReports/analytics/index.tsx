import { useEffect, useState } from "react";
import { RefreshCw, Pencil, ChevronsUpDown, X } from "lucide-react";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { CustomerListDto, EmployeeDto, SAPReportsApi } from "api/generated";
import getConfiguration from "confiuration";
import ReportsLineChart from "../LineCharts/ReportsLineChart";
import { useBusy } from "layouts/pages/hooks/useBusy";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { Button } from "components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChartData = {
  labels: string[];
  datasets: { label: string; data: number[] };
};

type SelectedItemRef = { key: string; text: string };

class SelectedEmployee {
  personelName: string;
  charts: ChartData;
  average: number;
  photo: string;
  customerText: string;
  employeeText: string;
  persId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

function ActivityReports(): JSX.Element {
  const dispatchBusy = useBusy();
  const [empOpen, setEmpOpen] = useState(false);

  const [globalselectedItems, setglobalselectedItems] = useState<SelectedItemRef[]>([]);

  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: { label: "", data: [] },
  });

  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedCustomerText, setselectedCustomerText] = useState<string | null>(null);
  const [customerAvg, setcustomerAvg] = useState<string | null>(null);

  const [customers, setCustomers] = useState<CustomerListDto[]>([]);
  const [employees, setemployees] = useState<EmployeeDto[]>([]);

  const [selectedEmployees, setSelectedEmployees] = useState<SelectedEmployee[]>([]);

  // Render-scoped guard to prevent duplicate async pushes in the same event tick
  var SelectedEmployeeConst: SelectedEmployee[] = [];

  const selectedEmployeeValues = globalselectedItems.map((i) => i.key);

  // ─── Data fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const conf = getConfiguration();
        const api = new SAPReportsApi(conf);
        const response = await api.apiSAPReportsGetCustomerListGet();
        response.data.unshift({ cusid: -99, custx: "Tüm" });
        setCustomers(response.data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    const fetchEmployee = async () => {
      try {
        const conf = getConfiguration();
        const api = new SAPReportsApi(conf);
        const response = await api.apiSAPReportsGetEmployeeListGet();
        setemployees(response.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchCustomers();
    fetchEmployee();
  }, []);

  const fetchSelectedCustomer = async (id: string) => {
    dispatchBusy({ isBusy: true });
    setChartData({ labels: [], datasets: { label: "", data: [] } });
    const conf = getConfiguration();
    const api = new SAPReportsApi(conf);
    const data = await api.apiSAPReportsCustomerLast12MonthInvoiceListPost(id);
    setcustomerAvg(null);
    setChartData({
      labels: data.data.map((item: any) => item.month.slice(0, 3)).reverse(),
      datasets: {
        label: "Aktivite",
        data: data.data.map((item: any) => item.act).reverse(),
      },
    });
    const totalAct = data.data.reduce((sum: number, item: any) => sum + item.act, 0);
    setcustomerAvg((totalAct / data.data.length).toFixed(2));
    dispatchBusy({ isBusy: false });
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleCustomerChange = (value: string) => {
    const customer = customers.find((c) => String(c.cusid) === value);
    const customerText = customer?.custx ?? null;

    setSelectedCustomer(value);
    setselectedCustomerText(customerText);
    fetchSelectedCustomer(value);

    // Re-fetch all already-selected employees under the new customer
    if (globalselectedItems.length > 0) {
      SelectedEmployeeConst.length = 0;
      setSelectedEmployees([]);

      globalselectedItems.forEach(async (item) => {
        const conf = getConfiguration();
        const api = new SAPReportsApi(conf);
        dispatchBusy({ isBusy: true });

        const data = await api.apiSAPReportsEmoloyeeLast12MonthInvoiceListPost(value, item.key);
        dispatchBusy({ isBusy: false });

        const chartItems: ChartData = {
          labels: data.data.map((i: any) => i.month.slice(0, 3)).reverse(),
          datasets: {
            label: "Aktivite",
            data: data.data.map((i: any) => i.act).reverse(),
          },
        };
        const totalAct = data.data.reduce((sum: number, i: any) => sum + i.act, 0);
        const averageAct = totalAct / data.data.length;
        const photo = await api.apiSAPReportsGetEmployeePictureAsBase64ByUserGet(item.key);

        const resItem = new SelectedEmployee();
        resItem.persId = item.key;
        resItem.personelName = item.text;
        resItem.employeeText = item.text;
        resItem.customerText = customerText ?? "";
        resItem.average = averageAct;
        resItem.charts = chartItems;
        resItem.photo = photo.data;

        SelectedEmployeeConst.push(resItem);
        setSelectedEmployees((prev) => {
          if (prev.some((e) => e.persId === resItem.persId)) return prev;
          return [...prev, resItem];
        });
      });
    }
  };

  const handleEmployeeSelectionChange = (newValues: string[]) => {
    const prevKeys = globalselectedItems.map((i) => i.key);

    // Remove deselected employees
    const removedKeys = prevKeys.filter((k) => !newValues.includes(k));
    if (removedKeys.length > 0) {
      SelectedEmployeeConst = SelectedEmployeeConst.filter(
        (e) => !removedKeys.includes(e.persId)
      );
      setSelectedEmployees((prev) => prev.filter((e) => !removedKeys.includes(e.persId)));
    }

    // Update ref list
    const newSelectedItems: SelectedItemRef[] = newValues.map((k) => {
      const emp = employees.find((e) => String(e.pernr) === k);
      return { key: k, text: emp?.ename ?? "" };
    });
    setglobalselectedItems(newSelectedItems);

    // Fetch data for newly added employees
    const addedKeys = newValues.filter((k) => !prevKeys.includes(k));
    addedKeys.forEach(async (key) => {
      if (SelectedEmployeeConst.some((e) => e.persId === key)) return;

      const conf = getConfiguration();
      const api = new SAPReportsApi(conf);
      dispatchBusy({ isBusy: true });

      const data = await api.apiSAPReportsEmoloyeeLast12MonthInvoiceListPost(
        selectedCustomer ?? "",
        key
      );
      dispatchBusy({ isBusy: false });

      const photo = await api.apiSAPReportsGetEmployeePictureAsBase64ByUserGet(key);
      const totalAct = data.data.reduce((sum: number, item: any) => sum + item.act, 0);
      const averageAct = totalAct / data.data.length;
      const chartItems: ChartData = {
        labels: data.data.map((item: any) => item.month.slice(0, 3)).reverse(),
        datasets: {
          label: "Aktivite",
          data: data.data.map((item: any) => item.act).reverse(),
        },
      };

      const emp = employees.find((e) => String(e.pernr) === key);
      const resItem = new SelectedEmployee();
      resItem.persId = key;
      resItem.personelName = emp?.ename ?? "";
      resItem.employeeText = emp?.ename ?? "";
      resItem.customerText = selectedCustomerText ?? "";
      resItem.average = averageAct;
      resItem.charts = chartItems;
      resItem.photo = photo.data;

      SelectedEmployeeConst.push(resItem);
      setSelectedEmployees((prev) => {
        if (prev.some((e) => e.persId === resItem.persId)) return prev;
        return [...prev, resItem];
      });
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="py-6 space-y-8">
        {/* ── Filter bar ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end gap-6">
          {/* Customer select */}
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-foreground">Müşteri</p>
            <Select onValueChange={handleCustomerChange}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Müşteri seçin…" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.cusid} value={String(customer.cusid)}>
                    {customer.custx}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employee multi-select */}
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-foreground">Personel</p>
            <Popover open={empOpen} onOpenChange={setEmpOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={empOpen}
                  aria-label="Personel seçin"
                  className="min-w-64 max-w-sm h-auto min-h-9 flex-wrap justify-start gap-1.5 rounded-lg border-slate-200 font-normal px-3 py-1.5"
                >
                  {globalselectedItems.length === 0 ? (
                    <span className="text-muted-foreground">Personel seçin…</span>
                  ) : (
                    globalselectedItems.map((item) => (
                      <span
                        key={item.key}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium"
                      >
                        {item.text}
                        <X
                          className="size-3 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={`${item.text} kaldır`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmployeeSelectionChange(
                              selectedEmployeeValues.filter((v) => v !== item.key)
                            );
                          }}
                        />
                      </span>
                    ))
                  )}
                  <ChevronsUpDown className="ml-auto size-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Personel ara..." />
                  <CommandList>
                    <CommandEmpty>Personel bulunamadı</CommandEmpty>
                    <CommandGroup>
                      {employees.map((emp) => (
                        <CommandItem
                          key={String(emp.pernr)}
                          value={emp.ename ?? ""}
                          data-checked={selectedEmployeeValues.includes(String(emp.pernr))}
                          onSelect={() => {
                            const val = String(emp.pernr);
                            const next = selectedEmployeeValues.includes(val)
                              ? selectedEmployeeValues.filter((v) => v !== val)
                              : [...selectedEmployeeValues, val];
                            handleEmployeeSelectionChange(next);
                          }}
                        >
                          {emp.ename}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Action buttons */}
          <TooltipProvider>
            <div className="flex items-center gap-1 ml-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Yenile"
                    className="inline-flex items-center justify-center rounded-lg p-2 text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <RefreshCw className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Refresh</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Düzenle"
                    className="inline-flex items-center justify-center rounded-lg p-2 text-blue-500 transition-colors hover:bg-blue-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Pencil className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Edit</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* ── Section heading ─────────────────────────────────────────── */}
        <div className="space-y-0.5">
          <h3 className="text-xl font-bold tracking-tight text-foreground">Yıllık Gösterimler</h3>
          <p className="text-sm text-muted-foreground">Müşteri</p>
        </div>

        {/* ── Charts grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Customer chart (always visible once customer is selected) */}
          {chartData && (
            <ReportsLineChart
              color="success"
              title={`${selectedCustomerText ?? ""} Yıllık Aktivite`}
              description={<>Veri Ortalaması {customerAvg}</>}
              date=""
              chart={chartData}
            />
          )}

          {/* Per-employee charts */}
          {selectedEmployees.map((item, index) => (
            <ReportsLineChart
              key={index}
              color="dark"
              title={`${item.customerText} ${item.employeeText} Yıllık Aktivite`}
              description={
                <span style={{ color: item.average < 20 ? "red" : "inherit" }}>
                  Veri Ortalaması {item.average.toFixed(2)}
                </span>
              }
              date="just updated"
              chart={item.charts}
              photo={item.photo}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ActivityReports;
