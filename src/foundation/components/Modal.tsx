import React, { ReactNode, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, PlatformColor, TouchableOpacity } from 'react-native';
import { Portal } from 'react-native-paper';
import CustomText from './text/CustomText';
import LabelSublabel from './text/LabelSublabel';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LIST_SPRING_CONFIG } from '../sortedLists/constants';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { BlurView } from "@react-native-community/blur";
import ButtonText from './text/ButtonText';
import useDimensions from '../hooks/useDimensions';

const AnimatedModal = Animated.createAnimatedComponent(View);

interface ModalProps {
    title: string;
    subTitle?: string;
    primaryButtonConfig: {
        label: string;
        onClick: () => void;
        platformColor?: string;
        disabled?: boolean;
    };
    children: ReactNode;
    open: boolean;
    width: number;
    height: number;
    toggleModalOpen: () => void;
    style?: ViewStyle;
}

const Modal = ({
    title,
    primaryButtonConfig,
    children,
    open,
    width,
    height,
    subTitle,
    toggleModalOpen,
    style: customStyle
}: ModalProps) => {

    const {
        screenHeight,
        bottomSpacer
    } = useDimensions();

    const top = useSharedValue(screenHeight);

    useEffect(() => {
        top.value = withSpring(
            open ? (screenHeight - height) : screenHeight,
            LIST_SPRING_CONFIG
        );
    }, [open]);

    const modalStyle = useAnimatedStyle(
        () => {
            return {
                top: top.value,
            }
        },
        [top.value]
    );

    return (
        <Portal>

            {/* Backdrop */}
            {open && (
                <TouchableOpacity
                    onPress={toggleModalOpen}
                    activeOpacity={0}
                    style={{
                        flex: 1,
                        backgroundColor: PlatformColor('systemBackground'),
                        opacity: .8,
                    }}
                />
            )}

            {/* Modal */}
            <Portal>
                <GestureHandlerRootView>
                    <AnimatedModal style={modalStyle}>
                        <View style={{
                            ...styles.card,
                            ...customStyle,
                            width,
                            height,
                            position: 'relative'
                        }}
                        >
                            <ScrollView contentContainerStyle={{
                                paddingHorizontal: 16,
                                paddingBottom: bottomSpacer,
                                paddingTop: 50,
                                flexGrow: 1
                            }}
                            >

                                {/* Title */}
                                <View style={{ display: 'flex', alignItems: 'center', paddingBottom: 32 }}>
                                    {subTitle ?
                                        <LabelSublabel
                                            label={title}
                                            subLabel={subTitle}
                                            type='medium'
                                        /> :
                                        <CustomText type='header'>
                                            {title}
                                        </CustomText>
                                    }
                                </View>

                                {/* Content */}
                                {children}

                            </ScrollView>

                            {/* Blur Bar */}
                            <BlurView
                                blurAmount={10}
                                blurType='dark'
                                style={{
                                    height: 50,
                                    width,
                                    position: 'absolute',
                                    borderTopRightRadius: 16,
                                    borderTopLeftRadius: 16,
                                    overflow: 'hidden',
                                    top: 0
                                }} />

                            {/* Cancel Button */}
                            <View style={{ position: 'absolute', left: 16, top: 16 }}>
                                <ButtonText
                                    label='Cancel'
                                    platformColor='secondaryLabel'
                                    onClick={toggleModalOpen}
                                />
                            </View>

                            {/* Primary Button */}
                            <View style={{ position: 'absolute', right: 16, top: 16 }}>
                                <ButtonText
                                    label={primaryButtonConfig.label}
                                    platformColor={primaryButtonConfig.platformColor ?? 'systemBlue'}
                                    onClick={primaryButtonConfig.onClick}
                                />
                            </View>
                        </View>
                    </AnimatedModal>
                </GestureHandlerRootView>
            </Portal>
        </Portal>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: PlatformColor('systemGray6'),
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
});

export default Modal;
