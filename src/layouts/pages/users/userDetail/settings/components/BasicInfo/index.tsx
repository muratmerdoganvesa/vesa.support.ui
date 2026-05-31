import { useEffect, useState } from "react";
import { useFormikContext } from "formik";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import FormField from "layouts/pages/users/new-user/components/FormField";
import getConfiguration from "confiuration";
import { PcDto, PCTrackingApi, UserApi, UserAppDtoOnlyNameId } from "api/generated";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { User2 } from "lucide-react";
import { ComboField } from "../ComboField";

function BasicInfo({ formData, readOnlyUserName }: any): JSX.Element {
  const { formField, values, errors, touched } = formData;
  const { userName, firstName, lastName, email } = formField;
  const {
    userName: userNameV,
    firstName: firstNameV,
    lastName: lastNameV,
    email: emailV,
    pCname: pCnameV,
    manager1: manager1V,
    manager2: manager2V,
  } = values;
  const { setFieldValue } = useFormikContext();
  const [pcData, setPcData] = useState<PcDto[]>([]);
  const [managerData, setManagerData] = useState<UserAppDtoOnlyNameId[]>([]);
  const dispatchBusy = useBusy();

  useEffect(() => {
    const load = async () => {
      try {
        dispatchBusy({ isBusy: true });
        const conf = getConfiguration();
        const [pcRes, userRes] = await Promise.all([
          new PCTrackingApi(conf).apiPCTrackingGetPcNamesGet(),
          new UserApi(conf).apiUserGetAllUsersNameIdOnlyGet(),
        ]);
        setPcData(pcRes.data);
        setManagerData(userRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };
    load();
  }, []);

  const pcOptions      = pcData.map((p) => p.pCname ?? "").filter(Boolean);
  const managerOptions = managerData.map((u) => `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()).filter(Boolean);

  const getManagerLabel = (id: string) => {
    const u = managerData.find((m) => m.id === id);
    return u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : "";
  };

  const handleManagerChange = (field: string, label: string) => {
    const found = managerData.find((u) => `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() === label);
    setFieldValue(field, found?.id ?? "");
  };

  return (
    <Card id="basic-info" className="overflow-hidden rounded-2xl border border-border/50 shadow-sm">
      <CardHeader className="border-b border-border/40 bg-muted/20 px-5 py-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <User2 className="size-4 text-indigo-500" />
          Genel Bilgiler
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            type={firstName.type}
            label={firstName.label}
            name={firstName.name}
            value={firstNameV}
            placeholder={firstName.placeholder}
            error={errors.firstName && touched.firstName}
            success={Boolean(firstNameV) && !errors.firstName}
          />
          <FormField
            type={lastName.type}
            label={lastName.label}
            name={lastName.name}
            value={lastNameV}
            placeholder={lastName.placeholder}
            error={errors.lastName && touched.lastName}
            success={lastNameV?.length > 0 && !errors.lastName}
          />
          <FormField
            type={userName.type}
            label={userName.label}
            name={userName.name}
            value={userNameV}
            disabled={readOnlyUserName}
            placeholder={userName.placeholder}
            error={errors.userName && touched.userName}
            success={Boolean(userNameV) && !errors.userName}
          />
          <FormField
            type={email.type}
            label={email.label}
            name={email.name}
            value={emailV}
            placeholder={email.placeholder}
            error={errors.email && touched.email}
            success={emailV?.length > 0 && !errors.email}
          />

          <ComboField
            id="combo-pcname"
            label="Bilgisayar Adı"
            placeholder="Bilgisayar seçin…"
            options={pcOptions}
            value={pCnameV ?? ""}
            onChange={(v) => setFieldValue("pCname", v)}
          />

          <div />

          <ComboField
            id="combo-mgr1"
            label="Yönetici 1"
            placeholder="Yönetici seçin…"
            options={managerOptions}
            value={getManagerLabel(manager1V)}
            onChange={(v) => handleManagerChange("manager1", v)}
          />

          <ComboField
            id="combo-mgr2"
            label="Yönetici 2"
            placeholder="Yönetici seçin…"
            options={managerOptions}
            value={getManagerLabel(manager2V)}
            onChange={(v) => handleManagerChange("manager2", v)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default BasicInfo;
