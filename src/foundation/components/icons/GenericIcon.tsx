import React from 'react';
import { FontAwesome, Feather, Ionicons, MaterialIcons, Entypo, FontAwesome5, Foundation, MaterialCommunityIcons, Fontisto, SimpleLineIcons, FontAwesome6 } from '@expo/vector-icons';

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
    FontAwesome6
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
    dashboard: { type: 'FontAwesome', name: 'coffee' },
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
    clock: { type: 'MaterialCommunityIcons', name: 'clock-outline' }

};
export type IconType = keyof typeof IconMap;

export interface GenericIconProps {
    type: IconType;
    size?: number;
    color?: string;
}

const GenericIcon: React.FC<GenericIconProps> = ({
    type,
    size,
    color,
    ...props
}) => {
    const iconConfig = IconMap[type];
    const IconComponent = IconSets[iconConfig.type];
    return <IconComponent name={iconConfig.name} size={size} color={color} {...props} />;
};

export default GenericIcon;
