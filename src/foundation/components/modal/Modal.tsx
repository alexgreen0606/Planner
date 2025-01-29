import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Dialog, Portal } from 'react-native-paper';
import globalStyles from '../../theme/globalStyles';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import GenericIcon, { GenericIconProps } from '../icons/GenericIcon';
import CustomText from '../text/CustomText';
import colors from '../../theme/colors';

interface ModalProps {
    title: string;
    subTitle?: string;
    primaryButtonConfig?: {
        label: string;
        onClick: () => void;
        color?: string;
        disabled?: boolean;
    };
    children: ReactNode;
    open: boolean;
    toggleModalOpen: () => void;
    iconConfig?: GenericIconProps;
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
            <Dialog theme={{ colors: { backdrop: 'black' } }} style={styles.container} visible={open} onDismiss={toggleModalOpen}>
                <Dialog.Title>
                    <View style={styles.label}>
                        {iconConfig && (
                            <GenericIcon
                                {...iconConfig}
                                size={20}
                            />
                        )}
                        <CustomText type='header'>
                            {title}
                        </CustomText>
                        <View style={styles.subTitle}>
                            <CustomText type='label'>
                                {subTitle}
                            </CustomText>
                        </View>
                    </View>
                </Dialog.Title>
                <Dialog.Content>
                    {children}
                </Dialog.Content>
                <Dialog.Actions>
                    <View style={globalStyles.spacedApart}>
                        <Button textColor={colors.grey} onPress={toggleModalOpen}>Cancel</Button>
                        {primaryButtonConfig && (
                            <Button
                                disabled={primaryButtonConfig.disabled}
                                textColor={primaryButtonConfig.color || colors.blue}
                                onPress={primaryButtonConfig.onClick}
                            >
                                {primaryButtonConfig.label}
                            </Button>
                        )}
                    </View>
                </Dialog.Actions>
            </Dialog>
        </GestureHandlerRootView>
    </Portal>

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
    },
    label: {
        color: colors.white,
        gap: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    subTitle: {
        justifyContent: 'flex-end',
        flex: 1,
        marginTop: 6
    }
});

export default Modal;
