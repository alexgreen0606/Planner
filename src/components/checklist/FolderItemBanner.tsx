import ButtonText from '@/components/text/ButtonText';
import CustomText from '@/components/text/CustomText';
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
                    style={styles.inputField}
                    cursorColor={PlatformColor('systemBlue')}
                    onSubmitEditing={saveItem}
                />
            ) : (
                <CustomText
                    type='pageLabel'
                    onPress={beginEditItem}
                    ellipsizeMode='tail'
                    numberOfLines={1}
                >
                    {item.value}
                </CustomText>
            )}

            {/* Back Button */}
            {!backButtonConfig.hide && (
                <View style={styles.backButton}>
                    <ButtonText
                        platformColor='systemBlue'
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

const styles = StyleSheet.create({
    inputField: {
        height: HEADER_HEIGHT,
        width: '100%',
        fontSize: 25,
        backgroundColor: 'transparent',
        color: PlatformColor('label'),
    },
    backButton: {
        gap: 0,
        position: 'absolute',
        left: 0,
        bottom: 50,
        transform: 'translateY(10px)'
    }
});


export default FolderItemBanner;
