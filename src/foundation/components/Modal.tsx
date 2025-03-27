import React, { ReactNode, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, PlatformColor, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Portal, Text } from 'react-native-paper';
import globalStyles from '../theme/globalStyles';
import GenericIcon, { GenericIconProps } from './GenericIcon';
import CustomText from './text/CustomText';
import LabelSublabel from './text/LabelSublabel';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LIST_SPRING_CONFIG } from '../sortedLists/constants';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView, VibrancyView } from "@react-native-community/blur";

const AnimatedModal = Animated.createAnimatedComponent(View);
const AnimatedToolbar = Animated.createAnimatedComponent(View);

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
    modalAbsoluteTop: number;
    toggleModalOpen: () => void;
    style?: ViewStyle;
}

const Modal = ({
    title,
    primaryButtonConfig,
    children,
    open,
    width,
    modalAbsoluteTop = 0,
    subTitle,
    toggleModalOpen,
    style: customStyle
}: ModalProps) => {
    const { bottom } = useSafeAreaInsets();
    const { height } = useWindowDimensions();

    const top = useSharedValue(height);

    useEffect(() => {
        console.log(open, modalAbsoluteTop)
        top.value = withSpring(
            open ? modalAbsoluteTop : height,
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

    const toolbarStyle = useAnimatedStyle(
        () => {
            return {
                ...globalStyles.spacedApart,
                top: top.value,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                height: 50,
                position: 'relative'
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
                        }}
                        >
                            <ScrollView contentContainerStyle={{
                                paddingHorizontal: 16,
                                paddingBottom: bottom * 2,
                                paddingTop: 60,
                            }}
                            >

                                {/* Tool Bar */}
                                <Portal>
                                    <AnimatedToolbar style={modalStyle}>
                                        <View style={{
                                            ...globalStyles.spacedApart,
                                            borderTopRightRadius: 16,
                                            borderTopLeftRadius: 16,
                                        }}>
                                            <BlurView
                                                blurAmount={10}
                                                blurType='dark'
                                                style={{
                                                    height: 60,
                                                    width,
                                                    borderTopRightRadius: 16,
                                                    borderTopLeftRadius: 16,
                                                    overflow: 'hidden'
                                                }} />

                                            {/* Modal Control Buttons */}
                                            <CustomText
                                                type='label'
                                                onPress={toggleModalOpen}
                                                style={{ position: 'absolute', left: 16 }}
                                            >
                                                Cancel
                                            </CustomText>
                                            <CustomText
                                                type='standard'
                                                disabled={primaryButtonConfig.disabled}
                                                style={{
                                                    color: PlatformColor(primaryButtonConfig.platformColor ?? 'systemBlue'),
                                                    position: 'absolute',
                                                    right: 16
                                                }}
                                                onPress={primaryButtonConfig.onClick}
                                            >
                                                {primaryButtonConfig.label}
                                            </CustomText>
                                        </View>
                                    </AnimatedToolbar>
                                </Portal>

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
                                {children}
                            </ScrollView>
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
