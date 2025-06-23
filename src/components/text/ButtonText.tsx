import React from 'react';
import { PlatformColor, StyleSheet, TextProps, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import CustomText, { TextVariant } from './CustomText';
import GenericIcon, { GenericIconProps } from '../icon';

const AnimatedText = Animated.createAnimatedComponent(View);

interface ButtonTextProps extends TextProps {
    platformColor?: string;
    onClick?: () => void;
    children: React.ReactNode;
    containerStyle?: ViewStyle;
    iconConfig?: GenericIconProps;
    textType?: TextVariant;
}

const ButtonText = ({
    platformColor = 'systemBlue',
    textType = 'button',
    onClick,
    children,
    containerStyle,
    iconConfig,
    ...rest
}: ButtonTextProps) => {

    const opacity = useSharedValue(1);

    function handlePressStart() {
        opacity.value = withTiming(.5, {
            duration: 50
        });
    }

    function handlePressEnd() {
        opacity.value = withTiming(1, {
            duration: 50
        });
        onClick?.();
    }

    const textStyle = useAnimatedStyle(() => ({
        opacity: opacity.value
    }));

    return (
        <TouchableWithoutFeedback onPressIn={handlePressStart} onPressOut={handlePressEnd}>
            <AnimatedText style={[textStyle, styles.container, containerStyle]}>
                {iconConfig && (
                    <GenericIcon
                        {...iconConfig}
                    />
                )}
                <CustomText
                    variant={textType}
                    ellipsizeMode='tail'
                    numberOfLines={1}
                    {...rest}
                    customStyle={{
                        color: PlatformColor(platformColor)
                    }}
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
