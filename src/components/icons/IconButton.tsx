import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon, { TIconProps } from './Icon';

// ✅ 

type TIconButtonProps = TIconProps & {
    hideRipple?: boolean;
    onClick: () => void;
};

const IconButton = ({
    hideRipple,
    onClick,
    ...iconProps
}: TIconButtonProps) => (
    <TouchableOpacity
        activeOpacity={hideRipple ? 1 : 0.8}
        onPress={onClick}
    >
        <Icon {...iconProps} />
    </TouchableOpacity>
);

export default IconButton;