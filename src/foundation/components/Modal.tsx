import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, PlatformColor, OpaqueColorValue } from 'react-native';
import { Dialog, Portal, Text } from 'react-native-paper';
import globalStyles from '../theme/globalStyles';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import GenericIcon, { GenericIconProps } from './GenericIcon';
import CustomText from './text/CustomText';
import LabelSublabel from './text/LabelSublabel';

interface ModalProps {
    title: string;
    subTitle?: string;
    primaryButtonConfig?: {
        label: string;
        onClick: () => void;
        platformColor?: string;
        disabled?: boolean;
    };
    children: ReactNode;
    open: boolean;
    toggleModalOpen: () => void;
    iconConfig?: GenericIconProps;
    style?: ViewStyle;
}

const Modal = ({
    title,
    primaryButtonConfig,
    children,
    open,
    iconConfig,
    subTitle,
    toggleModalOpen
}: ModalProps) =>
    <Portal>
        <GestureHandlerRootView>
            <Dialog
                theme={{ colors: { backdrop: 'rgba(0, 0, 0, 0.8)' } }}
                style={styles.card}
                visible={open}
                onDismiss={toggleModalOpen}
            >
                <Dialog.Title>
                    <View style={globalStyles.verticallyCentered} >
                        {iconConfig && (
                            <GenericIcon
                                {...iconConfig}
                                size='l'
                            />
                        )}
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
                </Dialog.Title>
                <Dialog.Content>
                    <View style={styles.container}>
                        {children}
                    </View>
                </Dialog.Content>
                <Dialog.Actions>
                    <View style={globalStyles.spacedApart}>
                        <Text style={{ color: PlatformColor('secondaryLabel') }} onPress={toggleModalOpen}>Cancel</Text>
                        {primaryButtonConfig && (
                            <Text
                                disabled={primaryButtonConfig.disabled}
                                style={{ color: PlatformColor(primaryButtonConfig.platformColor ?? 'systemBlue') }}
                                onPress={primaryButtonConfig.onClick}
                            >
                                {primaryButtonConfig.label}
                            </Text>
                        )}
                    </View>
                </Dialog.Actions>
            </Dialog>
        </GestureHandlerRootView>
    </Portal>

const styles = StyleSheet.create({
    card: {
        backgroundColor: PlatformColor('systemBackground'),
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    container: {
        padding: 8
    }
});

export default Modal;
