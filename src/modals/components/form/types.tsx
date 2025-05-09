import { RegisterOptions } from "react-hook-form";

export enum EFieldType {
    TEXT = 'text',
    DATE_RANGE = 'date_range',
    TIME_RANGE = 'time_range',
    SELECT = 'select',
    CHECKBOX = 'checkbox'
}

export interface IFormField {
    type: EFieldType;
    name: string;
    rules?: Omit<RegisterOptions, "disabled" | "valueAsNumber" | "valueAsDate" | "setValueAs">;
    defaultValue?: any;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    focusTrigger?: boolean;
    hide?: boolean;
}