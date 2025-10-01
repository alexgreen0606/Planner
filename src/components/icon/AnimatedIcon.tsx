import { iconMap, sizeMap, TIconType } from '@/lib/constants/icons';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { PlatformColor, TouchableOpacity, View, ViewStyle } from 'react-native';


export interface AnimatedIconProps<T = void> {
    type: TIconType;
    size?: 'xs' | 's' | 'm' | 'ms' | 'l' | 'xl';
    platformColor?: string;
    style?: ViewStyle;
    className?: string;
    hideRipple?: boolean;
    onClick?: (item?: T) => T | void | Promise<void>;
}

const AnimatedIcon = <T,>({
    type,
    size = 'm',
    platformColor: color = 'secondaryLabel',
    style,
    className,
    hideRipple = false,
    onClick
}: AnimatedIconProps<T>) => {
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
                // @ts-ignore
                name={iconMap[type]}
                type='palette'
                animationSpec={{
                    effect: { type: 'bounce' },
                    repeating: false,
                }}
                size={sizeMap[size]}
                tintColor={PlatformColor(color)}
                style={{ transform: [{ scale: 1.2 }] }}
            />
        </Wrapper>
    );
};

export default AnimatedIcon;
