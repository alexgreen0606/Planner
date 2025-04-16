import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, PlatformColor, TextInput } from 'react-native';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import { LISTS_STORAGE_ID } from '../../../feature/checklists/constants';
import { FolderItem, FolderItemTypes } from '../../../feature/checklists/types';
import { getFolderItem, updateFolderItem } from '../../../feature/checklists/storage/folderStorage';
import { ItemStatus } from '../../../foundation/sortedLists/constants';
import globalStyles from '../../../foundation/theme/globalStyles';
import GenericIcon from '../../../foundation/components/GenericIcon';
import CustomText from '../../../foundation/components/text/CustomText';
import ButtonText from '../../../foundation/components/text/ButtonText';

interface FolderItemBannerProps {
    itemId: string;
    backButtonConfig: {
        display: boolean;
        label: string | undefined;
        onClick: () => void;
    };
    itemType: FolderItemTypes;
}

const FolderItemBanner = ({
    itemId,
    backButtonConfig,
    itemType
}: FolderItemBannerProps) => {
    const [item, setItem] = useState<FolderItem>();
    const folderStorage = useMMKV({ id: LISTS_STORAGE_ID });

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
        <View style={globalStyles.pageLabelContainer}>
            <View style={styles.name}>

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
            </View>

            {/* Back Button */}
            {backButtonConfig.display && (
                <ButtonText
                    platformColor='systemBlue'
                    onClick={backButtonConfig.onClick}
                    iconConfig={{
                        type: 'chevronLeft',
                        platformColor: 'systemBlue'
                    }}
                >
                    {backButtonConfig.label}
                </ButtonText>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    name: {
        ...globalStyles.verticallyCentered,
        flex: 1,
        marginRight: 40
    },
    inputField: {
        ...globalStyles.blackFilledSpace,
        height: 25,
        fontSize: 25,
        backgroundColor: 'transparent',
        color: PlatformColor('label'),
    },
    backButton: {
        ...globalStyles.verticallyCentered,
        gap: 0,
        maxWidth: 70,
        justifyContent: 'flex-end'
    }
});


export default FolderItemBanner;
