import React from "react";
import PropTypes from "prop-types";
import { Form, Field, Formik } from "formik";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";

export default function StartTab({ initialValues, node, onButtonClick }) {
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
            value="zamanlama"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Zamanlama
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
            {({ handleChange, values }) => (
              <Form className="space-y-4">
                <div className="flex flex-col gap-1.5">
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

        {/* Tab: Zamanlama */}
        <TabsContent value="zamanlama" className="p-4">
          <p className="text-sm text-muted-foreground">Item Two</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

StartTab.propTypes = {
  initialValues: PropTypes.object.isRequired,
  node: PropTypes.object.isRequired,
  onButtonClick: PropTypes.func.isRequired,
};
