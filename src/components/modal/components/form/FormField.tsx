import DateRangeSelector from "./fields/DateRangeSelector";
import ModalCheckbox from "./fields/Checkbox";
import TimeRangeSelector from "./fields/TimeRangeSelector";
import ModalTextfield from "./fields/Textfield";
import { DateTime } from 'luxon';
import { IFormField } from "@/types/form/IFormField";
import { EFormFieldType } from "@/enums/EFormFieldType";

interface FormFieldProps extends Omit<IFormField, 'name'> {
    type: EFormFieldType;
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
    if (hide) return null;
    switch (type) {
        case EFormFieldType.TEXT:
            return (
                <ModalTextfield
                    label={label || placeholder || ''}
                    value={value || ''}
                    onChange={onChange}
                    focusTrigger={focusTrigger}
                />
            );
        case EFormFieldType.DATE_RANGE:
            const { startTime: start, endTime: end } = value || {};

            return (
                <DateRangeSelector
                    startDate={start}
                    endDate={end}
                    onChange={onChange}
                />
            );
        case EFormFieldType.TIME_RANGE:
            const now = DateTime.now().toISO();
            const currentValue = value || { startTime: now, endTime: now };

            const { startTime = now, endTime = now } = currentValue;

            return (
                <TimeRangeSelector
                    startTimestamp={startTime}
                    endTimestamp={endTime}
                    setStartTimestamp={(newStartTime) => {
                        onChange({
                            ...value,
                            startTime: newStartTime
                        });
                    }}
                    setEndTimestamp={(newEndTime) => {
                        onChange({
                            ...value,
                            endTime: newEndTime
                        });
                    }}
                />
            );
        case EFormFieldType.CHECKBOX:
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