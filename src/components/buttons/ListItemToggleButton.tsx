import { SymbolView } from 'expo-symbols';
import React from 'react';
import { PlatformColor, TouchableOpacity } from 'react-native';

import { PRESSABLE_OPACITY } from '@/lib/constants/generic';

interface IListItemToggleButtonProps {
  isDeleting: boolean;
  platformColor?: string;
  onToggle: () => void;
}

const ListItemToggleButton = ({ isDeleting, platformColor = 'systemBlue', onToggle }: IListItemToggleButtonProps) => (
  <TouchableOpacity onPress={onToggle} activeOpacity={PRESSABLE_OPACITY}>
    <SymbolView
      name={isDeleting ? 'circle.inset.filled' : 'circle'}
      type="palette"
      animationSpec={
        isDeleting
          ? {
            effect: { type: 'bounce' },
            speed: 1.7,
            repeating: false
          }
          : undefined
      }
      size={22}
      {...(isDeleting
        ? {
          colors: [PlatformColor(platformColor), PlatformColor('secondaryLabel')]
        }
        : { tintColor: PlatformColor('secondaryLabel') })}
    />
  </TouchableOpacity>
);

export default ListItemToggleButton;
