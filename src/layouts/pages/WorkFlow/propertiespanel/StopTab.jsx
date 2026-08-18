import React from "react";
import PropTypes from "prop-types";
import { Form, Field, Formik } from "formik";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";

const STOP_TYPES = [
  { name: "Süreci Bitir", code: "FINISH" },
  { name: "Yeniden Başlat", code: "RESTART" },
];

const getStopTypeCode = (stoptype) => {
  if (!stoptype) return "";
  if (typeof stoptype === "string") return stoptype;
  return stoptype.code ?? "";
};

export default function StopTab({ initialValues, node, onButtonClick }) {
  return (
    <div className="w-full">
      <Tabs defaultValue="genel" className="w-full">
        <TabsList className="w-full rounded-none border-b bg-transparent p-0 h-auto">
          <TabsTrigger
            value="genel"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Genel
          </TabsTrigger>
          <TabsTrigger
            value="aksiyon"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Aksiyon
          </TabsTrigger>
        </TabsList>

        {/* Tab: Genel */}
        <TabsContent value="genel" className="p-4">
          <Formik
            initialValues={initialValues}
            onSubmit={(values, { setSubmitting }) => {
              console.log(JSON.stringify(node));
              node.data = values;
              setSubmitting(false);
              onButtonClick(node);
            }}
          >
            {({ handleChange, values, setFieldValue }) => (
              <Form className="space-y-4">

                <div className="flex gap-3">
                  {/* Durma Tipi */}
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Label className="text-xs font-medium text-gray-600">Durma Tipi</Label>
                    <Select
                      value={getStopTypeCode(values.stoptype)}
                      onValueChange={(val) => {
                        const selected = STOP_TYPES.find((t) => t.code === val);
                        setFieldValue("stoptype", selected ?? { name: val, code: val });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Durma Tipi Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {STOP_TYPES.map((t) => (
                          <SelectItem key={t.code} value={t.code}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Akış Adı */}
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Label htmlFor="name" className="text-xs font-medium text-gray-600">
                      Akış Adı
                    </Label>
                    <Field
                      as={Input}
                      id="name"
                      name="name"
                      onChange={handleChange}
                      value={values.name}
                      placeholder="Akış adını giriniz"
                    />
                  </div>
                </div>

                {/* Method Adı */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="methodname" className="text-xs font-medium text-gray-600">
                    Method Adı
                  </Label>
                  <Field
                    as={Input}
                    id="methodname"
                    name="methodname"
                    onChange={handleChange}
                    value={values.methodname}
                    placeholder="Method adını giriniz"
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  className="bg-linear-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                >
                  Kaydet
                </Button>
              </Form>
            )}
          </Formik>
        </TabsContent>

        {/* Tab: Aksiyon */}
        <TabsContent value="aksiyon" className="p-4">
          <p className="text-sm text-muted-foreground">Aksiyon içeriği burada görünecek.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

StopTab.propTypes = {
  initialValues: PropTypes.object.isRequired,
  node: PropTypes.object.isRequired,
  onButtonClick: PropTypes.func.isRequired,
};
