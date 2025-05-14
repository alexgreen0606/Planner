import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import CustomText from '../../components/text/CustomText';
import { selectableColors } from '../../theme/colors';
import { LISTS_STORAGE_ID } from '../checklists/constants';
import {
    createFolderItem,
    deleteFolderItem,
    getFolderFromStorage,
    getFolderItems,
    updateFolderItem,
} from '../checklists/storage';
import { Folder, FolderItem, FolderItemTypes } from '../checklists/types';
import Toolbar, { ToolbarProps } from '../sortedList/components/ListItemToolbar';
import { ItemStatus } from '../sortedList/constants';
import useSortedList from '../sortedList/hooks/useSortedList';
import { useScrollContainer } from '../sortedList/services/ScrollContainerProvider';
import { ListItem, ModifyItemConfig } from '../sortedList/types';
import { generateSortId, isItemTextfield } from '../sortedList/utils';

import { GenericIconProps } from '@/components/GenericIcon';
import { Alert } from 'react-native';
import SortableList from '../sortedList';

interface SortedFolderProps {
    folderId: string;
    handleOpenItem: (id: string, type: FolderItemTypes) => void;
    parentClickTrigger: number;
    parentFolderData?: Folder;
};

const SortedFolder = ({
    folderId,
    handleOpenItem,
    parentClickTrigger,
    parentFolderData,
}: SortedFolderProps) => {

    const { currentTextfield, setCurrentTextfield } = useScrollContainer();

    const router = useRouter();

    const folderData = useMemo(() => getFolderFromStorage(folderId), [folderId]);

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
                router.back();
            }
        }
    }, [parentClickTrigger]);

    function initializeEmptyFolder(newItem: ListItem) {
        return {
            ...newItem,
            childrenCount: 0,
            listId: folderId,
            type: FolderItemTypes.FOLDER,
            platformColor: 'systemBrown',
        }
    };

    function beginItemTransfer(item: FolderItem) {
        setCurrentTextfield({ ...item, status: ItemStatus.TRANSFER });
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
        handleOpenItem(item.id, item.type);
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
        const isOpen = isItemTextfield(item);

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
                            onClick: () => {
                                const title = `Delete ${item.type}?`;

                                let message = '';
                                if (!!item.childrenCount) {
                                    message += `This ${item.type} has ${item.childrenCount} items. Deleting is irreversible and will lose all inner contents.`;
                                } else {
                                    message += `Would you like to delete this ${item.type}?`;
                                }

                                Alert.alert(
                                    title,
                                    message,
                                    [
                                        {
                                            text: 'Cancel',
                                            style: 'cancel'
                                        },
                                        {
                                            text: !!item.childrenCount ? 'Force Delete' : 'Delete',
                                            style: 'destructive',
                                            onPress: () => {
                                                SortedItems.deleteSingleItemFromStorage(item);
                                            }
                                        }
                                    ]
                                );
                            },
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
    const getIconType = (item: FolderItem) => isItemTransfering(item) ? 'transfer' : item.type;
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
                
                // Rebuild the list to sync the updated item
                SortedItems.refetchItems();
            },
            delete: (items) => deleteFolderItem(items[0].id, items[0].type)
        },
        reloadOnNavigate: true
    });

    return (
        <SortableList<FolderItem, ToolbarProps<FolderItem>, never>
            listId={folderId}
            items={SortedItems.items}
            fillSpace
            onDragEnd={SortedItems.persistItemToStorage}
            getTextfieldKey={item => `${item.id}-${item.sortId}`}
            onSaveTextfield={SortedItems.persistItemToStorage}
            onDeleteItem={SortedItems.deleteSingleItemFromStorage}
            getToolbar={item => getItemToolbarConfig(item)}
            initializeItem={initializeEmptyFolder}
            onContentClick={handleItemClick}
            getRowTextPlatformColor={item => isItemTransfering(item) ? 'systemBlue' :
                (isTransferMode() && item.type === FolderItemTypes.LIST) ? 'systemGray3' : 'label'}
            getRightIconConfig={item => ({
                customIcon:
                    <CustomText type='label'>
                        {item.childrenCount}
                    </CustomText>
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
                className: 'flex-1'
            }}
        />
    );
};

export default SortedFolder;