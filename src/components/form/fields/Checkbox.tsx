import React from 'react';
import ModalDisplayValue from '../../modal/ModalDisplayValue';
import { PlatformColor, Switch } from 'react-native';

// ✅ 

type ModalCheckboxProps = {
    label: string;
    value: boolean;
    disabled?: boolean;
    onChange: (newVal: boolean) => void;
};

const ModalCheckbox = ({
    label,
    value,
    disabled,
    onChange
}: ModalCheckboxProps) =>
    <ModalDisplayValue
        label={label}
        value={
            <Switch
                value={value}
                disabled={disabled}
                onValueChange={onChange}
                trackColor={{ true: PlatformColor('systemBlue') }}
                ios_backgroundColor={PlatformColor('secondaryLabel')}
            />
        }
    />;

export default ModalCheckbox;
