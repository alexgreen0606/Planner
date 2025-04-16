import React from 'react';
import { PlatformColor, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import CustomText from './CustomText';
import GenericIcon, { GenericIconProps } from '../GenericIcon';

const AnimatedText = Animated.createAnimatedComponent(View);

interface TextProps {
    platformColor: string;
    onClick: () => void;
    children: React.ReactNode;
    iconConfig?: GenericIconProps;
}

const ButtonText = ({
    platformColor,
    onClick,
    children,
    iconConfig
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
            <AnimatedText style={[textStyle, styles.container]}>
                {iconConfig && (
                    <GenericIcon
                        {...iconConfig}
                    />
                )}
                <CustomText
                    type='button'
                    style={{
                        color: PlatformColor(platformColor)
                    }}
                    ellipsizeMode='tail'
                    numberOfLines={1}
                >
                    {children}
                </CustomText>
            </AnimatedText>
        </TouchableWithoutFeedback>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        flexDirection: 'row'
    },
});

export default ButtonText;
