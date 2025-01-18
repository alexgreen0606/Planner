import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput } from 'react-native-paper';
import globalStyles from '../../../foundation/theme/globalStyles';
import { getFolderItem, updateFolderItem } from '../storage/folderStorage';
import CustomText from '../../../foundation/components/text/CustomText';
import GenericIcon from '../../../foundation/components/icons/GenericIcon';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import colors from '../../../foundation/theme/colors';
import { FOLDER_STORAGE_ID, FolderItem, FolderItemType } from '../utils';
import { ItemStatus } from '../../../foundation/sortedLists/utils';

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

    // Builds the folder item data from storage
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

    const styles = StyleSheet.create({
        label: {
            ...globalStyles.verticallyCentered,
            gap: 8,
            flex: 1,
        },
        labelText: {
            fontSize: 25,
            color: colors.white,
            flex: 1
        },
        textInput: {
            ...globalStyles.backdrop,
            height: 25,
            fontSize: 25,
            flex: 1
        },
        backButton: {
            color: colors.blue,
            maxWidth: 80,
        }
    });

    return (
        <View style={{ ...globalStyles.spacedApart, paddingHorizontal: 8 }}>
            <View style={styles.label}>

                {/* Type Icon */}
                <GenericIcon
                    type={itemType === FolderItemType.FOLDER ? 'open-folder' : 'list'}
                    size={28}
                    color={colors[item.color as keyof typeof colors]}
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
                        textColor={colors.white}
                        onSubmitEditing={saveItem}
                        contentStyle={{ paddingLeft: 0 }}
                    />
                ) : (
                    <Text
                        onPress={beginEditItem}
                        adjustsFontSizeToFit
                        style={styles.labelText}
                        numberOfLines={1}
                    >
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
                            type='chevron-left'
                            size={16}
                            color={colors.blue} // TODO: use the color of the previous
                        />
                        <CustomText
                            numberOfLines={1}
                            ellipsizeMode='tail'
                            style={styles.backButton}
                            type='label'
                        >
                            {backButtonConfig.label}
                        </CustomText>
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default FolderItemBanner;
