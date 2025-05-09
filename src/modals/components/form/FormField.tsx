import DateRangeSelector from "./fields/DateRangeSelector";
import ModalCheckbox from "./fields/Checkbox";
import TimeRangeSelector from "./fields/TimeRangeSelector";
import ModalTextfield from "./fields/Textfield";
import { EFieldType, IFormField } from "./types";
import { DateTime } from 'luxon';

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
    if (hide) return null;
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
        case EFieldType.DATE_RANGE:
            const dates = Array.isArray(value) ? value : [];
            return (
                <DateRangeSelector
                    dates={dates}
                    onChange={onChange}
                />
            );
        case EFieldType.TIME_RANGE:
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