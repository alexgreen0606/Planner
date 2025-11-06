import { Button, Host, VStack } from '@expo/ui/swift-ui';
import { frame } from '@expo/ui/swift-ui/modifiers';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { Alert, PlatformColor } from 'react-native';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';

import { transferingFolderItemAtom } from '@/atoms/transferingFolderItem';
import PopupList from '@/components/PopupList';
import { selectableColors } from '@/lib/constants/colors';
import { NULL } from '@/lib/constants/generic';
import { FOLDER_ITEM_MODAL_PATHNAME } from '@/lib/constants/pathnames';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EPopupActionType } from '@/lib/enums/EPopupActionType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { TChecklistsPageParams } from '@/lib/types/routeParams/TChecklistPageParams';
import {
  deleteFolderItemFromStorage,
  getFolderItemFromStorageById,
  getListItemFromStorageById,
  saveFolderItemToStorage
} from '@/storage/checklistsStorage';
import { deleteChecklistItems, deleteFolderItemAndChildren } from '@/utils/checklistUtils';
import { isValidPlatformColor } from '@/utils/colorUtils';

enum EFolderAction {
  DELETE_AND_SCATTER = 'DELETE_AND_SCATTER',
  ERASE_CONTENTS = 'ERASE_CONTENTS',
  DELETE_ALL = 'DELETE_ALL',
  EDIT = 'EDIT'
}

const FolderItemActions = ({ checklistId, folderId }: TChecklistsPageParams) => {
  const itemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
  const router = useRouter();

  const [itemInTransfer, setItemInTransfer] = useAtom(transferingFolderItemAtom);

  const folderItemId = folderId ?? checklistId ?? EStorageKey.ROOT_FOLDER_KEY;
  const [item, setItem] = useMMKVObject<IFolderItem>(folderItemId, itemStorage);

  const itemTypeName = item?.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Item';

  function handleAction(action: string) {
    if (!item) return;

    if (isValidPlatformColor(action)) {
      setItem((prev) =>
        prev
          ? {
              ...prev,
              platformColor: action
            }
          : prev
      );
      return;
    }

    let message = '';
    switch (action) {
      case EFolderAction.EDIT:
        router.push(`${FOLDER_ITEM_MODAL_PATHNAME}/${NULL}/${folderItemId}`);
        break;
      case EFolderAction.DELETE_ALL:
        const hasChildren = item.itemIds.length > 0;
        message = `Would you like to delete this ${item.type}?${hasChildren ? ' All inner contents will be lost.' : ''}`;

        Alert.alert(`Delete "${item.value}"?`, message, [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: hasChildren ? 'Force Delete' : 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteFolderItemAndChildren(item, true);
              router.back();
            }
          }
        ]);
        break;
      case EFolderAction.ERASE_CONTENTS:
        message = `Would you like to erase all contents from this ${item.type}?`;

        Alert.alert('Erase All Contents?', message, [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Erase',
            style: 'destructive',
            onPress: () => {
              if (item.type === EFolderItemType.FOLDER) {
                item.itemIds.forEach((childFolderItemId) => {
                  const childFolderItem = getFolderItemFromStorageById(childFolderItemId);
                  deleteFolderItemAndChildren(childFolderItem);
                });
              } else {
                deleteChecklistItems(item.itemIds.map(getListItemFromStorageById));
              }
            }
          }
        ]);
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

  function handleTransferToParent() {
    if (!itemInTransfer) return;

    const currentFolder = getFolderItemFromStorageById(folderItemId);

    const parentFolder = getFolderItemFromStorageById(currentFolder.listId);
    parentFolder.itemIds.push(itemInTransfer.id);
    saveFolderItemToStorage(parentFolder);

    saveFolderItemToStorage({
      ...currentFolder,
      itemIds: currentFolder.itemIds.filter((id) => id !== itemInTransfer.id)
    });
    saveFolderItemToStorage({ ...itemInTransfer, listId: currentFolder.listId });

    setItemInTransfer(null);
  }

  // If there's an item in transfer, show the transfer button instead.
  if (itemInTransfer) {
    const canTransferToParent = folderItemId !== EStorageKey.ROOT_FOLDER_KEY;
    return canTransferToParent ? (
      <Host matchContents>
        <VStack modifiers={[frame({ width: 190 })]}>
          <Button
            systemImage="arrow.uturn.left"
            color={PlatformColor('label') as unknown as string}
            onPress={handleTransferToParent}
          >
            Transfer to parent
          </Button>
        </VStack>
      </Host>
    ) : null;
  }

  return (
    <PopupList
      actions={[
        {
          type: EPopupActionType.BUTTON,
          title: `Edit ${itemTypeName}`,
          systemImage: 'pencil',
          onPress: () => handleAction(EFolderAction.EDIT)
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
            onPress: () => handleAction(color)
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
              hidden:
                item?.type !== EFolderItemType.FOLDER ||
                item?.listId === NULL ||
                !item?.itemIds.length
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
              title: `Delete Entire ${itemTypeName}`,
              destructive: true,
              hidden: item?.listId === NULL,
              systemImage: 'trash'
            }
          ]
        }
      ]}
    />
  );
};

export default FolderItemActions;
