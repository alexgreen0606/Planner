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
import Toolbar, { ToolbarProps } from '../../foundation/sortedLists/components/ListItemToolbar';
import { Folder, FolderItem, FolderItemTypes } from '../checklists/types';
import { Pages } from '../../foundation/navigation/constants';
import { ListItem, ModifyItemConfig } from '../../foundation/sortedLists/types';
import { useSortableList } from '../../foundation/sortedLists/services/SortableListProvider';
import DeleteModal, { DeleteModalProps } from './components/DeleteModal';
import CustomText from '../../foundation/components/text/CustomText';
import { generateSortId } from '../../foundation/sortedLists/utils';
import { ItemStatus } from '../../foundation/sortedLists/constants';
import { selectableColors } from '../../foundation/theme/colors';
import { GenericIconProps } from '../../foundation/components/GenericIcon';
import { LISTS_STORAGE_ID } from '../checklists/constants';
import { useNavigator } from '../../foundation/navigation/services/NavProvider';

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
    const { currentTab } = useNavigator();
    const { currentTextfield, setCurrentTextfield } = useSortableList();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const folderData = useMemo(() => getFolderFromStorage(folderId), [folderId]);

    // Creates a new empty brown folder item
    const initializeFolderItem = (newItem: ListItem) => ({
        ...newItem,
        childrenCount: 0,
        listId: folderId,
        type: FolderItemTypes.FOLDER,
        platformColor: 'systemBrown',
    });

    function beginItemTransfer(item: FolderItem) {
        return { ...item, status: ItemStatus.TRANSFER };
    }

    function toggleDeleteModal() {
        setDeleteModalOpen(curr => !curr);
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

    // Helper function to create the color selection icon set
    const createColorSelectionIconSet = (item: FolderItem): GenericIconProps<FolderItem>[] => {
        return Object.values(selectableColors).map(color => ({
            type: item.platformColor === color ? 'circleFilled' : 'circle',
            platformColor: color,
            onClick: () => setCurrentTextfield({ ...item, platformColor: color }),
        }));
    };

    const getItemToolbarConfig = (item: FolderItem): ModifyItemConfig<FolderItem, ToolbarProps<FolderItem>> => {
        const isNew = item.status === ItemStatus.NEW;
        const isOpen = currentTab === Pages.LISTS && !deleteModalOpen &&
            (isNew ? item.status === ItemStatus.NEW : item.status === ItemStatus.EDIT);

        return {
            component: Toolbar,
            props: {
                open: isOpen,
                iconSets: isNew
                    ? [
                        [
                            {
                                type: 'folder',
                                onClick: () => setCurrentTextfield({ ...item, type: FolderItemTypes.FOLDER }),
                                platformColor: item.type === FolderItemTypes.FOLDER ? item.platformColor : 'secondaryLabel'
                            },
                            {
                                type: 'list',
                                onClick: () => setCurrentTextfield({ ...item, type: FolderItemTypes.LIST }),
                                platformColor: item.type === FolderItemTypes.LIST ? item.platformColor : 'secondaryLabel'
                            }
                        ],
                        createColorSelectionIconSet(item)
                    ]
                    : [
                        [{
                            type: 'transfer',
                            onClick: () => beginItemTransfer(item),
                        }],
                        [{
                            onClick: toggleDeleteModal,
                            type: 'trash',
                        }],
                        createColorSelectionIconSet(item),
                    ],
                item,
            },
        };
    };

    const isItemTransfering = (item: FolderItem) => item.status === ItemStatus.TRANSFER;
    const isTransferMode = () => currentTextfield?.status === ItemStatus.TRANSFER;
    const getIconType = (item: FolderItem) =>
        isItemTransfering(item) ? 'transfer' :
            item.type === FolderItemTypes.FOLDER ? 'folder' :
                'list';
    const getIconPlatformColor = (item: FolderItem) => isItemTransfering(item) ?
        'systemBlue' : (item.type === FolderItemTypes.LIST && isTransferMode()) ?
            'secondaryLabel' : item.platformColor;

    const SortedItems = useSortedList<FolderItem, Folder>({
        storageId: LISTS_STORAGE_ID,
        storageKey: folderId,
        getItemsFromStorageObject: getFolderItems,
        storageConfig: {
            create: createFolderItem,
            update: (newItem) => {
                updateFolderItem(newItem);
                // Manually reload the list
                SortedItems.refetchItems();
            },
            delete: (items) => deleteFolderItem(items[0].id, items[0].type)
        }
    });

    return (
        <SortableList<FolderItem, ToolbarProps<FolderItem>, DeleteModalProps>
            listId={folderId}
            items={SortedItems.items}
            fillSpace
            onDragEnd={SortedItems.persistItemToStorage}
            getTextfieldKey={item => `${item.id}-${item.sortId}`}
            onSaveTextfield={SortedItems.persistItemToStorage}
            onDeleteItem={SortedItems.deleteSingleItemFromStorage}
            getToolbar={item => getItemToolbarConfig(item)}
            initializeItem={initializeFolderItem}
            onContentClick={handleItemClick}
            getRowTextPlatformColor={item => isItemTransfering(item) ? 'systemBlue' :
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
                        SortedItems.deleteSingleItemFromStorage(updatedItem);
                        toggleDeleteModal();
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