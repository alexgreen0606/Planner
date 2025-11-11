import React from 'react';
import { View } from 'react-native';

import IconButton from '@/components/buttons/IconButton';
import { selectableColors } from '@/lib/constants/selectableColors';
import { TFormFieldControl } from '@/lib/types/form/TFormFieldControl';

export interface IColorPickerModalFieldProps {
  label: string;
};

const ColorPickerModalField = ({
  value,
  onChange
}: IColorPickerModalFieldProps & TFormFieldControl<string>) => {
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
