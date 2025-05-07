import React from 'react';
import ModalDisplayValue from './ModalDisplayValue';
import Toggle from '../../calendarEvents/components/timeModal/Toggle';

export interface ModalCheckboxProps {
    label: string;
    value: boolean;
    hide: boolean;
    onChange: (newVal: boolean) => void;
    disabled?: boolean;
};

const ModalCheckbox = ({
    label,
    value,
    hide = false,
    onChange,
    disabled
}: ModalCheckboxProps) =>
    <ModalDisplayValue
        label={label}
        hide={hide}
        value={
            <Toggle value={value} onValueChange={onChange} disabled={disabled} />
        }
    />

export default ModalCheckbox;
