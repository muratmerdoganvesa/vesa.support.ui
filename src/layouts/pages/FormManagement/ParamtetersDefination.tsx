/**
=========================================================
* Material Dashboard 2 PRO React TS - v1.0.2
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-2-pro-react-ts
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { Form, FormBuilder, Formio } from "@formio/react";

import { useEffect, useRef, useState } from "react";

import "./style/Builder.css";

import { ErrorMessage, Field, Formik, FormikProvider, useFormik } from "formik";
import * as Yup from "yup";
// import { setLoading, useMaterialUIController } from "context";

import React from "react";
import "./Custom"; // side-effect: registers DS* components via Formio.Components.addComponent
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import {
  FormDataApi,
  FormCategory,
  FormPriority,
  FormType,
  WorkFlowDefinationApi,
  WorkFlowDefinationListDto,
} from "api/generated";
import getConfiguration from "confiuration";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { Editor } from "@monaco-editor/react";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "components/ui/accordion";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Checkbox } from "components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import {
  Code2,
  Cog,
  FileJson,
  FileText,
  Info,
  LayoutTemplate,
  Play,
  Save,
  SlidersHorizontal,
} from "lucide-react";

interface FormProps {
  id?: string;
  formName?: string;
  formDescription?: string;
  formDesign?: string;
  revision?: number;
  isActive?: number;
  showInMenu?: number;
  formType: number;
  formTypeText: string;
  formCategory: number;
  formCategoryText: string;
  formPriority: number;
  propPriorityText: string;
  workflowId: string;
  workFlowName: string;
}

interface formCategory {
  id: FormCategory;
  name: string;
  description: string;
}

interface formType {
  id: FormType;
  name: string;
  description: string;
}

interface formPriority {
  id: FormPriority;
  name: string;
  description: string;
}

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject {
  [key: string]: JsonValue;
}
interface JsonArray extends Array<JsonValue> {}

const ParamtetersDefination = (): JSX.Element => {
  const { id } = useParams();

  // const [controller, dispatch] = useMaterialUIController();
  const [searchParams] = useSearchParams();
  // const urlParams = new URLSearchParams(location.search);
  const [value, setValue] = React.useState("1");
  // const configuration = ConfigurationConfig;
  const navigate = useNavigate();

  const handleTabValueChange = (newValue: string) => {
    setValue(newValue);
  };
  const testData = [
    { id: 0, kolon1: "Veri 1111-1", kolon2: "Veri 1-2", kolon3: "Veri 1-3" },
    { id: 1, kolon1: "Veri 2-1", kolon2: "Veri 2-2", kolon3: "Veri 2-3" },
    { id: 2, kolon1: "Veri 3-1", kolon2: "Veri 3-2", kolon3: "Veri 3-3" },
    { id: 3, kolon1: "Veri 4-1", kolon2: "Veri 4-2", kolon3: "Veri 4-3" },
    { id: 4, kolon1: "Veri 5-1", kolon2: "Veri 5-2", kolon3: "Veri 5-3" },
    { id: 5, kolon1: "Veri 6-1", kolon2: "Veri 6-2", kolon3: "Veri 6-3" },
    { id: 6, kolon1: "Veri 7-1", kolon2: "Veri 7-2", kolon3: "Veri 7-3" },
    { id: 7, kolon1: "Veri 8-1", kolon2: "Veri 8-2", kolon3: "Veri 8-3" },
  ];

  // Validasyon şemasını önce tanımla, sonra kullan
  const validationSchema = Yup.object().shape({
    formName: Yup.string().required("Bu alan boş bırakılamaz"),
    workflowId: Yup.string().when("formType", {
      is: "workflow",
      then: () => Yup.string().required("İş akışı formu için iş akışı seçimi zorunludur"),
    }),
    formType: Yup.string().required("Form tipi seçimi zorunludur"),
    formCategory: Yup.string().required("Form kategorisi seçimi zorunludur"),
    formPriority: Yup.string().required("Form önceliği seçimi zorunludur"),
  });

  let initialValues = {
    formName: "",
    formDescription: "",
    Revision: "1",
    formid: "",
    isActive: 0,
    showInMenu: 0,
    workflowId: "",
    workFlowName: "",
    formType: 0,
    formTypeText: "",
    formCategory: 0,
    formCategoryText: "",
    formPriority: 0,
    formPriortyText: "",
  };
  const [myFormPriorities, setMyFormPriorities] = useState<formPriority[]>([]);
  const [myFormCategories, setMyFormCategories] = useState<formCategory[]>([]);
  const [myFormTypes, setMyFormTypes] = useState<formType[]>([]);
  const [myWorkFlowDefinations, setMyWorkFlowDefinations] = useState<any>([]);

  const [prevFormDataJson, setPrevFormDataJson] = useState("");

  const myData = async () => {
    var conf = getConfiguration();
    const workflowdefination = new WorkFlowDefinationApi(conf);
    const formProperty = new FormDataApi(conf);
    const dataPriorities = await formProperty.apiFormDataGetFormPrioritiesEnumGet();
    const dataCategories = await formProperty.apiFormDataGetFormCategoriesEnumGet();
    const dataTypes = await formProperty.apiFormDataGetFormTypesEnumGet();
    const workFlowDefinationData =
      await workflowdefination.apiWorkFlowDefinationGetWorkFlowListByMenuGet();
    console.log("sercan log1 prio", dataPriorities.data);
    console.log("sercan log2 catego", dataCategories.data);
    console.log("sercan log3 type", dataTypes.data);
    console.log("sercan log4 definiton", workFlowDefinationData.data);
    setMyFormPriorities(dataPriorities.data as any);
    setMyFormCategories(dataCategories.data as any);
    setMyFormTypes(dataTypes.data as any);
    setMyWorkFlowDefinations(workFlowDefinationData.data as any);
  };

  const [jsonSchema, setSchema] = useState({ components: [] });
  const [jsEditorValue, setJsEditorValue] = useState("");

  function removeKeysFromJson<T extends JsonValue>(data: T, keysToRemove: string[] = ["id"]): T {
    if (Array.isArray(data)) {
      return data.map((item) => removeKeysFromJson(item, keysToRemove)) as T;
    } else if (data !== null && typeof data === "object") {
      const result: JsonObject = {};
      for (const key in data) {
        if (!keysToRemove.includes(key)) {
          result[key] = removeKeysFromJson((data as JsonObject)[key], keysToRemove);
        }
      }
      return result as T;
    }
    return data;
  }

  const saveForm = async (values: any) => {
    try {
      console.log("Form gönderiliyor...", values);
      var conf = getConfiguration();
      const formRepo = new FormDataApi(conf);
      values.formDesign = JSON.stringify(jsonSchema);
      values.javaScriptCode = jsEditorValue;
      console.log("workflow ıd ", values.workflowId);

      if (id) {
        console.log("Form güncelleniyor...");
        const json1 = JSON.parse(prevFormDataJson);
        const json2 = JSON.parse(values.formDesign);
        const cleaned1 = removeKeysFromJson(json1);
        const cleaned2 = removeKeysFromJson(json2);
        const areEqual = JSON.stringify(cleaned1) === JSON.stringify(cleaned2);
        console.log("Formlar aynı mı?", areEqual);

        if (areEqual) {
          await formRepo.apiFormDataPut({
            id: id,
            formName: values.formName,
            canEdit: true,
            parentFormId: values.parentFormId,
            formDescription: values.formDescription,
            formDesign: values.formDesign,
            revision: values.Revision,
            isActive: values.isActive,
            showInMenu: values.showInMenu == 1 ? true : false,
            javaScriptCode: values.javaScriptCode,
            formCategory: values.formCategory,
            formPriority: values.formPriority,
            formType: values.formType,
            workFlowDefinationId: values.workflowId == "" ? null : values.workflowId,
          });
        } else {
          await formRepo.apiFormDataPut({
            id: id,
            formName: values.formName,
            canEdit: false,
            parentFormId: values.parentFormId,
            formDescription: values.formDescription,
            formDesign: values.formDesign,
            revision: values.Revision,
            isActive: values.isActive,
            showInMenu: false,
            javaScriptCode: values.javaScriptCode,
            formCategory: values.formCategory,
            formPriority: values.formPriority,
            formType: values.formType,
            workFlowDefinationId: values.workflowId == "" ? null : values.workflowId,
          });
          await formRepo.apiFormDataPost({
            formName: values.formName,
            parentFormId: values.parentFormId,
            canEdit: true,
            formDescription: values.formDescription,
            formDesign: values.formDesign,
            revision: values.Revision + 1,
            isActive: values.isActive,
            showInMenu: values.showInMenu == 1 ? true : false,
            javaScriptCode: values.javaScriptCode,
            formCategory: values.formCategory,
            formPriority: values.formPriority,
            formType: values.formType,
            workFlowDefinationId: values.workflowId == "" ? null : values.workflowId,
          });
        }

        console.log("Form başarıyla güncellendi");
      } else {
        console.log("Yeni form oluşturuluyor...");
        await formRepo.apiFormDataPost({
          formName: values.formName,
          canEdit: true,
          formDescription: values.formDescription,
          formDesign: values.formDesign,
          revision: values.Revision,
          isActive: values.isActive,
          showInMenu: values.showInMenu == 1 ? true : false,
          javaScriptCode: values.javaScriptCode,
          formCategory: values.formCategory,
          formPriority: values.formPriority,
          formType: values.formType,
          workFlowDefinationId: values.workflowId == "" ? null : values.workflowId,
        });
        console.log("Form başarıyla oluşturuldu");
      }
      console.log("Navigating to /parameters...");
      navigate("/parameters", { replace: true });
    } catch (error) {
      console.error("Form gönderme hatası:", error);
      alert("Form kaydedilirken bir hata oluştu!");
    }
  };

  const formikProps = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema,
    onSubmit: saveForm,
  });

  useEffect(() => {
    // Custom components already register themselves via Formio.Components.addComponent
    // in each Custom/* module. Do NOT call Components.setComponents() with class-name
    // keys — that pollutes the registry and can break builder sidebar groups.

    Formio.setBaseUrl("https://api.cfapps.us21.hana.ondemand.com/api");
    Formio.setProjectUrl("https://api.cfapps.us21.hana.ondemand.com/api");
  }, []);

  const [formEditActive, setformEditActive] = useState(false);

  const [detailForm, setDetailForm] = useState<FormProps>();
  const [jsonEditorValue, setJsonEditorValue] = useState("");
  const editorRef = useRef(null);

  const [selectedFormPiority, setSelectedFormPiority] = useState("");
  const fetchTest = async () => {
    try {
      if (id) {
        var confg = getConfiguration();
        const formRepo = new FormDataApi(confg);
        var data = await formRepo.apiFormDataIdGet(id);
        console.log("getbyid data", data);
        formikProps.setFieldValue("formName", data.data.formName);
        formikProps.setFieldValue("parentFormId", data.data.parentFormId);
        formikProps.setFieldValue("formDescription", data.data.formDescription);
        formikProps.setFieldValue("formid", data.data.id);
        formikProps.setFieldValue("Revision", data.data.revision);
        formikProps.setFieldValue("isActive", data.data.isActive);
        formikProps.setFieldValue("showInMenu", data.data.showInMenu);
        formikProps.setFieldValue("formType", data.data.formType);
        formikProps.setFieldValue("formCategory", data.data.formCategory);
        formikProps.setFieldValue("formPriority", data.data.formPriority);
        formikProps.setFieldValue("workflowId", data.data.workFlowDefinationId);
        formikProps.setFieldValue("formTypeText", data.data.formTypeText);
        formikProps.setFieldValue("formCategoryText", data.data.formCategoryText);
        formikProps.setFieldValue("formPriortyText", data.data.formPriorityText);
        formikProps.setFieldValue("workFlowName", data.data.workFlowName);
        if (data.data.workFlowDefinationId != null) {
          formikProps.values.formType = 2;
        }
        console.log("fethtest", data.data.formPriority);
        setSelectedFormPiority(data.data.formPriorityText);
        // JavaScript kodunu state'e kaydet
        setJsEditorValue(
          data.data.javaScriptCode || generateJavaScript(JSON.parse(data.data.formDesign))
        );

        setSchema(JSON.parse(data.data.formDesign));
        setDetailForm(data.data as any);

        setPrevFormDataJson(data.data.formDesign);
      }
    } catch (error) {
      console.error("Error fetching form data:", error);
    }
  };

  useEffect(() => {
    myData();
    fetchTest();
  }, []);

  const handleJsonChange = (value: string | undefined) => {
    try {
      if (value) {
        const parsedJson = JSON.parse(value);
        setSchema(parsedJson);
        setJsonEditorValue(value);
      }
    } catch (error) {
      console.error("JSON parse hatası:", error);
    }
  };

  const onFormChange = (schema: any) => {
    setSchema({ ...schema, components: [...schema.components] });
    setJsonEditorValue(JSON.stringify(schema, null, 2));
  };

  async function getFormId(id: any) {
    // setLoading(dispatch, true);
    // let formApi = new FormDataApi(configuration);
    // var formDetail = await formApi.apiFormDataIdGet(id);
    // // console.log(formDetail);
    // formikProps.setFieldValue("formName", formDetail.data.formName);
    // formikProps.setFieldValue("formDescription", formDetail.data.formDescription);
    // formikProps.setFieldValue("formid", formDetail.data.id);
    // formikProps.setFieldValue("isActive", formDetail.data.isActive);
    // setDetailForm(formDetail.data);
    // setformEditActive(true);
    // setSchema(JSON.parse(formDetail.data.formDesign));
    // setLoading(dispatch, false);
  }

  const options = {
    // Force Form.io's own sidebar toggle (no Bootstrap JS dependency)
    bootstrap: 0,
    builder: {
      premium: false,
      custom: {
        title: "Vesa Design System",
        key: "custom",
        weight: 10,
        default: false,
        components: {
          dsinput: {
            title: "DS Inbox",
            key: "dsinput",
            icon: "terminal",
            schema: {
              label: "dsinput",
              type: "dsinput",
              key: "dsinput",
            },
          },
          dsselect: {
            title: "DS Select",
            key: "dsselect",
            icon: "list",
            schema: {
              label: "dsselect",
              type: "dsselect",
              key: "dsselect",
            },
          },
          dscheckbox: {
            title: "DS CheckBox",
            key: "dscheckbox",
            icon: "check-square",
            schema: {
              label: "dscheckbox",
              type: "dscheckbox",
              key: "dscheckbox",
            },
          },
          dsselectboxes: {
            title: "DS Selectboxes",
            key: "dsselectboxes",
            icon: "plus-square",
            schema: {
              label: "dsselectboxes",
              type: "dsselectboxes",
              key: "dsselectboxes",
            },
          },
          dsradio: {
            title: "DS Radio",
            key: "dsradio",
            icon: "dot-circle-o",
            schema: {
              label: "dsradio",
              type: "dsradio",
              key: "dsradio",
            },
          },
          dsnumber: {
            title: "DS Number",
            key: "dsnumber",
            icon: "hashtag",
            schema: {
              label: "dsnumber",
              type: "dsnumber",
              key: "dsnumber",
            },
          },
          dspassword: {
            title: "DS Password",
            key: "dspassword",
            icon: "lock",
            schema: {
              label: "dspassword",
              type: "dspassword",
              key: "dspassword",
            },
          },
          dsbutton: {
            title: "DS Button",
            key: "dsbutton",
            icon: "stop",
            schema: {
              label: "dsbutton",
              type: "dsbutton",
              key: "dsbutton",
            },
          },
          dsemail: {
            title: "DS Email",
            key: "dsemail",
            icon: "at",
            schema: {
              label: "dsemail",
              type: "dsemail",
              key: "dsemail",
            },
          },
          dsphone: {
            title: "DS Phone",
            key: "dsphone",
            icon: "phone-square",
            schema: {
              label: "dsphone",
              type: "dsphone",
              key: "dsphone",
            },
          },
          dsdatetime: {
            title: "DS DateTime",
            key: "dsdatetime",
            icon: "calendar",
            schema: {
              label: "dsdatetime",
              type: "dsdatetime",
              key: "dsdatetime",
            },
          },
          dsday: {
            title: "DS Day",
            key: "dsday",
            icon: "calendar",
            schema: {
              label: "dsday",
              type: "dsday",
              key: "dsday",
            },
          },
          dstime: {
            title: "DS Time",
            key: "dstime",
            icon: "clock-o",
            schema: {
              label: "dstime",
              type: "dstime",
              key: "dstime",
            },
          },
          dscurrency: {
            title: "DS Currency",
            key: "dscurrency",
            icon: "usd",
            schema: {
              label: "dscurrency",
              type: "dscurrency",
              key: "dscurrency",
            },
          },
          dssurvey: {
            title: "DS Survey",
            key: "dssurvey",
            icon: "list",
            schema: {
              label: "dssurvey",
              type: "dssurvey",
              key: "dssurvey",
            },
          },
          dssignature: {
            title: "DS Signature",
            key: "dssignature",
            icon: "pencil",
            schema: {
              label: "dssignature",
              type: "dssignature",
              key: "dssignature",
            },
          },
          dstable: {
            title: "DS Table",
            key: "dstable",
            icon: "table",
            schema: {
              label: "dstable",
              type: "dstable",
              key: "dstable",
            },
          },
          dsusername: {
            title: "DS Username",
            key: "dsusername",
            icon: "user",
            schema: {
              label: "dsusername",
              type: "dsusername",
              key: "dsusername",
            },
          },
          dshtmlelement: {
            title: "DS HTML",
            key: "dshtmlelement",
            icon: "code",
            schema: {
              label: "dshtmlelement",
              type: "dshtmlelement",
              key: "dshtmlelement",
            },
          },
          dstextarea: {
            title: "DS Text Area",
            key: "dstextarea",
            icon: "font",
            schema: {
              label: "dstextarea",
              type: "dstextarea",
              key: "dstextarea",
            },
          },
          dsapproval: {
            title: "DS Approval",
            key: "dsapproval",
            icon: "check",
            schema: {
              label: "dsapproval",
              type: "dsapproval",
              key: "dsapproval",
            },
          },
        },
      },
    },
  };

  const [activeTab, setActiveTab] = useState("form"); // "form" | "typescript"

  const generateTypeScript = (formSchema: any) => {
    const interfaceNames = new Set<string>();
    const interfaces: string[] = [];

    // Form alanları için interface oluştur
    const generateFieldInterface = (components: any[]) => {
      let fields = "";
      components.forEach((component) => {
        if (component.key) {
          switch (component.type) {
            case "textfield":
              fields += `  ${component.key}: string;\n`;
              break;
            case "number":
              fields += `  ${component.key}: number;\n`;
              break;
            case "checkbox":
              fields += `  ${component.key}: boolean;\n`;
              break;
            case "select":
              const enumName = `${component.key}Options`;
              interfaceNames.add(enumName);
              interfaces.push(`export enum ${enumName} {
  ${component.data.values.map((v: any) => `${v.label} = "${v.value}"`).join(",\n  ")}
}\n`);
              fields += `  ${component.key}: ${enumName};\n`;
              break;
            default:
              fields += `  ${component.key}: any;\n`;
          }
        }
      });
      return fields;
    };

    // Event handler'lar için interface oluştur
    const generateEventHandlers = (components: any[]) => {
      let handlers = "";
      components.forEach((component) => {
        if (component.key) {
          switch (component.type) {
            case "button":
              handlers += `  on${component.key}Click?: () => void;\n`;
              break;
            case "textfield":
            case "number":
            case "select":
              handlers += `  on${component.key}Change?: (value: any) => void;\n`;
              break;
          }
        }
      });
      return handlers;
    };

    const formName = formikProps.values.formName || "DefaultForm";
    const typescriptCode = `// ${formName} için otomatik oluşturulan TypeScript tanımlamaları
import { FormEvent } from 'react';

${interfaces.join("\n")}

export interface I${formName}Data {
${generateFieldInterface(formSchema.components)}
}

export interface I${formName}Events {
${generateEventHandlers(formSchema.components)}
  onSubmit?: (data: I${formName}Data) => void;
  onValidationError?: (errors: any) => void;
}

export interface I${formName}Props extends I${formName}Events {
  initialData?: Partial<I${formName}Data>;
  isLoading?: boolean;
  isReadOnly?: boolean;
}

export class ${formName}Handler {
  private formData: I${formName}Data;
  private events: I${formName}Events;

  constructor(events?: I${formName}Events) {
    this.formData = {} as I${formName}Data;
    this.events = events || {};
  }

  public handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Form doğrulama
      console.log("asdasdasd");
      const validationResult = await this.validateForm();
      if (validationResult.isValid) {
        this.events.onSubmit?.(this.formData);
      } else {
        this.events.onValidationError?.(validationResult.errors);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  private validateForm = async () => {
    // Form doğrulama mantığı burada implement edilecek
    return { isValid: true, errors: null };
  };

${formSchema.components
  .map((component: any) => {
    if (component.key) {
      switch (component.type) {
        case "button":
          return `  public handle${component.key}Click = () => {
    this.events.on${component.key}Click?.();
  };\n`;
        case "textfield":
        case "number":
        case "select":
          return `  public handle${component.key}Change = (value: any) => {
    this.formData.${component.key} = value;
    this.events.on${component.key}Change?.(value);
  };\n`;
        default:
          return "";
      }
    }
    return "";
  })
  .join("\n")}
}

// Kullanım örneği:
/*
const ${formName}Instance = new ${formName}Handler({
  onSubmit: (data) => {
    console.log('Form data:', data);
  },
  onValidationError: (errors) => {
    console.error('Validation errors:', errors);
  }
});
*/
`;
    return typescriptCode;
  };

  const [tsCode, setTsCode] = useState("");

  useEffect(() => {
    setTsCode(generateTypeScript(jsonSchema));
  }, [jsonSchema]);

  const handleTsCodeChange = (value: string | undefined) => {
    if (value) {
      setTsCode(value);
    }
  };

  const saveTypeScriptCode = async () => {
    try {
      // TypeScript dosyasını kaydet
      const fileName = `${formikProps.values.formName || "DefaultForm"}.ts`;
      const blob = new Blob([tsCode], { type: "text/typescript" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("TypeScript dosyası kaydedilirken hata:", error);
    }
  };

  const generateJavaScript = (formSchema: any) => {
    const formName = formikProps.values.formName || "DefaultForm";

    const javascriptCode = `// ${formName} için Form.io event handlers
document.addEventListener('DOMContentLoaded', function() {
  // Form oluştur
  Formio.createForm(document.getElementById('formio'), ${JSON.stringify(
    formSchema
  )}).then(function(form) {
    console.log('Form yüklendi:', form);

    // Form submit olayı
    form.on('submit', (submission) => {
      alert('Form başarıyla gönderildi!');
      console.log('Form verileri:', submission.data);
    });

    // Her component için event listener'ları ekle
    ${formSchema.components
      .map((comp: any) => {
        if (comp.key) {
          switch (comp.type) {
            case "button":
              return `
    // ${comp.key} butonu için click event
    const ${comp.key}Btn = form.getComponent('${comp.key}');
    if (${comp.key}Btn) {
      ${comp.key}Btn.on('click', () => {
        console.log('${comp.key} butonuna tıklandı');
      });
    }`;
            case "textfield":
              return `
    // ${comp.key} text alanı için change event
    const ${comp.key}Field = form.getComponent('${comp.key}');
    if (${comp.key}Field) {
      ${comp.key}Field.on('change', (e) => {
        console.log('${comp.key} değeri değişti:', e.value);
      });
    }`;
            case "number":
              return `
    // ${comp.key} sayı alanı için change event
    const ${comp.key}Field = form.getComponent('${comp.key}');
    if (${comp.key}Field) {
      ${comp.key}Field.on('change', (e) => {
        console.log('${comp.key} sayısı değişti:', e.value);
      });
    }`;
            case "select":
              return `
    // ${comp.key} seçim alanı için change event
    const ${comp.key}Select = form.getComponent('${comp.key}');
    if (${comp.key}Select) {
      ${comp.key}Select.on('change', (e) => {
        console.log('${comp.key} seçimi değişti:', e.value);
      });
    }`;
            default:
              return `
    // ${comp.key} componenti için change event
    const ${comp.key}Comp = form.getComponent('${comp.key}');
    if (${comp.key}Comp) {
      ${comp.key}Comp.on('change', (e) => {
        console.log('${comp.key} değeri değişti:', e.value);
      });
    }`;
          }
        }
        return "";
      })
      .join("\n")}

    // Form hazır olduğunda
    form.on('ready', () => {
      console.log('Form kullanıma hazır');
    });

    // Form validation hatası olduğunda
    form.on('error', (errors) => {
      console.error('Form hataları:', errors);
      alert('Form gönderilirken hata oluştu!');
    });
  });
});`;

    return javascriptCode;
  };

  const loadFormScript = () => {
    // Önceki script'i temizle
    const oldScript = document.getElementById("form-handler-script");
    if (oldScript) {
      oldScript.remove();
      // Global değişkeni temizle
      const formName = formikProps.values.formName || "DefaultForm";
      delete (window as any)[formName];
    }

    // Yeni script'i ekle
    const script = document.createElement("script");
    script.id = "form-handler-script";
    script.textContent = generateJavaScript(jsonSchema);
    document.body.appendChild(script);
  };

  useEffect(() => {
    if (value === "3") {
      // Önizleme tabı seçildiğinde
      setTimeout(loadFormScript, 100); // Form yüklendikten sonra script'i yükle
    }
    return () => {
      // Component unmount olduğunda script'i temizle
      const script = document.getElementById("form-handler-script");
      if (script) {
        script.remove();
      }
    };
  }, [value, jsonSchema]);

  const [showPreviewModal, setShowPreviewModal] = useState(false);

  return (
    <>
      <DashboardLayout>
        <DashboardNavbar />
        <div className="mx-auto w-full max-w-[1920px] px-3">
          <Tabs value={value} onValueChange={handleTabValueChange} className="w-full gap-3 pb-10">
            <TabsList variant="line" className="mb-3 flex h-auto min-h-10 w-full flex-wrap justify-start gap-1 rounded-xl border border-border/60 bg-muted/25 p-1.5 md:flex-nowrap" aria-label="Form düzenleyici sekmeleri">
              <TabsTrigger value="1" className="shrink-0 gap-2 text-sm px-4 py-2.5">
                <LayoutTemplate className="size-4 shrink-0 opacity-70" aria-hidden />
                Form Tasarımı
              </TabsTrigger>
              <TabsTrigger value="2" className="shrink-0 gap-2 text-sm px-4 py-2.5">
                <FileText className="size-4 shrink-0 opacity-70" aria-hidden />
                JavaScript Kod
              </TabsTrigger>
              <TabsTrigger value="3" className="shrink-0 gap-2 text-sm px-4 py-2.5">
                <Play className="size-4 shrink-0 opacity-70" aria-hidden />
                Önizleme
              </TabsTrigger>
              <TabsTrigger value="4" className="shrink-0 gap-2 text-sm px-4 py-2.5">
                <FileJson className="size-4 shrink-0 opacity-70" aria-hidden />
                Form JSON
              </TabsTrigger>
            </TabsList>

            <TabsContent value="1" className="focus:outline-none">
              <div className="flex min-h-[calc(100vh-15rem)] w-full flex-col rounded-xl border border-border/60 shadow-sm lg:flex-row">
                <div className="relative min-h-[520px] min-w-0 flex-1 overflow-auto border-border/60 bg-background lg:border-r">
                  <div className="formio-builder-host block min-h-[520px] w-full overflow-x-auto p-2 [&_.formbuilder]:min-h-[480px]">
                    <FormBuilder options={options} form={jsonSchema} onChange={onFormChange} />
                  </div>
                </div>

                <div className="h-auto w-full shrink-0 overflow-y-auto border-t border-border/60 bg-muted/25 lg:max-w-md lg:border-t-0 lg:border-l lg:border-border/60 lg:overflow-y-scroll">
                    <Accordion type="single" collapsible defaultValue="sidebar" className="w-full border-0 px-3 py-2 shadow-none">
                      <AccordionItem value="sidebar" className="border-0">
                        <AccordionTrigger className="rounded-lg px-2 py-2 hover:no-underline">
                          <span className="flex items-center gap-2 text-[15px] font-medium tracking-tight">
                            <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                            Form Özellikleri
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4 pt-0">
                          <form className="space-y-4 px-0">
                            <Accordion type="multiple" defaultValue={["basic", "config", "other"]} className="w-full border-0 bg-transparent shadow-none">
                              <AccordionItem value="basic" className="rounded-lg border border-border/50 px-2">
                                <AccordionTrigger className="py-2 text-sm hover:no-underline">
                                  <span className="flex items-center gap-2">
                                    <Info className="size-4 shrink-0 text-sky-500" aria-hidden />
                                    Temel Bilgiler
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3 px-2 pb-3 pt-2">
                                  <div className="space-y-1.5">
                                    <Label className="text-muted-foreground" htmlFor="formName">
                                      Form Adı
                                    </Label>
                                    <Input
                                      disabled={formEditActive}
                                      className="h-10 w-full"
                                      value={formikProps.values.formName}
                                      onChange={formikProps.handleChange}
                                      onBlur={formikProps.handleBlur}
                                      name="formName"
                                      id="formName"
                                      autoComplete="off"
                                    />
                                    {formikProps.errors.formName && formikProps.touched.formName && (
                                      <p className="text-xs text-destructive" role="alert">
                                        {String(formikProps.errors.formName)}
                                      </p>
                                    )}
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label className="text-muted-foreground" htmlFor="formDescription">
                                      Form Açıklama
                                    </Label>
                                    <Input
                                      className="h-10 w-full"
                                      value={formikProps.values.formDescription}
                                      onChange={formikProps.handleChange}
                                      onBlur={formikProps.handleBlur}
                                      name="formDescription"
                                      id="formDescription"
                                      autoComplete="off"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label className="text-muted-foreground" htmlFor="Revision">
                                      Revizyon
                                    </Label>
                                    <Input
                                      className="h-10 w-full bg-muted"
                                      readOnly
                                      value={String(formikProps.values.Revision)}
                                      onChange={formikProps.handleChange}
                                      onBlur={formikProps.handleBlur}
                                      name="Revision"
                                      id="Revision"
                                      disabled
                                      aria-readonly="true"
                                    />
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              <AccordionItem value="config" className="mt-2 rounded-lg border border-border/50 px-2">
                                <AccordionTrigger className="py-2 text-sm hover:no-underline">
                                  <span className="flex items-center gap-2">
                                    <Cog className="size-4 shrink-0 text-emerald-600" aria-hidden />
                                    Form Yapılandırması
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3 px-2 pb-3 pt-2">
                                  <div className="space-y-1.5">
                                    <Label className="text-muted-foreground">Form Tipi</Label>
                                    <Select
                                      value={formikProps.values.formTypeText || undefined}
                                      onValueChange={(desc) => {
                                        console.log(desc);
                                        const found = myFormTypes.find((x) => x.description == desc);
                                        if (!found) return;
                                        const formTypeId = found.id;
                                        console.log(formTypeId);
                                        if (desc == "2") {
                                          formikProps.setFieldValue("formType", formTypeId);
                                        }
                                        if (desc !== "2") {
                                          console.log(formTypeId);
                                          formikProps.setFieldValue("workflowId", "");
                                          formikProps.setFieldValue("formType", formTypeId);
                                        }
                                        formikProps.setFieldValue("formTypeText", desc ?? "");
                                      }}
                                    >
                                      <SelectTrigger id="formType" className="h-10 w-full" aria-invalid={Boolean(formikProps.errors.formType && formikProps.touched.formType)}>
                                        <SelectValue placeholder="Seçiniz" />
                                      </SelectTrigger>
                                      <SelectContent className="z-1200">
                                        {myFormTypes.map((type) => (
                                          <SelectItem key={String(type.id)} value={String(type.description ?? "")}>
                                            {type.description}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {formikProps.errors.formType && formikProps.touched.formType && (
                                      <p className="text-xs text-destructive" role="alert">
                                        {String(formikProps.errors.formType)}
                                      </p>
                                    )}
                                  </div>

                                  {formikProps.values.formType === 2 && (
                                    <div className="space-y-1.5">
                                      <Label className="text-muted-foreground">İş Akışı</Label>
                                      <Select
                                        value={(formikProps.values.workFlowName as string | undefined) || undefined}
                                        onValueChange={(wfName) => {
                                          const selectedWorkflow = myWorkFlowDefinations?.data?.find(
                                            (workflow: any) => workflow.workflowName === wfName,
                                          );

                                          console.log("Seçilen ID:", selectedWorkflow?.id);
                                          formikProps.setFieldValue("workflowId", selectedWorkflow?.id || null);
                                          formikProps.setFieldValue("workFlowName", wfName ?? "");
                                        }}
                                      >
                                        <SelectTrigger id="workflowId" className="h-10 w-full" aria-invalid={Boolean(formikProps.errors.workflowId && formikProps.touched.workflowId)}>
                                          <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent className="z-1200 max-h-[min(65vh,var(--radix-select-content-available-height))]">
                                          {(myWorkFlowDefinations?.data ?? []).map((workflow: any) => (
                                            <SelectItem key={String(workflow.id)} value={String(workflow.workflowName ?? "")}>
                                              {workflow.workflowName}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      {formikProps.errors.workflowId && formikProps.touched.workflowId && (
                                        <p className="text-xs text-destructive" role="alert">
                                          {String(formikProps.errors.workflowId)}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  <div className="space-y-1.5">
                                    <Label className="text-muted-foreground">Form Kategorisi</Label>
                                    <Select
                                      value={formikProps.values.formCategoryText || undefined}
                                      onValueChange={(desc) => {
                                        const found = myFormCategories.find((x) => x.description == desc);
                                        if (!found) return;
                                        const categoryId = found.id;
                                        console.log(categoryId);
                                        formikProps.setFieldValue("formCategory", categoryId);
                                        formikProps.setFieldValue("formCategoryText", desc ?? "");
                                      }}
                                    >
                                      <SelectTrigger id="formCategory" className="h-10 w-full" aria-invalid={Boolean(formikProps.errors.formCategory && formikProps.touched.formCategory)}>
                                        <SelectValue placeholder="Seçiniz" />
                                      </SelectTrigger>
                                      <SelectContent className="z-1200">
                                        {myFormCategories.map((category) => (
                                          <SelectItem key={String(category.id)} value={String(category.description ?? "")}>
                                            {category.description}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {formikProps.errors.formCategory && formikProps.touched.formCategory && (
                                      <p className="text-xs text-destructive" role="alert">
                                        {String(formikProps.errors.formCategory)}
                                      </p>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              <AccordionItem value="other" className="mt-2 rounded-lg border border-border/50 px-2">
                                <AccordionTrigger className="py-2 text-sm hover:no-underline">
                                  <span className="flex items-center gap-2">
                                    <SlidersHorizontal className="size-4 shrink-0 text-orange-400" aria-hidden />
                                    Diğer Ayarlar
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 px-2 pb-3 pt-2">
                                  <div className="space-y-1.5">
                                    <Label className="text-muted-foreground">Form Önceliği</Label>
                                    <Select
                                      value={formikProps.values.formPriortyText || undefined}
                                      onValueChange={(desc) => {
                                        const found = myFormPriorities.find((x) => x.description == desc);
                                        if (!found) return;
                                        const formPriorityId = found.id;
                                        console.log(formPriorityId);
                                        formikProps.setFieldValue("formPriority", formPriorityId);
                                        formikProps.setFieldValue("formPriortyText", desc ?? "");
                                      }}
                                    >
                                      <SelectTrigger id="formPriority" className="h-10 w-full">
                                        <SelectValue placeholder="Seçiniz" />
                                      </SelectTrigger>
                                      <SelectContent className="z-1200">
                                        {myFormPriorities.map((priorty) => (
                                          <SelectItem key={String(priorty.id)} value={String(priorty.description ?? "")}>
                                            {priorty.description}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <label className="flex cursor-pointer items-center gap-2.5 text-sm leading-none select-none peer-disabled:pointer-events-none peer-disabled:opacity-50">
                                    <Checkbox
                                      id="is-active-cb"
                                      checked={Boolean(formikProps.values.isActive)}
                                      onCheckedChange={(checked) =>
                                        formikProps.setFieldValue("isActive", checked === true ? 1 : 0)
                                      }
                                      aria-label="Aktif mi?"
                                    />
                                    <span>Aktif mi?</span>
                                  </label>

                                  <label className="flex cursor-pointer items-center gap-2.5 text-sm leading-none select-none peer-disabled:pointer-events-none peer-disabled:opacity-50">
                                    <Checkbox
                                      id="show-menu-cb"
                                      checked={Boolean(formikProps.values.showInMenu)}
                                      onCheckedChange={(checked) =>
                                        formikProps.setFieldValue("showInMenu", checked === true ? 1 : 0)
                                      }
                                      aria-label="Menüde gösterilsin mi?"
                                    />
                                    <span>Menüde Gösterilsin mi?</span>
                                  </label>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>

                            <Button
                              type="button"
                              variant="default"
                              className="mt-6 w-full bg-emerald-600 text-emerald-50 shadow-sm hover:bg-emerald-700 hover:shadow-md"
                              onClick={() => {
                                console.log("Kaydet butonuna tıklandı");
                                saveForm(formikProps.values);
                              }}
                            >
                              <Save className="size-4 shrink-0" aria-hidden />
                              Kaydet
                            </Button>
                          </form>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="2" className="focus:outline-none">
              <div className="flex max-h-[calc(100vh-12rem)] min-h-[calc(100vh-16rem)] flex-col overflow-hidden rounded-xl border border-border/60 bg-[#1e1e1e]">
                <div className="flex flex-wrap gap-2 border-b border-white/10 px-3 py-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0"
                    onClick={() => {
                      const fileName = `${formikProps.values.formName || "DefaultForm"}.js`;
                      const blob = new Blob([generateJavaScript(jsonSchema)], {
                        type: "text/javascript",
                      });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = fileName;
                      link.click();
                      window.URL.revokeObjectURL(url);
                    }}
                  >
                    <Code2 className="mr-2 size-4 shrink-0 opacity-80" aria-hidden />
                    JavaScript Kodunu Kaydet
                  </Button>
                  <Button
                    type="button"
                    className="shrink-0 gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => setShowPreviewModal(true)}
                  >
                    <Play className="size-4 shrink-0 opacity-90" aria-hidden />
                    Çalıştır
                  </Button>
                </div>
                <Editor
                  height="calc(100% - 52px)"
                  defaultLanguage="javascript"
                  value={jsEditorValue}
                  onChange={(val) => val && setJsEditorValue(val)}
                  theme="vs-dark"
                  options={{
                    readOnly: false,
                    minimap: { enabled: true },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    formatOnPaste: true,
                    formatOnType: true,
                    suggestOnTriggerCharacters: true,
                    fontFamily: "'Fira Code', monospace",
                    fontLigatures: true,
                    renderLineHighlight: "all",
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="3" className="focus:outline-none">
              <div className="flex min-h-[420px] flex-col rounded-xl border border-border/60 bg-card p-2">
                <div id="preview-container" className="min-h-[360px] w-full rounded-md bg-background p-2">
                  <div
                    id="form-error"
                    className="hidden text-sm text-red-600"
                    aria-live="polite"
                  ></div>
                  <Form
                    form={jsonSchema}
                    options={{ readOnly: false }}
                    onRender={() => {
                      const script = document.createElement("script");
                      script.id = "form-handler-script";
                      script.innerHTML = jsEditorValue;
                      document.body.appendChild(script);
                    }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="4" className="focus:outline-none">
              <div className="flex min-h-[calc(100vh-14rem)] flex-col overflow-hidden rounded-xl border border-border/60 bg-[#1e1e1e]">
                <div className="flex flex-wrap gap-2 border-b border-white/10 px-3 py-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0"
                    onClick={() => {
                      const fileName = `${formikProps.values.formName || "DefaultForm"}.json`;
                      const blob = new Blob([JSON.stringify(jsonSchema, null, 2)], {
                        type: "application/json",
                      });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = fileName;
                      link.click();
                      window.URL.revokeObjectURL(url);
                    }}
                  >
                    JSON Dosyasını Kaydet
                  </Button>
                </div>
                <Editor
                  height="calc(100vh - 15rem)"
                  defaultLanguage="json"
                  value={JSON.stringify(jsonSchema, null, 2)}
                  theme="vs-dark"
                  onChange={(val) => {
                    try {
                      if (val) {
                        const newSchema = JSON.parse(val);
                        setSchema(newSchema);
                        setJsonEditorValue(val);
                      }
                    } catch (error) {
                      console.error("JSON parse hatası:", error);
                    }
                  }}
                  options={{
                    readOnly: false,
                    minimap: { enabled: true },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    formatOnPaste: true,
                    formatOnType: true,
                    suggestOnTriggerCharacters: true,
                    fontFamily: "'Fira Code', monospace",
                    fontLigatures: true,
                    renderLineHighlight: "all",
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="flex max-h-[88vh] w-[92vw] max-w-6xl flex-col gap-4 sm:gap-6" showCloseButton>
            <DialogHeader>
              <DialogTitle>{`${formikProps.values.formName || "Form"} Önizleme`}</DialogTitle>
            </DialogHeader>
            <div className="min-h-[62vh] flex-1 overflow-auto rounded-lg border border-border/60 bg-card p-2">
              <Form
                form={jsonSchema}
                options={{ readOnly: false }}
                onRender={() => {
                  const script = document.createElement("script");
                  script.id = "form-handler-script";
                  script.innerHTML = jsEditorValue;
                  document.body.appendChild(script);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
};
export default ParamtetersDefination;
