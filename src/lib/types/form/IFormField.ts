import { EFormFieldType } from "@/lib/enums/EFormFieldType";
import { RegisterOptions } from "react-hook-form";

export interface IFormField {
    type: EFormFieldType;
    name: string;
    rules?: RegisterOptions;
    defaultValue?: any;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    hide?: boolean;
    multiDay?: boolean;
    allDay?: boolean;
    trigger?: boolean;
    setTrigger?: React.Dispatch<boolean>
}