import { textfieldIdAtom } from '@/atoms/textfieldId';
import CustomText from '@/components/text/CustomText';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { useScrollContainerContext } from '@/providers/ScrollContainer';
import { getFolderItemFromStorageById, saveFolderItemToStorage } from '@/storage/checklistsStorage';
import { deleteFolderItemAndChildren, createNewFolderItemAndSaveToStorage, updateListItemIndex } from '@/utils/checklistUtils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSetAtom } from 'jotai';
import React, { useCallback, useEffect } from 'react';
import { PlatformColor, TouchableOpacity, View } from 'react-native';
import { useMMKV } from 'react-native-mmkv';
import DragAndDropList from './components/DragAndDropList';
import useFolderItem from '@/hooks/useFolderItem';
import TransferFolderIcon from '../icon/TransferFolderIcon';
import AnimatedIcon from '../icon/AnimatedIcon';
import { TIconType } from '@/lib/constants/icons';

// ✅ 

type ISortedFolderProps = {
    parentClickTrigger: number;
    onOpenItem: (id: string, type: EFolderItemType) => void;
};

const SortedFolder = ({
    parentClickTrigger,
    onOpenItem,
}: ISortedFolderProps) => {
    const { folderId } = useLocalSearchParams<{ folderId: string }>();
    const folderItemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
    const router = useRouter();

    const setTextfieldId = useSetAtom(textfieldIdAtom);

    const {
        item: folder,
        itemIds,
        isTransferMode,
        toolbarIconSet,
        transferingItem,
        onEndTransfer,
    } = useFolderItem(folderId, folderItemStorage);

    const { onFocusPlaceholder } = useScrollContainerContext();

    // const getLeftIconConfigCallback = useCallback((item: IFolderItem) => {
    //     return {
    //         icon: {
    //             type: item.type,
    //             platformColor: getIconPlatformColor(item)
    //         },
    //         onClick: () => {
    //             onFocusPlaceholder();
    //             setTextfieldId(item.id);
    //         },
    //         customIcon: getIsItemTransfering(item.id) ? (
    //             <View className='scale-[0.8] pr-2'>
    //                 <TransferFolderIcon disabled={false} />
    //             </View>
    //         ) : (
    //             <MemoizedAnimatedIcon
    //                 type={item.type}
    //                 platformColor={getIconPlatformColor(item)}
    //             />
    //         )
    //     }
    // }, [transferingItem]);

    const getLeftIconConfig = (item: IFolderItem) => {
        return getIsItemTransfering(item.id) ? (
            <View className='scale-[0.8] pr-2'>
                <TransferFolderIcon disabled={false} />
            </View>
        ) : (
            <TouchableOpacity onPress={() => {
                onFocusPlaceholder();
                setTextfieldId(item.id);
            }} >
                <AnimatedIcon
                    type={item.type}
                    platformColor={getIconPlatformColor(item)}
                />
            </TouchableOpacity>
        )
    }

    // Handle clicking of the parent folder.
    useEffect(() => {
        if (!folder || parentClickTrigger === 0) return;

        if (isTransferMode) {
            handleTransferToParent();
            return;
        }

        router.back();
    }, [parentClickTrigger]);

    // ==================
    // 1. Event Handlers
    // ==================

    function handleTransferToParent() {
        if (!folder || !transferingItem) return;

        const parentFolder = getFolderItemFromStorageById(folder.listId);
        parentFolder.itemIds.push(transferingItem.id);
        saveFolderItemToStorage(parentFolder);

        saveFolderItemToStorage({ ...folder, itemIds: folder.itemIds.filter((id) => id !== transferingItem.id) });
        saveFolderItemToStorage({ ...transferingItem, listId: folder.listId });

        onEndTransfer();
    }

    function handleTransferToChild(destinationItem: IFolderItem) {
        if (!folder || !transferingItem) return;

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

        onOpenItem(item.id, item.type);
    }

    // ====================
    // 2. Helper Functions
    // ====================

    function getIsItemTransfering(itemId: string) {
        return isTransferMode && transferingItem?.id === itemId;
    }

    function getIconPlatformColor(item: IFolderItem) {
        if (getIsItemTransfering(item.id)) {
            return 'systemBlue';
        }
        if (isTransferMode && item.type === EFolderItemType.LIST) {
            return 'tertiaryLabel';
        }
        return item.platformColor;
    }

    function getRowTextPlatformColor(item: IFolderItem) {
        if (getIsItemTransfering(item.id)) {
            return 'tertiaryLabel';
        }
        if (isTransferMode && item.type === EFolderItemType.LIST) {
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
            toolbarIconSet={toolbarIconSet}
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
            onGetLeftIcon={getLeftIconConfig}
            emptyLabelConfig={{
                label: "It's a ghost town in here",
                className: 'flex-1'
            }}
            onDeleteItem={deleteFolderItemAndChildren}
            onCreateItem={createNewFolderItemAndSaveToStorage}
            onContentClick={handleItemClick}
            onIndexChange={updateListItemIndex}
        />
    )
};

export default SortedFolder;
