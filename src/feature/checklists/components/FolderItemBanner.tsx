import React, { useEffect, useState } from 'react';
import { View, StyleSheet, PlatformColor, TextInput } from 'react-native';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import { LISTS_STORAGE_ID } from '../constants';
import { FolderItem, FolderItemTypes } from '../types';
import { getFolderItem, updateFolderItem } from '../storage';
import { ItemStatus } from '../../../foundation/sortedLists/constants';
import globalStyles from '../../../theme/globalStyles';
import CustomText from '../../../foundation/components/text/CustomText';
import ButtonText from '../../../foundation/components/text/ButtonText';
import { useRouter } from 'expo-router';
import useDimensions from '../../../foundation/hooks/useDimensions';
import { HEADER_HEIGHT } from '../../../constants';

interface FolderItemBannerProps {
    itemId: string;
    backButtonConfig: {
        display: boolean;
        label: string | undefined;
    };
    itemType: FolderItemTypes;
}

const FolderItemBanner = ({
    itemId,
    backButtonConfig,
    itemType
}: FolderItemBannerProps) => {
    const router = useRouter();
    const [item, setItem] = useState<FolderItem>();
    const folderStorage = useMMKV({ id: LISTS_STORAGE_ID });

    const { SCREEN_WIDTH } = useDimensions();

    // Build the item data from storage
    const loadItemData = () => {
        setItem(getFolderItem(itemId, itemType));
    };

    // Load in the initial data
    useEffect(() => {
        loadItemData();
    }, []);

    // Keep the data in sync with storage
    useMMKVListener((key) => {
        if (key === itemId) {
            loadItemData();
        }
    }, folderStorage);

    if (!item) return;

    const beginEditItem = () => setItem({ ...item, status: ItemStatus.EDIT });
    const updateItem = (text: string) => setItem({ ...item, value: text });
    const saveItem = () => updateFolderItem({ ...item, status: ItemStatus.STATIC });
    const isItemEditing = item.status === ItemStatus.EDIT;

    return (
        <View style={[
            globalStyles.pageLabelContainer,
            styles.container
        ]}>

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
            {backButtonConfig.display && (
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
    container: {
        position: 'relative'
    },
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
