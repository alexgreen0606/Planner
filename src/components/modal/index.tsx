import { spacing } from "@/constants/layout";
import { BlurView } from "expo-blur";
import React, { ReactNode } from 'react';
import { ActionSheetIOS, PlatformColor, ScrollView, View, ViewStyle } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ButtonText from '../text/ButtonText';
import CustomText from '../text/CustomText';

const TopBlurBar = Animated.createAnimatedComponent(View);
const ScrollContainer = Animated.createAnimatedComponent(ScrollView);

const TOP_BLUR_BAR_HEIGHT = 50;

interface ModalProps {
    title: string;
    primaryButtonConfig: {
        label: string;
        onClick: () => void;
        platformColor?: string;
        disabled?: boolean;
    };
    deleteButtonConfig?: {
        label: string;
        optionLabels: string[];
        optionHandlers: (() => void)[];
        message?: string;
        hidden?: boolean;
    };
    onClose: () => void;
    customStyle?: ViewStyle;
    children: ReactNode;
}

const Modal = ({
    title,
    primaryButtonConfig,
    deleteButtonConfig,
    onClose,
    customStyle,
    children,
}: ModalProps) => {
    const { bottom: BOTTOM_SPACER } = useSafeAreaInsets();

    const scrollRef = useAnimatedRef();
    const scrollOffset = useSharedValue(0);

    // Keep track of modal scroll position
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollOffset.value = event.contentOffset.y;
        }
    });

    const topBlurBarStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollOffset.value,
            [0, 10],
            [0, 1],
            Extrapolation.CLAMP
        )
        return { opacity };
    });

    function handleDeleteButtonClick() {
        if (!deleteButtonConfig) return;

        const { optionLabels, optionHandlers, message } = deleteButtonConfig;
        const handlers = [
            () => null,
            ...optionHandlers
        ];
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ['Cancel', ...optionLabels],
                destructiveButtonIndex: 1,
                cancelButtonIndex: 0,
                message
            },
            buttonIndex => {
                if (buttonIndex === 0) return;

                handlers[buttonIndex]?.();
            }
        );
    }

    return (
        <View
            className='flex-1'
            style={[
                customStyle,
                { backgroundColor: PlatformColor('systemGray6') }
            ]}
        >
            <ScrollContainer
                ref={scrollRef}
                onScroll={scrollHandler}
                contentContainerStyle={{
                    paddingTop: TOP_BLUR_BAR_HEIGHT,
                    paddingBottom: BOTTOM_SPACER,
                    paddingHorizontal: spacing.large,
                    flexGrow: 1
                }}
            >

                {/* Title */}
                <View className='items-center mb-5'>
                    <CustomText type='header'>
                        {title}
                    </CustomText>
                </View>

                {/* Content */}
                {children}

                <View className='flex-1' />

                {/* Delete Button */}
                {!deleteButtonConfig?.hidden && (
                    <View
                        className="w-full items-center"
                        style={{
                            paddingTop: BOTTOM_SPACER,
                            paddingBottom: BOTTOM_SPACER / 2
                        }}
                    >
                        <ButtonText
                            onClick={handleDeleteButtonClick}
                            platformColor='systemRed'
                        >
                            {deleteButtonConfig?.label}
                        </ButtonText>
                    </View>
                )}

            </ScrollContainer>

            {/* Top Blur Bar */}
            <TopBlurBar
                className="absolute top-0 left-0 w-full"
                style={[
                    topBlurBarStyle,
                    { height: TOP_BLUR_BAR_HEIGHT }
                ]}>
                <BlurView
                    intensity={50}
                    tint='systemUltraThinMaterial'
                    className="overflow-hidden flex-1"
                />
            </TopBlurBar>

            {/* Cancel Button */}
            <View className="absolute left-4 top-5">
                <ButtonText
                    onClick={onClose}
                    platformColor='secondaryLabel'
                >
                    Cancel
                </ButtonText>
            </View>

            {/* Primary Button */}
            <View className="absolute right-4 top-5">
                <ButtonText
                    onClick={primaryButtonConfig.onClick}
                    platformColor={
                        primaryButtonConfig.disabled ? 'tertiaryLabel' :
                            primaryButtonConfig.platformColor
                    }
                >
                    {primaryButtonConfig.label}
                </ButtonText>
            </View>
        </View>
    )
}

export default Modal;
