import { useFormikContext } from "formik";
import { Card, CardContent } from "components/ui/card";
import { Button } from "components/ui/button";
import { Save } from "lucide-react";

function DeleteAccount(): JSX.Element {
  const { submitForm } = useFormikContext();

  return (
    <Card id="delete-account" className="overflow-hidden rounded-2xl border border-border/50 shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <h3 className="text-base font-semibold text-foreground">Kayıt İşlemleri</h3>
          <p className="text-sm text-muted-foreground">
            Değişiklikleri kaydetmek için "Kaydet" butonuna tıklayın.
          </p>
        </div>
        <Button
          type="button"
          id="btn-save-user"
          className="h-10 gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:from-emerald-600 hover:to-teal-700 sm:shrink-0"
          onClick={submitForm}
        >
          <Save className="size-4 shrink-0" />
          Kaydet
        </Button>
      </CardContent>
    </Card>
  );
}

export default DeleteAccount;
