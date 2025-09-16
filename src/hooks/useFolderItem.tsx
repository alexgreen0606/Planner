import { transferingFolderItemAtom } from '@/atoms/transferingFolderItem';
import GenericIcon from '@/components/icon';
import useOverflowActions from '@/hooks/useOverflowActions';
import { platformToRgbMap, selectableColors } from '@/lib/constants/colors';
import { NULL } from '@/lib/constants/generic';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { deleteFolderItemFromStorage, getFolderItemFromStorageById, getListItemFromStorageById, saveFolderItemToStorage } from '@/storage/checklistsStorage';
import { deleteChecklistItems, deleteFolderItemAndChildren } from '@/utils/checklistUtils';
import { isValidPlatformColor } from '@/utils/colorUtils';
import { MenuAction, MenuView } from '@react-native-menu/menu';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { Alert } from 'react-native';
import { MMKV, useMMKVObject } from 'react-native-mmkv';
import useAppTheme from './useAppTheme';
import useTextfieldItemAs from './useTextfieldItemAs';

// ✅ 

enum EFolderAction {
    EDIT_TITLE = 'EDIT_TITLE',
    SCATTER = 'SCATTER',
    ERASE_CONTENTS = 'ERASE_CONTENTS',
    DELETE = 'DELETE',
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
            case EFolderAction.DELETE:
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
            case EFolderAction.SCATTER:
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

    // =================
    // Overflow Actions
    // =================

    const colorSubactions: MenuAction[] = selectableColors.map((color) => ({
        id: color,
        title: color === 'label' ? 'None' : color.replace('system', ''),
        image: item?.platformColor === color ? 'inset.filled.circle' : 'circle',
        imageColor: color === 'label' ? overflowActionText : platformToRgbMap[color],
        state: item?.platformColor === color ? 'on' : 'off'
    }));

    const deleteSubactions = [
        {
            id: EFolderAction.SCATTER,
            title: 'Delete And Scatter',
            subtitle: 'All contents will be transfered upward.',
            image: 'shippingbox.and.arrow.backward',
            attributes: {
                hidden: item?.type !== EFolderItemType.FOLDER || item?.listId === NULL || !item?.itemIds.length
            }
        },
        {
            id: EFolderAction.ERASE_CONTENTS,
            title: 'Erase All Contents',
            image: 'minus',
            attributes: {
                hidden: !item?.itemIds.length
            }
        },
        {
            id: EFolderAction.DELETE,
            title: `Delete Entire ${item?.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : ""}`,
            attributes: {
                destructive: true,
                hidden: item?.listId === NULL
            },
            image: 'trash'
        }
    ];

    const overflowActions = useOverflowActions([
        {
            id: EFolderAction.EDIT_TITLE,
            title: `Edit Title`,
            image: 'pencil',
        },
        {
            id: 'colors',
            title: 'Change Color',
            image: 'paintbrush',
            subactions: colorSubactions,
        },
        {
            id: 'delete',
            title: 'Delete Options',
            image: 'trash',
            subactions: deleteSubactions,
        },
    ]);

    const OverflowIcon = () => (
        <MenuView
            title={item?.value}
            onPressAction={({ nativeEvent }) => {
                handleAction(nativeEvent.event);
            }}
            actions={overflowActions}
        >
            <GenericIcon size='l' type='more' platformColor='systemBlue' />
        </MenuView>
    );

    return {
        item,
        itemIds: item?.itemIds ?? [],
        isEditingValue,
        isTransferMode: !!transferingItem,
        textfieldItem,
        transferingItem,
        OverflowIcon,
        onEndTransfer: handleEndItemTransfer,
        onValueChange: handleValueChange,
        onToggleEditValue: handleToggleEditValue,
    }
};

export default useFolderItem;