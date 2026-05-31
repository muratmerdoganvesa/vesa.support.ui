import { useEffect, useState } from "react";
import { useFormikContext } from "formik";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Switch } from "components/ui/switch";
import { Label } from "components/ui/label";
import { KeyRound, ShieldCheck, Mail } from "lucide-react";

interface ToggleRowProps {
  id: string;
  icon: JSX.Element;
  title: string;
  description: string;
  statusLabel: string;
  checked: boolean;
  onCheckedChange: () => void;
}

function ToggleRow({ id, icon, title, description, statusLabel, checked, onCheckedChange }: ToggleRowProps) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:shrink-0">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {statusLabel}
        </Label>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}

function Accounts({ formData }: any): JSX.Element {
  const { values } = formData;
  const { setFieldValue } = useFormikContext();

  return (
    <Card id="accounts" className="overflow-hidden rounded-2xl border border-border/50 shadow-sm">
      <CardHeader className="border-b border-border/40 bg-muted/20 px-5 py-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <KeyRound className="size-4 text-indigo-500" />
          Erişim Ayarları
        </CardTitle>
        <p className="text-xs text-muted-foreground">SSO, yönetici ve mail gönderme ayarları</p>
      </CardHeader>

      <CardContent className="divide-y divide-border/30 px-5 py-0">
        <ToggleRow
          id="toggle-sso"
          icon={<KeyRound className="size-4" />}
          title="Vesa SSO"
          description="SSO kullanarak sisteme giriş yapabilir"
          statusLabel={values.canSsoLogin ? "SSO Açık" : "SSO Kapalı"}
          checked={values.canSsoLogin}
          onCheckedChange={() => setFieldValue("canSsoLogin", !values.canSsoLogin)}
        />
        <ToggleRow
          id="toggle-admin"
          icon={<ShieldCheck className="size-4" />}
          title="Yönetici mi?"
          description="Admin yetkisi verir"
          statusLabel={values.isSystemAdmin ? "Admin Yetkisi Var" : "Admin Değil"}
          checked={values.isSystemAdmin}
          onCheckedChange={() => setFieldValue("isSystemAdmin", !values.isSystemAdmin)}
        />
        <ToggleRow
          id="toggle-mail"
          icon={<Mail className="size-4" />}
          title="Yeni Kullanıcı Maili Gönderilsin Mi"
          description="Kullanıcıya giriş bilgileri mail ile iletilir"
          statusLabel={values.isMailSender ? "Mail Gönderilsin" : "Mail Gönderilmesin"}
          checked={values.isMailSender}
          onCheckedChange={() => setFieldValue("isMailSender", !values.isMailSender)}
        />
      </CardContent>
    </Card>
  );
}

export default Accounts;
