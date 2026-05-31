import { useState, ChangeEvent, useEffect, useRef } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useNavigate, useParams } from "react-router-dom";
import getConfiguration from "confiuration";
import { clientData } from "layouts/pages/calendar/controller";
import { PositionListDto, WorkCompanyDto } from "api/generated/api";
import { PositionsApi } from "api/generated";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { ChevronsUpDown, X } from "lucide-react";

function PositionDetailPage() {
  const navigate = useNavigate();
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const { id } = useParams();

  const [formData, setFormData] = useState<PositionListDto>({
    name: "",
    customerRefId: "",
    customerName: "",
    description: "",
    id: "",
  });

  const [selectedCompany, setSelectedCompany] = useState<WorkCompanyDto | null>(null);
  const [companyOptions, setCompanyOptions] = useState<WorkCompanyDto[]>([]);
  const [isCompanyDataLoaded, setIsCompanyDataLoaded] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);

  useEffect(() => {
    const fetchCompanyOptions = async () => {
      try {
        dispatchBusy({ isBusy: true });
        const data = await clientData();
        setCompanyOptions(data);
        setIsCompanyDataLoaded(true);
      } catch (error) {
        dispatchAlert({ message: "Şirket bilgileri alınamadı", type: "Error" });
      }
    };
    fetchCompanyOptions();
  }, []);

  const idCount = useRef(0);

  useEffect(() => {
    if (!isCompanyDataLoaded) return;

    const fetchData = async () => {
      if (!id) {
        dispatchBusy({ isBusy: false });
        return;
      }
      try {
        dispatchBusy({ isBusy: true });
        const conf = getConfiguration();
        const api = new PositionsApi(conf);
        const response = await api.apiPositionsIdGet(id);
        console.log(response.data);
        setFormData((prev) => ({
          ...prev,
          name: response.data.name,
          customerRefId: response.data.customerRefId,
          customerName: response.data.customerName,
          description: response.data.description,
          id,
        }));
        if (response.data.customerRefId) {
          const company = companyOptions.find((c) => c.id === response.data.customerRefId);
          if (company) setSelectedCompany(company);
        }
        idCount.current++;
      } catch (error) {
        dispatchAlert({ message: "Pozisyon bilgileri alınamadı", type: "Error" });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };
    fetchData();
  }, [id, isCompanyDataLoaded]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new PositionsApi(conf);

      if (formData.customerName === "") {
        dispatchAlert({ message: "Şirket Alanı Boş Bırakılamaz", type: "Error" });
        dispatchBusy({ isBusy: false });
        return;
      }
      if (formData.name === "") {
        dispatchAlert({ message: "Pozisyon Adı Alanı Boş Bırakılamaz", type: "Error" });
        dispatchBusy({ isBusy: false });
        return;
      }
      if (formData.description === "") {
        dispatchAlert({ message: "Açıklama Alanı Boş Bırakılamaz", type: "Error" });
        dispatchBusy({ isBusy: false });
        return;
      }

      try {
        if (formData.id) {
          await api.apiPositionsPut(formData);
          dispatchAlert({
            message: "Pozisyon bilgileri başarıyla güncellendi",
            type: "Success",
          });
        } else {
          await api.apiPositionsPost({
            name: formData.name,
            customerRefId: formData.customerRefId,
            description: formData.description,
          });
          dispatchAlert({
            message: "Pozisyon bilgileri başarıyla oluşturuldu",
            type: "Success",
          });
        }
        dispatchBusy({ isBusy: false });
        navigate("/position", { replace: true });
        return;
      } catch (innerError) {
        dispatchAlert({ message: "Pozisyon bilgileri güncellenemedi", type: "Error" });
      }
    } catch (error) {
      dispatchAlert({ message: "Pozisyon bilgileri güncellenemedi", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="mt-[-15px] rounded-xl bg-white shadow-md overflow-hidden">
        {/* Card header */}
        <div className="px-8 pt-8 pb-4 border-b border-gray-100">
          <h1 className="text-2xl font-semibold text-[#344767]">
            {id ? "Pozisyon Güncelle" : "Pozisyon Oluştur"}
          </h1>
        </div>

        {/* Form body */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Company combobox */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Şirket
              </Label>
              <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="company"
                    variant="outline"
                    role="combobox"
                    aria-expanded={companyOpen}
                    aria-label="Şirket seçin"
                    className="w-full h-9 justify-between rounded-lg border-slate-200 font-normal focus-visible:border-blue-400 focus-visible:ring-blue-100 transition-all"
                  >
                    <span className={selectedCompany ? "text-foreground" : "text-muted-foreground"}>
                      {selectedCompany?.name ?? "İsim aratınız..."}
                    </span>
                    <div className="flex items-center gap-1">
                      {selectedCompany && (
                        <X
                          className="size-3.5 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Seçimi temizle"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCompany(null);
                            setFormData((prev) => ({ ...prev, customerName: "", customerRefId: "" }));
                            setCompanyOpen(false);
                          }}
                        />
                      )}
                      <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="İsim aratınız..." />
                    <CommandList>
                      <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
                      <CommandGroup>
                        {companyOptions.map((company) => (
                          <CommandItem
                            key={company.id}
                            value={company.name ?? ""}
                            data-checked={selectedCompany?.id === company.id}
                            onSelect={() => {
                              const next = company.id === selectedCompany?.id ? null : company;
                              setSelectedCompany(next);
                              setFormData((prev) => ({
                                ...prev,
                                customerName: next?.name ?? "",
                                customerRefId: next?.id ?? "",
                              }));
                              setCompanyOpen(false);
                            }}
                          >
                            {company.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Position name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pozisyon Adı
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Pozisyon adı giriniz"
                className="h-9 rounded-lg border-slate-200 focus-visible:border-blue-400 focus-visible:ring-blue-100"
                aria-label="Pozisyon adı"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mt-6 flex flex-col gap-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Açıklama
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Açıklama giriniz"
              rows={5}
              className="rounded-lg border-slate-200 focus-visible:border-blue-400 focus-visible:ring-blue-100 resize-none"
              aria-label="Açıklama"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-100 bg-gray-50/50">
          <Button
            variant="outline"
            onClick={() => navigate("/position")}
            className="h-9 px-5 border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="İptal et ve geri dön"
          >
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            className="h-9 px-5 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium"
            aria-label="Pozisyonu kaydet"
          >
            Kaydet
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default PositionDetailPage;
