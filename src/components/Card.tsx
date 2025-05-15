import React, { ReactNode, useEffect } from 'react';
import { PlatformColor, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const ContentContainer = Animated.createAnimatedComponent(View);

interface CardProps {
    header?: ReactNode;
    badges?: ReactNode;
    footer?: ReactNode;
    style?: ViewStyle;
    contentHeight: number;
    collapsed: boolean;
    children: ReactNode;
}

const Card = ({
    header,
    badges,
    footer,
    style,
    collapsed = false,
    contentHeight,
    children,
}: CardProps) => {
    const plannerContainerMaxHeight = useSharedValue(0);

    useEffect(() => {
        if (contentHeight) {
            const newHeight = collapsed ? 0 : contentHeight;
            plannerContainerMaxHeight.value = withTiming(newHeight, {
                duration: 300
            })
        }
    }, [collapsed]);

    const plannerContainerStyle = useAnimatedStyle(() => ({
        maxHeight: plannerContainerMaxHeight.value,
        overflow: 'hidden'
    }));

    return (
        <View style={[styles.card, style]}>
            {header && (
                <View style={styles.banner}>
                    {header}
                </View>
            )}
            <ContentContainer style={contentHeight ? plannerContainerStyle : undefined}>
                {children}
                {footer && (
                    <View style={styles.banner}>
                        {footer}
                    </View>
                )}
            </ContentContainer>
            {badges && (
                <View style={styles.badge}>
                    {badges}
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        position: 'relative',
        borderRadius: 8,
        backgroundColor: PlatformColor('systemGray6')
    },
    banner: { padding: 8 },
    badge: {
        position: 'absolute',
        bottom: '100%',
        right: 0,
        transform: 'translateY(10px)'
    }
});

export default Card;
