import React, { useEffect, useMemo, useState } from 'react';
import useSortedList from '../../../../foundation/sortedLists/hooks/useSortedList';
import { useNavigatorContext } from '../../../../foundation/navigation/services/TabsProvider';
import {
    createFolderItem,
    getFolderFromStorage,
    updateFolderItem,
    deleteFolderItem,
    getFolderItems,
} from '../../storage/folderStorage';
import SortableList from '../../../../foundation/sortedLists/components/list/SortableList';
import Popover, { PopoverProps } from '../popover/FolderItemPopover';
import { Folder, FOLDER_STORAGE_ID, FolderItem, FolderItemType } from '../../utils';
import { Pages } from '../../../../foundation/navigation/utils';
import { generateSortId, ItemStatus, ListItem, ModifyItemConfig } from '../../../../foundation/sortedLists/utils';
import { useSortableListContext } from '../../../../foundation/sortedLists/services/SortableListProvider';
import DeleteModal, { DeleteModalProps } from '../modal/DeleteModal';
import CustomText from '../../../../foundation/components/text/CustomText';
import { Color, SelectableColor } from '../../../../foundation/theme/colors';

interface SortableFolderProps {
    folderId: string;
    onBackClick: (listId: string) => void;
    onOpenItem: (id: string, type: FolderItemType) => void;
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
        type: FolderItemType.FOLDER,
        color: SelectableColor.YELLOW,
    });

    // Toggles an item in and out of delete status
    const toggleDeleteModal = () => setDeleteModalOpen(curr => !curr);

    // Stores the current folder and all handler functions to update it
    const SortedItems = useSortedList<FolderItem, Folder>(
        folderId,
        FOLDER_STORAGE_ID,
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
            } else if (item.type === FolderItemType.FOLDER) {
                handleItemTransfer(item);
            }
            return;
        } else if (currentTextfield) {
            SortedItems.persistItemToStorage({ ...currentTextfield, status: ItemStatus.STATIC });
        }
        onOpenItem(item.id, item.type);
    };

    const editItemPopoverConfig = (item: FolderItem): ModifyItemConfig<FolderItem, PopoverProps> => {
        return {
            component: Popover,
            props: {
                open: currentTab === Pages.LISTS && item.status === ItemStatus.EDIT && !deleteModalOpen,
                iconRows: [[{
                    type: 'transfer',
                    onClick: () => beginItemTransfer(item),
                    size: 20,
                    color: isItemTransfering(item) ? Color.BLUE : Color.DIM
                }],
                [{
                    onClick: () => {
                        toggleDeleteModal();
                        return item;
                    },
                    type: 'trash',
                    size: 20,
                    color: Color.DIM
                }]],
                item,
                onSave: (newItem: FolderItem) => newItem
            },
        }
    }

    const newItemPopoverConfig = (item: FolderItem): ModifyItemConfig<FolderItem, PopoverProps> => {
        return {
            component: Popover,
            props: {
                iconRows: [[{
                    type: 'folder',
                    onClick: () => ({ ...item, type: FolderItemType.FOLDER }),
                    size: 20,
                    color: item.type === FolderItemType.FOLDER ? Color.BLUE : Color.DIM
                },
                {
                    type: 'list',
                    size: 20,
                    onClick: () => ({ ...item, type: FolderItemType.LIST }),
                    color: item.type === FolderItemType.LIST ? Color.BLUE : Color.DIM
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
            item.type === FolderItemType.FOLDER ? 'folder' :
                'list';
    const getIconColor = (item: FolderItem) => isItemTransfering(item) ?
        Color.BLUE : (item.type === FolderItemType.LIST && isTransferMode()) ?
            Color.DIM : item.color

    return (
        <SortableList<FolderItem, PopoverProps, DeleteModalProps>
            listId={folderId}
            items={SortedItems.items}
            fillSpace
            onDragEnd={SortedItems.persistItemToStorage}
            getTextfieldKey={item => `${item.id}-${item.sortId}`}
            onSaveTextfield={SortedItems.persistItemToStorage}
            onDeleteItem={SortedItems.deleteItemFromStorage}
            getPopovers={item => [editItemPopoverConfig(item), newItemPopoverConfig(item)]}
            getRowTextColor={item => isItemTransfering(item) ? Color.BLUE :
                (isTransferMode() && item.type === FolderItemType.LIST) ? Color.DIM : Color.WHITE}
            initializeItem={initializeFolderItem}
            getRightIconConfig={item => ({
                customIcon:
                    <CustomText type='soft'>
                        {item.childrenCount}
                    </CustomText>
            })}
            onContentClick={handleItemClick}
            getModal={(item: FolderItem) => ({
                component: DeleteModal,
                props: {
                    open: deleteModalOpen,
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
                    color: getIconColor(item)
                },
                onClick: SortedItems.toggleItemEdit
            })}
            emptyLabelConfig={{
                label: "It's a ghost town in here.",
                iconConfig: {
                    type: 'ghost',
                    size: 20,
                    color: Color.DIM,
                },
                style: { height: '90%' }
            }}
        />
    );
};

export default SortedFolder;