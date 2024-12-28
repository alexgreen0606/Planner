import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';
import { theme } from '../../../theme/theme';
import { FolderItemType } from '../enums';
import globalStyles from '../../../theme/globalStyles';
import { FolderItem } from '../types';
import { getFolderFromStorage, getListFromStorage, getStorageKey, updateFolderItem } from '../storage/folderStorage';
import { ItemStatus } from '../../../foundation/sortedLists/enums';
import CustomText from '../../../foundation/ui/text';
import GenericIcon from '../../../foundation/ui/icons/GenericIcon';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import { StorageIds } from '../../../enums';

interface FolderItemBannerProps {
    itemId: string;
    backButtonConfig: {
        display: boolean;
        label: string | undefined;
        onClick: () => void;
    };
    itemType: FolderItemType;
}

const FolderItemBanner = ({
    itemId,
    backButtonConfig,
    itemType
}: FolderItemBannerProps) => {
    const { colors } = useTheme();
    const [item, setItem] = useState<FolderItem>();
    const folderStorage = useMMKV({ id: StorageIds.FOLDER_STORAGE });

    // Builds the folder item data from storage
    const loadItemData = () => {
        if (itemType === FolderItemType.FOLDER) {
            const data = getFolderFromStorage(itemId);
            setItem({
                id: data.id,
                value: data.value,
                sortId: data.sortId,
                status: ItemStatus.STATIC,
                type: FolderItemType.FOLDER,
                childrenCount: data.folderIds.length + data.listIds.length,
            } as FolderItem);
        } else {
            const data = getListFromStorage(itemId);
            setItem({
                id: data.id,
                value: data.value,
                sortId: data.sortId,
                status: ItemStatus.STATIC,
                type: FolderItemType.LIST,
                childrenCount: data.items.length,
            } as FolderItem);
        }
    }

    // Load in the initial data
    useEffect(() => {
        loadItemData();
    }, [])

    // Keep the data in sync with storage
    useMMKVListener((key) => {
        if (key === getStorageKey(itemId)) {
            loadItemData();
        }
    }, folderStorage)

    if (!item) return;

    const beginEditItem = () => setItem({ ...item, status: ItemStatus.EDIT });
    const updateItem = (text: string) => setItem({ ...item, value: text });
    const saveItem = () => updateFolderItem({ ...item, status: ItemStatus.STATIC });

    const isItemEditing = item.status === ItemStatus.EDIT;

    return (
        <View style={globalStyles.listRow}>
            <View style={styles.label}>

                {/* Type Icon */}
                <GenericIcon
                    type='Entypo'
                    name={itemType === FolderItemType.FOLDER ? 'folder' : 'list'}
                    size={26}
                    color={colors.primary}
                />

                {/* Item Name */}
                {isItemEditing ? (
                    <TextInput
                        autoFocus
                        value={item.value}
                        onChangeText={updateItem}
                        style={styles.textInput}
                        selectionColor="white"
                        theme={{
                            colors: {
                                primary: 'transparent'
                            }
                        }}
                        textColor={colors.secondary}
                        onSubmitEditing={saveItem}
                        contentStyle={{ paddingLeft: 0 }}
                    />
                ) : (
                    <Text
                        onPress={beginEditItem}
                        adjustsFontSizeToFit
                        style={styles.labelText}
                        numberOfLines={1}>
                        {item.value}
                    </Text>
                )}
            </View>

            {/* Back Button */}
            {backButtonConfig.display && (
                <TouchableOpacity
                    onPress={backButtonConfig.onClick}
                >
                    <View style={globalStyles.verticallyCentered}>
                        <GenericIcon
                            type='MaterialIcons'
                            name='chevron-left'
                            size={16}
                            color={colors.secondary}
                        />
                        <CustomText
                            numberOfLines={1}
                            ellipsizeMode='tail'
                            style={styles.backButton}
                            type='collapseText'
                        >
                            {backButtonConfig.label}
                        </CustomText>
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    label: {
        ...globalStyles.verticallyCentered,
        gap: 8,
        flex: 1
    },
    labelText: {
        fontSize: 25,
        color: theme.colors.secondary,
        flex: 1
    },
    textInput: {
        ...globalStyles.backdrop,
        height: 25,
        fontSize: 25,
        flex: 1
    },
    backButton: {
        color: theme.colors.secondary,
        marginLeft: 2,
        maxWidth: 80,
    }
});

export default FolderItemBanner;
