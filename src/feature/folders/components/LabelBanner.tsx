import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, TextInput, useTheme } from 'react-native-paper';
import { theme } from '../../../theme/theme';
import { FolderItemType } from '../enums';
import { FontAwesome } from '@expo/vector-icons';
import globalStyles from '../../../theme/globalStyles';
import { Folder, FolderItem } from '../types';
import { getFolder, getList, updateFolderItem } from '../storage/folderStorage';
import { ItemStatus } from '../../../foundation/sortedLists/enums';

interface LabelBannerProps {
    dataId: string;
    backButtonConfig: {
        display: boolean;
        label: string | undefined;
        onClick: () => void;
    };
    type: FolderItemType;
}

const LabelBanner = ({ dataId, backButtonConfig, type }: LabelBannerProps) => {
    const { colors } = useTheme();
    const iconStyle = type === FolderItemType.FOLDER ? 'folder-o' : 'bars';
    const [localData, setLocalData] = useState<FolderItem>();

    useEffect(() => {
        if (type === FolderItemType.FOLDER) {
            const data = getFolder(dataId);
            setLocalData({
                id: data.id,
                value: data.value,
                sortId: data.sortId,
                status: ItemStatus.STATIC,
                type: FolderItemType.FOLDER,
                childrenCount: data.folderIds.length + data.listIds.length,
            } as FolderItem);
        } else {
            const data = getList(dataId);
            setLocalData({
                id: data.id,
                value: data.value,
                sortId: data.sortId,
                status: ItemStatus.STATIC,
                type: FolderItemType.LIST,
                childrenCount: data.items.length,
            } as FolderItem);
        }
    }, [])

    const saveEdit = () => {
        if (localData) {
            localData.status = ItemStatus.STATIC;
            updateFolderItem(localData);
        }
    }

    const toggleEditMode = () => {
        if (localData)
            setLocalData({
                ...localData,
                status: localData.status === ItemStatus.STATIC ? ItemStatus.EDIT : ItemStatus.DELETE
            })
    }

    return (
        <View style={styles.container}>
            {backButtonConfig.display && (
                <Button
                    mode="text"
                    onPress={backButtonConfig.onClick}
                    icon="chevron-left"
                    theme={{ colors: { primary: colors.secondary } }}
                >
                    {backButtonConfig.label}
                </Button>
            )}
            <View style={globalStyles.spacedApart}>
                <View style={styles.label}>
                    <FontAwesome
                        name={iconStyle}
                        size={26}
                        color={colors.primary}
                    />
                    {localData?.status === ItemStatus.EDIT ? (
                        <TextInput
                            mode="flat"
                            autoFocus
                            value={localData.value}
                            onChangeText={(text) => setLocalData({ ...localData, value: text })}
                            selectionColor="white"
                            style={styles.textInput}
                            theme={{
                                colors: {
                                    text: colors.primary,
                                    primary: 'transparent',
                                },
                            }}
                            underlineColor="transparent"
                            textColor={colors.primary}
                            onSubmitEditing={saveEdit}
                            contentStyle={{ paddingLeft: 0 }}
                        />
                    ) : (
                        <Text adjustsFontSizeToFit style={styles.labelText} numberOfLines={2}>
                            {localData?.value}
                        </Text>
                    )}
                </View>
                {localData?.status !== ItemStatus.EDIT && (
                    <FontAwesome
                        name='pencil'
                        size={18}
                        color={colors.outline}
                        onPress={toggleEditMode}
                    />
                )}
            </View>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingHorizontal: 8,
    },
    label: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    labelText: {
        fontSize: 25,
        color: theme.colors.primary,
    },
    textInput: {
        color: theme.colors.primary,
        height: 25,
        fontSize: 25,
        backgroundColor: theme.colors.background,
    },
});

export default LabelBanner;
