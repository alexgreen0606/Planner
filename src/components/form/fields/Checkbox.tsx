import { Host, Switch } from "@expo/ui/swift-ui";
import React from 'react';
import { PlatformColor } from 'react-native';
import ModalDisplayValue from '../../modal/ModalDisplayValue';

// ✅ 

type TModalCheckboxProps = {
    label: string;
    value: boolean;
    onChange: (newVal: boolean) => void;
};

const ModalCheckbox = ({
    label,
    value,
    onChange
}: TModalCheckboxProps) =>
    <ModalDisplayValue
        label={label}
        value={
            <Host matchContents>
                <Switch
                    value={value}
                    onValueChange={onChange}
                    color={PlatformColor('systemBlue') as unknown as string}
                />
            </Host>
        }
    />;


export default ModalCheckbox;
