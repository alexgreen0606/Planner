import { GenericIconProps } from '@/components/GenericIcon';
import CustomText from '@/components/text/CustomText';
import { selectableColors } from '@/constants/selectableColors';
import { CHECKLISTS_STORAGE_ID } from '@/constants/storageIds';
import { EFolderItemType } from '@/enums/EFolderItemType';
import { EItemStatus } from '@/enums/EItemStatus';
import useSortedList from '@/hooks/useSortedList';
import { createFolderItem, deleteFolderItem, getFolderFromStorage, getFolderItems, updateFolderItem } from '@/storage/checklistsStorage';
import { IFolder } from '@/types/checklists/IFolder';
import { ModifyItemConfig } from '@/types/listItems/core/rowConfigTypes';
import { IListItem } from '@/types/listItems/core/TListItem';
import { IFolderItem } from '@/types/listItems/IFolderItem';
import { generateSortId, isItemTextfield } from '@/utils/listUtils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, PlatformColor } from 'react-native';
import SortableList from '../sortedList';
import Toolbar, { ToolbarProps } from '../sortedList/ListItemToolbar';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';

interface SortedFolderProps {
    handleOpenItem: (id: string, type: EFolderItemType) => void;
    parentClickTrigger: number;
    parentFolderData?: IFolder;
};

const SortedFolder = ({
    handleOpenItem,
    parentClickTrigger,
    parentFolderData,
}: SortedFolderProps) => {
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<IFolderItem>();
    const { folderId } = useLocalSearchParams<{ folderId: string }>();
    const router = useRouter();

    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const folderData = useMemo(() => getFolderFromStorage(folderId), [folderId]);

    /**
     * If the focused item is being transferred, transfer it to the parent folder.
     * Otherwise, open the parent folder.
     */
    useEffect(() => {
        if (parentClickTrigger > 0) {

            // Handle parent folder click
            if (textfieldItem?.status === EItemStatus.TRANSFER) {
                handleItemTransfer();
                return;

            } else if (folderData.listId) {
                router.back();
            }
        }
    }, [parentClickTrigger]);

    function initializeEmptyFolder(newItem: IListItem) {
        return {
            ...newItem,
            childrenCount: 0,
            listId: folderId,
            type: EFolderItemType.FOLDER,
            platformColor: 'systemBrown',
        }
    };

    function beginItemTransfer(item: IFolderItem) {
        setTextfieldItem({ ...item, status: EItemStatus.TRANSFER });
    }

    /**
     * Transfers the textfield item to a new folder.
     * @param destination - the folder being transferred to
     */
    const handleItemTransfer = (destination?: IFolderItem) => {
        if (!destination && !parentFolderData?.id || !textfieldItem) return;
        const destinationId = destination ? destination.id : parentFolderData?.id;

        if (!destinationId) return;

        // Transfer the item to the destination
        const destinationItems = getFolderItems(
            destination ? getFolderFromStorage(destination.id) : parentFolderData!
        );
        updateFolderItem({
            ...textfieldItem,
            status: EItemStatus.STATIC,
            listId: destinationId,
            sortId: generateSortId(-1, destinationItems)
        });
        setTextfieldItem(null);
    };

    /**
     * Handles clicking a list item. In transfer mode, the textfield item will transfer to the clicked item.
     * Otherwise, the focused item will be saved and the clicked item will be opened.
     * @param item - the item that was clicked
     */
    const handleItemClick = (item: IFolderItem) => {
        if (textfieldItem && textfieldItem.status === EItemStatus.TRANSFER) {
            if (item.id === textfieldItem.id) {
                setTextfieldItem({ ...textfieldItem, status: EItemStatus.EDIT });
            } else if (item.type === EFolderItemType.FOLDER) {
                handleItemTransfer(item);
            }
            return;
        } else if (textfieldItem) {
            SortedItems.persistItemToStorage({ ...textfieldItem, status: EItemStatus.STATIC });
        }
        handleOpenItem(item.id, item.type);
    };

    // Helper function to create the color selection icon set
    const createColorSelectionIconSet = (item: IFolderItem): GenericIconProps<IFolderItem>[] => {
        return Object.values(selectableColors).map(color => ({
            type: item.platformColor === color ? 'circleFilled' : 'circle',
            platformColor: color,
            onClick: () => setTextfieldItem({ ...item, platformColor: color }),
        }));
    };

    const getItemToolbarConfig = (item: IFolderItem): ModifyItemConfig<IFolderItem, ToolbarProps<IFolderItem>> => {
        const isNew = item.status === EItemStatus.NEW;
        const isOpen = isItemTextfield(item);

        return {
            component: Toolbar<IFolderItem>,
            props: {
                open: isOpen,
                iconSets: isNew
                    ? [
                        [
                            {
                                type: 'folder',
                                onClick: () => setTextfieldItem({ ...item, type: EFolderItemType.FOLDER }),
                                platformColor: item.type === EFolderItemType.FOLDER ? item.platformColor : 'secondaryLabel'
                            },
                            {
                                type: 'list',
                                onClick: () => setTextfieldItem({ ...item, type: EFolderItemType.LIST }),
                                platformColor: item.type === EFolderItemType.LIST ? item.platformColor : 'secondaryLabel'
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

                                setIsDeleteAlertOpen(true);
                                Alert.alert(
                                    title,
                                    message,
                                    [
                                        {
                                            text: 'Cancel',
                                            style: 'cancel',
                                            onPress: () => {
                                                setIsDeleteAlertOpen(false);
                                            }
                                        },
                                        {
                                            text: !!item.childrenCount ? 'Force Delete' : 'Delete',
                                            style: 'destructive',
                                            onPress: () => {
                                                SortedItems.deleteSingleItemFromStorage(item);
                                                setIsDeleteAlertOpen(false);
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

    const isItemTransfering = (item: IFolderItem) => item.status === EItemStatus.TRANSFER;
    const isTransferMode = textfieldItem?.status === EItemStatus.TRANSFER;
    const getIconType = (item: IFolderItem) => isItemTransfering(item) ? 'transfer' : item.type;
    const getIconPlatformColor = (item: IFolderItem) => isItemTransfering(item) ?
        'systemBlue' : (item.type === EFolderItemType.LIST && isTransferMode) ?
            'tertiaryLabel' : item.platformColor;

    const SortedItems = useSortedList<IFolderItem, IFolder>({
        storageId: CHECKLISTS_STORAGE_ID,
        storageKey: folderId,
        getItemsFromStorageObject: getFolderItems,
        storageConfig: {
            create: createFolderItem,
            update: (newItem) => {
                updateFolderItem(newItem);

                // Rebuild the list to sync the updated item
                SortedItems.refetchItems();
            },
            delete: (items) => {
                deleteFolderItem(items[0].id, items[0].type);
                setTextfieldItem(null);
            }
        },
        initializeListItem: initializeEmptyFolder,
        reloadOnNavigate: true
    });

    return (
        <SortableList<IFolderItem, ToolbarProps<IFolderItem>, never>
            listId={folderId}
            items={SortedItems.items}
            fillSpace
            onDragEnd={SortedItems.persistItemToStorage}
            getTextfieldKey={item => `${item.id}-${item.sortId}`}
            onDeleteItem={SortedItems.deleteSingleItemFromStorage}
            getToolbar={item => getItemToolbarConfig(item)}
            onContentClick={handleItemClick}
            saveTextfieldAndCreateNew={SortedItems.saveTextfieldAndCreateNew}
            hideKeyboard={isDeleteAlertOpen || isTransferMode}
            getRowTextPlatformColor={item => isItemTransfering(item) ? 'systemBlue' :
                (isTransferMode && item.type === EFolderItemType.LIST) ? 'tertiaryLabel' : 'label'}
            getRightIconConfig={item => ({
                customIcon:
                    <CustomText
                        type='label'
                        style={{
                            color: PlatformColor((item.type === EFolderItemType.LIST && isTransferMode) ?
                                'tertiaryLabel' : 'secondaryLabel')
                        }}
                    >
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