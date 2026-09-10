import { useEffect, useMemo, useState } from "react";

import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Switch } from "components/ui/switch";
import {
  ACTIVITY_V2_CONFIGURABLE_FIELD_KEYS,
  ACTIVITY_V2_FIELD_LABELS,
  EMPTY_RULE_JSON,
  buildRuleJsonFromStates,
  mergeFieldStates,
  parseRuleJson,
  toggleFieldState,
  type ActivityFieldRuleDto,
  type ActivityFieldRulePayload,
  type ActivityV2FieldKey,
  type ActivityV2FieldRuleState,
} from "../api/activityFieldRulesApi";

type ActivityFieldRuleFormValues = {
  name: string;
  description: string;
  isActive: boolean;
  fieldStates: Record<ActivityV2FieldKey, ActivityV2FieldRuleState>;
};

type ActivityFieldRuleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketProjectId: string;
  editingItem?: ActivityFieldRuleDto | null;
  onSubmit: (payload: ActivityFieldRulePayload) => Promise<void>;
};

const emptyForm = (): ActivityFieldRuleFormValues => ({
  name: "",
  description: "",
  isActive: true,
  fieldStates: mergeFieldStates(EMPTY_RULE_JSON),
});

const ActivityFieldRuleDialog = ({
  open,
  onOpenChange,
  ticketProjectId,
  editingItem,
  onSubmit,
}: ActivityFieldRuleDialogProps) => {
  const isEdit = Boolean(editingItem);
  const [values, setValues] = useState<ActivityFieldRuleFormValues>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingItem) {
      setValues({
        name: editingItem.name ?? "",
        description: editingItem.description ?? "",
        isActive: editingItem.isActive,
        fieldStates: mergeFieldStates(parseRuleJson(editingItem.ruleJson)),
      });
      return;
    }
    setValues(emptyForm());
  }, [open, editingItem]);

  const handleFieldToggle = (
    key: ActivityV2FieldKey,
    prop: keyof ActivityV2FieldRuleState,
    value: boolean,
  ) => {
    setValues((prev) => ({
      ...prev,
      fieldStates: toggleFieldState(prev.fieldStates, key, prop, value),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSubmit({
        ticketProjectId,
        isActive: values.isActive,
        name: values.name.trim() || undefined,
        description: values.description.trim() || undefined,
        ruleJson: buildRuleJsonFromStates(values.fieldStates),
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const visibleCount = useMemo(
    () => ACTIVITY_V2_CONFIGURABLE_FIELD_KEYS.filter((key) => values.fieldStates[key].visible).length,
    [values.fieldStates],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        aria-label={isEdit ? "Aktivite alan kuralını düzenle" : "Aktivite alan kuralı ekle"}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "Alan kuralını düzenle" : "Alan kuralı ekle"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="activity-field-rule-name">Kural adı</Label>
            <Input
              id="activity-field-rule-name"
              value={values.name}
              maxLength={200}
              placeholder="Örn. Destek formu"
              onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
              aria-label="Kural adı"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="activity-field-rule-description">Açıklama</Label>
            <Input
              id="activity-field-rule-description"
              value={values.description}
              maxLength={500}
              placeholder="Kural açıklaması"
              onChange={(e) => setValues((prev) => ({ ...prev, description: e.target.value }))}
              aria-label="Kural açıklaması"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-input px-3 py-2">
            <Label htmlFor="activity-field-rule-active" className="cursor-pointer font-normal">
              Kural aktif
            </Label>
            <Switch
              id="activity-field-rule-active"
              checked={values.isActive}
              onCheckedChange={(checked) =>
                setValues((prev) => ({ ...prev, isActive: checked === true }))
              }
              aria-label="Kural aktif"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Alan kuralları</span>
              <span className="text-xs text-muted-foreground">
                {visibleCount} görünür alan
              </span>
            </div>
            <div className="overflow-hidden rounded-lg border border-input">
              {ACTIVITY_V2_CONFIGURABLE_FIELD_KEYS.map((key, index) => {
                const label = ACTIVITY_V2_FIELD_LABELS[key];
                const state = values.fieldStates[key];
                return (
                  <div
                    key={key}
                    className={
                      index === 0
                        ? "flex items-center justify-between gap-3 px-3 py-2.5"
                        : "flex items-center justify-between gap-3 border-t border-input px-3 py-2.5"
                    }
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        Görünür
                        <Switch
                          size="sm"
                          checked={state.visible}
                          onCheckedChange={(checked) =>
                            handleFieldToggle(key, "visible", checked === true)
                          }
                          aria-label={`${label} görünür`}
                        />
                      </label>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        Zorunlu
                        <Switch
                          size="sm"
                          checked={state.required}
                          disabled={!state.visible}
                          onCheckedChange={(checked) =>
                            handleFieldToggle(key, "required", checked === true)
                          }
                          aria-label={`${label} zorunlu`}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Çalışma yeri, açıklama, aktivite saati ve faturalanabilir saat her zaman görünür ve
              zorunludur.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            İptal
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityFieldRuleDialog;
