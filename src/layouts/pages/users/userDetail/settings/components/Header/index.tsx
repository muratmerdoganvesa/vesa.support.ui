import { useFormikContext } from "formik";
import getConfiguration from "confiuration";
import { SAPReportsApi } from "api/generated";
import { Card, CardContent } from "components/ui/card";
import { Switch } from "components/ui/switch";
import { Label } from "components/ui/label";
import { Upload, Database, User, Mail, Briefcase } from "lucide-react";

function Header({ formData }: any): JSX.Element {
  const { formField, values } = formData;
  const { setFieldValue } = useFormikContext();

  function handleIsLocked() {
    setFieldValue("isBlocked", !values.isBlocked);
  }
  function handleIsTestData() {
    setFieldValue("isTestData", !values.isTestData);
  }

  const photoSrc = values.photo
    ? values.photo.startsWith("data:image")
      ? values.photo
      : `data:image/png;base64,${values.photo}`
    : null;

  return (
    <Card id="profile" className="overflow-hidden rounded-2xl border border-border/50 shadow-sm">
      <CardContent className="p-0">
        {/* Coloured top strip */}
        <div className="h-20 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600" />

        <div className="flex flex-col gap-6 px-6 pb-6 sm:flex-row sm:items-end">
          {/* Avatar */}
          <div className="-mt-12 flex flex-col items-center gap-2">
            <div className="relative">
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt="profile"
                  className="size-24 rounded-full border-4 border-background object-cover shadow-md"
                />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-full border-4 border-background bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md text-3xl font-bold text-white">
                  {`${values.firstName?.[0] ?? ""}${values.lastName?.[0] ?? ""}`.toUpperCase() || "?"}
                </div>
              )}
            </div>

            {/* Upload */}
            <label htmlFor="raised-button-file" className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
              <Upload className="size-3.5" />
              Fotoğraf Yükle
            </label>
            <input
              accept="image/*"
              className="hidden"
              id="raised-button-file"
              type="file"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    if (ev.target?.result) setFieldValue("photo", ev.target.result);
                  };
                  reader.readAsDataURL(e.target.files[0]);
                }
              }}
            />
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={async () => {
                const conf = getConfiguration();
                const api = new SAPReportsApi(conf);
                const data = await api.apiSAPReportsGetSapInfoGet(values.email);
                setFieldValue("photo", data.data.photo);
                setFieldValue("sapPositionText", data.data.stext);
              }}
            >
              <Database className="size-3.5" />
              SAP'tan Getir
            </button>
          </div>

          {/* Name & info */}
          <div className="flex flex-1 flex-col gap-0.5 sm:mb-1">
            <h2 className="text-xl font-bold text-foreground">
              {values.firstName} {values.lastName}
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="size-3.5 shrink-0" />
              {values.email || "—"}
            </p>
            {values.sapPositionText && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
                <Briefcase className="size-3.5 shrink-0" />
                {values.sapPositionText}
              </p>
            )}
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-3 sm:mb-1 sm:items-end">
            <div className="flex items-center gap-3">
              <Label htmlFor="toggle-blocked" className="text-sm text-muted-foreground">
                Kullanıcı {values.isBlocked ? "Pasif" : "Aktif"}
              </Label>
              <Switch
                id="toggle-blocked"
                checked={!values.isBlocked}
                onCheckedChange={handleIsLocked}
              />
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="toggle-test" className="text-sm text-muted-foreground">
                Test Verisi mi?
              </Label>
              <Switch
                id="toggle-test"
                checked={values.isTestData}
                onCheckedChange={handleIsTestData}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Header;
