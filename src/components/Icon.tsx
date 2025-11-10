import { SymbolView, SymbolViewProps } from 'expo-symbols';
import React from 'react';
import { PlatformColor } from 'react-native';

import { isValidPlatformColor } from '@/utils/colorUtils';

export interface IIconProps extends SymbolViewProps {
  color?: string;
  disabled?: boolean;
};

const Icon = ({ color, disabled, ...symbolViewProps }: IIconProps) => {
  const colorToUse = disabled ? 'tertiaryLabel' : color || 'label';
  const iconColor = isValidPlatformColor(colorToUse) ? PlatformColor(colorToUse) : colorToUse;
  return (
    <SymbolView
      tintColor={symbolViewProps.type === 'multicolor' ? undefined : iconColor}
      {...symbolViewProps}
    />
  );
};

export default Icon;
