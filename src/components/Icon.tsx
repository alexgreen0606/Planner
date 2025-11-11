import { SymbolView, SymbolViewProps } from 'expo-symbols';
import React from 'react';

import { getValidCssColor } from '@/utils/colorUtils';

export interface IIconProps extends SymbolViewProps {
  color?: string;
  disabled?: boolean;
};

const Icon = ({ color, disabled, ...symbolViewProps }: IIconProps) => {
  const colorToUse = disabled ? 'tertiaryLabel' : color || 'label';
  return (
    <SymbolView
      tintColor={symbolViewProps.type === 'multicolor' ? undefined : getValidCssColor(colorToUse)}
      {...symbolViewProps}
    />
  );
};

export default Icon;
