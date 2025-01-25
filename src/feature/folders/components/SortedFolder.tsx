import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import { useNavigatorContext } from '../../../foundation/navigation/services/TabsProvider';
import {
    createFolderItem,
    getFolderFromStorage,
    updateFolderItem,
    deleteFolderItem,
    getFolderItems,
} from '../storage/folderStorage';
import globalStyles from '../../../foundation/theme/globalStyles';
import CustomText from '../../../foundation/components/text/CustomText';
import colors from '../../../foundation/theme/colors';
import SortableList from '../../../foundation/sortedLists/components/list/SortableList';
import Popover, { PopoverProps } from './FolderItemPopover';
import { Folder, FOLDER_STORAGE_ID, FolderItem, FolderItemType, NULL } from '../utils';
import { Pages } from '../../../foundation/navigation/utils';
import DeleteModal, { DeleteModalProps } from './DeleteModal';
import { isItemTextfield, ItemStatus, ListItem, ModifyItemConfig } from '../../../foundation/sortedLists/utils';
import { useSortableListContext } from '../../../foundation/sortedLists/services/SortableListProvider';

interface SortableFolderProps {
    folderId: string;
    onBackClick: (listId: string) => void;
    onOpenItem: (id: string, type: FolderItemType) => void;
    parentClickTrigger: number;
};

const SortedFolder = ({
    folderId,
    onBackClick,
    onOpenItem,
    parentClickTrigger
}: SortableFolderProps) => {
    const { currentTab } = useNavigatorContext();
    const { currentTextfield, setCurrentTextfield } = useSortableListContext();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const folderData = useMemo(() => getFolderFromStorage(folderId), [folderId]);
    const parentFolderData = useMemo(() => folderData.listId !== NULL ? getFolderFromStorage(folderData.listId) : null, [folderData]);

    // Creates a new textfield with initial item count set to 0
    const initializeFolderItem = (newItem: ListItem) => ({
        ...newItem,
        childrenCount: 0,
        listId: folderId,
        type: FolderItemType.FOLDER,
        color: 'yellow',
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
            customStorageHandlers: {
                create: createFolderItem,
                update: (newItem) => {
                    updateFolderItem(newItem);
                    SortedItems.refetchItems();
                },
                delete: (item) => deleteFolderItem(item.id, item.type)
            }
        },
    );

    const beginItemTransfer = (item: FolderItem) => {
        return { ...item, status: ItemStatus.TRANSFER };
    }

    /**
     * Transfers the focused item to a new folder.
     * @param destination - the folder being transferred to
     */
    const handleItemTransfer = (destination?: FolderItem) => {
        if (!destination && !parentFolderData?.id || !currentTextfield) return;
        const destinationId = destination ? destination.id : parentFolderData?.id;

        // Transfer the item to the destination
        updateFolderItem({ ...currentTextfield, status: ItemStatus.STATIC, listId: destinationId });
        setCurrentTextfield(undefined);
    };

    /**
     * If the focused item is being transferred, transfer it to the parent folder.
     * Otherwise, open the parent folder.
     */
    const handleParentFolderClick = () => {
        if (currentTextfield?.status === ItemStatus.TRANSFER) {
            handleItemTransfer();
            return;

        } else if (folderData.listId) {
            onBackClick(folderData.listId);
        }
    };

    useEffect(() => {
        if (parentClickTrigger > 0) {
            handleParentFolderClick();
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
                icons: [[{
                    onClick: beginItemTransfer,
                    icon: {
                        type: 'transfer',
                        size: 20,
                        color: isItemTransfering(item) ? colors.blue : colors.grey
                    }
                }],
                [{
                    onClick: (item: FolderItem) => {
                        toggleDeleteModal();
                        return item;
                    },
                    icon: {
                        type: 'trash',
                        size: 20,
                        color: colors.grey
                    }
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
                icons: [[{
                    onClick: (item: FolderItem) => ({ ...item, type: FolderItemType.FOLDER }),
                    icon: {
                        type: 'folder',
                        size: 20,
                        color: item.type === FolderItemType.FOLDER ? colors.blue : colors.grey
                    }
                },
                {
                    onClick: (item: FolderItem) => ({ ...item, type: FolderItemType.LIST }), // TODO: other changes needed?
                    icon: {
                        type: 'list',
                        size: 20,
                        color: item.type === FolderItemType.LIST ? colors.blue : colors.grey
                    }
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
        colors.blue : (item.type === FolderItemType.LIST && isTransferMode()) ?
            colors.grey : colors[item.color as keyof typeof colors]

    return (
        <View style={globalStyles.blackFilledSpace}>
            <SortableList<FolderItem, PopoverProps, DeleteModalProps>
                listId={folderId}
                items={SortedItems.items}
                onDragEnd={SortedItems.persistItemToStorage}
                getTextfieldKey={item => `${item.id}-${item.sortId}`}
                onSaveTextfield={SortedItems.persistItemToStorage}
                onDeleteItem={SortedItems.deleteItemFromStorage}
                getPopovers={item => [editItemPopoverConfig(item), newItemPopoverConfig(item)]}
                getRowTextColor={item => isItemTransfering(item) ? colors.blue :
                    (isTransferMode() && item.type === FolderItemType.LIST) ? colors.grey : colors.white}
                initializeItem={initializeFolderItem}
                getRightIconConfig={item => ({
                    hideIcon: isItemTextfield(item),
                    customIcon:
                        <CustomText type='soft' style={{ color: colors.grey }}>
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
                    onClick: SortedItems.convertItemToTextfield
                })}
                emptyLabelConfig={{
                    label: "It's a ghost town in here.",
                    iconConfig: {
                        type: 'ghost',
                        size: 20,
                        color: colors.grey,
                    },
                    customFontSize: 14,
                    style: { height: '90%' }
                }}
            />
        </View>
    );
};

export default SortedFolder;