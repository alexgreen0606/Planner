import { GenericIconProps } from '@/components/icon';
import CustomText from '@/components/text/CustomText';
import useSortedList from '@/hooks/useSortedList';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { selectableColors } from '@/lib/constants/selectableColors';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EItemStatus } from '@/lib/enums/EItemStatus';
import { EListType } from '@/lib/enums/EListType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IFolder } from '@/lib/types/checklists/IFolder';
import { IListItem } from '@/lib/types/listItems/core/TListItem';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { deleteFolderItem, getFolderFromStorage, getFolderItems, saveTextfieldItem, updateFolderItem } from '@/storage/checklistsStorage';
import { generateSortId } from '@/utils/listUtils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, PlatformColor } from 'react-native';
import { useMMKV, useMMKVListener, useMMKVObject } from 'react-native-mmkv';
import SortableList from './components/SortableList';
import { ToolbarIcon } from './components/Toolbar';

interface SortedFolderProps {
    handleOpenItem: (id: string, type: EFolderItemType) => void;
    parentClickTrigger: number;
    parentFolderData?: IFolder;
}

const SortedFolder = ({
    handleOpenItem,
    parentClickTrigger,
    parentFolderData,
}: SortedFolderProps) => {
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<IFolderItem>();
    const { folderId } = useLocalSearchParams<{ folderId: string }>();
    const router = useRouter();

    const storage = useMMKV({ id: EStorageId.CHECKLISTS });

    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const [folder] = useMMKVObject<IFolder>(folderId, storage);

    const listType = EListType.FOLDER;

    /**
     * If the focused item is being transferred, transfer it to the parent folder.
     * Otherwise, open the parent folder.
     */
    useEffect(() => {
        if (!folder) return;
        if (parentClickTrigger > 0) {

            // Handle parent folder click
            if (textfieldItem?.status === EItemStatus.TRANSFER) {
                handleItemTransfer();
                return;

            } else if (folder.listId) {
                router.back();
            }
        }
    }, [parentClickTrigger]);

    // ------------- Utilities -------------

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

        let destinationFolder = parentFolderData!;
        if (destination) {
            const foundFolder = getFolderFromStorage(destination.id);
            if (!foundFolder) return;
            destinationFolder = foundFolder;
        }

        // Transfer the item to the destination
        const destinationItems = getFolderItems(destinationFolder);
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
    function handleItemClick(item: IFolderItem) {
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
    }

    // Helper function to create the color selection icon set
    function createColorSelectionIconSet(item: IFolderItem): GenericIconProps<IFolderItem>[] {
        return Object.values(selectableColors).map(color => ({
            type: item.platformColor === color ? 'circleFilled' : 'circle',
            platformColor: color,
            onClick: () => setTextfieldItem({ ...item, platformColor: color }),
        }));
    }

    function getToolbarIcons(): ToolbarIcon<IFolderItem>[][] {
        const item: IFolderItem = textfieldItem ?? initializeEmptyFolder({ id: '1', value: '', sortId: 1, status: EItemStatus.STATIC, listId: folderId, listType: EListType.FOLDER })
        const isNew = textfieldItem?.status === EItemStatus.NEW;

        return isNew ? [
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
        ] : [
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
                                    deleteFolderItem(item.id, item.type);
                                    setTextfieldItem(null);
                                    setIsDeleteAlertOpen(false);
                                }
                            }
                        ]
                    );
                },
                type: 'trash'
            }],
            createColorSelectionIconSet(item)
        ]
    }

    const getFolderItemsMemoized = useCallback(getFolderItems, []);

    const isItemTransfering = (item: IFolderItem) => item.status === EItemStatus.TRANSFER;
    const isTransferMode = textfieldItem?.status === EItemStatus.TRANSFER;
    const getIconType = (item: IFolderItem) => isItemTransfering(item) ? 'transfer' : item.type;
    const getIconPlatformColor = (item: IFolderItem) => isItemTransfering(item) ?
        'systemBlue' : (item.type === EFolderItemType.LIST && isTransferMode) ?
            'tertiaryLabel' : item.platformColor;

    const SortedItems = useSortedList<IFolderItem, IFolder>({
        storageId: EStorageId.CHECKLISTS,
        storageKey: folderId,
        getItemsFromStorageObject: getFolderItemsMemoized,
        saveItemToStorage: saveTextfieldItem,
        initializeListItem: initializeEmptyFolder,
        listType
    });

    // Rebuild the list when one of the folder's items changes
    useMMKVListener((key) => {
        if (!storage.contains(key)) return;
        if (
            folder?.listIds.includes(key) ||
            folder?.folderIds.includes(key)
        ) {
            SortedItems.refetchItems();
        }
    }, storage);

    return (
        <SortableList<IFolderItem>
            listId={folderId}
            items={SortedItems.items}
            fillSpace
            listType={listType}
            isLoading={SortedItems.isLoading}
            onDragEnd={SortedItems.persistItemToStorage}
            toolbarIconSet={getToolbarIcons()}
            onContentClick={handleItemClick}
            saveTextfieldAndCreateNew={SortedItems.saveTextfieldAndCreateNew}
            hideKeyboard={isDeleteAlertOpen || isTransferMode}
            getRowTextPlatformColor={item => isItemTransfering(item) ? 'systemBlue' :
                (isTransferMode && item.type === EFolderItemType.LIST) ? 'tertiaryLabel' : 'label'}
            getRightIconConfig={item => ({
                customIcon:
                    <CustomText
                        variant='microDetail'
                        customStyle={{
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