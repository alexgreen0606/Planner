import GenericIcon, { GenericIconProps } from '@/components/icon';
import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { PressableProps } from 'react-native-gesture-handler';
import CustomText from '../text/CustomText';

export interface EmptyLabelProps extends PressableProps {
    label: string;
    onPress: () => void;
    iconConfig?: GenericIconProps;
    className?: string;
    style?: ViewStyle;
    fontSize?: number;
};

const EmptyLabel = ({
    label,
    iconConfig,
    onLayout,
    onPress,
    style,
    className,
    fontSize = 14
}: EmptyLabelProps) =>
    <Pressable
        onLayout={onLayout}
        onPress={onPress}
        style={style}
        className={`flex items-center justify-center ${className}`}
    >
        <View className='flex-column gap-2 items-center'>
            {iconConfig && (
                <GenericIcon
                    {...iconConfig}
                    size='l'
                />
            )}
            <CustomText
                type='label'
                style={{ fontSize }}
            >
                {label}
            </CustomText>
        </View>
    </Pressable>

export default EmptyLabel;
