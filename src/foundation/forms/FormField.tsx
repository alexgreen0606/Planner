import CalendarSelect from "../calendarEvents/components/CalendarSelect";
import ModalCheckbox from "../components/modal/ModalCheckbox";
import ModalDisplayValue from "../components/modal/ModalDisplayValue";
import ModalTextfield from "../components/modal/ModalTextfield";
import { EFieldType, IFormField } from "./types";

interface FormFieldProps extends Omit<IFormField, 'name'> {
    type: EFieldType;
    value: any;
    onChange: (value: any) => void;
}

const FormField = ({
    type,
    value,
    onChange,
    label,
    hide,
    placeholder,
    disabled,
    focusTrigger = false,
}: FormFieldProps) => {
    switch (type) {
        case EFieldType.TEXT:
            return (
                <ModalTextfield
                    label={label || placeholder || ''}
                    value={value || ''}
                    onChange={onChange}
                    focusTrigger={focusTrigger}
                />
            );
        case EFieldType.DATE:
            const dates = Array.isArray(value) ? value : [];
            return (
                <CalendarSelect
                    dates={dates}
                    onChange={onChange}
                />
            );
        case EFieldType.CHECKBOX:
            return (
                <ModalCheckbox
                    label={label ?? ''}
                    hide={Boolean(hide)}
                    value={Boolean(value)}
                    onChange={onChange}
                    disabled={disabled}
                />
            );
        default:
            return null;
    }
}

export default FormField;