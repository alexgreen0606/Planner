import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, PlatformColor } from 'react-native';
import { TextInput } from 'react-native-paper';
import { FolderItem, FolderItemTypes } from '../../../../feature/checklists/types';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import { getFolderItem, updateFolderItem } from '../../../../feature/checklists/storage/folderStorage';
import { ItemStatus } from '../../../../foundation/sortedLists/constants';
import globalStyles from '../../../../foundation/theme/globalStyles';
import GenericIcon from '../../../../foundation/components/GenericIcon';
import CustomText from '../../../../foundation/components/text/CustomText';
import { BANNER_HEIGHT } from '../../../../foundation/components/constants';
import { LISTS_STORAGE_ID } from '../../../../feature/checklists/constants';

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
        <View style={{ height: BANNER_HEIGHT }}>
            <View style={globalStyles.pageLabelContainer}>
                <View style={styles.name}>

                    {/* Name */}
                    {isItemEditing ? (
                        <TextInput
                            autoFocus
                            value={item.value}
                            onChangeText={updateItem}
                            style={styles.inputField}
                            selectionColor="white"
                            theme={{
                                colors: {
                                    primary: 'transparent'
                                }
                            }}
                            onSubmitEditing={saveItem}
                            contentStyle={{ paddingLeft: 0 }}
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
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={backButtonConfig.onClick}
                    >
                        <GenericIcon
                            type='chevronLeft'
                            size='m'
                            platformColor='systemBlue'
                        />
                        <CustomText
                            ellipsizeMode='tail'
                            type='label'
                            numberOfLines={1}
                            style={{ color: PlatformColor('systemBlue') }}
                        >
                            {backButtonConfig.label}
                        </CustomText>
                    </TouchableOpacity>
                )}
            </View>
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
    },
    backButton: {
        ...globalStyles.verticallyCentered,
        gap: 0,
        maxWidth: 70,
        justifyContent: 'flex-end'
    }
});


export default FolderItemBanner;
