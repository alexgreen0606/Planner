import { PRESSABLE_OPACITY } from '@/lib/constants/generic';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { PlatformColor, TouchableOpacity } from 'react-native';

interface IListItemToggleButtonProps {
  isDeleting: boolean;
  onToggle: () => void;
}

const ListItemToggleButton = ({ isDeleting, onToggle }: IListItemToggleButtonProps) => (
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
          colors: [PlatformColor('systemBlue'), PlatformColor('secondaryLabel')]
        }
        : { tintColor: PlatformColor('secondaryLabel') })}
    />
  </TouchableOpacity>
);

export default ListItemToggleButton;
