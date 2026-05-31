import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Check, Paperclip, Trash2, X } from "lucide-react";
import { MessageBoxType } from "@ui5/webcomponents-react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Textarea } from "components/ui/textarea";
import { ActivityCenterExpensesApi, ExpenseCenterListDto, ExpenseCenterUpdateDto } from "api/generated/api";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { ActivityFieldCombobox, toComboOptions } from "./field-combobox";

const RECEIPT_STATUS_VAR_ID = "Var";
const RECEIPT_STATUS_OPTIONS = [
  { value: "Var", label: "Var" },
  { value: "Yok", label: "Yok" },
];

const readFileAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("File could not be read."));
        return;
      }
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("File read failed."));
    reader.readAsDataURL(file);
  });

type ExpenseAddDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  activityId: string;
  /** Aktivite satırındaki tarih (dd.MM.yyyy); belge tarihi buna eşittir */
  activityDateDisplay: string;
  /** Native date input (yyyy-MM-dd), salt okunur */
  activityDateIso: string;
  customerInfo: string;
  activityUserName: string;
  initialExpense?: ExpenseCenterListDto | null;
  /** false iken kayıt kaydet / güncelle kapalı */
  isPeriodOpen?: boolean;
  onSave: (payload: ExpenseCenterUpdateDto) => void | Promise<void>;
};

type AttachmentItem = {
  id: string;
  fileName: string;
  contentType: string;
  base64?: string;
  file?: File;
};

const formatProcessDateTr = () =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

const formatProcessTimeTr = () =>
  new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

function ExpenseAddDialog({
  open,
  onOpenChange,
  mode,
  activityId,
  activityDateDisplay,
  activityDateIso,
  customerInfo,
  activityUserName,
  initialExpense,
  isPeriodOpen = true,
  onSave,
}: ExpenseAddDialogProps) {
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const [mainType, setMainType] = useState("");
  const [subType, setSubType] = useState("");
  const [expensePlace, setExpensePlace] = useState("");
  const [receiptStatus, setReceiptStatus] = useState("");
  const [receiptNo, setReceiptNo] = useState("");
  const [statusCode, setStatusCode] = useState("04");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mainTypeOptions, setMainTypeOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [subTypeOptions, setSubTypeOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [expensePlaceOptions, setExpensePlaceOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [currencyOptions, setCurrencyOptions] = useState<Array<{ value: string; label: string }>>([]);

  const receiptStatusOptions = useMemo(() => RECEIPT_STATUS_OPTIONS, []);

  const fetchBaseOptions = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new ActivityCenterExpensesApi(getConfiguration());
      const [mainTypesResponse, expenseCentersResponse, currenciesResponse] = await Promise.all([
        api.apiActivityCenterExpensesMainExpenseTypesGet(),
        api.apiActivityCenterExpensesExpenseCentersGet(),
        api.apiActivityCenterExpensesCurrencyTypesGet(),
      ]);

      setMainTypeOptions(
        toComboOptions(
          (mainTypesResponse.data ?? [])
            .filter((item) => item.key !== undefined && item.description)
            .map((item) => ({
              id: String(item.key),
              label: item.description as string,
            })),
        ),
      );
      setExpensePlaceOptions(
        toComboOptions(
          (expenseCentersResponse.data ?? [])
            .filter((item) => item.key !== undefined && item.description)
            .map((item) => ({
              id: String(item.key),
              label: item.description as string,
            })),
        ),
      );
      setCurrencyOptions(
        toComboOptions(
          (currenciesResponse.data ?? [])
            .filter((item) => item.key !== undefined && item.description)
            .map((item) => ({
              id: String(item.key),
              label: item.description as string,
            })),
        ),
      );
    } catch (error) {
      dispatchAlert({
        message: "Masraf secenekleri yuklenirken hata olustu.",
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchSubTypes = async (mainTypeValue: string) => {
    if (!mainTypeValue) {
      setSubTypeOptions([]);
      return;
    }
    const mainTypeAsNumber = Number(mainTypeValue);
    if (!Number.isFinite(mainTypeAsNumber)) {
      setSubTypeOptions([]);
      return;
    }

    try {
      dispatchBusy({ isBusy: true });
      const api = new ActivityCenterExpensesApi(getConfiguration());
      const response = await api.apiActivityCenterExpensesSubExpenseTypesGet(mainTypeAsNumber);
      setSubTypeOptions(
        toComboOptions(
          (response.data ?? [])
            .filter((item) => item.key !== undefined && item.description)
            .map((item) => ({
              id: String(item.key),
              label: item.description as string,
            })),
        ),
      );
    } catch (error) {
      dispatchAlert({
        message: "Alt masraf turleri yuklenirken hata olustu.",
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleMainTypeChange = (nextMainType: string) => {
    setMainType(nextMainType);
    setSubType("");
  };

  useEffect(() => {
    if (!open) return;
    fetchSubTypes(mainType);
  }, [mainType, open]);

  useEffect(() => {
    if (receiptStatus !== RECEIPT_STATUS_VAR_ID) {
      setReceiptNo("");
    }
  }, [receiptStatus]);

  useEffect(() => {
    if (!open) return;
    fetchBaseOptions();
    setMainType(initialExpense?.mainExpenseType != null ? String(initialExpense.mainExpenseType) : "");
    setSubType(initialExpense?.subExpenseType != null ? String(initialExpense.subExpenseType) : "");
    setExpensePlace(initialExpense?.expenseCenter != null ? String(initialExpense.expenseCenter) : "");
    setReceiptStatus(initialExpense?.hasReceipt == null ? "" : (initialExpense.hasReceipt ? RECEIPT_STATUS_VAR_ID : "Yok"));
    setReceiptNo(initialExpense?.receiptNumber && initialExpense.receiptNumber !== "." ? initialExpense.receiptNumber : "");
    setStatusCode("04");
    setAmount(initialExpense?.amount != null ? String(initialExpense.amount) : "");
    setCurrency(initialExpense?.currencyType != null ? String(initialExpense.currencyType) : "");
    setDescription(initialExpense?.description ?? "");
    setAttachments([]);

    const loadExistingDocuments = async () => {
      if (mode !== "edit" || !initialExpense?.id) return;
      try {
        dispatchBusy({ isBusy: true });
        const api = new ActivityCenterExpensesApi(getConfiguration());
        const response = await api.apiActivityCenterExpensesIdDocumentsGet(initialExpense.id);
        const existingAttachments: AttachmentItem[] = (response.data ?? [])
          .filter((item) => item.base64)
          .map((item, index) => ({
            id: `existing-${index}-${item.fileName ?? "document"}`,
            fileName: item.fileName ?? `document-${index + 1}`,
            contentType: item.contentType ?? "application/octet-stream",
            base64: item.base64 ?? "",
          }));
        setAttachments(existingAttachments);
      } catch (error) {
        dispatchAlert({
          message: "Yuklu belgeler getirilirken hata olustu.",
          type: MessageBoxType.Error,
        });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };

    loadExistingDocuments();
  }, [dispatchAlert, dispatchBusy, initialExpense, mode, open]);

  useEffect(() => {
    if (currencyOptions.length !== 1) return;
    const singleCurrency = currencyOptions[0];
    if (!singleCurrency?.value) return;
    setCurrency(singleCurrency.value);
  }, [currencyOptions]);

  const handleAttachmentButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const list = event.target.files;
    if (!list?.length) return;
    const newAttachments = Array.from(list).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      file,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    event.target.value = "";
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    if (!activityDateDisplay || !activityDateIso) {
      dispatchAlert({
        message: "Aktivite tarihi bulunamadı. Lütfen aktivite seçerek tekrar deneyin.",
        type: MessageBoxType.Warning,
      });
      return;
    }
    if (!mainType) {
      dispatchAlert({ message: "Ana Masraf Turu alanı zorunludur.", type: MessageBoxType.Warning });
      return;
    }
    if (!subType) {
      dispatchAlert({ message: "Alt Masraf Turu alanı zorunludur.", type: MessageBoxType.Warning });
      return;
    }
    if (!expensePlace) {
      dispatchAlert({ message: "Masraf Yeri alanı zorunludur.", type: MessageBoxType.Warning });
      return;
    }
    if (!amount.trim()) {
      dispatchAlert({ message: "Tutar alanı zorunludur.", type: MessageBoxType.Warning });
      return;
    }
    if (!receiptStatus) {
      dispatchAlert({ message: "Fiş Durumu alanı zorunludur.", type: MessageBoxType.Warning });
      return;
    }
    if (receiptStatus === RECEIPT_STATUS_VAR_ID && !receiptNo.trim()) {
      dispatchAlert({
        message: "Fis Durumu 'Var' secildiginde Fis No alani zorunludur.",
        type: MessageBoxType.Warning,
      });
      return;
    }

    const amountNum = Number(amount.replace(",", "."));
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      dispatchAlert({ message: "Tutar 0'dan büyük olmalı.", type: MessageBoxType.Warning });
      return;
    }

    const showReceiptNo = receiptStatus === RECEIPT_STATUS_VAR_ID;
    const receiptNoTrimmed = showReceiptNo ? receiptNo.trim() : "";
    const hasReceipt = receiptStatus === RECEIPT_STATUS_VAR_ID;
    const expenseCenter = Number(expensePlace);
    const mainExpenseType = Number(mainType);
    const subExpenseType = Number(subType);
    const currencyType = Number(currency);
    if (
      !Number.isFinite(expenseCenter) ||
      !Number.isFinite(mainExpenseType) ||
      !Number.isFinite(subExpenseType) ||
      !Number.isFinite(currencyType)
    ) {
      dispatchAlert({
        message: "Masraf turu, yeri veya para birimi secimleri gecersiz.",
        type: MessageBoxType.Warning,
      });
      return;
    }

    let documentsBase64Json: string | null = initialExpense?.documentsBase64Json ?? "[]";
    if (attachments.length > 0) {
      try {
        const documents = await Promise.all(
          attachments.map(async (attachment) => ({
            fileName: attachment.fileName,
            contentType: attachment.contentType || "application/octet-stream",
            base64: attachment.file ? await readFileAsBase64(attachment.file) : (attachment.base64 ?? ""),
          })),
        );
        documentsBase64Json = JSON.stringify(documents);
      } catch (error) {
        dispatchAlert({
          message: "Belgeler okunurken hata olustu.",
          type: MessageBoxType.Error,
        });
        return;
      }
    }

    const payload: ExpenseCenterUpdateDto = {
      id: mode === "edit" ? initialExpense?.id : undefined,
      activityId: initialExpense?.activityId ?? activityId,
      expenseCenter,
      mainExpenseType,
      subExpenseType,
      currencyType,
      amount: amountNum,
      description: description.trim() || null,
      hasReceipt,
      receiptNumber: hasReceipt && receiptNoTrimmed.length > 0 ? receiptNoTrimmed : null,
      documentsBase64Json: documentsBase64Json || "[]",
    };

    try {
      await onSave(payload);
      onOpenChange(false);
    } catch (error) {
      // API error alert is handled by parent.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[1100px] max-h-[90vh] overflow-auto rounded-2xl border border-slate-300/60 shadow-[0_10px_30px_rgba(15,23,42,0.15)] p-6">
        <DialogHeader>
          <DialogTitle className="text-center font-semibold">
            {mode === "edit" ? "Masraf Düzenle" : "Masraf Ekle"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="min-w-0 space-y-1 md:col-span-2">
            <label className="text-sm text-slate-600" htmlFor="expense-date">
              Aktivite / Belge / Fiş Tarihi(*)
            </label>
            <Input
              id="expense-date"
              className="w-full disabled:cursor-not-allowed disabled:opacity-70"
              type="date"
              value={activityDateIso}
              disabled
              readOnly
              aria-readonly="true"
            />
          </div>

          <div className="min-w-0 space-y-1">
            <span className="text-sm text-slate-600 block">Ana Masraf Türü(*)</span>
            <ActivityFieldCombobox
              ariaLabel="Ana masraf türü seçin"
              options={mainTypeOptions}
              value={mainType}
              placeholder="Seçiniz"
              onChange={handleMainTypeChange}
            />
          </div>

          <div className="min-w-0 space-y-1">
            <span className="text-sm text-slate-600 block">Alt Masraf Türü(*)</span>
            <ActivityFieldCombobox
              ariaLabel="Alt masraf türü seçin"
              options={subTypeOptions}
              value={subType}
              placeholder={mainType ? "Seçiniz" : "Önce ana masraf türü seçiniz"}
              disabled={!mainType}
              onChange={setSubType}
            />
          </div>

          <div className="min-w-0 space-y-1">
            <span className="text-sm text-slate-600 block">Masraf Yeri(*)</span>
            <ActivityFieldCombobox
              ariaLabel="Masraf yeri seçin"
              options={expensePlaceOptions}
              value={expensePlace}
              placeholder="Seçiniz"
              onChange={setExpensePlace}
            />
          </div>

          <div className="min-w-0 space-y-1">
            <label className="text-sm text-slate-600" htmlFor="expense-amount">
              Tutar(*)
            </label>
            <Input
              id="expense-amount"
              className="w-full"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="min-w-0 space-y-1">
            <span className="text-sm text-slate-600 block">Para Birimi</span>
            <ActivityFieldCombobox
              ariaLabel="Para birimi seçin"
              options={currencyOptions}
              value={currency}
              placeholder="Seçiniz"
              disabled={currencyOptions.length === 1}
              onChange={setCurrency}
            />
          </div>

          <div className="min-w-0 space-y-1">
            <span className="text-sm text-slate-600 block">Fiş Durumu(*)</span>
            <ActivityFieldCombobox
              ariaLabel="Fiş durumu seçin"
              options={receiptStatusOptions}
              value={receiptStatus}
              placeholder="Seçiniz"
              onChange={setReceiptStatus}
            />
          </div>

          {receiptStatus === RECEIPT_STATUS_VAR_ID ? (
            <div className="min-w-0 space-y-1 md:col-span-2">
              <label className="text-sm text-slate-600" htmlFor="expense-receipt-no">
                Fiş No
              </label>
              <Input
                id="expense-receipt-no"
                className="w-full"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                placeholder="Fiş No"
              />
            </div>
          ) : null}

          <div className="min-w-0 space-y-2 md:col-span-2">
            <span className="text-sm text-slate-600 block">Belgeler</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-label="Belge dosyaları seçin"
              onChange={handleFilesSelected}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={handleAttachmentButtonClick}
              >
                <Paperclip className="h-4 w-4 shrink-0" aria-hidden />
                Belge ekle
              </Button>
              <span className="text-xs text-slate-500">Birden fazla dosya seçebilirsiniz</span>
            </div>
            {attachments.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Eklenen belge sayısı: {attachments.length}</p>
                <ul className="max-h-40 overflow-auto rounded-lg border border-slate-200 divide-y divide-slate-100 bg-slate-50/50">
                  {attachments.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-slate-700"
                    >
                      <span className="min-w-0 truncate" title={item.fileName}>
                        {item.fileName}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-slate-500 hover:text-destructive"
                        aria-label={`${item.fileName} belgesini kaldır`}
                        onClick={() => handleRemoveAttachment(item.id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Henüz belge eklenmedi</p>
            )}
          </div>

          <div className="min-w-0 space-y-1 md:col-span-2">
            <label className="text-sm text-slate-600" htmlFor="expense-description">
              Açıklama
            </label>
            <Textarea
              id="expense-description"
              className="w-full"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
          onClick={handleSave}
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          {mode === "edit" ? "Güncelle" : "Kaydet"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  );
}

export default ExpenseAddDialog;
