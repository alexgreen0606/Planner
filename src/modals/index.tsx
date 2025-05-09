import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, PlatformColor, ScrollView } from 'react-native';
import CustomText from '../foundation/components/text/CustomText';
import Animated, { Extrapolation, interpolate, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from "expo-blur";
import ButtonText from '../foundation/components/text/ButtonText';
import useDimensions from '../foundation/hooks/useDimensions';
import { useRouter } from 'expo-router';

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
        onClick: () => void;
        hidden?: boolean
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

    const router = useRouter();

    const { BOTTOM_SPACER } = useDimensions();

    const scrollRef = useAnimatedRef();
    const scrollOffset = useSharedValue(0);

    // Keep track of modal scroll position
    const handler = useAnimatedScrollHandler({
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


    return (
        <View>
            <View style={[
                customStyle,
                styles.modal
            ]}>
                <GestureHandlerRootView>
                    <ScrollContainer
                        ref={scrollRef}
                        onScroll={handler}
                        contentContainerStyle={[
                            styles.scrollContainer,
                            { paddingBottom: BOTTOM_SPACER }
                        ]}
                    >

                        {/* Title */}
                        <View style={styles.title}>
                            <CustomText type='header'>
                                {title}
                            </CustomText>
                        </View>

                        {/* Content */}
                        {children}

                        <View style={{ flex: 1 }} />

                        {/* Delete Button */}
                        {!deleteButtonConfig?.hidden && (
                            <View style={styles.deleteButton}>
                                <ButtonText
                                    onClick={deleteButtonConfig?.onClick!}
                                    platformColor='systemRed'
                                >
                                    {deleteButtonConfig?.label}
                                </ButtonText>
                            </View>
                        )}

                    </ScrollContainer>

                    {/* Top Blur Bar */}
                    <TopBlurBar style={[
                        topBlurBarStyle,
                        styles.topBlurBarContainer
                    ]}>
                        <BlurView
                            intensity={50}
                            tint='systemUltraThinMaterial'
                            style={styles.topBlurBar}
                        />
                    </TopBlurBar>

                    {/* Cancel Button */}
                    <View style={styles.cancelButton}>
                        <ButtonText
                            onClick={onClose}
                            platformColor='secondaryLabel'
                        >
                            Cancel
                        </ButtonText>
                    </View>

                    {/* Primary Button */}
                    <View style={styles.primaryButton}>
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

                </GestureHandlerRootView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    modal: {
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: PlatformColor('systemGray6'),
        gap: 4
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: TOP_BLUR_BAR_HEIGHT
    },
    topBlurBarContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: TOP_BLUR_BAR_HEIGHT,
        width: '100%'
    },
    topBlurBar: {
        flex: 1,
        borderTopRightRadius: 16,
        borderTopLeftRadius: 16,
        overflow: 'hidden',
    },
    title: {
        alignItems: 'center',
        paddingBottom: 32
    },
    primaryButton: {
        position: 'absolute',
        right: 16,
        top: 16
    },
    cancelButton: {
        position: 'absolute',
        left: 16,
        top: 16
    },
    deleteButton: {
        alignItems: 'center',
        width: '100%'
    },
});

export default Modal;
