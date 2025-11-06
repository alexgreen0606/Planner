import { Host, Picker } from '@expo/ui/swift-ui';
import { frame } from '@expo/ui/swift-ui/modifiers';
import React from 'react';
import { View } from 'react-native';

import ModalDisplayValue from '@/components/Modal/ModalDisplayValue';
import { TFormFieldControl } from '@/lib/types/form/TFormField';
import { getValidCssColor } from '@/utils/colorUtils';

// ✅

export type TPickerOption = {
  label: string;
  value: string;
};

export type TPickerModalFieldProps = {
  options: TPickerOption[];
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
}: TPickerModalFieldProps & TFormFieldControl<string | undefined>) =>
  options.length > 3 ? (
    <ModalDisplayValue
      label={label ?? ''}
      value={
        <View className="flex-row flex-1 justify-end">
          <Host matchContents>
            <Picker
              options={options.map(({ label }) => label)}
              selectedIndex={options.findIndex((o) => o.value === value) ?? null}
              onOptionSelected={({ nativeEvent: { label } }) => {
                const newValue = options.find((o) => o.label === label)?.value;
                onChange(newValue);
              }}
              variant="menu"
              color={getValidCssColor(color)}
              modifiers={[
                frame({
                  width: 300,
                  alignment: 'trailing'
                })
              ]}
            />
          </Host>
        </View>
      }
    />
  ) : (
    <Host matchContents>
      <Picker
        options={options.map(({ label }) => label)}
        selectedIndex={options.findIndex((o) => o.value === value) ?? null}
        onOptionSelected={({ nativeEvent: { label } }) => {
          const newValue = options.find((o) => o.label === label)?.value;
          onChange(newValue);
        }}
        variant="segmented"
        modifiers={width ? [frame({ width })] : undefined}
      />
    </Host>
  );

export default PickerModalField;
