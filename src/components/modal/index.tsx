import useAppTheme from "@/hooks/useAppTheme";
import { Host, Text } from "@expo/ui/swift-ui";
import React, { ReactNode } from 'react';
import { PlatformColor, ScrollView, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassIconButton from "../icons/customButtons/GlassIconButton";
import PopupList, { TPopupListProps } from "../PopupList";
import UpperFadeOutView from "../views/UpperFadeOutView";

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

    const { background, modalUpperFadeArray } = useAppTheme();

    return (
        <View
            className='flex-1'
            style={[
                customStyle,
                { backgroundColor: PlatformColor(background) }
            ]}
        >

            {/* Top Bar with Fade */}
            <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: TOP_GLASS_BAR_HEIGHT,
                zIndex: 10000
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
