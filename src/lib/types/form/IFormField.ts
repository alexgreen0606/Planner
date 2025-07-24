import { EFormFieldType } from "@/lib/enums/EFormFieldType";
import { RegisterOptions } from "react-hook-form";

// ✅ 

// todo: delete once form fields updated

export interface IFormField {
    type: EFormFieldType;
    name: string;
    rules?: RegisterOptions;
    defaultValue?: any;
    label?: string;
    disabled?: boolean;
    hide?: boolean;
    multiDay?: boolean;
    allDay?: boolean;
    trigger?: any;
    autoCapitalizeWords?: boolean;
    setTrigger?: React.Dispatch<boolean>
}