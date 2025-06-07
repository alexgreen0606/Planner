import React from 'react';
import { PlatformColor, StyleSheet, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import CustomText, { TextType } from './CustomText';
import GenericIcon, { GenericIconProps } from '../GenericIcon';

const AnimatedText = Animated.createAnimatedComponent(View);

interface ButtonTextProps extends React.ComponentProps<typeof Text> {
    platformColor?: string;
    onClick?: () => void;
    children: React.ReactNode;
    containerStyle?: ViewStyle;
    iconConfig?: GenericIconProps;
    textType?: TextType;
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
                    type={textType}
                    ellipsizeMode='tail'
                    numberOfLines={1}
                    {...rest}
                    style={{
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
