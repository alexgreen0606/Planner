import React from 'react';
import { TouchableOpacity } from 'react-native';

import { PRESSABLE_OPACITY } from '@/lib/constants/generic';

import Icon, { TIconProps } from './Icon';

// ✅

type TIconButtonProps = TIconProps & {
  hideRipple?: boolean;
  onClick: () => void;
};

const IconButton = ({ hideRipple, onClick, ...iconProps }: TIconButtonProps) => (
  <TouchableOpacity activeOpacity={hideRipple ? 1 : PRESSABLE_OPACITY} onPress={onClick}>
    <Icon {...iconProps} />
  </TouchableOpacity>
);

export default IconButton;
