import ModalDisplayValue from '@/components/modal/ModalDisplayValue';
import { TFormFieldControl } from '@/lib/types/form/TFormField';
import { DateTimePicker, Host } from '@expo/ui/swift-ui';
import { DateTime } from 'luxon';
import React from 'react';

// ✅ 

export type TDateModalFieldProps = {
    label: string;
    showTime?: boolean;
    minimumDate?: Date;
};

// TODO: need to handle change of date (affects initialDate)
const DateModalField = ({
    label = '',
    value,
    showTime,
    minimumDate,
    onChange
}: TDateModalFieldProps & TFormFieldControl<DateTime>) => (
    <ModalDisplayValue
        label={label}
        value={
            <Host matchContents>
                <DateTimePicker
                    onDateSelected={(newDate) => onChange(DateTime.fromJSDate(newDate))}
                    displayedComponents={showTime ? 'dateAndTime' : 'date'}
                    initialDate={value.toISO()}
                    variant='automatic'
                />
            </Host>
        }
    />
);

export default DateModalField;