import { BlurView } from "expo-blur";
import React, { ReactNode } from 'react';
import { ActionSheetIOS, PlatformColor, ScrollView, View, ViewStyle } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ButtonText from '../text/ButtonText';
import CustomText from '../text/CustomText';

// ✅ 

type TModalProps = {
    title: string;
    primaryButtonConfig: {
        label: string;
        platformColor?: string;
        disabled?: boolean;
        onClick: () => void;
    };
    deleteButtonConfig?: {
        label: string;
        optionLabels: string[];
        message?: string;
        hidden?: boolean;
        optionHandlers: (() => void)[];
    };
    customStyle?: ViewStyle;
    children: ReactNode;
    onClose: () => void;
};

const TopBlurBar = Animated.createAnimatedComponent(View);
const ScrollContainer = Animated.createAnimatedComponent(ScrollView);

const TOP_BLUR_BAR_HEIGHT = 50;

const Modal = ({
    title,
    primaryButtonConfig,
    deleteButtonConfig,
    onClose,
    customStyle,
    children,
}: TModalProps) => {
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
                    paddingTop: TOP_BLUR_BAR_HEIGHT * 1.5,
                    paddingBottom: BOTTOM_SPACER,
                    paddingHorizontal: 16,
                    flexGrow: 1
                }}
            >

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
                    intensity={100}
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

            {/* Title */}
            <View className="absolute left-[50%] top-4 -translate-x-1/2">
                <CustomText variant='modalTitle'>
                    {title}
                </CustomText>
            </View>

            {/* Primary Button */}
            <View className="absolute right-4 top-4">
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
};

export default Modal;
