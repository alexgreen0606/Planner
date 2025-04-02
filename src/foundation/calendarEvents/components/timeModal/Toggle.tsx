import React from 'react';
import { PlatformColor, Switch } from 'react-native';

export interface ToggleProps {
    onValueChange: (newVal: boolean) => void;
    value: boolean;
    disabled?: boolean;
}

const Toggle = ({
    onValueChange,
    value,
    disabled
}: ToggleProps) => {

    return (
        <Switch
            value={value}
            disabled={disabled}
            onValueChange={onValueChange}
            ios_backgroundColor={PlatformColor('secondaryLabel')}
            trackColor={{ true: PlatformColor('systemBlue') }}
        />
    );
};

export default Toggle;