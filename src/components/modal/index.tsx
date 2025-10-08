import useAppTheme from "@/hooks/useAppTheme";
import { Host, Text } from "@expo/ui/swift-ui";
import React, { ReactNode } from 'react';
import { PlatformColor, ScrollView, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassIconButton from "../icons/customButtons/GlassIconButton";
import PopupList, { TPopupListProps } from "../PopupList";
import ColorFadeView from "../views/ColorFadeView";

// ✅ 

type TModalProps = {
    title: string;
    primaryButtonConfig: {
        platformColor?: string;
        disabled?: boolean;
        onClick: () => void;
    };
    deleteButtonConfig?: TPopupListProps;
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

    const { CssColor: { background }, ColorArray: { Modal: { upper } } } = useAppTheme();

    return (
        <View
            className='flex-1'
            style={[
                customStyle,
                { backgroundColor: background }
            ]}
        >

            {/* Top Bar with Fade */}
            <View className='absolute top-0 left-0 right-0 z-[1]' style={{
                height: TOP_GLASS_BAR_HEIGHT
            }}>
                <ColorFadeView colors={upper} totalHeight={TOP_GLASS_BAR_HEIGHT} solidHeight={TOP_GLASS_BAR_HEIGHT / 2} />
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

            {/* Modal Contents */}
            <ScrollView
                contentContainerClassName="z-[0] flex-1"
                contentContainerStyle={{
                    paddingTop: TOP_GLASS_BAR_HEIGHT,
                    paddingBottom: BOTTOM_SPACER,
                    paddingHorizontal: MODAL_PADDING,
                }}
            >
                {children}
            </ScrollView>

            {/* Delete Actions */}
            {deleteButtonConfig && (
                <View className='p-4 absolute' style={{
                    bottom: BOTTOM_SPACER,
                    left: BOTTOM_SPACER,
                }}>
                    <PopupList
                        {...deleteButtonConfig}
                        wrapButton
                        systemImage="trash"
                        platformColor="systemRed"
                    />
                </View>
            )}

        </View>
    )
};

export default Modal;
