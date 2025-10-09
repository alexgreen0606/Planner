import { isValidPlatformColor } from '@/utils/colorUtils';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import React from 'react';
import { PlatformColor } from 'react-native';

// ✅ 

export type TIconProps = SymbolViewProps & {
    color?: string;
    disabled?: boolean;
};

const Icon = ({
    color,
    disabled,
    ...symbolViewProps
}: TIconProps) => {
    const colorToUse = disabled ? 'tertiaryLabel' : (color || 'label');

    const iconColor = isValidPlatformColor(colorToUse)
        ? PlatformColor(colorToUse)
        : colorToUse;

    return (
        <SymbolView
            tintColor={symbolViewProps.type === 'multicolor' ? undefined : iconColor}
            {...symbolViewProps}
        />
    );
};

export default Icon;