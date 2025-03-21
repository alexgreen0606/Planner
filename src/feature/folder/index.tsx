import React, { useEffect, useMemo, useState } from 'react';
import useSortedList from '../../foundation/sortedLists/hooks/useSortedList';
import {
    createFolderItem,
    getFolderFromStorage,
    updateFolderItem,
    deleteFolderItem,
    getFolderItems,
} from '../checklists/storage/folderStorage';
import SortableList from '../../foundation/sortedLists/components/list/SortableList';
import Toolbar, { ToolbarProps } from './components/FolderItemToolbar';
import { Folder, LISTS_STORAGE_ID, FolderItem, FolderItemTypes } from '../checklists/types';
import { Pages } from '../../app/navUtils';
import { ItemStatus, ListItem, ModifyItemConfig } from '../../foundation/sortedLists/types';
import { useSortableListContext } from '../../foundation/sortedLists/services/SortableListProvider';
import DeleteModal, { DeleteModalProps } from './components/DeleteModal';
import { useNavigatorContext } from '../../app/NavProvider';
import CustomText from '../../foundation/components/text/CustomText';
import { generateSortId } from '../../foundation/sortedLists/utils';
import { PlatformColor } from 'react-native';

interface SortableFolderProps {
    folderId: string;
    onBackClick: (listId: string) => void;
    onOpenItem: (id: string, type: FolderItemTypes) => void;
    parentClickTrigger: number;
    parentFolderData?: Folder;
};

const SortedFolder = ({
    folderId,
    onBackClick,
    onOpenItem,
    parentClickTrigger,
    parentFolderData,
}: SortableFolderProps) => {
    const { currentTab } = useNavigatorContext();
    const { currentTextfield, setCurrentTextfield } = useSortableListContext();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const folderData = useMemo(() => getFolderFromStorage(folderId), [folderId]);

    // Creates a new textfield with initial item count set to 0
    const initializeFolderItem = (newItem: ListItem) => ({
        ...newItem,
        childrenCount: 0,
        listId: folderId,
        type: FolderItemTypes.FOLDER,
        platformColor: 'systemBrown',
    });

    // Toggles an item in and out of delete status
    const toggleDeleteModal = () => setDeleteModalOpen(curr => !curr);

    // Stores the current folder and all handler functions to update it
    const SortedItems = useSortedList<FolderItem, Folder>(
        folderId,
        LISTS_STORAGE_ID,
        getFolderItems,
        undefined,
        {
            create: createFolderItem,
            update: (newItem) => {
                updateFolderItem(newItem);
                SortedItems.refetchItems();
            },
            delete: (item) => deleteFolderItem(item.id, item.type)
        },
    );

    const beginItemTransfer = (item: FolderItem) => {
        return { ...item, status: ItemStatus.TRANSFER };
    }

    /**
     * Transfers the textfield item to a new folder.
     * @param destination - the folder being transferred to
     */
    const handleItemTransfer = (destination?: FolderItem) => {
        if (!destination && !parentFolderData?.id || !currentTextfield) return;
        const destinationId = destination ? destination.id : parentFolderData?.id;

        // Transfer the item to the destination
        const destinationItems = getFolderItems(
            destination ? getFolderFromStorage(destination.id) : parentFolderData!
        );
        updateFolderItem({ ...currentTextfield, status: ItemStatus.STATIC, listId: destinationId, sortId: generateSortId(-1, destinationItems) });
        setCurrentTextfield(undefined);
    };

    /**
     * If the focused item is being transferred, transfer it to the parent folder.
     * Otherwise, open the parent folder.
     */
    useEffect(() => {
        if (parentClickTrigger > 0) {

            // Handle parent folder click
            if (currentTextfield?.status === ItemStatus.TRANSFER) {
                handleItemTransfer();
                return;

            } else if (folderData.listId) {
                onBackClick(folderData.listId);
            }
        }
    }, [parentClickTrigger])

    /**
     * Handles clicking a list item. In transfer mode, the textfield item will transfer to the clicked item.
     * Otherwise, the focused item will be saved and the clicked item will be opened.
     * @param item - the item that was clicked
     */
    const handleItemClick = (item: FolderItem) => {
        if (currentTextfield && currentTextfield.status === ItemStatus.TRANSFER) {
            if (item.id === currentTextfield.id) {
                setCurrentTextfield({ ...currentTextfield, status: ItemStatus.EDIT });
            } else if (item.type === FolderItemTypes.FOLDER) {
                handleItemTransfer(item);
            }
            return;
        } else if (currentTextfield) {
            SortedItems.persistItemToStorage({ ...currentTextfield, status: ItemStatus.STATIC });
        }
        onOpenItem(item.id, item.type);
    };

    const editItemToolbarConfig = (item: FolderItem): ModifyItemConfig<FolderItem, ToolbarProps> => {
        return {
            component: Toolbar,
            props: {
                open: currentTab === Pages.LISTS && item.status === ItemStatus.EDIT && !deleteModalOpen,
                iconRows: [[{
                    type: 'transfer',
                    onClick: () => beginItemTransfer(item),
                }],
                [{
                    onClick: () => {
                        toggleDeleteModal();
                        return item;
                    },
                    type: 'trash',
                }]],
                item,
                onSave: (newItem: FolderItem) => newItem
            },
        }
    }

    const newItemToolbarConfig = (item: FolderItem): ModifyItemConfig<FolderItem, ToolbarProps> => {
        return {
            component: Toolbar,
            props: {
                iconRows: [[{
                    type: 'folder',
                    onClick: () => ({ ...item, type: FolderItemTypes.FOLDER }),
                    platformColor: item.type === FolderItemTypes.FOLDER ? item.platformColor : 'secondaryLabel'
                },
                {
                    type: 'list',
                    onClick: () => ({ ...item, type: FolderItemTypes.LIST }),
                    platformColor: item.type === FolderItemTypes.LIST ? item.platformColor : 'secondaryLabel'
                }]],
                open: currentTab === Pages.LISTS && item.status === ItemStatus.NEW && !deleteModalOpen,
                onSave: (updatedItem: FolderItem) => updatedItem,
                item
            },
        }
    }

    const isItemTransfering = (item: FolderItem) => item.status === ItemStatus.TRANSFER;
    const isTransferMode = () => currentTextfield?.status === ItemStatus.TRANSFER;
    const getIconType = (item: FolderItem) =>
        isItemTransfering(item) ? 'transfer' :
            item.type === FolderItemTypes.FOLDER ? 'folder' :
                'list';
    const getIconPlatformColor = (item: FolderItem) => isItemTransfering(item) ?
        'systemTeal' : (item.type === FolderItemTypes.LIST && isTransferMode()) ?
            'secondaryLabel' : item.platformColor

    return (
        <SortableList<FolderItem, ToolbarProps, DeleteModalProps>
            listId={folderId}
            items={SortedItems.items}
            fillSpace
            onDragEnd={SortedItems.persistItemToStorage}
            getTextfieldKey={item => `${item.id}-${item.sortId}`}
            onSaveTextfield={SortedItems.persistItemToStorage}
            onDeleteItem={SortedItems.deleteItemFromStorage}
            getToolbars={item => [editItemToolbarConfig(item), newItemToolbarConfig(item)]}
            initializeItem={initializeFolderItem}
            onContentClick={handleItemClick}
            getRowTextPlatformColor={item => isItemTransfering(item) ? 'systemTeal' :
                (isTransferMode() && item.type === FolderItemTypes.LIST) ? 'systemGray3' : 'label'}
            getRightIconConfig={item => ({
                customIcon:
                    <CustomText type='label'>
                        {item.childrenCount}
                    </CustomText>
            })}
            getModal={(item: FolderItem) => ({
                component: DeleteModal,
                props: {
                    parentFolderName: folderData.value,
                    open: deleteModalOpen,
                    hideKeyboard: deleteModalOpen,
                    toggleModalOpen: toggleDeleteModal,
                    onSave: (updatedItem: FolderItem) => {
                        SortedItems.deleteItemFromStorage(updatedItem);
                        toggleDeleteModal();
                        return undefined;
                    },
                    item
                },
            })}
            getLeftIconConfig={item => ({
                icon: {
                    type: getIconType(item),
                    platformColor: getIconPlatformColor(item)
                },
                onClick: SortedItems.toggleItemEdit
            })}
            emptyLabelConfig={{
                label: "It's a ghost town in here.",
                style: { height: '90%' }
            }}
        />
    );
};

export default SortedFolder;