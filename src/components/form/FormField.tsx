import DateRangeSelector from "./fields/DateRangeSelector";
import ModalCheckbox from "./fields/Checkbox";
import TimeRangeSelector from "./fields/TimeRangeSelector";
import ModalTextfield from "./fields/Textfield";
import { DateTime } from 'luxon';
import { IFormField } from "@/types/form/IFormField";
import { EFormFieldType } from "@/enums/EFormFieldType";
import { getNowISORoundDown5Minutes } from "@/utils/dateUtils";

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
    allDay,
    multiDay,
    trigger = false,
}: FormFieldProps) => {
    if (hide) return null;
    switch (type) {
        case EFormFieldType.TEXT:
            return (
                <ModalTextfield
                    placeholder={placeholder ?? ''}
                    value={value ?? ''}
                    onChange={onChange}
                    focusTrigger={trigger}
                />
            );
        case EFormFieldType.DATE_RANGE:
            const { startTime: start, endTime: end } = value || {};

            return (
                <DateRangeSelector
                    startDatestamp={start}
                    endDatestamp={end}
                    onChange={onChange}
                />
            );
        case EFormFieldType.TIME_RANGE:
            const nowIso = getNowISORoundDown5Minutes();
            const currentValue = value || { startTime: nowIso, endTime: nowIso };
            const { startTime = nowIso, endTime = nowIso } = currentValue;

            return (
                <TimeRangeSelector
                    startIso={startTime}
                    endIso={endTime}
                    onChange={(start, end) => {
                        onChange({
                            startTime: start,
                            endTime: end
                        });
                    }}
                    allDay={allDay}
                    multiDay={multiDay}
                    openInputTrigger={trigger}
                />
            );
        case EFormFieldType.CHECKBOX:
            return (
                <ModalCheckbox
                    label={label ?? ''}
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