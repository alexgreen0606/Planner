import ButtonText from '@/components/text/ButtonText';
import CustomText, { textStyles } from '@/components/text/CustomText';
import { useFolderItem } from '@/hooks/useFolderItem';
import { HEADER_HEIGHT } from '@/lib/constants/miscLayout';
import { EStorageId } from '@/lib/enums/EStorageId';
import { useRouter } from 'expo-router';
import React from 'react';
import { PlatformColor, TextInput, View } from 'react-native';
import { useMMKV } from 'react-native-mmkv';

// ✅ 

type FolderItemBannerProps = {
    itemId: string;
    backButtonConfig: {
        label: string | undefined;
        hide?: boolean;
        onClick?: () => void;
    };
};

const FolderItemBanner = ({
    itemId,
    backButtonConfig
}: FolderItemBannerProps) => {
    const itemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
    const router = useRouter();

    const {
        item: folder,
        isEditingValue,
        onToggleEditValue,
        onEditValue
    } = useFolderItem(itemId, itemStorage);

    return (
        <View
            className='flex-row items-center justify-between w-full relative'
            style={{ height: HEADER_HEIGHT }}
        >

            {/* Name */}
            {isEditingValue ? (
                <TextInput
                    autoFocus
                    value={folder?.value}
                    onChangeText={onEditValue}
                    cursorColor={PlatformColor('systemBlue')}
                    onBlur={onToggleEditValue}
                    className='w-full bg-transparent'
                    style={[
                        textStyles.pageLabel,
                        { height: HEADER_HEIGHT }
                    ]}
                />
            ) : (
                <CustomText
                    variant='pageLabel'
                    onPress={onToggleEditValue}
                    ellipsizeMode='tail'
                    numberOfLines={1}
                >
                    {folder?.value}
                </CustomText>
            )}

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

        </View>
    );
};

export default FolderItemBanner;
