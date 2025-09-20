import { TFormFieldControl } from "@/lib/types/form/TFormField";
import { Host, Switch } from "@expo/ui/swift-ui";
import React from 'react';
import { PlatformColor } from 'react-native';
import ModalDisplayValue from '../../modal/ModalDisplayValue';

// ✅ 

export type TCheckboxModalFieldProps = {
    label: string;
};

const CheckboxModalField = ({
    label = '',
    value,
    onChange
}: TCheckboxModalFieldProps & TFormFieldControl<boolean>) =>
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


export default CheckboxModalField;
