import { useScrollContainer } from '@/services/ScrollContainer';
import React, { ReactNode, useEffect } from 'react';
import { PlatformColor, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const ContentContainer = Animated.createAnimatedComponent(View);

interface CardProps {
    header?: ReactNode;
    footer?: ReactNode;
    style?: ViewStyle;
    contentHeight: number;
    collapsed: boolean;
    children: ReactNode;
}

const Card = ({
    header,
    footer,
    style,
    collapsed = false,
    contentHeight,
    children,
}: CardProps) => {
    const { measureContentHeight } = useScrollContainer();

    const contentContainerHeight = useSharedValue(0);

    useEffect(() => {
        if (contentHeight) {
            const newHeight = collapsed ? 0 : contentHeight;
            contentContainerHeight.value = withTiming(
                newHeight,
                { duration: 300 }
            );
        }
    }, [collapsed, contentHeight]);

    useAnimatedReaction(
        () => contentContainerHeight.value,
        measureContentHeight
    );

    const plannerContainerStyle = useAnimatedStyle(() => ({
        maxHeight: contentContainerHeight.value
    }));

    return (
        <View
            className='relative rounded-xl'
            style={[
                { backgroundColor: PlatformColor('systemGray6') },
                style
            ]}
        >
            {header && (
                <View className='p-2'>
                    {header}
                </View>
            )}
            <ContentContainer
                className='overflow-hidden'
                style={contentHeight ? plannerContainerStyle : undefined}
            >
                {children}
                {footer && (
                    <View className='p-2'>
                        {footer}
                    </View>
                )}
            </ContentContainer>
        </View>
    )
}

export default Card;
