import React from 'react';
import { PlatformColor, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedText = Animated.createAnimatedComponent(View);

interface TextProps {
    platformColor: string;
    label: string;
    onClick: () => void;
}

const ButtonText = ({
    platformColor,
    label,
    onClick
}: TextProps) => {

    const opacity = useSharedValue(1);

    const handlePressStart = () => {
        opacity.value = withTiming(.5, {
            duration: 50
        });
        onClick();
    };

    const handlePressEnd = () => {
        opacity.value = withTiming(1, {
            duration: 50
        });
    };

    const textStyle = useAnimatedStyle(
        () => ({
            opacity: opacity.value
        }),
        [opacity]
    )

    return (
        <TouchableWithoutFeedback onPressIn={handlePressStart} onPressOut={handlePressEnd}>
            <AnimatedText style={textStyle}>
                <Text
                    style={{
                        ...styles.text,
                        color: PlatformColor(platformColor)
                    }}
                >
                    {label}
                </Text>
            </AnimatedText>
        </TouchableWithoutFeedback>
    )
}

const styles = StyleSheet.create({
    text: {
        fontSize: 16,
        fontWeight: 500,
        fontFamily: 'System'
    },
});

export default ButtonText;
