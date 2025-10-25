import ModalDisplayValue from '@/components/Modal/ModalDisplayValue';
import { TFormFieldControl } from '@/lib/types/form/TFormField';
import { getValidCssColor } from '@/utils/colorUtils';
import { Host, Picker } from '@expo/ui/swift-ui';
import { frame } from '@expo/ui/swift-ui/modifiers';
import React from 'react';
import { View } from 'react-native';

// ✅ 

export type TPickerModalFieldProps = {
    options: string[];
    width?: number;
    label?: string;
    color?: string;
};

const PickerModalField = ({
    value,
    options,
    width,
    label,
    color,
    onChange
}: TPickerModalFieldProps & TFormFieldControl<string>) => options.length > 3 ? (
    <ModalDisplayValue
        label={label ?? ''}
        value={
            <View className='flex-row flex-1 justify-end'>
                <Host matchContents>
                    <Picker
                        options={options}
                        selectedIndex={options.indexOf(value) ?? null}
                        onOptionSelected={({ nativeEvent: { label } }) => {
                            onChange(label);
                        }}
                        variant='menu'
                        color={getValidCssColor(color)}
                        modifiers={[frame({ width: 300, alignment: 'trailing' })]}
                    />
                </Host>
            </View>
        }
    />
) : (
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