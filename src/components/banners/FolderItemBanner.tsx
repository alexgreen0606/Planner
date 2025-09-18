import CustomText, { textStyles } from '@/components/text/CustomText';
import useFolderItem from '@/hooks/useFolderItem';
import { HEADER_HEIGHT, PAGE_LABEL_HEIGHT } from '@/lib/constants/miscLayout';
import { EStorageId } from '@/lib/enums/EStorageId';
import { Button, Host, HStack } from '@expo/ui/swift-ui';
import { frame, padding } from '@expo/ui/swift-ui/modifiers';
import { useRouter } from 'expo-router';
import React from 'react';
import { PlatformColor, TextInput, useWindowDimensions, View } from 'react-native';
import { useMMKV } from 'react-native-mmkv';

// ✅ 

type TFolderItemBannerProps = {
    itemId: string;
    backButtonConfig: {
        label: string | undefined;
        hide?: boolean;
        onClick?: () => void;
    };
};

const FolderItemBanner = ({ itemId, backButtonConfig }: TFolderItemBannerProps) => {
    const itemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const router = useRouter();

    const {
        item,
        isEditingValue,
        onToggleEditValue,
        onValueChange,
        OverflowActionsIcon
    } = useFolderItem(itemId, itemStorage);

    return (
        <View
            className='flex-row items-center justify-between w-full relative'
            style={{ height: HEADER_HEIGHT }}
        >

            {/* Back Button */}
            {!backButtonConfig.hide && (
                <Host style={{ position: 'absolute', bottom: '100%', left: 8, width: SCREEN_WIDTH - 16, transform: [{ translateY: -4 }] }}>
                    <HStack modifiers={[frame({ alignment: 'leading', width: SCREEN_WIDTH }), padding({ horizontal: 16 })]}>
                        <Button
                            variant='borderless'
                            onPress={() => backButtonConfig.onClick ? backButtonConfig.onClick() : router.back()}
                            systemImage='chevron.left'
                        >
                            {backButtonConfig.label}
                        </Button>
                    </HStack>
                </Host>
            )}

            {/* Name */}
            <View className='relative flex-1'>
                {isEditingValue ? (
                    <TextInput
                        autoFocus
                        value={item?.value}
                        onChangeText={onValueChange}
                        cursorColor={PlatformColor('systemBlue')}
                        onBlur={onToggleEditValue}
                        autoCapitalize='words'
                        className='bg-transparent pr-2'
                        style={[
                            textStyles.pageLabel,
                            { height: HEADER_HEIGHT, color: PlatformColor(item?.platformColor ?? 'label') }
                        ]}
                    />
                ) : (
                    <View className='pr-2' style={{ height: PAGE_LABEL_HEIGHT }}>
                        <CustomText
                            variant='pageLabel'
                            ellipsizeMode='tail'
                            numberOfLines={1}
                            customStyle={{ color: PlatformColor(item?.platformColor ?? 'label') }}
                        >
                            {item?.value}
                        </CustomText>
                    </View>
                )}
            </View>

            {/* Overflow Actions */}
            <OverflowActionsIcon />

        </View>
    )
};

export default FolderItemBanner;