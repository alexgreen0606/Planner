import { EFormFieldType } from "@/enums/EFormFieldType";
import { RegisterOptions } from "react-hook-form";

export interface IFormField {
    type: EFormFieldType;
    name: string;
    rules?: RegisterOptions;
    defaultValue?: any;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    focusTrigger?: boolean;
    hide?: boolean;
}