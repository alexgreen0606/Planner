import PopupList from '@/components/PopupList';
import { selectableColors } from '@/lib/constants/colors';
import { NULL } from '@/lib/constants/generic';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EPopupActionType } from '@/lib/enums/EPopupActionType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { TChecklistsPageParams } from '@/lib/types/routeParams/TChecklistPageParams';
import { deleteFolderItemFromStorage, getFolderItemFromStorageById, getListItemFromStorageById, saveFolderItemToStorage } from '@/storage/checklistsStorage';
import { deleteChecklistItems, deleteFolderItemAndChildren } from '@/utils/checklistUtils';
import { isValidPlatformColor } from '@/utils/colorUtils';
import { useRouter } from 'expo-router';
import { Alert, PlatformColor } from 'react-native';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';

enum EFolderAction {
    EDIT_TITLE = 'EDIT_TITLE',
    DELETE_AND_SCATTER = 'DELETE_AND_SCATTER',
    ERASE_CONTENTS = 'ERASE_CONTENTS',
    DELETE_ALL = 'DELETE_ALL'
}

const FolderItemActions = ({ checklistId, folderId }: TChecklistsPageParams) => {
    const folderItemId = folderId ?? checklistId ?? NULL;

    const router = useRouter();
    const itemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });

    const [item, setItem] = useMMKVObject<IFolderItem>(folderItemId, itemStorage);

    function handleAction(action: string) {
        if (!item) return;

        if (isValidPlatformColor(action)) {
            setItem((prev) => prev ? ({
                ...prev, platformColor: action
            }) : prev);
            return;
        }

        let message = '';
        switch (action) {
            case EFolderAction.EDIT_TITLE:
                // TODO: Implement edit title functionality
                // You may want to navigate to an edit screen or use an atom to trigger edit mode
                console.log('Edit title clicked');
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

    return (
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
};

export default FolderItemActions;