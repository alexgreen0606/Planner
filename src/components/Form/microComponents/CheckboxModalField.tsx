import { Host, Switch } from '@expo/ui/swift-ui';
import { SFSymbol } from 'expo-symbols';
import React from 'react';

import { TFormFieldControl } from '@/lib/types/form/TFormFieldControl';
import { getValidCssColor } from '@/utils/colorUtils';

import ModalDisplayValue from '../../modals/ModalDisplayValue';

export interface ICheckboxModalFieldProps {
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
}: ICheckboxModalFieldProps & TFormFieldControl<boolean>) => (
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
