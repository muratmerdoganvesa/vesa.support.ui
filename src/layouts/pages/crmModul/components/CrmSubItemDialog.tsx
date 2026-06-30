import { ListModuleDto } from "api/generated";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { useEffect, useState } from "react";
import {
  calculateEstimatedValueString,
  emptyCrmSubItemFormValues,
  type CrmSubItemFormValues,
} from "../formMappers";
import { CrmSubItemFormFields } from "./CrmSubItemFormFields";

type CrmSubItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: CrmSubItemFormValues | null;
  isEditMode?: boolean;
  modules: ListModuleDto[];
  onSave: (values: CrmSubItemFormValues) => void;
};

export const CrmSubItemDialog = ({
  open,
  onOpenChange,
  initialValues,
  isEditMode = false,
  modules,
  onSave,
}: CrmSubItemDialogProps) => {
  const [values, setValues] = useState<CrmSubItemFormValues>(emptyCrmSubItemFormValues());

  useEffect(() => {
    if (open) {
      setValues(initialValues ? { ...initialValues } : emptyCrmSubItemFormValues());
    }
  }, [open, initialValues]);

  const handleSave = () => {
    onSave({
      ...values,
      estimatedValue: calculateEstimatedValueString(values.unitPrice, values.personCount),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Modülü Düzenle" : "Yeni Modül Ekle"}</DialogTitle>
        </DialogHeader>

        <CrmSubItemFormFields values={values} modules={modules} onChange={setValues} />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-teal-800 hover:bg-teal-900 text-white"
          >
            {isEditMode ? "Güncelle" : "Ekle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
