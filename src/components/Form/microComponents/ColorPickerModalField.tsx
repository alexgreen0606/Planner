import React from 'react';
import { View } from 'react-native';

import IconButton from '@/components/icons/IconButton';
import { selectableColors } from '@/lib/constants/colors';
import { TFormFieldControl } from '@/lib/types/form/TFormField';

// ✅

export type TColorPickerModalFieldProps = {
  label: string;
};

const ColorPickerModalField = ({
  value,
  onChange
}: TColorPickerModalFieldProps & TFormFieldControl<string>) => {
  return (
    <View className="flex-row w-full justify-between items-center px-2 py-3">
      {Object.values(selectableColors).map((color) => (
        <IconButton
          key={color}
          size={30}
          name={value === color ? 'circle.inset.filled' : 'circle'}
          color={color}
          onClick={() => onChange(color)}
        />
      ))}
    </View>
  );
};

export default ColorPickerModalField;
