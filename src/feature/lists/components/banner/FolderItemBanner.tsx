import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput } from 'react-native-paper';
import { FOLDER_STORAGE_ID, FolderItem, FolderItemType } from '../../utils';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import { getFolderItem, updateFolderItem } from '../../storage/folderStorage';
import { ItemStatus } from '../../../../foundation/sortedLists/utils';
import globalStyles from '../../../../foundation/theme/globalStyles';
import GenericIcon from '../../../../foundation/components/icon/GenericIcon';
import CustomText from '../../../../foundation/components/text/CustomText';
import { Color } from '../../../../foundation/theme/colors';

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
                    color={item.color}
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
                        textColor={Color.WHITE}
                        onSubmitEditing={saveItem}
                        contentStyle={{ paddingLeft: 0 }}
                    />
                ) : (
                    <CustomText
                        type='pageLabel'
                        onPress={beginEditItem}
                        ellipsizeMode='tail'
                        numberOfLines={1}
                    // style={globalStyles.blackFilledSpace}
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
                        type='chevron-left'
                        size={16}
                        color={Color.BLUE}
                    />
                    <CustomText
                        ellipsizeMode='tail'
                        type='label'
                        numberOfLines={1}
                        style={{ color: Color.BLUE }}
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
