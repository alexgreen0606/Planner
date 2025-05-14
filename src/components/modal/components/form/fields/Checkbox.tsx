import React from 'react';
import ModalDisplayValue from '../../ModalDisplayValue';
import { PlatformColor, Switch } from 'react-native';

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
            <Switch
                value={value}
                disabled={disabled}
                onValueChange={onChange}
                ios_backgroundColor={PlatformColor('secondaryLabel')}
                trackColor={{ true: PlatformColor('systemBlue') }}
            />
        }
    />

export default ModalCheckbox;
