import ButtonText from '@/components/text/ButtonText';
import CustomText, { textStyles } from '@/components/text/CustomText';
import { useFolderItem } from '@/hooks/useFolderItem';
import { HEADER_HEIGHT } from '@/lib/constants/layout';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { useRouter } from 'expo-router';
import React from 'react';
import { PlatformColor, TextInput, View } from 'react-native';

interface FolderItemBannerProps {
    itemId: string;
    itemType: EFolderItemType;
    backButtonConfig: {
        label: string | undefined;
        hide?: boolean;
        onClick?: () => void;
    };
}

const FolderItemBanner = ({
    itemId,
    itemType,
    backButtonConfig
}: FolderItemBannerProps) => {
    const router = useRouter();
    const {
        folder,
        editingValue,
        onBeginEdit,
        onTitleChange,
        onSave
    } = useFolderItem(itemId, itemType);

    const isItemEditing = editingValue !== null;

    return (
        <View
            className='flex-row items-center justify-between w-full relative'
            style={{ height: HEADER_HEIGHT }}
        >

            {/* Name */}
            {isItemEditing ? (
                <TextInput
                    autoFocus
                    value={editingValue}
                    onChangeText={onTitleChange}
                    cursorColor={PlatformColor('systemBlue')}
                    onSubmitEditing={onSave}
                    onBlur={onSave}
                    className='w-full bg-transparent'
                    style={[
                        textStyles.pageLabel,
                        { height: HEADER_HEIGHT }
                    ]}
                />
            ) : (
                <CustomText
                    variant='pageLabel'
                    onPress={onBeginEdit}
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
