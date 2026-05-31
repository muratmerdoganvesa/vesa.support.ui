import { useEffect, useState } from "react";
import { useAlert, AppAlertType as MessageBoxType } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useFormikContext } from "formik";
import getConfiguration from "confiuration";
import { UserApi } from "api/generated";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Button } from "components/ui/button";
import { LockKeyhole, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

function ChangePassword({ formData }: any): JSX.Element {
  const { values } = formData;
  const { email } = values;
  const [passwordError, setPasswordError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isMailSender, setIsMailSender] = useState(values.isMailSender);
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();

  const validatePassword = (pw: string): string => {
    if (pw.length < 6) return "Şifre en az 6 karakter olmalı";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw)) return "Şifre en az bir özel karakter içermeli";
    if (!/\d/.test(pw)) return "Şifre en az bir rakam içermeli";
    return "";
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setNewPassword(v);
    const err = validatePassword(v);
    setPasswordError(err || (confirmPassword && v !== confirmPassword ? "Şifreler eşleşmiyor" : ""));
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setConfirmPassword(v);
    const err = validatePassword(newPassword);
    setPasswordError(err || (newPassword && v !== newPassword ? "Şifreler eşleşmiyor" : ""));
  };

  useEffect(() => { setIsMailSender(values.isMailSender); }, [values.isMailSender]);

  const handleUpdatePassword = async () => {
    try {
      dispatchBusy({ isBusy: true });
      if (validatePassword(newPassword) || validatePassword(confirmPassword) || newPassword !== confirmPassword) {
        dispatchAlert({ message: "Şifre geçerli değil", type: "Error" });
        return;
      }
      const conf = getConfiguration();
      const api = new UserApi(conf);
      await api.apiUserResetPassWordGet(email, newPassword, isMailSender);
      dispatchAlert({ message: "Şifre başarıyla güncellendi", type: "Success" });
    } catch (error) {
      dispatchAlert({ message: `Hata: ${error}`, type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const requirements = [
    "En az 1 özel karakter (!@#$% vb.)",
    "En az 6 karakter",
    "En az 1 rakam",
  ];

  return (
    <Card id="change-password" className="overflow-hidden rounded-2xl border border-border/50 shadow-sm">
      <CardHeader className="border-b border-border/40 bg-muted/20 px-5 py-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <LockKeyhole className="size-4 text-indigo-500" />
          Şifre Değiştir
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Yeni Şifre
            </Label>
            <Input
              id="new-password"
              type="password"
              className={`h-10 ${passwordError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              onChange={handlePasswordChange}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Şifre Tekrar
            </Label>
            <Input
              id="confirm-password"
              type="password"
              className={`h-10 ${passwordError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              onChange={handleConfirmPasswordChange}
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Error message */}
        {passwordError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {passwordError}
          </div>
        )}

        {/* Requirements */}
        <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Şifre Gereksinimleri
          </p>
          <ul className="space-y-1.5">
            {requirements.map((req, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                {req}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            id="btn-update-password"
            className="gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:from-indigo-600 hover:to-violet-700"
            onClick={handleUpdatePassword}
          >
            <RefreshCw className="size-4 shrink-0" />
            Şifreyi Güncelle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ChangePassword;
