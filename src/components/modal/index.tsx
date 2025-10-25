import { GlassEffectContainer, Host, Text, VStack } from "@expo/ui/swift-ui";
import React, { ReactNode } from 'react';
import { View } from 'react-native';
import GlassIconButton from "../icons/customButtons/GlassIconButton";
import PopupList, { TPopupListProps } from "../PopupList";

// ✅ 

type TModalProps = {
    title: string;
    primaryButtonConfig: {
        color?: string;
        disabled?: boolean;
        onClick: () => void;
    };
    deleteButtonConfig?: TPopupListProps;
    isViewMode?: boolean;
    children: ReactNode;
    onClose: () => void;
};

const TOP_GLASS_BAR_HEIGHT = 69;

const Modal = ({
    title,
    primaryButtonConfig,
    deleteButtonConfig,
    children,
    isViewMode,
    onClose,
}: TModalProps) => (
    <Host style={{ flex: 1 }}>
        <GlassEffectContainer>
            <VStack>
                <View>

                    {/* Top Bar with Fade */}
                    {!isViewMode && (
                        <View className='absolute top-0 left-0 right-0 z-[1]' style={{
                            height: TOP_GLASS_BAR_HEIGHT
                        }}>
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
                                    color={primaryButtonConfig.color}
                                    disabled={primaryButtonConfig.disabled}
                                    onPress={primaryButtonConfig.onClick}
                                />
                            </View>
                        </View>
                    )}

                    <View
                        style={[{
                            paddingHorizontal: 26,
                            paddingTop: !isViewMode ? TOP_GLASS_BAR_HEIGHT : 26
                        }]}
                        className="flex-1 z-[0]"
                    >
                        {children}

                        {/* Delete Actions */}
                        {!isViewMode && deleteButtonConfig && (
                            <View className='px-4 w-full items-start'>
                                <PopupList
                                    {...deleteButtonConfig}
                                    wrapButton
                                    systemImage="trash"
                                    iconPlatformColor="systemRed"
                                />
                            </View>
                        )}
                    </View>
                </View>
            </VStack>
        </GlassEffectContainer>
    </Host>
);

export default Modal;
