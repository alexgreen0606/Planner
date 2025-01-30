import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput } from 'react-native-paper';
import { FOLDER_STORAGE_ID, FolderItem, FolderItemType } from '../../utils';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import { getFolderItem, updateFolderItem } from '../../storage/folderStorage';
import { ItemStatus } from '../../../../foundation/sortedLists/utils';
import globalStyles from '../../../../foundation/theme/globalStyles';
import GenericIcon from '../../../../foundation/components/icon/GenericIcon';
import Colors from '../../../../foundation/theme/colors';
import CustomText from '../../../../foundation/components/text/CustomText';

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
    const [item, setItem] = useState<FolderItem>();
    const folderStorage = useMMKV({ id: FOLDER_STORAGE_ID });

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

                {/* Icon */}
                <GenericIcon
                    type={itemType === FolderItemType.FOLDER ? 'open-folder' : 'list'}
                    size={28}
                    color={Colors[item.color as keyof typeof Colors]}
                />

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
                        textColor={Colors.WHITE}
                        onSubmitEditing={saveItem}
                        contentStyle={{ paddingLeft: 0 }}
                    />
                ) : (
                    <CustomText
                        type='pageLabel'
                        onPress={beginEditItem}
                        adjustsFontSizeToFit
                        numberOfLines={2}
                        style={globalStyles.blackFilledSpace}
                    >
                        {item.value}
                    </CustomText>
                )}
            </View>

            {/* Back Button */}
            {backButtonConfig.display && (
                <TouchableOpacity
                    style={globalStyles.verticallyCentered}
                    onPress={backButtonConfig.onClick}
                >
                    <GenericIcon
                        type='chevron-left'
                        size={16}
                        color={Colors.BLUE} // TODO: use the color of the previous
                    />
                    <CustomText
                        numberOfLines={1}
                        ellipsizeMode='tail'
                        style={styles.backButton}
                        type='label'
                    >
                        {backButtonConfig.label}
                    </CustomText>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    name: {
        ...globalStyles.verticallyCentered,
        flex: 1,
        height: 40
    },
    inputField: {
        ...globalStyles.blackFilledSpace,
        height: 25,
        fontSize: 25,
    },
    backButton: {
        color: Colors.BLUE,
        width: 60,
    }
});

export default FolderItemBanner;
