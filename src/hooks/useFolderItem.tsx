import { IToolbarIconConfig } from '@/components/lists/components/ListToolbar';
import { selectableColors } from '@/lib/constants/colors';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { deleteFolderItemAndChildren } from '@/utils/checklistUtils';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { MMKV, useMMKVObject } from 'react-native-mmkv';
import ToggleFolderItemTypeIcon from '@/components/icon/ToggleFolderItemTypeIcon';
import TransferFolderIcon from '@/components/icon/TransferFolderIcon';
import useTextfieldItemAs from './useTextfieldItemAs';

// ✅ 

const useFolderItem = (itemId: string, itemStorage: MMKV) => {
    const [item, setItem] = useMMKVObject<IFolderItem>(itemId, itemStorage);

    const [transferingItem, setTransferingItem] = useState<IFolderItem | null>(null);
    const [isEditingValue, setIsEditingValue] = useState(false);

    const { textfieldItem, textfieldId, onSetTextfieldItem, onCloseTextfield } = useTextfieldItemAs<IFolderItem>(itemStorage);

    // Clear the transfering item if a new item begins editing.
    useEffect(() => {
        if (textfieldId) {
            setTransferingItem(null);
        }
    }, [textfieldId]);

    // =====================
    // 1. Exposed Functions
    // =====================

    function handleToggleEditValue() {
        setIsEditingValue(prev => !prev);
    }

    function handleValueChange(value: string) {
        setItem((prev) => {
            if (!prev) return prev;
            return { ...prev, value };
        });
    }

    function handleEndItemTransfer() {
        setTransferingItem(null);
    }

    // ====================
    // 2. Helper Functions
    // ====================

    function beginFocusedItemTransfer() {
        if (!textfieldItem) return;

        setTransferingItem({ ...textfieldItem });
        onCloseTextfield();
    }

    function changeFocusedItemColor(platformColor: string) {
        onSetTextfieldItem((prev) => {
            if (!prev) return prev;
            return { ...prev, platformColor };
        });
    }

    function toggleFocusedItemType() {
        onSetTextfieldItem((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                type:
                    prev.type === EFolderItemType.FOLDER ? EFolderItemType.LIST : EFolderItemType.FOLDER
            };
        });
    }

    // ==================
    // 3. Toolbar Config
    // ==================

    const toolbarIconSet: IToolbarIconConfig<IFolderItem>[][] = !textfieldItem
        ? []
        : [
            // Delete
            [
                {
                    onClick: () => {
                        onCloseTextfield();

                        if (textfieldItem.value.trim() === '') return;

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

            // Folder/List toggle
            [
                {
                    customIcon: (
                        <ToggleFolderItemTypeIcon disabled={textfieldItem.itemIds.length > 0} currentType={textfieldItem.type} />
                    ),
                    type: textfieldItem.type,
                    onClick: textfieldItem.itemIds.length > 0 ? undefined : toggleFocusedItemType,

                },
            ],

            // Transfer
            [
                {
                    type: "transfer",
                    onClick: textfieldItem.value.length === 0 ? undefined : beginFocusedItemTransfer,
                    customIcon: (
                        <TransferFolderIcon disabled={textfieldItem.value.length === 0} />
                    )
                },
            ],

            // Color selection
            Object.values(selectableColors).map(color => ({
                type: textfieldItem?.platformColor === color ? 'circleFilled' : 'circle',
                platformColor: color,
                onClick: () => changeFocusedItemColor(color),
            })),
        ];

    return {
        item,
        itemIds: item?.itemIds ?? [],
        isEditingValue,
        isTransferMode: !!transferingItem,
        textfieldItem,
        toolbarIconSet,
        transferingItem,
        onEndTransfer: handleEndItemTransfer,
        onValueChange: handleValueChange,
        onToggleEditValue: handleToggleEditValue,
    }
};

export default useFolderItem;