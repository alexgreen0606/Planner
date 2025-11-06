import { Host, Switch } from '@expo/ui/swift-ui';
import { SFSymbol } from 'expo-symbols';
import React from 'react';

import { TFormFieldControl } from '@/lib/types/form/TFormField';
import { getValidCssColor } from '@/utils/colorUtils';

import ModalDisplayValue from '../../Modal/ModalDisplayValue';

// ✅

export type TCheckboxModalFieldProps = {
  label: string;
  iconName?: SFSymbol;
  color?: string;
};

const CheckboxModalField = ({
  label = '',
  value,
  iconName,
  color = 'label',
  onChange
}: TCheckboxModalFieldProps & TFormFieldControl<boolean>) => (
  <ModalDisplayValue
    label={label}
    value={
      <Host matchContents>
        <Switch value={value} onValueChange={onChange} color={getValidCssColor(color)} />
      </Host>
    }
    iconName={iconName}
  />
);

export default CheckboxModalField;
