import React, { ReactNode, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, PlatformColor, TouchableOpacity, ScrollView } from 'react-native';
import { Portal } from 'react-native-paper';
import CustomText from './text/CustomText';
import Animated, { Extrapolation, interpolate, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from "expo-blur";
import ButtonText from './text/ButtonText';
import useDimensions from '../hooks/useDimensions';

const Backdrop = Animated.createAnimatedComponent(View);
const ModalContainer = Animated.createAnimatedComponent(View);
const TopBlurBar = Animated.createAnimatedComponent(View);
const ScrollContainer = Animated.createAnimatedComponent(ScrollView);

const MODAL_HEIGHT = 700;
const TOP_BLUR_BAR_HEIGHT = 50;

interface ModalProps {
    open: boolean;
    toggleModalOpen: () => void;
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
    customStyle?: ViewStyle;
    children: ReactNode;
}

const Modal = ({
    open,
    toggleModalOpen,
    title,
    primaryButtonConfig,
    deleteButtonConfig,
    customStyle,
    children,
}: ModalProps) => {

    const {
        SCREEN_HEIGHT,
        BOTTOM_SPACER
    } = useDimensions();

    const scrollRef = useAnimatedRef();
    const scrollOffset = useSharedValue(0);
    const modalAbsoluteTop = useSharedValue(SCREEN_HEIGHT);

    // Animate modal open and closed
    useEffect(() => {
        modalAbsoluteTop.value = withTiming(
            open ? (SCREEN_HEIGHT - MODAL_HEIGHT) : SCREEN_HEIGHT,
            { duration: 300 }
        );
    }, [open]);

    // Keep track of modal scroll position
    const handler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollOffset.value = event.contentOffset.y;
        }
    });

    const backdropStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            modalAbsoluteTop.value,
            [SCREEN_HEIGHT - MODAL_HEIGHT, SCREEN_HEIGHT],
            [.8, 0],
            Extrapolation.CLAMP
        );
        return {
            opacity,
            pointerEvents: modalAbsoluteTop.value === SCREEN_HEIGHT ? 'none' : 'auto'
        };
    });

    const modalContainerStyle = useAnimatedStyle(() => ({
        top: modalAbsoluteTop.value,
    }));

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
        <Portal>

            {/* Backdrop */}
            <Backdrop style={[
                backdropStyle,
                styles.backdrop
            ]}>
                <TouchableOpacity
                    onPress={toggleModalOpen}
                    activeOpacity={1}
                    style={{ flex: 1 }}
                />
            </Backdrop>

            {/* Modal */}
            <ModalContainer style={modalContainerStyle}>
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
                                onClick={toggleModalOpen}
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
            </ModalContainer>
        </Portal>
    )
}

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: PlatformColor('systemBackground')
    },
    modal: {
        position: 'relative',
        width: '100%',
        height: MODAL_HEIGHT,
        backgroundColor: PlatformColor('systemGray6'),
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
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
