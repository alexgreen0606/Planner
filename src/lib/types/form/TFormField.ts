import { TCheckboxModalFieldProps } from "@/components/form/fields/CheckboxModalField";
import { TColorPickerModalFieldProps } from "@/components/form/fields/ColorPickerModalField";
import { TDateModalFieldProps } from "@/components/form/fields/DateModalField";
import { TPickerModalFieldProps } from "@/components/form/fields/PickerModalField";
import { TTextModalFieldProps } from "@/components/form/fields/TextModalField";
import { EFormFieldType } from "@/lib/enums/EFormFieldType";
import { SFSymbol } from "expo-symbols";
import { RegisterOptions } from "react-hook-form";

// ✅ 

export type TFormFieldConfig = {
    name: string;
    rules?: RegisterOptions;
    invisible?: boolean;
    floating?: boolean;

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
    | (TFormFieldConfig & TDateModalFieldProps & { type: EFormFieldType.DATE })
    | (TFormFieldConfig & TPickerModalFieldProps & { type: EFormFieldType.PICKER })
    | (TFormFieldConfig & TColorPickerModalFieldProps & { type: EFormFieldType.COLOR_PICKER });

