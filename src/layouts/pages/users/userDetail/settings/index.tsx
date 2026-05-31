import { useEffect, useState } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import BasicInfo from "./components/BasicInfo";
import ChangePassword from "./components/ChangePassword";
import Accounts from "./components/Accounts";
import DeleteAccount from "./components/DeleteAccount";
import Header from "./components/Header";
import TicketManagement from "./components/TicketManagement";
import NewPaswword from "./components/ChangePassword/newpassord";
import initialValues from "layouts/pages/users/new-user/schemas/initialValues";
import validations from "layouts/pages/users/new-user/schemas/validations";
import form from "layouts/pages/users/new-user/schemas/form";
import { Formik, Form } from "formik";
import getConfiguration from "confiuration";
import { CreateUserDto, UpdateUserDto, UserApi } from "api/generated";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert, AppAlertType as MessageBoxType } from "layouts/pages/hooks/useAlert";
import { useNavigate } from "react-router-dom";

function Settings(): JSX.Element {
  const currentValidation = validations[0];
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(initialValues);
  const [formGudid, setFormId] = useState("");
  const { formId, formField } = form;
  const urlParams = new URLSearchParams(window.location.search);

  const handleSubmit = async (values: any, actions: any) => {
    if (formGudid) {
      dispatchBusy({ isBusy: true });
      const update = values as UpdateUserDto;
      const conf = getConfiguration();
      const api = new UserApi(conf);
      update.id = formGudid;
      if (update.isBlocked == null) update.isBlocked = false;
      if (update.isTestData == null) update.isTestData = false;
      if (update.isSystemAdmin == null) update.isSystemAdmin = false;
      if (update.vacationMode == null) update.vacationMode = false;
      if (update.workCompanyId == null) {
        dispatchAlert({ message: "Şirket Alanı Boş Bırakılamaz", type: "Error" });
        dispatchBusy({ isBusy: false });
        return;
      }
      if (update.ticketDepartmentId == null) {
        dispatchAlert({ message: "Departman Alanı Boş Bırakılamaz", type: "Error" });
        dispatchBusy({ isBusy: false });
        return;
      }
      if (update.roleIds.length === 0) {
        dispatchAlert({ message: "Rol Alanı Boş Bırakılamaz", type: "Error" });
        dispatchBusy({ isBusy: false });
        return;
      }
      if (update.userLevel == null) {
        dispatchAlert({ message: "Seviye Alanı Boş Bırakılamaz", type: "Error" });
        dispatchBusy({ isBusy: false });
        return;
      }
      try {
        await api.apiUserPut(update);
      } catch (error: any) {
        dispatchBusy({ isBusy: false });
        dispatchAlert({ message: error.response.data.errors[0], type: "Error" });
        actions.setSubmitting(false);
        return;
      }
      dispatchBusy({ isBusy: false });
      navigate("/users");
    } else {
      dispatchBusy({ isBusy: true });
      const create = values as CreateUserDto;
      const conf = getConfiguration();
      const api = new UserApi(conf);
      create.lastLoginIp = "";
      try {
        await api.apiUserPost(values.isMailSender, create);
      } catch (error: any) {
        dispatchBusy({ isBusy: false });
        dispatchAlert({ message: error.response.data.errors[0], type: "Error" });
        actions.setSubmitting(false);
        return;
      }
      dispatchBusy({ isBusy: false });
      navigate("/users");
    }
    actions.setSubmitting(false);
    actions.resetForm();
  };

  useEffect(() => {
    const id = urlParams.get("id");
    if (id) fetchDetail(id);
  }, []);

  const fetchDetail = async (id: any) => {
    dispatchBusy({ isBusy: true });
    const conf = getConfiguration();
    const api = new UserApi(conf);
    const data = await api.apiUserGet(id);
    setFormId(data.data.id);
    setFormValues((prev) => ({
      ...prev,
      manager1: data.data.manager1 || null,
      manager2: data.data.manager2 || null,
      userName: data.data.userName || "",
      firstName: data.data.firstName || "",
      lastName: data.data.lastName || "",
      department: data.data.departmentId || "",
      title: data.data.title || "",
      email: data.data.email || "",
      linkedinUrl: data.data.linkedinUrl || "",
      isBlocked: data.data.isBlocked || false,
      isTestData: data.data.isTestData || false,
      isSystemAdmin: data.data.isSystemAdmin || false,
      canSsoLogin: data.data.canSsoLogin || false,
      vacationMode: data.data.vacationMode || false,
      profileInfo: data.data.profileInfo || "",
      photo: data.data.photo || "",
      sapDepartmentText: data.data.sapDepartmentText || "",
      sapPositionText: data.data.sapPositionText || "",
      ticketDepartmentId: data.data.ticketDepartmentId || "",
      roleIds: data.data.roles || [],
      workCompanyId: data.data.workCompanyId || "",
      hasTicketPermission: data.data.hasTicketPermission || false,
      hasDepartmentPermission: data.data.hasDepartmentPermission || false,
      hasOtherCompanyPermission: data.data.hasOtherCompanyPermission || false,
      hasOtherDeptCalendarPerm: data.data.hasOtherDeptCalendarPerm || false,
      canEditTicket: data.data.canEditTicket || false,
      dontApplyDefaultFilters: data.data.dontApplyDefaultFilters || false,
      positionId: data.data.positionId || null,
      userLevel: data.data.userLevel || null,
      mainManagerUserAppId: data.data.mainManagerUserAppId || null,
      pCname: data.data.pCname || "",
      isTeamLeader: data.data.isTeamLeader || false,
    }));
    dispatchBusy({ isBusy: false });
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <main className="w-full px-3 pb-10 pt-4">
        <Formik
          initialValues={formValues}
          enableReinitialize
          validationSchema={currentValidation}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, isSubmitting }) => (
            <Form>
              <div className="flex flex-col gap-5">
                {/* Save / action bar */}
                <DeleteAccount />

                {/* Profile header */}
                <Header formData={{ values, touched, formField, errors }} />

                {/* General info */}
                <BasicInfo
                  readOnlyUserName={formGudid!!}
                  formData={{ values, touched, formField, errors }}
                />

                {/* Password */}
                {formGudid ? (
                  <ChangePassword formData={{ values, touched, formField, errors }} />
                ) : (
                  <NewPaswword formData={{ values, touched, formField, errors }} />
                )}

                {/* Access / switches */}
                <Accounts formData={{ values, touched, formField, errors }} />

                {/* Ticket Management */}
                <TicketManagement formData={{ values, touched, formField, errors }} />
              </div>
            </Form>
          )}
        </Formik>
      </main>
    </DashboardLayout>
  );
}

export default Settings;
