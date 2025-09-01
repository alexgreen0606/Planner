import React from 'react';
import { PlatformColor, TextProps, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import GenericIcon, { GenericIconProps } from '../icon';
import CustomText, { TTextVariant } from './CustomText';

// ✅ 

interface IButtonTextProps extends TextProps {
    platformColor?: string;
    children: React.ReactNode;
    containerStyle?: ViewStyle;
    iconConfig?: GenericIconProps;
    textType?: TTextVariant;
    onClick?: () => void;
}

const AnimatedText = Animated.createAnimatedComponent(View);

const ButtonText = ({
    platformColor = 'systemBlue',
    textType = 'button',
    children,
    containerStyle,
    iconConfig,
    onClick,
    ...rest
}: IButtonTextProps) => {
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
            <AnimatedText
                className='items-center flex-row'
                style={[textStyle, containerStyle]}
            >
                {iconConfig && (
                    <GenericIcon {...iconConfig} />
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
};

export default ButtonText;
