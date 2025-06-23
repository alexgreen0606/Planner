import ButtonText from '@/components/text/ButtonText';
import CustomText, { textStyles } from '@/components/text/CustomText';
import { HEADER_HEIGHT } from '@/lib/constants/layout';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EItemStatus } from '@/lib/enums/EItemStatus';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { getFolderItem, updateFolderItem } from '@/storage/checklistsStorage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { PlatformColor, StyleSheet, TextInput, View } from 'react-native';

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
    const [item, setItem] = useState<IFolderItem>(getFolderItem(itemId, itemType));

    const beginEditItem = () => setItem({ ...item, status: EItemStatus.EDIT });
    const updateItem = (text: string) => setItem({ ...item, value: text });
    const saveItem = () => {
        updateFolderItem({ ...item, status: EItemStatus.STATIC });
        setItem(getFolderItem(itemId, itemType));
    };

    const isItemEditing = item.status === EItemStatus.EDIT;

    return (
        <View
            className='flex-row items-center justify-between w-full relative'
            style={{ height: HEADER_HEIGHT }}
        >

            {/* Name */}
            {isItemEditing ? (
                <TextInput
                    autoFocus
                    value={item.value}
                    onChangeText={updateItem}
                    cursorColor={PlatformColor('systemBlue')}
                    onSubmitEditing={saveItem}
                    className='w-full bg-transparent'
                    style={[
                        textStyles.pageLabel,
                        { height: HEADER_HEIGHT }
                    ]}
                />
            ) : (
                <CustomText
                    variant='pageLabel'
                    onPress={beginEditItem}
                    ellipsizeMode='tail'
                    numberOfLines={1}
                >
                    {item.value}
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
                        {backButtonConfig.label} long ass name that goes past the center eye thing
                    </ButtonText>
                </View>
            )}
        </View>
    );
};

export default FolderItemBanner;
