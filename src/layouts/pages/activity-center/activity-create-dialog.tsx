import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Plus, X } from "lucide-react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Textarea } from "components/ui/textarea";
import { ActivityFieldCombobox, toComboOptions } from "./field-combobox";
import { ActivityFormState } from "./types";

type Option = { id: string; label: string };
type ProjectOption = Option & { customerId?: string };

type ActivityCreateDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  form: ActivityFormState;
  customers: Option[];
  projects: ProjectOption[];
  tickets: Option[];
  referencePersonnelOptions: Option[];
  effortPlaces: Option[];
  /** false iken kayıt ekleme / güncelleme kapalı */
  isPeriodOpen?: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (next: ActivityFormState) => void;
  onSave: () => void;
};

function ActivityCreateDialog({
  open,
  mode,
  form,
  customers,
  projects,
  tickets,
  referencePersonnelOptions,
  effortPlaces,
  isPeriodOpen = true,
  onOpenChange,
  onFormChange,
  onSave,
}: ActivityCreateDialogProps) {
  const availableProjects = useMemo(
    () => projects,
    [projects]
  );

  const availableSubProjects = useMemo(
    () => availableProjects.map((project) => ({ id: project.id, label: project.label })),
    [availableProjects]
  );

  const customerOptions = useMemo(() => toComboOptions(customers), [customers]);
  const projectOptions = useMemo(
    () => toComboOptions(availableProjects),
    [availableProjects]
  );
  const subProjectOptions = useMemo(
    () => toComboOptions(availableSubProjects),
    [availableSubProjects]
  );
  const effortPlaceOptions = useMemo(
    () => toComboOptions(effortPlaces),
    [effortPlaces]
  );
  const ticketOptions = useMemo(() => toComboOptions(tickets), [tickets]);
  const referencePersonnelComboOptions = useMemo(
    () => toComboOptions(referencePersonnelOptions),
    [referencePersonnelOptions]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[1100px] max-h-[90vh] overflow-auto rounded-2xl border border-slate-300/60 shadow-[0_10px_30px_rgba(15,23,42,0.15)] p-6">
        <DialogHeader>
          <DialogTitle className="text-center font-semibold">
            {mode === "edit" ? "Kaydı Düzenle" : "Yeni Kayıt"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="space-y-1 w-full">
            <label className="text-sm text-slate-600" htmlFor="activity-date">
              Tarih(*)
            </label>
            <Input
              id="activity-date"
              className="w-full"
              type="date"
              value={form.date}
              onChange={(e) =>
                onFormChange({ ...form, date: e.target.value })
              }
            />
          </div>

          <div className="space-y-1 w-full">
            <span className="text-sm text-slate-600 block">Müşteri(*)</span>
            <ActivityFieldCombobox
              ariaLabel="Müşteri seçin"
              options={customerOptions}
              value={form.customerId}
              placeholder="Müşteri seçiniz"
              onChange={(next) =>
                onFormChange({
                  ...form,
                  customerId: next,
                  projectId: "",
                  subProjectId: "",
                })
              }
            />
          </div>

          <div className="space-y-1 w-full">
            <span className="text-sm text-slate-600 block">Proje(*)</span>
            <ActivityFieldCombobox
              ariaLabel="Proje seçin"
              options={projectOptions}
              value={form.projectId}
              placeholder="Proje seçiniz"
              onChange={(next) =>
                onFormChange({ ...form, projectId: next, subProjectId: "" })
              }
            />
          </div>

          <div className="space-y-1 w-full">
            <span className="text-sm text-slate-600 block">Alt Proje(*)</span>
            <ActivityFieldCombobox
              ariaLabel="Alt proje seçin"
              options={subProjectOptions}
              value={form.subProjectId}
              placeholder="Alt proje seçiniz"
              onChange={(next) =>
                onFormChange({ ...form, subProjectId: next })
              }
            />
          </div>

          <div className="space-y-1 w-full">
            <span className="text-sm text-slate-600 block">Efor Yeri(*)</span>
            <ActivityFieldCombobox
              ariaLabel="Efor yeri seçin"
              options={effortPlaceOptions}
              value={form.effortPlaceId}
              placeholder="Efor yeri seçiniz"
              onChange={(next) =>
                onFormChange({ ...form, effortPlaceId: next })
              }
            />
          </div>

          <div className="space-y-1 w-full">
            <label className="text-sm text-slate-600">Talep ID</label>
            <ActivityFieldCombobox
              ariaLabel="Talep secin"
              options={ticketOptions}
              value={form.requestId}
              placeholder="Talep seçiniz"
              onChange={(next) => onFormChange({ ...form, requestId: next })}
            />
          </div>

          <div className="space-y-1 w-full">
            <label className="text-sm text-slate-600">
              Referans Personel
            </label>
            <ActivityFieldCombobox
              ariaLabel="Referans personel secin"
              options={referencePersonnelComboOptions}
              value={form.referencePersonnel}
              placeholder="Referans personel seçiniz"
              onChange={(next) => onFormChange({ ...form, referencePersonnel: next })}
            />
          </div>

          <div className="space-y-1 w-full">
            <label className="text-sm text-slate-600">Talep Eden</label>
            <Input
              className="w-full"
              value={form.requester}
              onChange={(e) =>
                onFormChange({ ...form, requester: e.target.value })
              }
            />
          </div>

          <div className="space-y-1 w-full">
            <label className="text-sm text-slate-600">Aktivite S.(*)</label>
            <Input
              className="w-full"
              type="number"
              min="0"
              step="0.5"
              value={form.activityHour}
              onChange={(e) =>
                onFormChange({
                  ...form,
                  activityHour: e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-1 w-full">
            <label className="text-sm text-slate-600">Fatura S.</label>
            <Input
              className="w-full"
              type="number"
              min="0"
              step="0.5"
              value={form.invoiceHour}
              onChange={(e) =>
                onFormChange({
                  ...form,
                  invoiceHour: e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-1 w-full md:col-span-2">
            <label className="text-sm text-slate-600">Açıklama(*)</label>
            <Textarea
              className="w-full"
              rows={3}
              value={form.description}
              onChange={(e) =>
                onFormChange({
                  ...form,
                  description: e.target.value,
                })
              }
            />
          </div>
        </div>
      <DialogFooter className="mt-2 -mx-6 -mb-6 px-6 py-4 border-t border-slate-200 bg-slate-50 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4 shrink-0" aria-hidden />
          Vazgeç
        </Button>

        <Button
          type="button"
          className="gap-2 bg-[#3e5d8f] text-white hover:bg-[#324d7a]"
          disabled={!isPeriodOpen}
          onClick={onSave}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          {mode === "edit" ? "Güncelle" : "Ekle"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  );
}

export default ActivityCreateDialog;
