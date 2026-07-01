import { Handshake } from "lucide-react";

export const CrmModulListEmpty = () => (
  <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
    <div className="flex size-12 items-center justify-center rounded-full bg-slate-100">
      <Handshake className="size-6 text-slate-300" />
    </div>
    <p className="text-sm font-medium">CRM kaydı bulunamadı</p>
    <p className="text-xs text-slate-400">Filtreleri değiştirmeyi veya yeni kayıt eklemeyi deneyin.</p>
  </div>
);
