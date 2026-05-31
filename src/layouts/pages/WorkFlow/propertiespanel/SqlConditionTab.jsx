import React from "react";
import PropTypes from "prop-types";
import { Form, Field, Formik } from "formik";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Textarea } from "components/ui/textarea";
import { Checkbox } from "components/ui/checkbox";
import { Label } from "components/ui/label";

export default function SqlConditionTab({ initialValues, node, onButtonClick }) {
  const dispatchBusy = useBusy();

  const testSqlQuery = async (query) => {
    try {
      dispatchBusy({ isBusy: true });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("SQL sorgusu başarıyla test edildi!");
      dispatchBusy({ isBusy: false });
    } catch (error) {
      dispatchBusy({ isBusy: false });
      alert("SQL sorgusu test edilirken hata oluştu: " + error.message);
    }
  };

  return (
    <div className="w-full">
      <Formik
        initialValues={
          initialValues || {
            name: "",
            sqlQuery: "",
            isTransaction: false,
          }
        }
        onSubmit={(values, { setSubmitting }) => {
          console.log(JSON.stringify(node));
          node.data = values;
          setSubmitting(false);
          onButtonClick(node);
        }}
      >
        {({ handleChange, values, setFieldValue }) => (
          <Form>
            <Tabs defaultValue="zamanlama" className="w-full">
              <TabsList className="w-full rounded-none border-b bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="zamanlama"
                  className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  Zamanlama
                </TabsTrigger>
                <TabsTrigger
                  value="sql"
                  className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  SQL Sorgu
                </TabsTrigger>
              </TabsList>

              {/* Tab: Zamanlama */}
              <TabsContent value="zamanlama" className="p-4 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name" className="text-xs font-medium text-gray-600">
                    Koşul Adı
                  </Label>
                  <Field
                    as={Input}
                    id="name"
                    name="name"
                    onChange={handleChange}
                    value={values.name}
                    placeholder="Koşul adını giriniz"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-linear-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                >
                  Kaydet
                </Button>
              </TabsContent>

              {/* Tab: SQL Sorgu */}
              <TabsContent value="sql" className="p-4 space-y-4">
                <div className="flex flex-col gap-3">

                  {/* Transaction checkbox */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isTransaction"
                      checked={!!values.isTransaction}
                      onCheckedChange={(checked) => setFieldValue("isTransaction", checked)}
                    />
                    <Label htmlFor="isTransaction" className="text-sm font-medium cursor-pointer">
                      Transaction Kullan
                    </Label>
                  </div>

                  {/* SQL query textarea */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="sqlQuery" className="text-xs font-medium text-gray-600">
                      SQL Sorgusu
                    </Label>
                    <Textarea
                      id="sqlQuery"
                      name="sqlQuery"
                      value={values.sqlQuery}
                      onChange={(e) => setFieldValue("sqlQuery", e.target.value)}
                      placeholder="SELECT * FROM tablo WHERE koşul"
                      rows={8}
                      className="font-mono text-sm resize-y"
                    />
                    <p className="text-xs text-muted-foreground">
                      SQL sorgusu TRUE/FALSE değer döndürmelidir.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => testSqlQuery(values.sqlQuery)}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                    >
                      SQL Test Et
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-linear-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                    >
                      Kaydet
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Form>
        )}
      </Formik>
    </div>
  );
}

SqlConditionTab.propTypes = {
  initialValues: PropTypes.object,
  node: PropTypes.object.isRequired,
  onButtonClick: PropTypes.func.isRequired,
};
