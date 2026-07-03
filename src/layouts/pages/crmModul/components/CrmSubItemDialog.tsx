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
  calculateEstimatedDiscountedValueString,
  calculateEstimatedValueString,
  emptyCrmSubItemFormValues,
  validatePricingGroup,
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
  onValidationError?: (message: string) => void;
};

export const CrmSubItemDialog = ({
  open,
  onOpenChange,
  initialValues,
  isEditMode = false,
  modules,
  onSave,
  onValidationError,
}: CrmSubItemDialogProps) => {
  const [values, setValues] = useState<CrmSubItemFormValues>(emptyCrmSubItemFormValues());

  useEffect(() => {
    if (open) {
      setValues(initialValues ? { ...initialValues } : emptyCrmSubItemFormValues());
    }
  }, [open, initialValues]);

  const handleSave = () => {
    const pricingError = validatePricingGroup(values);
    if (pricingError) {
      onValidationError?.(pricingError);
      return;
    }

    onSave({
      ...values,
      estimatedValue: calculateEstimatedValueString(values.unitPrice, values.personCount),
      estimatedDiscountedValue: calculateEstimatedDiscountedValueString(
        values.unitPrice,
        values.personCount,
        values.discount
      ),
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
