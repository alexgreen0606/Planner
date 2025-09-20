import useAppTheme from "@/hooks/useAppTheme";
import { TOOLBAR_HEIGHT } from "@/lib/constants/miscLayout";
import { Button, Host, HStack, Label, Spacer, VStack } from "@expo/ui/swift-ui";
import { frame, glassEffect, padding } from "@expo/ui/swift-ui/modifiers";
import React, { ReactNode } from 'react';
import { ActionSheetIOS, PlatformColor, ScrollView, useWindowDimensions, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const TOP_GLASS_BAR_HEIGHT = 50;
const MODAL_PADDING = 16;

const Modal = ({
    title,
    primaryButtonConfig,
    deleteButtonConfig,
    onClose,
    customStyle,
    children,
}: TModalProps) => {
    const { bottom: BOTTOM_SPACER } = useSafeAreaInsets();
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const { background } = useAppTheme();

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
                { backgroundColor: PlatformColor(background) }
            ]}
        >

            {/* Modal Contents */}
            <ScrollView
                contentContainerStyle={{
                    paddingTop: TOP_GLASS_BAR_HEIGHT * 1.5,
                    paddingBottom: BOTTOM_SPACER,
                    paddingHorizontal: MODAL_PADDING,
                    flexGrow: 1
                }}
            >

                {children}

                {/* Delete Button */}
                {!deleteButtonConfig?.hidden && (
                    <Host style={{ flex: 1 }}>
                        <VStack modifiers={[frame({ width: SCREEN_WIDTH - (MODAL_PADDING * 2) })]}>
                            <Spacer />
                            <Button
                                variant="borderless"
                                onPress={handleDeleteButtonClick}
                                color={PlatformColor('systemRed') as unknown as string}
                            >
                                {deleteButtonConfig?.label}
                            </Button>
                        </VStack>
                    </Host>
                )}

            </ScrollView>

            {/* Top Glass Bar */}
            <Host style={{ width: SCREEN_WIDTH, height: TOOLBAR_HEIGHT, position: 'absolute', right: 0, top: 0 }}>
                <HStack modifiers={[
                    glassEffect({ glass: { variant: 'regular' }, shape: 'rectangle' }),
                    frame({ width: SCREEN_WIDTH, height: TOP_GLASS_BAR_HEIGHT })
                ]}>
                    <HStack modifiers={[padding({ horizontal: TOP_GLASS_BAR_HEIGHT / 3 }),
                    frame({ width: SCREEN_WIDTH, height: TOP_GLASS_BAR_HEIGHT })]}>
                        <Button
                            variant="borderless"
                            onPress={onClose}
                            color={PlatformColor('secondaryLabel') as unknown as string}
                        >
                            Cancel
                        </Button>
                        <Spacer />
                        <Label title={title} />
                        <Spacer />
                        <Button
                            variant="borderless"
                            onPress={primaryButtonConfig.onClick}
                            color={primaryButtonConfig.disabled ? PlatformColor('tertiaryLabel') as unknown as string : undefined}
                        >
                            {primaryButtonConfig.label}
                        </Button>
                    </HStack>
                </HStack>
            </Host>
        </View>
    )
};

export default Modal;
