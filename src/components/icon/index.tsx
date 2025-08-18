import { isValidPlatformColor } from '@/utils/colorUtils';
import React from 'react';
import { PlatformColor, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';

// ✅ 

export interface GenericIconProps<T = void> {
    type: TIconType;
    size?: 'xs' | 's' | 'm' | 'l' | 'xl';
    platformColor?: string;
    style?: ViewStyle;
    className?: string;
    hideRipple?: boolean;
    onClick?: (item?: T) => T | void | Promise<void>;
};

const sizeMap = {
    xs: 10,
    s: 14,
    m: 16,
    l: 18,
    xl: 32
};

const iconMap = {
    transfer: 'arrow.uturn.down',
    recurringCalendar: 'arrow.trianglehead.2.clockwise.rotate.90',
    folder: 'folder.fill',
    openFolder: 'folder.fill',
    list: 'list.bullet',
    calendar: 'calendar',
    plannerStack: 'square.stack',
    lists: 'list.bullet.clipboard',
    coffee: 'cup.and.saucer.fill',
    add: 'plus',
    edit: 'pencil',
    note: 'note',
    chevronLeft: 'chevron.left',
    chevronDown: 'chevron.down',
    chevronUp: 'chevron.up',
    chevronRight: 'chevron.right',
    circleFilled: 'inset.filled.circle',
    circle: 'circle',
    trash: 'trash',
    more: 'ellipsis.circle',
    megaphone: 'megaphone',
    globe: 'globe.americas.fill',
    birthday: 'gift',
    clock: 'clock',
    message: 'message',
    messageFilled: 'checkmark.message',
    alert: 'exclamationmark.triangle',
    refresh: 'arrow.trianglehead.counterclockwise',
    refreshComplete: 'checkmark.arrow.trianglehead.counterclockwise'
};

export type TIconType = keyof typeof iconMap;

const GenericIcon = <T,>({
    type,
    size = 'm',
    platformColor: color = 'secondaryLabel',
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
            <SFSymbol
                name={iconMap[type]}
                size={sizeMap[size]}
                color={isValidPlatformColor(color) ? PlatformColor(color) : color}
            />
        </Wrapper>
    );
};

export default GenericIcon;
