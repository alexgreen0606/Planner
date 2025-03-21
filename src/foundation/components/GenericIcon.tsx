import React from 'react';
import { PlatformColor, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { isValidPlatformColor } from '../theme/colors';

const sizeMap = {
    xs: 10,
    s: 14,
    m: 16,
    l: 18,
    xl: 24
};
const iconMap = {
    transfer: 'arrow.uturn.down',
    recurringCalendar: 'arrow.trianglehead.2.clockwise.rotate.90',
    folder: 'folder.fill',
    openFolder: 'folder.fill',
    list: 'list.bullet',
    planners: 'calendar',
    plannerStack: 'square.stack',
    lists: 'list.bullet.clipboard',
    coffee: 'cup.and.saucer.fill',
    add: 'plus',
    chevronLeft: 'chevron.left',
    chevronDown: 'chevron.down',
    chevronUp: 'chevron.up',
    chevronRight: 'chevron.right',
    circleFilled: 'inset.filled.circle',
    circle: 'circle',
    trash: 'trash',
    megaphone: 'megaphone',
    globe: 'globe.americas.fill',
    birthday: 'birthday.cake.fill',
    clock: 'clock',
    message: 'message',
    messageFilled: 'checkmark.message',
    alert: 'exclamationmark.triangle',
    refresh: 'arrow.trianglehead.counterclockwise',
    refreshComplete: 'checkmark.arrow.trianglehead.counterclockwise'
};

export type IconType = keyof typeof iconMap;
export interface GenericIconProps<T = void> {
    type: IconType;
    size?: 'xs' | 's' | 'm' | 'l' | 'xl';
    platformColor?: string;
    onClick?: () => T;
    style?: ViewStyle;
    hideRipple?: boolean;
};

const GenericIcon = <T,>({
    type,
    size = 'm',
    platformColor: color = 'secondaryLabel',
    onClick,
    style,
    hideRipple = false
}: GenericIconProps<T>) => {
    const Wrapper = onClick ? TouchableOpacity : View;
    return (
        <Wrapper activeOpacity={hideRipple ? 1 : 0} onPress={onClick} style={{
            width: sizeMap[size],
            height: sizeMap[size],
            alignItems: 'center',
            justifyContent: 'center',
            ...style
        }}>
            <SFSymbol resizeMode='center' name={iconMap[type]} size={sizeMap[size]} color={isValidPlatformColor(color) ? PlatformColor(color) : color} />
        </Wrapper>
    )
};

export default GenericIcon;
