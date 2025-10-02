import useAppTheme from "@/hooks/useAppTheme";
import { Host, Text } from "@expo/ui/swift-ui";
import React, { ReactNode } from 'react';
import { ActionSheetIOS, PlatformColor, ScrollView, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassIconButton from "../icon/GlassButtonIcon";
import UpperFadeOutView from "../views/UpperFadeOutView";

// ✅ 

type TModalProps = {
    title: string;
    primaryButtonConfig: {
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

const TOP_GLASS_BAR_HEIGHT = 69;
const MODAL_PADDING = 16;

const Modal = ({
    title,
    primaryButtonConfig,
    deleteButtonConfig,
    customStyle,
    children,
    onClose,
}: TModalProps) => {
    const { bottom: BOTTOM_SPACER } = useSafeAreaInsets();

    const { background, modalUpperFadeArray } = useAppTheme();

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
                    paddingTop: TOP_GLASS_BAR_HEIGHT,
                    paddingBottom: BOTTOM_SPACER,
                    paddingHorizontal: MODAL_PADDING,
                    flexGrow: 1
                }}
            >

                {children}

            </ScrollView>

            {/* Top Bar with Fade */}
            <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: TOP_GLASS_BAR_HEIGHT
            }}>
                <UpperFadeOutView colors={modalUpperFadeArray} totalHeight={TOP_GLASS_BAR_HEIGHT} solidHeight={TOP_GLASS_BAR_HEIGHT / 2} />
                <View className='px-4 w-full h-full absolute flex-row items-center justify-between'>
                    <GlassIconButton
                        systemImage="xmark"
                        onPress={onClose}
                    />
                    <Host style={{ flex: 1 }}>
                        <Text design="rounded" size={20} weight="semibold">
                            {title}
                        </Text>
                    </Host>
                    <GlassIconButton
                        systemImage="checkmark"
                        isPrimary
                        disabled={primaryButtonConfig.disabled}
                        onPress={primaryButtonConfig.onClick}
                    />
                </View>
            </View>

            {/* Bottom Delete Button */}
            {!deleteButtonConfig?.hidden && (
                <View className='p-4 absolute' style={{
                    bottom: BOTTOM_SPACER,
                    left: BOTTOM_SPACER,
                }}>
                    <GlassIconButton
                        systemImage="trash"
                        iconColor="systemRed"
                        onPress={handleDeleteButtonClick}
                    />
                </View>
            )}

        </View>
    )
};

export default Modal;
