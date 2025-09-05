import { iconMap, sizeMap, TIconType } from '@/lib/constants/icons';
import { isValidPlatformColor } from '@/utils/colorUtils';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { PlatformColor, TouchableOpacity, View, ViewStyle } from 'react-native';

// ✅ 

export interface GenericIconProps<T = void> {
    type: TIconType;
    multicolor?: boolean;
    size?: 'xs' | 's' | 'm' | 'ms' | 'l' | 'xl';
    platformColor?: string;
    style?: ViewStyle;
    className?: string;
    hideRipple?: boolean;
    onClick?: (item?: T) => T | void | Promise<void>;
}

const GenericIcon = <T,>({
    type,
    size = 'm',
    platformColor: color = 'secondaryLabel',
    multicolor,
    style,
    className,
    hideRipple = false,
    onClick
}: GenericIconProps<T>) => {
    const Wrapper = onClick ? TouchableOpacity : View;
    return (
        <Wrapper
            activeOpacity={hideRipple ? 1 : 0}
            onPress={() => onClick?.()}
            style={{
                width: sizeMap[size],
                height: sizeMap[size],
                alignItems: 'center',
                justifyContent: 'center',
                ...style
            }}
            className={className}
        >
            <SymbolView
                type={multicolor ? 'multicolor' : 'monochrome'}
                // @ts-ignore
                name={iconMap[type] ?? type}
                size={sizeMap[size]}
                tintColor={multicolor ? undefined : isValidPlatformColor(color) ? PlatformColor(color) : color}
            />
        </Wrapper>
    );
};

export default GenericIcon;
