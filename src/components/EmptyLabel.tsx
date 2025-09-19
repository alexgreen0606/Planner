import GenericIcon, { GenericIconProps } from '@/components/icon';
import { Host, Text, VStack } from '@expo/ui/swift-ui';
import { frame } from '@expo/ui/swift-ui/modifiers';
import React from 'react';
import { PlatformColor, Pressable, useWindowDimensions, View } from 'react-native';
import { PressableProps } from 'react-native-gesture-handler';
import SlowFadeInView from './SlowFadeInView';

// ✅ 

export interface IEmptyLabelProps extends PressableProps {
    label: string;
    iconConfig?: GenericIconProps;
    className?: string;
    onPress?: () => void;
    centerOnPage?: boolean;
};

const EmptyLabel = ({
    label,
    iconConfig,
    className,
    onLayout,
    onPress,
    centerOnPage
}: IEmptyLabelProps) => {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    return (
        <Pressable
            onLayout={onLayout}
            onPress={onPress}
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
                    <Host matchContents>
                        <VStack modifiers={[frame({ width: SCREEN_WIDTH })]}>
                            <Text design='rounded' size={14} color={PlatformColor('tertiaryLabel') as unknown as string}>
                                {label}
                            </Text>
                        </VStack>
                    </Host>
                </View>
            </SlowFadeInView>
        </Pressable>
    )
};

export default EmptyLabel;
