import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';
import { theme } from '../../../theme/theme';
import globalStyles from '../../../theme/globalStyles';
import { PlannerProvider } from '../../../feature/planners/services/PlannerProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface ModalProps {
    title: string;
    primaryButtonConfig?: {
        label: string;
        onClick: () => void;
        color?: string;
    };
    children: ReactNode;
    open: boolean;
    toggleModalOpen: () => void;
}

const Modal = ({
    title,
    primaryButtonConfig,
    children,
    open,
    toggleModalOpen
}: ModalProps) => {
    const { colors } = useTheme();

    return (
        <Portal>
            <GestureHandlerRootView>
                <PlannerProvider>
                    <Dialog style={styles.container} visible={open} onDismiss={toggleModalOpen}>
                        <Dialog.Title style={styles.label}>
                            {title}
                        </Dialog.Title>
                        <Dialog.Content>
                            {children}
                        </Dialog.Content>
                        <Dialog.Actions>
                            <View style={globalStyles.spacedApart}>
                                <Button textColor={colors.outline} onPress={toggleModalOpen}>Cancel</Button>
                                {primaryButtonConfig && (
                                    <Button textColor={primaryButtonConfig.color || colors.primary} onPress={primaryButtonConfig.onClick}>{primaryButtonConfig.label}</Button>
                                )}
                            </View>
                        </Dialog.Actions>
                    </Dialog>
                </PlannerProvider>
            </GestureHandlerRootView>
        </Portal>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background
    },
    label: {
        color: theme.colors.primary,
        fontSize: 20
    },
});

export default Modal;
