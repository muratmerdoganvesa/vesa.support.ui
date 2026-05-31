import { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import validations from "layouts/pages/users/new-user/schemas/validations";
import form from "layouts/pages/users/new-user/schemas/form";
import initialValues from "layouts/pages/users/new-user/schemas/initialValues";
import getConfiguration from "confiuration";
import { CreateUserDto, UpdateUserDto, UserApi } from "api/generated";
import { useNavigate } from "react-router-dom";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
// import Organization from "./components/Organization";
import { Button } from "components/ui/button";
import { cn } from "lib/utils";
import { Check } from "lucide-react";

const STEPS = ["User Info", "Organizasyon", "Teknik CV"];

// const getStepContent = (stepIndex: number, formData: any, id: any): JSX.Element => {
//   switch (stepIndex) {
//     case 0:
//       return <UserInfo readOnlyUserName={id!!} showPassword={true} formData={formData} />;
//     case 1:
//       return <Organization formData={formData} />;
//     case 2:
//       return <Socials formData={formData} />;
//     default:
//       return null;
//   }
// };

function NewUser(): JSX.Element {
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const { formId, formField } = form;
  const currentValidation = validations[activeStep];
  const isLastStep = activeStep === STEPS.length - 1;
  const [formValues, setFormValues] = useState(initialValues);
  const [formGudid, setFormId] = useState("");
  const urlParams = new URLSearchParams(window.location.search);

  useEffect(() => {
    const id = urlParams.get("id");
    if (id) fetchDetail(id);
  }, []);

  const fetchDetail = async (id: any) => {
    dispatchBusy({ isBusy: true });
    const conf = getConfiguration();
    const api = new UserApi(conf);
    const data = await api.apiUserGet(id);
    const resultData = data.data;
    setFormId(resultData.id);
    setFormValues((prevValues) => ({
      ...prevValues,
      manager1:       data.data.manager1       || "",
      manager2:       data.data.manager2       || "",
      userName:       data.data.userName       || "",
      firstName:      data.data.firstName      || "",
      lastName:       data.data.lastName       || "",
      department:     data.data.departmentId   || "",
      title:          data.data.title          || "",
      email:          data.data.email          || "",
      linkedinUrl:    data.data.linkedinUrl    || "",
      isBlocked:      data.data.isBlocked      || false,
      isSystemAdmin:  data.data.isSystemAdmin  || false,
      vacationMode:   data.data.vacationMode   || false,
      profileInfo:    data.data.profileInfo    || "",
    }));
    dispatchBusy({ isBusy: false });
  };

  const sleep = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleBack = () => setActiveStep((s) => s - 1);

  const submitForm = async (values: any, actions: any) => {
    await sleep(1000);

    if (formGudid) {
      const update = values as UpdateUserDto;
      const conf = getConfiguration();
      const api = new UserApi(conf);
      update.id = formGudid;
      update.canSsoLogin = false;
      if (update.isBlocked == null)     update.isBlocked = false;
      if (update.isSystemAdmin == null) update.isSystemAdmin = false;
      if (update.vacationMode == null)  update.vacationMode = false;
      try {
        const data = await api.apiUserPut(update);
        console.log("Başarılı:", data);
      } catch (error: any) {
        dispatchAlert({ message: error.response.data.errors[0], type: "Error" });
        actions.setSubmitting(false);
        return;
      }
      navigate("/users");
    } else {
      const create = values as CreateUserDto;
      const conf = getConfiguration();
      const api = new UserApi(conf);
      create.canSsoLogin = false;
      create.lastLoginIp = "";
      try {
        const data = await api.apiUserPost(false, create);
        console.log("Başarılı:", data);
      } catch (error: any) {
        dispatchAlert({ message: error.response.data.errors[0], type: "Error" });
        actions.setSubmitting(false);
        return;
      }
      navigate("/users");
    }

    actions.setSubmitting(false);
    actions.resetForm();
    setActiveStep(0);
  };

  const handleSubmit = (values: any, actions: any) => {
    if (isLastStep) {
      submitForm(values, actions);
    } else {
      setActiveStep((s) => s + 1);
      actions.setTouched({});
      actions.setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="py-6 mb-20">
        <div className="w-full max-w-3xl mt-2.5">
          <Formik
            initialValues={formValues}
            enableReinitialize
            validationSchema={currentValidation}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, isSubmitting }) => (
              <Form id={formId} autoComplete="off">
                <div className="rounded-xl bg-white shadow-md overflow-hidden border border-gray-100">

                  {/* ── Stepper ── */}
                  <div className="relative flex items-center justify-between px-8 pt-6 pb-5 border-b border-gray-100">
                    {/* connecting line behind dots */}
                    <div className="absolute left-8 right-8 top-[2.35rem] h-px bg-gray-200 z-0" />

                    {STEPS.map((label, index) => {
                      const isCompleted = index < activeStep;
                      const isActive    = index === activeStep;

                      return (
                        <div
                          key={label}
                          className="relative z-10 flex flex-1 flex-col items-center gap-2"
                        >
                          {/* Circle */}
                          <div
                            className={cn(
                              "flex size-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                              isCompleted
                                ? "border-blue-500 bg-blue-500 text-white"
                                : isActive
                                  ? "border-blue-500 bg-white text-blue-500 shadow-sm shadow-blue-100"
                                  : "border-gray-200 bg-white text-gray-400"
                            )}
                          >
                            {isCompleted ? (
                              <Check className="size-4" strokeWidth={2.5} />
                            ) : (
                              index + 1
                            )}
                          </div>

                          {/* Label */}
                          <span
                            className={cn(
                              "text-xs font-medium whitespace-nowrap transition-colors duration-200",
                              isActive     ? "text-blue-600"  :
                              isCompleted  ? "text-blue-400"  :
                                             "text-gray-400"
                            )}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Step content ── */}
                  <div className="p-6">
                    {/* {getStepContent(
                      activeStep,
                      { values, touched, formField, errors },
                      formGudid
                    )} */}

                    {/* ── Navigation ── */}
                    <div className="mt-6 flex items-center justify-between">
                      {activeStep === 0 ? (
                        <div />
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleBack}
                          className="h-9 px-5 border-slate-200 text-slate-600 hover:bg-slate-50"
                          aria-label="Önceki adıma dön"
                        >
                          Geri
                        </Button>
                      )}

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-9 px-5 bg-linear-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-medium"
                        aria-label={isLastStep ? "Formu gönder" : "Sonraki adıma geç"}
                      >
                        {isLastStep ? "Gönder" : "İleri"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default NewUser;
