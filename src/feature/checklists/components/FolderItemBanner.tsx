import ButtonText from '@/components/text/ButtonText';
import CustomText from '@/components/text/CustomText';
import { HEADER_HEIGHT } from '@/constants/layout';
import { EFolderItemType } from '@/enums/EFolderItemType';
import { EItemStatus } from '@/enums/EItemStatus';
import { useDimensions } from '@/services/DimensionsProvider';
import { IFolderItem } from '@/types/listItems/IFolderItem';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { PlatformColor, StyleSheet, TextInput, View } from 'react-native';
import { getFolderItem, updateFolderItem } from '../../../storage/checklistsStorage';

interface FolderItemBannerProps {
    itemId: string;
    itemType: EFolderItemType;
    backButtonConfig: {
        pathname: string;
        label: string | undefined;
        hide?: boolean;
    };
}

const FolderItemBanner = ({
    itemId,
    itemType,
    backButtonConfig
}: FolderItemBannerProps) => {
    const router = useRouter();
    const [item, setItem] = useState<IFolderItem>(getFolderItem(itemId, itemType));
    const { SCREEN_WIDTH } = useDimensions();

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
                        onClick={() => router.back()}
                        iconConfig={{
                            type: 'chevronLeft',
                            platformColor: 'systemBlue'
                        }}
                        containerStyle={{ width: SCREEN_WIDTH - 60 }}
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
