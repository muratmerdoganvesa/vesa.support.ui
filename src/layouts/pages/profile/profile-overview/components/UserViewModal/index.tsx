import React from "react";
import { X, User, Mail, Hash, Briefcase } from "lucide-react";
import { UserAppDto } from "api/generated";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";

interface UserViewModalProps {
  user: UserAppDto;
  open: boolean;
  onClose: () => void;
}

function UserViewModal({ user, open, onClose }: UserViewModalProps) {
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Kullanıcı Bilgileri</DialogTitle>
        </DialogHeader>

        {/* Avatar + name row */}
        <div className="flex items-center gap-4 py-2">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-2xl font-bold text-indigo-600">
              {initials || <User className="w-7 h-7 text-indigo-400" />}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-800 truncate">{fullName || "—"}</p>
            {user.title && (
              <p className="text-sm text-slate-500 truncate">{user.title}</p>
            )}
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Detail rows */}
        <div className="flex flex-col gap-3 py-1">
          {user.id && (
            <InfoRow icon={<Hash className="w-3.5 h-3.5" />} label="ID" value={user.id} mono />
          )}
          {user.firstName && (
            <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Ad" value={user.firstName} />
          )}
          {user.lastName && (
            <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Soyad" value={user.lastName} />
          )}
          {user.email && (
            <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="E-posta" value={user.email} />
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}

// ── Small helper ──────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">{label}</p>
        <p className={`text-sm text-slate-700 truncate ${mono ? "font-mono text-xs" : "font-medium"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default UserViewModal;
