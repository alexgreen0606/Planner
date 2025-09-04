import GenericIcon, { GenericIconProps } from '@/components/icon';
import CustomText from '@/components/text/CustomText';
import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { PressableProps } from 'react-native-gesture-handler';
import SlowFadeInView from './SlowFadeInView';

// ✅ 

export interface IEmptyLabelProps extends PressableProps {
    label: string;
    iconConfig?: GenericIconProps;
    className?: string;
    style?: ViewStyle;
    fontSize?: number;
    onPress?: () => void;
};

const EmptyLabel = ({
    label,
    iconConfig,
    style,
    className,
    fontSize = 14,
    onLayout,
    onPress
}: IEmptyLabelProps) =>
    <Pressable
        onLayout={onLayout}
        onPress={onPress}
        style={style}
        className={`flex items-center justify-center ${className}`}
    >
        <SlowFadeInView>
            <View className='flex-column gap-2 items-center'>
                {iconConfig && (
                    <GenericIcon
                        {...iconConfig}
                        size='l'
                    />
                )}
                <CustomText
                    variant='emptyLabel'
                    customStyle={{ fontSize }}
                >
                    {label}
                </CustomText>
            </View>
        </SlowFadeInView>
    </Pressable>;

export default EmptyLabel;
