import { ToolbarIcon } from '@/components/lists/components/ListToolbar';
import { selectableColors } from '@/lib/constants/colors';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { deleteFolderItemAndChildren } from '@/utils/checklistUtils';
import { useState } from 'react';
import { Alert } from 'react-native';
import { MMKV, useMMKV, useMMKVObject } from 'react-native-mmkv';
import { useTextfieldItemAs } from './useTextfieldItemAs';

//

export const useFolderItem = (itemId: string, itemStorage: MMKV) => {
    const [item, setItem] = useMMKVObject<IFolderItem>(itemId, itemStorage);

    const { textfieldItem, onSetTextfieldItem, onCloseTextfield } = useTextfieldItemAs<IFolderItem>(itemStorage);

    const [isTransfering, setIsTransfering] = useState(false);
    const [isEditingValue, setIsEditingValue] = useState(false);

    // =====================
    // 1. Exposed Functions
    // =====================

    function handleToggleEditValue() {
        setIsEditingValue(prev => !prev);
    }

    function handleEditValue(value: string) {
        setItem((prev) => {
            if (!prev) return prev;
            return { ...prev, value };
        });
    }

    function handleEndItemTransfer() {
        setIsTransfering(false);
    }

    // ====================
    // 2. Helper Functions
    // ====================

    function handleBeginItemTransfer() {
        setIsTransfering(true);
    }

    function handleChangeItemColor(platformColor: string) {
        onSetTextfieldItem((prev) => {
            if (!prev) return prev;
            return { ...prev, platformColor };
        });
    }

    function handleToggleItemType() {
        onSetTextfieldItem((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                type:
                    prev.type === EFolderItemType.FOLDER ? EFolderItemType.LIST : EFolderItemType.FOLDER
            };
        });
    }

    const toolbarIconSet: ToolbarIcon<IFolderItem>[][] = !textfieldItem
        ? []
        : [
            // Folder/List toggle
            textfieldItem.itemIds.length === 0
                ? [
                    {
                        type: "folder",
                        onClick: handleToggleItemType,
                        platformColor:
                            textfieldItem.type === EFolderItemType.FOLDER
                                ? textfieldItem.platformColor
                                : "secondaryLabel",
                    },
                    {
                        type: "list",
                        onClick: handleToggleItemType,
                        platformColor:
                            textfieldItem.type === EFolderItemType.LIST
                                ? textfieldItem.platformColor
                                : "secondaryLabel",
                    },
                ]
                : [],

            // Color selection
            Object.values(selectableColors).map(color => ({
                type: textfieldItem?.platformColor === color ? 'circleFilled' : 'circle',
                platformColor: color,
                onClick: () => handleChangeItemColor(color),
            })),

            // Transfer
            [
                {
                    type: "transfer",
                    onClick: handleBeginItemTransfer,
                },
            ],

            // Delete
            [
                {
                    onClick: () => {
                        const title = `Delete ${textfieldItem.type}?`;
                        const hasNestedItems = textfieldItem.itemIds.length > 0;

                        let message = "";
                        if (hasNestedItems) {
                            message += `This ${textfieldItem.type} has ${textfieldItem.itemIds.length} items. Deleting is irreversible and will lose all inner contents.`;
                        } else {
                            message += `Would you like to delete this ${textfieldItem.type}?`;
                        }

                        Alert.alert(title, message, [
                            {
                                text: "Cancel",
                                style: "cancel",
                            },
                            {
                                text: hasNestedItems ? "Force Delete" : "Delete",
                                style: "destructive",
                                onPress: () => {
                                    onCloseTextfield();
                                    deleteFolderItemAndChildren(textfieldItem);
                                },
                            },
                        ]);
                    },
                    type: "trash",
                },
            ],
        ];

    return {
        item,
        itemIds: item?.itemIds ?? [],
        isEditingValue,
        isTransferMode: isTransfering,
        textfieldItem,
        toolbarIconSet,
        onEndTransfer: handleEndItemTransfer,
        onEditValue: handleEditValue,
        onToggleEditValue: handleToggleEditValue,
    }
};