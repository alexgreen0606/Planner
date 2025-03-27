import React from 'react';
import { PlatformColor, Switch } from 'react-native';

export interface ToggleProps {
    onValueChange: () => void;
    value: boolean;
}

const Toggle = ({
    onValueChange,
    value,
}: ToggleProps) => {

    return (
        <Switch
            value={value}
            onValueChange={onValueChange}
            ios_backgroundColor={PlatformColor('secondaryLabel')}
        />
    );
};

export default Toggle;