import ButtonText from '@/components/text/ButtonText';
import CustomText, { textStyles } from '@/components/text/CustomText';
import useFolderItem from '@/hooks/useFolderItem';
import { HEADER_HEIGHT, PAGE_LABEL_HEIGHT } from '@/lib/constants/miscLayout';
import { EStorageId } from '@/lib/enums/EStorageId';
import { useRouter } from 'expo-router';
import React from 'react';
import { PlatformColor, TextInput, View } from 'react-native';
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
    const router = useRouter();

    const {
        item,
        isEditingValue,
        onToggleEditValue,
        onValueChange,
        OverflowIcon
    } = useFolderItem(itemId, itemStorage);

    return (
        <View
            className='flex-row items-center justify-between w-full relative'
            style={{ height: HEADER_HEIGHT }}
        >

            {/* Back Button */}
            {!backButtonConfig.hide && (
                <View className='absolute bottom-full translate-y-1'>
                    <ButtonText
                        onClick={() => backButtonConfig.onClick ? backButtonConfig.onClick() : router.back()}
                        iconConfig={{
                            type: 'chevronLeft',
                            platformColor: 'systemBlue'
                        }}
                        className='w-screen pr-8'
                    >
                        {backButtonConfig.label}
                    </ButtonText>
                </View>
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
            <OverflowIcon />

        </View>
    )
};

export default FolderItemBanner;