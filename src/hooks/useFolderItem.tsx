import { transferingFolderItemAtom } from '@/atoms/transferingFolderItem';
import PopupList from '@/components/PopupList';
import { selectableColors } from '@/lib/constants/colors';
import { NULL } from '@/lib/constants/generic';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EPopupActionType } from '@/lib/enums/EPopupActionType';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { deleteFolderItemFromStorage, getFolderItemFromStorageById, getListItemFromStorageById, saveFolderItemToStorage } from '@/storage/checklistsStorage';
import { deleteChecklistItems, deleteFolderItemAndChildren } from '@/utils/checklistUtils';
import { isValidPlatformColor } from '@/utils/colorUtils';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { Alert, PlatformColor } from 'react-native';
import { MMKV, useMMKVObject } from 'react-native-mmkv';
import useAppTheme from './useAppTheme';
import useTextfieldItemAs from './useTextfieldItemAs';

// ✅ 

enum EFolderAction {
    EDIT_TITLE = 'EDIT_TITLE',
    DELETE_AND_SCATTER = 'DELETE_AND_SCATTER',
    ERASE_CONTENTS = 'ERASE_CONTENTS',
    DELETE_ALL = 'DELETE_ALL'
}

const useFolderItem = (itemId: string, itemStorage: MMKV) => {
    const router = useRouter();

    const [transferingItem, setTransferingItem] = useAtom(transferingFolderItemAtom);

    const [isEditingValue, setIsEditingValue] = useState(false);

    const [item, setItem] = useMMKVObject<IFolderItem>(itemId, itemStorage);

    const { textfieldItem, onCloseTextfield } = useTextfieldItemAs<IFolderItem>(itemStorage);

    const { overflowActionText } = useAppTheme();

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

    function handleAction(action: string) {
        if (!item) return;

        onCloseTextfield();

        if (isValidPlatformColor(action)) {
            setItem((prev) => prev ? ({
                ...prev, platformColor: action
            }) : prev);
        }

        let message = '';
        switch (action) {
            case EFolderAction.EDIT_TITLE:
                handleToggleEditValue();
                break;
            case EFolderAction.DELETE_ALL:
                const hasChildren = item.itemIds.length > 0;
                message = `Would you like to delete this ${item.type}?${hasChildren ? ' All inner contents will be lost.' : ''}`;

                Alert.alert(
                    `Delete "${item.value}"?`,
                    message,
                    [
                        {
                            text: "Cancel",
                            style: "cancel",
                        },
                        {
                            text: hasChildren ? "Force Delete" : "Delete",
                            style: "destructive",
                            onPress: () => {
                                deleteFolderItemAndChildren(item, true);
                                router.back();
                            },
                        },
                    ]
                );

                break;
            case EFolderAction.ERASE_CONTENTS:
                message = `Would you like to erase all contents from this ${item.type}?`;

                Alert.alert(
                    `Erase All Contents?`,
                    message,
                    [
                        {
                            text: "Cancel",
                            style: "cancel",
                        },
                        {
                            text: "Erase",
                            style: "destructive",
                            onPress: () => {
                                if (item.type === EFolderItemType.FOLDER) {
                                    item.itemIds.forEach(childFolderItemId => {
                                        const childFolderItem = getFolderItemFromStorageById(childFolderItemId);
                                        deleteFolderItemAndChildren(childFolderItem);
                                    });
                                } else {
                                    deleteChecklistItems(item.itemIds.map(getListItemFromStorageById));
                                }
                            },
                        },
                    ]
                );

                break;
            case EFolderAction.DELETE_AND_SCATTER:
                const parentFolder = getFolderItemFromStorageById(item.listId);
                item.itemIds.forEach((id) => {
                    const childItem = getFolderItemFromStorageById(id);
                    childItem.listId = parentFolder.id;
                    parentFolder.itemIds.push(id);
                    saveFolderItemToStorage(childItem);
                });
                parentFolder.itemIds = parentFolder.itemIds.filter((id) => id !== item.id);
                saveFolderItemToStorage(parentFolder);
                deleteFolderItemFromStorage(item.id);
                router.back();
                break;
        }
    }

    // ==================
    //  Overflow Actions
    // ==================

    const OverflowActionsIcon = () => (
        <PopupList actions={[
            {
                onPress: () => handleAction(EFolderAction.EDIT_TITLE),
                title: `Edit Title`,
                systemImage: 'pencil',
                type: EPopupActionType.BUTTON
            },
            {
                type: EPopupActionType.SUBMENU,
                title: 'Change Color',
                systemImage: 'paintbrush',
                items: selectableColors.map((color) => ({
                    title: color === 'label' ? 'None' : color.replace('system', ''),
                    type: EPopupActionType.BUTTON,
                    systemImage: item?.platformColor === color ? 'inset.filled.circle' : 'circle',
                    color: PlatformColor(color) as unknown as string,
                    onPress: () => handleAction(color),
                }))
            },
            {
                type: EPopupActionType.SUBMENU,
                title: 'Delete Options',
                systemImage: 'trash',
                items: [
                    {
                        type: EPopupActionType.BUTTON,
                        onPress: () => handleAction(EFolderAction.DELETE_AND_SCATTER),
                        title: 'Delete And Scatter',
                        // subtitle: 'All contents will be transfered upward.',
                        systemImage: 'shippingbox.and.arrow.backward',
                        hidden: item?.type !== EFolderItemType.FOLDER || item?.listId === NULL || !item?.itemIds.length
                    },
                    {
                        type: EPopupActionType.BUTTON,
                        onPress: () => handleAction(EFolderAction.ERASE_CONTENTS),
                        title: 'Erase All Contents',
                        systemImage: 'minus',
                        hidden: !item?.itemIds.length
                    },
                    {
                        type: EPopupActionType.BUTTON,
                        onPress: () => handleAction(EFolderAction.DELETE_ALL),
                        title: `Delete Entire ${item?.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : ""}`,
                        destructive: true,
                        hidden: item?.listId === NULL,
                        systemImage: 'trash'
                    }
                ]
            }
        ]} />
    );

    return {
        item,
        itemIds: item?.itemIds ?? [],
        isEditingValue,
        isTransferMode: !!transferingItem,
        textfieldItem,
        transferingItem,
        OverflowActionsIcon,
        onEndTransfer: handleEndItemTransfer,
        onValueChange: handleValueChange,
        onToggleEditValue: handleToggleEditValue,
    }
};

export default useFolderItem;