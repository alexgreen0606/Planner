import { textfieldIdAtom } from '@/atoms/textfieldId';
import CustomText from '@/components/text/CustomText';
import useFolderItem from '@/hooks/useFolderItem';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { usePageContext } from '@/providers/PageProvider';
import { getFolderItemFromStorageById, saveFolderItemToStorage } from '@/storage/checklistsStorage';
import { createNewFolderItemAndSaveToStorage, deleteFolderItemAndChildren, updateListItemIndex } from '@/utils/checklistUtils';
import { useRouter } from 'expo-router';
import { useSetAtom } from 'jotai';
import React from 'react';
import { PlatformColor } from 'react-native';
import { useMMKV } from 'react-native-mmkv';
import FolderItemButton from '../icons/customButtons/FolderItemButton';
import DragAndDropList from './components/DragAndDropList';

// ✅ 

type TFolderProps = {
    folderId: string;
}

const FolderContentsList = ({ folderId }: TFolderProps) => {
    const folderItemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
    const router = useRouter();

    const setTextfieldId = useSetAtom(textfieldIdAtom);

    const {
        item: folder,
        itemIds,
        isTransferMode,
        transferingItem,
        onEndTransfer,
    } = useFolderItem(folderId, folderItemStorage);

    const { onFocusPlaceholder } = usePageContext();

    const getLeftIcon = (item: IFolderItem) => (
        <FolderItemButton
            item={item}
            disabled={getIsItemTransfering(item.id) || isTransferMode && item.type === EFolderItemType.CHECKLIST}
            onClick={() => {
                onFocusPlaceholder();
                setTextfieldId(item.id);
            }}
        />
    );

    // ==================
    // 1. Event Handlers
    // ==================

    function handleTransferToChild(destinationItem: IFolderItem) {
        if (!folder || !transferingItem) return;

        // TODO: dont allow transfer into self

        const childFolder = getFolderItemFromStorageById(destinationItem.id);
        childFolder.itemIds.push(transferingItem.id);
        saveFolderItemToStorage(childFolder);

        saveFolderItemToStorage({ ...folder, itemIds: folder.itemIds.filter((id) => id !== transferingItem.id) });
        saveFolderItemToStorage({ ...transferingItem, listId: destinationItem.id });
    }

    function handleItemClick(item: IFolderItem) {
        if (isTransferMode) {
            if (item.type === EFolderItemType.FOLDER && item.id !== transferingItem?.id) {
                handleTransferToChild(item);
            }
            onEndTransfer();
            return;
        }

        setTextfieldId(null);

        if (item.type === EFolderItemType.FOLDER) {
            router.push(`checklists/folder/${item.id}`);
        } else if (item.type === EFolderItemType.CHECKLIST) {
            router.push(`checklists/checklist/${item.id}`);
        }
    }

    // ====================
    // 2. Helper Functions
    // ====================

    function getIsItemTransfering(itemId: string) {
        return isTransferMode && transferingItem?.id === itemId;
    }

    function getRowTextPlatformColor(item: IFolderItem) {
        if (getIsItemTransfering(item.id)) {
            return 'tertiaryLabel';
        }
        if (isTransferMode && item.type === EFolderItemType.CHECKLIST) {
            return 'tertiaryLabel';
        }
        return 'label';
    }

    return (
        <DragAndDropList<IFolderItem>
            fillSpace
            listId={folderId}
            itemIds={itemIds}
            storage={folderItemStorage}
            storageId={EStorageId.FOLDER_ITEM}
            onGetRowTextPlatformColor={getRowTextPlatformColor}
            onGetRightIcon={(item) => (
                <CustomText
                    variant='microDetail'
                    customStyle={{
                        color: PlatformColor(getRowTextPlatformColor(item))
                    }}
                >
                    {item.itemIds.length}
                </CustomText>
            )}
            onGetLeftIcon={getLeftIcon}
            onDeleteItem={deleteFolderItemAndChildren}
            onCreateItem={createNewFolderItemAndSaveToStorage}
            onContentClick={handleItemClick}
            onIndexChange={updateListItemIndex}
        />
    )
};

export default FolderContentsList;
