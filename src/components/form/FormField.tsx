import { EFormFieldType } from "@/lib/enums/EFormFieldType";
import { IFormField } from "@/lib/types/form/IFormField";
import { isoToDatestamp } from "@/utils/dateUtils";
import ModalCheckbox from "./fields/Checkbox";
import ModalTextfield from "./fields/Textfield";
import TimeRangeSelector from "./fields/TimeRangeSelector";

// ✅ 

// TODO: make the form fields map the field type to its props

interface FormFieldProps extends Omit<IFormField, 'name'> {
    type: EFormFieldType;
    value: any;
    onChange: (value: any) => void;
}

const FormField = ({
    type,
    value,
    label,
    hide,
    disabled,
    autoCapitalizeWords,
    allDay,
    multiDay,
    trigger = false,
    onChange,
}: FormFieldProps) => {
    if (hide) return null;

    switch (type) {
        case EFormFieldType.TEXT:
            return (
                <ModalTextfield
                    value={value ?? ''}
                    onChange={onChange}
                    focusTrigger={trigger}
                    autoCapitalizeWords={Boolean(autoCapitalizeWords)}
                />
            );
        case EFormFieldType.DATE_RANGE:
            const { startDatestamp, endDatestamp } = value;
            if (!startDatestamp || !endDatestamp) return null;

            return (
                <TimeRangeSelector
                    startIso={startDatestamp}
                    endIso={endDatestamp}
                    onChange={(startIso, endIso) => {
                        onChange({
                            startDatestamp: isoToDatestamp(startIso),
                            endDatestamp: isoToDatestamp(endIso)
                        });
                    }}
                    allDay={true}
                    multiDay={true}
                    triggerOpenField={trigger}
                />
            );
        case EFormFieldType.TIME_RANGE:
            const { startIso, endIso } = value;
            if (!startIso || !endIso) return null;

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
                    triggerOpenField={trigger}
                />
            );
        case EFormFieldType.CHECKBOX:
            return (
                <ModalCheckbox
                    label={label ?? ''}
                    value={Boolean(value)}
                    onChange={onChange}
                />
            );
        default:
            return null;
    }
}

export default FormField;