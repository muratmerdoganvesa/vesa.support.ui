import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import FormField from "layouts/pages/users/new-user/components/FormField";

const requirements = [
  "En az 1 özel karakter (!@#$% vb.)",
  "En az 6 karakter",
  "En az 1 rakam (2 önerilir)",
];

function NewPaswword({ formData }: any): JSX.Element {
  const { formField, values, errors, touched } = formData;
  const { password } = formField;
  const { password: passwordV } = values;

  return (
    <Card id="change-password" className="overflow-hidden rounded-2xl border border-border/50 shadow-sm">
      <CardHeader className="border-b border-border/40 bg-muted/20 px-5 py-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <LockKeyhole className="size-4 text-indigo-500" />
          Şifre Belirle
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <div className="max-w-sm">
          <FormField
            type={password.type}
            label={password.label}
            name={password.name}
            value={passwordV}
            placeholder={password.placeholder}
            error={errors.password && touched.password}
            success={Boolean(passwordV) && !errors.password}
          />
        </div>

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
      </CardContent>
    </Card>
  );
}

export default NewPaswword;
