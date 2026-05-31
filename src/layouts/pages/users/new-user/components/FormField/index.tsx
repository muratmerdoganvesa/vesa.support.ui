import { ErrorMessage, Field } from "formik";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";

interface Props {
  label: string;
  name: string;
  [key: string]: any;
}

function FormField({ label, name, ...rest }: Props): JSX.Element {
  return (
    <div className="mb-3 flex flex-col gap-1">
      <Label htmlFor={name} className="text-xs font-medium text-gray-600">
        {label}
      </Label>
      <Field {...rest} id={name} name={name} as={Input} />
      <div className="min-h-[16px]">
        <ErrorMessage name={name}>
          {(msg) => <span className="text-xs text-red-500">{msg}</span>}
        </ErrorMessage>
      </div>
    </div>
  );
}

export default FormField;
