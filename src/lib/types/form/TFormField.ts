import { TCheckboxModalFieldProps } from "@/components/form/fields/CheckboxModalField";
import { TDateModalFieldProps } from "@/components/form/fields/DateModalField";
import { TTextModalFieldProps } from "@/components/form/fields/TextModalField";
import { EFormFieldType } from "@/lib/enums/EFormFieldType";
import { RegisterOptions } from "react-hook-form";

// ✅ 

export type TFormFieldConfig = {
    name: string;
    rules?: RegisterOptions;
    invisible?: boolean;

    // Handles any side effects caused by setting the field with a new value.
    onHandleSideEffects?: (val: any) => void;
};

export type TFormFieldControl<T> = {
    value: T;
    onChange: (val: T) => void;
};

export type TFormField =
    | (TFormFieldConfig & TTextModalFieldProps & { type: EFormFieldType.TEXT })
    | (TFormFieldConfig & TCheckboxModalFieldProps & { type: EFormFieldType.CHECKBOX })
    | (TFormFieldConfig & TDateModalFieldProps & { type: EFormFieldType.DATE });
