import React from 'react';
import {
    FontAwesome,
    Feather,
    Ionicons,
    MaterialIcons,
    Entypo,
    FontAwesome5,
    Foundation,
    MaterialCommunityIcons,
    Fontisto,
    SimpleLineIcons,
    FontAwesome6,
    Octicons
} from '@expo/vector-icons';
import { TouchableOpacity, ViewStyle } from 'react-native';

const IconSets = {
    FontAwesome,
    Feather,
    Entypo,
    MaterialIcons,
    Foundation,
    FontAwesome5,
    SimpleLineIcons,
    Ionicons,
    MaterialCommunityIcons,
    Fontisto,
    FontAwesome6,
    Octicons
};
type IconSetType = keyof typeof IconSets;

const IconMap: Record<string, { type: IconSetType, name: string }> = {
    transfer: { type: 'MaterialCommunityIcons', name: 'arrow-down-right' },
    'recurring-calendar': { type: 'MaterialCommunityIcons', name: 'calendar-sync' },
    folder: { type: 'MaterialIcons', name: 'folder-open' },
    'open-folder': { type: 'Entypo', name: 'folder' },
    list: { type: 'Ionicons', name: 'list-outline' },
    planner: { type: 'Ionicons', name: 'calendar-number-sharp' },
    lists: { type: 'Entypo', name: 'archive' },
    coffee: { type: 'FontAwesome', name: 'coffee' },
    'chevron-left': { type: 'Entypo', name: 'chevron-left' },
    'chevron-down': { type: 'Entypo', name: 'chevron-down' },
    'chevron-up': { type: 'Entypo', name: 'chevron-up' },
    'chevron-right': { type: 'Entypo', name: 'chevron-right' },
    'circle-filled': { type: 'FontAwesome', name: 'circle' },
    circle: { type: 'FontAwesome', name: 'circle-thin' },
    ghost: { type: 'FontAwesome6', name: 'ghost' },
    trash: { type: 'Entypo', name: 'trash' },
    megaphone: { type: 'Entypo', name: 'megaphone' },
    globe: { type: 'Entypo', name: 'globe' },
    birthday: { type: 'FontAwesome', name: 'birthday-cake' },
    celebrate: { type: 'MaterialCommunityIcons', name: 'party-popper' },
    clock: { type: 'MaterialCommunityIcons', name: 'clock-outline' },
    message: { type: 'MaterialCommunityIcons', name: 'message-outline' },
    messageFilled: { type: 'MaterialCommunityIcons', name: 'message' },
    square: { type: 'Feather', name: 'square' },
    checkSquare: { type: 'Feather', name: 'check-square' },
    alert: {type: 'Octicons', name: 'alert'}
};
export type IconType = keyof typeof IconMap;

export interface GenericIconProps<T = void> {
    type: IconType;
    size?: number;
    color?: string;
    onClick?: () => T;
    style?: ViewStyle;
}

const GenericIcon = <T,>({
    type,
    size,
    color,
    onClick,
    style
}: GenericIconProps<T>) => {
    const iconConfig = IconMap[type];
    const IconComponent = IconSets[iconConfig.type];
    const Icon = <IconComponent name={iconConfig.name} size={size} color={color} />;

    return onClick ?
        <TouchableOpacity style={style} onPress={onClick}>
            {Icon}
        </TouchableOpacity>
        :
        Icon
};

export default GenericIcon;
