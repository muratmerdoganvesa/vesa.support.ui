import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

interface AimRow {
  id: number;
  kpi: string;
  kpiBoyutu: string;
  olcumBoyutu: string;
  hs: string;
  durum: string;
  notlar: string;
  visible: boolean;
  createdBy: string;
}

interface AimDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (rows: AimRow[]) => void;
  isEdit: boolean;
  initialRows?: AimRow[];
  fullName: string;
  loginName: string;
}

const emptyRow = (id: number, loginName: string): AimRow => ({
  id,
  kpi: "",
  kpiBoyutu: "",
  olcumBoyutu: "",
  hs: "",
  durum: "Başarılı",
  notlar: "",
  visible: true,
  createdBy: loginName, // ✅ burada set
});

const durumOptions = ["Başarılı", "Kısmi Başarı", "Beklemede", "Başarısız"];

function AimDialog({ open, onClose, onSave, isEdit, fullName, loginName, initialRows }: AimDialogProps) {
  const [rows, setRows] = useState<AimRow[]>(
    initialRows && initialRows.length > 0 ? initialRows : [emptyRow(1, loginName)]
  );
  const [nextId, setNextId] = useState(
    initialRows && initialRows.length > 0 ? Math.max(...initialRows.map((r) => r.id)) + 1 : 2
  );

  useEffect(() => {
    if (open) {
      if (initialRows && initialRows.length > 0) {
        setRows(initialRows);
        setNextId(Math.max(...initialRows.map((r) => r.id)) + 1);
      } else {
        setRows([emptyRow(1, loginName)]);
        setNextId(2);
      }
    }
  }, [open, initialRows]);

  const handleAddRow = () => {
    setRows((prev) => [...prev, emptyRow(nextId, loginName)]);
    setNextId((prev) => prev + 1);
  };

  const handleDeleteRow = (id: number) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleChange = (id: number, field: keyof AimRow, value: any) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const handleSave = () => {
    onSave(rows);
  };

  const handleDialogClose = () => {
    onClose();
  };
  const filteredRows = isEdit
    ? rows
    : rows.filter((r) => r.visible);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleDialogClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="sr-only">{fullName} - Hedef Yönetimi</DialogTitle>
      </DialogHeader>
      <div className="p-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{fullName} -  Hedef Yönetimi</h2>
          {isEdit && (
            <button
              onClick={handleAddRow}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
              title="Yeni satır ekle"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Table */}
       <div className="overflow-x-auto border border-slate-200 rounded-lg">
  <table className="min-w-[900px] table-auto divide-y divide-slate-200">
    <thead className="bg-slate-50">
      <tr>
        <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-16">
          HS
        </th>
        <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 uppercase min-w-[180px]">
          Oluşturan
        </th>
        <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide min-w-[120px]">
          KPI
        </th>
        <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide min-w-[120px]">
          KPI Boyutu
        </th>
        <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide min-w-[120px]">
          Ölçüm Boyutu
        </th>
        
        <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide min-w-[140px]">
          Durum
        </th>
        <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide min-w-[200px]">
          Notlar
        </th>
        {isEdit && (
          <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 uppercase w-20">
            Görünürlük
          </th>
        )}
        {isEdit && (
          <th className="px-2 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide w-20">
            Actions
          </th>
        )}
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-slate-100">
      {filteredRows.length > 0 ? (
        filteredRows.map((row, index) => (
          <tr key={row.id} className="hover:bg-slate-50 transition-colors">
            
             {/* HS */}
            <td className="px-2 py-1 text-center">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                {index + 1}
              </span>
            </td>
            {/* Oluşturan */}
            <td className="px-2 py-1">
              <div
                className="w-full text-xs px-2 py-1 border border-gray-200 rounded-md bg-gray-100 text-gray-600 wrap-break-word"
                title={row.createdBy}
              >
                {row.createdBy}
              </div>
            </td>

            {/* KPI */}
            <td className="px-2 py-1">
              <input
                type="text"
                disabled={!isEdit}
                value={row.kpi}
                onChange={(e) => handleChange(row.id, "kpi", e.target.value)}
                placeholder="KPI giriniz..."
                className="w-full text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </td>

            {/* KPI Boyutu */}
            <td className="px-2 py-1">
              <input
                type="text"
                disabled={!isEdit}
                value={row.kpiBoyutu}
                onChange={(e) => handleChange(row.id, "kpiBoyutu", e.target.value)}
                placeholder="KPI Boyutu..."
                className="w-full text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </td>

            {/* Ölçüm Boyutu */}
            <td className="px-2 py-1">
              <input
                type="text"
                disabled={!isEdit}
                value={row.olcumBoyutu}
                onChange={(e) => handleChange(row.id, "olcumBoyutu", e.target.value)}
                placeholder="Ölçüm Boyutu..."
                className="w-full text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </td>

           

            {/* Durum */}
            <td className="px-2 py-1">
              <select
                value={row.durum}
                disabled={!isEdit}
                onChange={(e) => handleChange(row.id, "durum", e.target.value)}
                className="w-full text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
              >
                {durumOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </td>

            {/* Notlar */}
            <td className="px-2 py-1">
              <textarea
                value={row.notlar}
                onChange={(e) => handleChange(row.id, "notlar", e.target.value)}
                placeholder="Eklemek istediğiniz notlar:"
                disabled={!isEdit}
                className="w-full text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </td>

            {/* Görünürlük */}
            {isEdit && (
              <td className="px-2 py-1 text-center">
                <input
                  type="checkbox"
                  checked={row.visible}
                  disabled={!isEdit}
                  onChange={(e) => handleChange(row.id, "visible", e.target.checked)}
                />
              </td>
            )}

            {/* Actions */}
            {isEdit && (
              <td className="px-2 py-1 text-center">
                <button
                  onClick={() => {
                    if (
                      row.createdBy === "muhammed.kadan@vesacons.com" &&
                      loginName !== "muhammed.kadan@vesacons.com"
                    ) {
                      return;
                    }
                    handleDeleteRow(row.id);
                  }}
                  disabled={
                    row.createdBy === "muhammed.kadan@vesacons.com" &&
                    loginName !== "muhammed.kadan@vesacons.com"
                  }
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors
                    ${
                      row.createdBy === "muhammed.kadan@vesacons.com" &&
                      loginName !== "muhammed.kadan@vesacons.com"
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-red-500 hover:bg-red-50 hover:text-red-700"
                    }`}
                  title={
                    row.createdBy === "muhammed.kadan@vesacons.com" &&
                    loginName !== "muhammed.kadan@vesacons.com"
                      ? "Muhammed bey'in hedefidir, sadece kendisi silebilir"
                      : "Satırı sil"
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            )}
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={isEdit ? 9 : 7} className="px-6 py-10 text-center">
            <p className="text-sm text-slate-500">
              Henüz kayıt bulunmamaktadır. Yeni satır eklemek için sağ üstteki + butonuna
              tıklayın.
            </p>
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

        {/* Footer Buttons */}
        <div className="flex gap-3 justify-end mt-4">
          <button
            onClick={handleDialogClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            İptal
          </button>
          {isEdit && (
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm text-white bg-green-500 hover:bg-green-600 rounded-lg font-medium transition-colors"
            >
              Güncelle
            </button>
          )}
        </div>
      </div>
      </DialogContent>
    </Dialog>
  );
}

export type { AimRow };
export default AimDialog;
