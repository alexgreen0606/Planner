import { EFormFieldType } from "@/lib/enums/EFormFieldType";
import { TFormField, TFormFieldControl } from "@/lib/types/form/TFormField";
import { DateTime } from "luxon";
import CheckboxModalField, { TCheckboxModalFieldProps } from "./fields/CheckboxModalField";
import DateModalField, { TDateModalFieldProps } from "./fields/DateModalField";
import TextModalField, { TTextModalFieldProps } from "./fields/TextModalField";

// ✅ 

const TextField = (props: TTextModalFieldProps & TFormFieldControl<string>) => <TextModalField {...props} />;
const CheckboxField = (props: TCheckboxModalFieldProps & TFormFieldControl<boolean>) => <CheckboxModalField {...props} />;
const DateField = (props: TDateModalFieldProps & TFormFieldControl<DateTime>) => <DateModalField {...props} />;

const FormField = (field: TFormField & TFormFieldControl<any>) => {
    switch (field.type) {
        case EFormFieldType.TEXT: return <TextField {...field} />;
        case EFormFieldType.CHECKBOX: return <CheckboxField {...field} />;
        case EFormFieldType.DATE: return <DateField {...field} />;
    }
};

export default FormField;