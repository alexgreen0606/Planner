import React from 'react';
import { FontAwesome, Feather, Ionicons, MaterialIcons, Entypo, FontAwesome5, Foundation, MaterialCommunityIcons, Fontisto } from '@expo/vector-icons';

const IconSets = {
    FontAwesome,
    Feather,
    Entypo,
    MaterialIcons,
    Foundation,
    FontAwesome5,
    Ionicons,
    MaterialCommunityIcons,
    Fontisto
};

export type IconType = keyof typeof IconSets;

interface GenericIconProps {
    type: IconType;
    name: string;
    size?: number;
    color?: string;
}

const GenericIcon: React.FC<GenericIconProps> = ({
    type,
    name,
    size,
    color,
    ...props
}) => {
    const IconComponent = IconSets[type];

    //@ts-ignore
    return <IconComponent name={name} size={size} color={color} {...props} />;
};

export default GenericIcon;
