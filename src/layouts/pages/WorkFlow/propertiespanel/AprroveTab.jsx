import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import { Form, Field, Formik } from "formik";
import { UserApi } from "api/generated";
import { useBusy } from "layouts/pages/hooks/useBusy";
import getConfiguration from "confiuration";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Checkbox } from "components/ui/checkbox";
import { Label } from "components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { ChevronsUpDown } from "lucide-react";

export default function AprroveTab({ initialValues, node, onButtonClick }) {
  const [searchByName, setSearchByName] = useState([]);
  const [selectedKullanici, setSelectedKullanici] = useState(null);
  const [UserDialogVisible, setUserDialogVisible] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const dispatchBusy = useBusy();

  const handleCheckBox = (checked) => {
    alert(checked);
    setInputDisabled(checked);
  };

  const handleSearchByName = async (value) => {
    if (value === "") {
      setSearchByName([]);
      return;
    }

    dispatchBusy({ isBusy: true });
    const conf = getConfiguration();
    const api = new UserApi(conf);
    const data = await api.apiUserGetAllUsersAsyncWitNameGet(value);
    setSearchByName(data.data);
    dispatchBusy({ isBusy: false });
  };

  const getUserLabel = (option) => {
    if (!option) return "";
    if (option.firstName && option.lastName) return `${option.firstName} ${option.lastName}`;
    return option.userAppName || "";
  };

  return (
    <div className="w-full">
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
                  value="action"
                  className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  Action
                </TabsTrigger>
              </TabsList>

              {/* Tab: Zamanlama */}
              <TabsContent value="zamanlama" className="p-4 space-y-4">
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
                <Button type="submit" size="sm" className="bg-linear-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700">
                  Kaydet
                </Button>
              </TabsContent>

              {/* Tab: Action */}
              <TabsContent value="action" className="p-4 space-y-4">
                <div className="flex flex-col gap-3">

                  {/* Üst Yönetici checkbox */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isManager"
                      checked={!!values.isManager}
                      onCheckedChange={(checked) => setFieldValue("isManager", checked)}
                    />
                    <Label htmlFor="isManager" className="text-sm font-medium cursor-pointer">
                      Üst Yönetici
                    </Label>
                  </div>

                  {/* User search combobox */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium text-gray-600">Kullanıcı</Label>
                    <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          role="combobox"
                          aria-expanded={userPopoverOpen}
                          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className={selectedKullanici ? "text-foreground" : "text-muted-foreground"}>
                            {selectedKullanici ? getUserLabel(selectedKullanici) : "Kullanıcı seçiniz..."}
                          </span>
                          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="İsme göre ara..."
                            onValueChange={(val) => handleSearchByName(val)}
                          />
                          <CommandList>
                            <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">
                              Kullanıcı bulunamadı.
                            </CommandEmpty>
                            <CommandGroup>
                              {searchByName.map((option) => (
                                <CommandItem
                                  key={option.id}
                                  value={option.id}
                                  onSelect={() => {
                                    setSelectedKullanici(option);
                                    setFieldValue("code", option.userName);
                                    setFieldValue(
                                      "approvername",
                                      `${option.firstName} ${option.lastName}`
                                    );
                                    setUserPopoverOpen(false);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-3 py-1">
                                    <Avatar className="size-8 shrink-0">
                                      <AvatarImage
                                        src={`data:image/png;base64,${option.photo}`}
                                        alt={option.firstName}
                                      />
                                      <AvatarFallback className="text-xs bg-muted">
                                        {option.firstName?.[0]}{option.lastName?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-sm font-medium truncate">
                                        {option.firstName} {option.lastName}
                                      </span>
                                      <span className="text-xs text-muted-foreground truncate">
                                        {option.email}
                                      </span>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Selected approver badge */}
                  {values.approvername && (
                    <p className="text-sm font-medium text-gray-700 px-1">
                      {values.approvername}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="sm"
                    className="w-[100px] bg-linear-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                  >
                    Kaydet
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </Form>
        )}
      </Formik>
    </div>
  );
}

AprroveTab.propTypes = {
  initialValues: PropTypes.object.isRequired,
  node: PropTypes.object.isRequired,
  onButtonClick: PropTypes.func.isRequired,
};
