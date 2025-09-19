import ModalDisplayValue from '@/components/modal/ModalDisplayValue';
import { DateTimePicker, Host, HStack } from '@expo/ui/swift-ui';
import React from 'react';

// ✅ 

type TTimeSelectorProps = {
    label: string;
    date: Date;
    showTime: boolean;
    minimumDate?: Date;
    onChange: (date: Date) => void;
};

const TimeSelector = ({
    label,
    date,
    showTime,
    minimumDate,
    onChange
}: TTimeSelectorProps) => (
    <ModalDisplayValue
        label={label}
        value={
            <Host matchContents>
                <HStack spacing={4}>
                    <DateTimePicker
                        onDateSelected={onChange}
                        displayedComponents={showTime ? 'dateAndTime' : 'date'}
                        initialDate={date.toISOString()}
                        variant='automatic'
                    />
                </HStack>
            </Host>
        }
    />
);

export default TimeSelector;