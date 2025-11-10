import React from 'react';
import { TouchableOpacity } from 'react-native';

import { PRESSABLE_OPACITY } from '@/lib/constants/generic';

import Icon, { IIconProps } from '../Icon';

interface IIconButtonProps extends IIconProps {
  hideRipple?: boolean;
  onClick: () => void;
};

const IconButton = ({ hideRipple, onClick, ...iconProps }: IIconButtonProps) => (
  <TouchableOpacity activeOpacity={hideRipple ? 1 : PRESSABLE_OPACITY} onPress={onClick}>
    <Icon {...iconProps} />
  </TouchableOpacity>
);

export default IconButton;
