import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Button, Dialog, Portal } from 'react-native-paper';
import globalStyles from '../../theme/globalStyles';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import GenericIcon, { GenericIconProps } from '../icon/GenericIcon';
import CustomText from '../text/CustomText';
import LabelSublabel from '../text/LabelSublabel';
import { Color } from '../../theme/colors';

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
    style?: ViewStyle;
}

const Modal = ({
    title,
    primaryButtonConfig,
    children,
    open,
    iconConfig,
    subTitle,
    style,
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
                                size={20}
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
                        <Button textColor={Color.DIM} onPress={toggleModalOpen}>Cancel</Button>
                        {primaryButtonConfig && (
                            <Button
                                disabled={primaryButtonConfig.disabled}
                                textColor={primaryButtonConfig.color || Color.BLUE}
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
    card: {
        backgroundColor: Color.BLACK,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    container: {
        padding: 8
    }
});

export default Modal;
