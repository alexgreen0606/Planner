import DateRangeSelector from "./fields/DateRangeSelector";
import ModalCheckbox from "./fields/Checkbox";
import TimeRangeSelector from "./fields/TimeRangeSelector";
import ModalTextfield from "./fields/Textfield";
import { EFormFieldType } from "@/lib/enums/EFormFieldType";
import { IFormField } from "@/lib/types/form/IFormField";
import { getIsoRoundedDown5Minutes } from "@/utils/dateUtils";

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
                    onChange={(start, end) => {
                        onChange({
                            startTime: start,
                            endTime: end
                        });
                    }}
                    multiDay
                />
            );
        case EFormFieldType.TIME_RANGE:
            const nowIso = getIsoRoundedDown5Minutes();
            const currentValue = value || { startIso: nowIso, endIso: nowIso };
            const { startIso = nowIso, endIso = nowIso } = currentValue;

            return (
                <TimeRangeSelector
                    startIso={startIso}
                    endIso={endIso}
                    onChange={(start, end) => {
                        onChange({
                            startIso: start,
                            endIso: end
                        });
                    }}
                    allDay={allDay}
                    multiDay={multiDay}
                    triggerOpenStartTimeSelector={trigger}
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