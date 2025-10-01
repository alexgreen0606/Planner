import { TFormFieldControl } from '@/lib/types/form/TFormField';
import { Host, Picker } from '@expo/ui/swift-ui';
import { frame } from '@expo/ui/swift-ui/modifiers';
import React from 'react';

// ✅ 

export type TPickerModalFieldProps = {
    options: string[];
    width?: number;
};

const PickerModalField = ({
    value,
    options,
    width,
    onChange
}: TPickerModalFieldProps & TFormFieldControl<string>) => (
    <Host matchContents>
        <Picker
            options={options}
            selectedIndex={options.indexOf(value) ?? null}
            onOptionSelected={({ nativeEvent: { label } }) => {
                onChange(label);
            }}
            variant='segmented'
            modifiers={width ? [frame({ width })] : undefined}
        />
    </Host>
);

export default PickerModalField;