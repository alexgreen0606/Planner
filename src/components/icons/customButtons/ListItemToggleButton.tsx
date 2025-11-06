import { SymbolView } from 'expo-symbols';
import React from 'react';
import { PlatformColor, TouchableOpacity } from 'react-native';

// ✅

type ListItemToggleButtonProps = {
  isDeleting: boolean;
  onToggle: () => void;
};

const ListItemToggleButton = ({ isDeleting, onToggle }: ListItemToggleButtonProps) => (
  <TouchableOpacity onPress={onToggle} activeOpacity={0.6}>
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
