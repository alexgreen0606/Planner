import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import { useNavigatorContext } from '../../../foundation/navigation/services/TabsProvider';
import FolderItemBanner from './FolderItemBanner';
import {
    createFolderItem,
    getFolderFromStorage,
    updateFolderItem,
    deleteFolderItem,
    getFolderItems,
} from '../storage/folderStorage';
import Modal from '../../../foundation/components/modal/Modal';
import globalStyles from '../../../foundation/theme/globalStyles';
import CustomText from '../../../foundation/components/text/CustomText';
import colors from '../../../foundation/theme/colors';
import SortableList from '../../../foundation/sortedLists/components/list/SortableList';
import Popover from './FolderItemPopover';
import { Folder, FOLDER_STORAGE_ID, FolderItem, FolderItemType } from '../utils';
import { isItemEditing, ItemStatus, ShiftTextfieldDirection } from '../../../foundation/sortedLists/utils';
import { Pages } from '../../../foundation/navigation/utils';
import DeleteModal from './DeleteModal';
import ClickableLine from '../../../foundation/sortedLists/components/separator/ClickableLine';

interface SortableFolderProps {
    folderId: string;
    onBackClick: (parentFolderId: string) => void;
    onOpenItem: (id: string, type: FolderItemType) => void;
};

const SortedFolder = ({
    folderId,
    onBackClick,
    onOpenItem
}: SortableFolderProps) => {
    const { currentTab } = useNavigatorContext();
    const folderData = useMemo(() => getFolderFromStorage(folderId), [folderId]);
    const parentFolderData = useMemo(() => folderData.parentFolderId ? getFolderFromStorage(folderData.parentFolderId) : null, [folderData]);

    // Creates a new textfield with initial item count set to 0
    const initializeFolderItem = (newItem: FolderItem) => {
        const initializedItem = {
            ...newItem,
            childrenCount: 0,
            type: FolderItemType.FOLDER,
            color: 'yellow'
        };
        return initializedItem;
    };

    // Toggles an item in and out of delete status
    const customToggleItemDelete = (item: FolderItem, isModalOpen: boolean) => {
        SortedItems.persistItemToStorage({
            ...item,
            status: isModalOpen ? ItemStatus.EDIT : ItemStatus.DELETE
        })
    }

    // Stores the current folder and all handler functions to update it
    const SortedItems = useSortedList<FolderItem, Folder>(
        folderId,
        FOLDER_STORAGE_ID,
        getFolderItems,
        buildFolderFromItems,
        initializeFolderItem,
        {
            create: (newItem) => createFolderItem(folderId, newItem),
            update: (newItem) => updateFolderItem(newItem),
            delete: (item) => deleteFolderItem(item.id, item.type)
        },
    );

    const beginItemTransfer = (item: FolderItem) => {
        SortedItems.persistItemToStorage({ ...item, status: ItemStatus.TRANSFER })
    }

    /**
     * Transfers the focused item to a new folder.
     * @param destination - the folder being transferred to
     */
    const handleItemTransfer = (destination?: FolderItem) => {
        const focusedItem = SortedItems.getFocusedItem();
        if (!destination && !parentFolderData?.id || !focusedItem) return;
        const destinationId = destination ? destination.id : parentFolderData?.id;

        // Transfer the item to the destination
        updateFolderItem({ ...focusedItem, status: ItemStatus.STATIC }, destinationId);
    };

    /**
     * If the focused item is being transferred, transfer it to the parent folder.
     * Otherwise, open the parent folder.
     */
    const handleParentFolderClick = () => {
        const focusedItem = SortedItems.getFocusedItem();
        if (focusedItem?.status === ItemStatus.TRANSFER) {
            handleItemTransfer();
            return;

        } else if (folderData.parentFolderId) {
            onBackClick(folderData.parentFolderId);
        }
    };

    /**
     * Deletes the item from storage.
     * @param item - the item to delete
     */
    const handleDeleteItem = (item: FolderItem) => {
        deleteFolderItem(item.id, item.type);
    };

    /**
     * Handles clicking a list item. In transfer mode, the textfield item will transfer to the clicked item.
     * Otherwise, the focused item will be saved and the clicked item will be opened.
     * @param item - the item that was clicked
     */
    const handleItemClick = (item: FolderItem) => {
        const currentItem = SortedItems.getFocusedItem();
        if (currentItem && currentItem.status === ItemStatus.TRANSFER) {
            if (item.type === FolderItemType.FOLDER) {
                handleItemTransfer(item);
            }
            return;
        } else if (currentItem) {
            SortedItems.saveTextfield();
        }
        onOpenItem(item.id, item.type);
    };

    const editItemPopoverConfig = (item: FolderItem) => {
        return {
            open: currentTab === Pages.LISTS && item.status === ItemStatus.EDIT,
            popover:
                <Popover
                    item={item}
                    icons={[[{
                        onClick: () => beginItemTransfer(item),
                        icon: {
                            type: 'transfer',
                            size: 20,
                            color: isItemTransfering(item) ? colors.blue : colors.grey
                        }
                    }],
                    [{
                        onClick: () => customToggleItemDelete(item, false),
                        icon: {
                            type: 'trash',
                            size: 20,
                            color: colors.grey
                        }
                    }]]}
                    saveNewColor={color => SortedItems.persistItemToStorage({ ...item, color })}
                />
        }
    }

    const newItemPopoverConfig = (item: FolderItem) => {
        return {
            open: currentTab === Pages.LISTS && item.status === ItemStatus.NEW,
            popover:
                <Popover
                    item={item}
                    icons={[[{
                        onClick: () => SortedItems.persistItemToStorage({ ...item, type: FolderItemType.FOLDER }),
                        icon: {
                            type: 'folder',
                            size: 20,
                            color: item.type === FolderItemType.FOLDER ? colors.blue : colors.grey
                        }
                    },
                    {
                        onClick: () => SortedItems.persistItemToStorage({ ...item, type: FolderItemType.LIST }),
                        icon: {
                            type: 'list',
                            size: 20,
                            color: item.type === FolderItemType.LIST ? colors.blue : colors.grey
                        }
                    }]]}
                    saveNewColor={color => SortedItems.persistItemToStorage({ ...item, color })}
                />
        }
    }

    const isItemTransfering = (item: FolderItem) => item.status === ItemStatus.TRANSFER;
    const isTransferMode = () => SortedItems.getFocusedItem()?.status === ItemStatus.TRANSFER;
    const isItemDeleting = (item: FolderItem) => item.status === ItemStatus.DELETE;
    const getIconType = (item: FolderItem) =>
        isItemTransfering(item) ? 'transfer' :
            item.type === FolderItemType.FOLDER ? 'folder' :
                'list';
    const getIconColor = (item: FolderItem) => isItemTransfering(item) ?
        colors.blue : (item.type === FolderItemType.LIST && isTransferMode()) ?
            colors.grey : colors[item.color as keyof typeof colors]

    return (
        <View style={globalStyles.backdrop}>
            <FolderItemBanner
                itemId={folderData.id}
                backButtonConfig={{
                    display: !!parentFolderData,
                    label: parentFolderData?.value,
                    onClick: handleParentFolderClick
                }}
                itemType={FolderItemType.FOLDER}
            />
            <ClickableLine onPress={() => SortedItems.createOrMoveTextfield(-1)} />
            <View style={{ flex: 1, justifyContent: 'center' }}>
                {SortedItems.items.length !== 0 ? (
                    <SortableList<FolderItem>
                        items={SortedItems.items}
                        endDrag={SortedItems.endDragItem}
                        getTextfieldKey={item => `${item.id}-${item.sortId}`}
                        handleValueChange={(text, item) => SortedItems.persistItemToStorage({ ...item, value: text })}
                        onSaveTextfield={() => SortedItems.saveTextfield(ShiftTextfieldDirection.BELOW)}
                        getPopovers={item => [editItemPopoverConfig(item), newItemPopoverConfig(item)]}
                        getRowTextColor={item =>
                            (isTransferMode() && item.type === FolderItemType.LIST) ||
                                isItemDeleting(item) ? colors.grey : colors.white}
                        getRightIconConfig={item => ({
                            hideIcon: !isItemEditing(item),
                            customIcon:
                                <Text style={{ color: colors.grey }}>
                                    {item.childrenCount}
                                </Text>
                        })}
                        onContentClick={item => handleItemClick(item)}
                        onLineClick={item => SortedItems.createOrMoveTextfield(item.sortId)}
                        getModal={item =>
                            <DeleteModal
                                item={item}
                                toggleModalOpen={() => customToggleItemDelete(item, true)}
                                deleteItem={() => handleDeleteItem(item)}
                            />
                        }
                        getLeftIconConfig={item => ({
                            icon: {
                                type: getIconType(item),
                                color: getIconColor(item)
                            },
                            onClick: () => SortedItems.beginEditItem(item)
                        })}
                    />
                ) : (
                    <EmptyLabel
                        label="It's a ghost town in here."
                        iconConfig={{
                            type: 'ghost',
                            size: 26,
                            color: colors.grey,
                        }}
                        customFontSize={14}
                        onPress={() => SortedItems.createOrMoveTextfield(-1)}
                        style={{ flexDirection: 'column' }}
                    />
                )}
            </View>
        </View>
    );
};

export default SortedFolder;