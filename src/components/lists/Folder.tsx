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
import { ToolbarIcon } from './components/ListToolbar';
import SortableList from './components/SortableList';

// ✅ 

type SortedFolderProps = {
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

    const getFolderItemsMemoized = useCallback(getFolderItems, []);

    const storage = useMMKV({ id: EStorageId.CHECKLISTS });
    const [folder] = useMMKVObject<IFolder>(folderId, storage);

    const listType = EListType.FOLDER;
    const isTransferMode = textfieldItem?.status === EItemStatus.TRANSFER;

    // Rebuild the list when one of the folder's items changes.
    useMMKVListener((key) => {
        if (!storage.contains(key)) return;
        if (
            folder?.listIds.includes(key) ||
            folder?.folderIds.includes(key)
        ) {
            SortedItems.refetchItems();
        }
    }, storage);

    // Handle clicking of the parent folder.
    useEffect(() => {
        if (!folder) return;
        if (parentClickTrigger > 0) {

            if (isTransferMode) {
                handleItemTransfer();
            } else if (folder.listId) {
                router.back();
            }
        }
    }, [parentClickTrigger]);

    // ==================
    // 1. Event Handlers
    // ==================

    function handleBeginItemTransfer(item: IFolderItem) {
        setTextfieldItem({ ...item, status: EItemStatus.TRANSFER });
    }

    function handleItemTransfer(destination?: IFolderItem) {
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
    }

    function handleItemClick(item: IFolderItem) {
        if (isTransferMode) {
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

    // ====================
    // 2. Helper Functions
    // ====================

    function initializeEmptyFolder(newItem: IListItem) {
        return {
            ...newItem,
            childrenCount: 0,
            listId: folderId,
            type: EFolderItemType.FOLDER,
            platformColor: 'systemBrown',
        }
    }

    function isItemTransfering(item: IFolderItem) {
        return item.status === EItemStatus.TRANSFER;
    }

    function generateColorSelectionIconSet(item: IFolderItem): GenericIconProps<IFolderItem>[] {
        return Object.values(selectableColors).map(color => ({
            type: item.platformColor === color ? 'circleFilled' : 'circle',
            platformColor: color,
            onClick: () => setTextfieldItem({ ...item, platformColor: color }),
        }));
    }

    function generateToolbarIcons(): ToolbarIcon<IFolderItem>[][] {
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
            generateColorSelectionIconSet(item)
        ] : [
            [{
                type: 'transfer',
                onClick: () => handleBeginItemTransfer(item),
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
            generateColorSelectionIconSet(item)
        ]
    }

    function getIconType(item: IFolderItem) {
        return isItemTransfering(item) ? 'transfer' : item.type;
    }

    function getIconPlatformColor(item: IFolderItem) {
        if (isItemTransfering(item)) {
            return 'systemBlue';
        }
        if (isTransferMode && item.type === EFolderItemType.LIST) {
            return 'tertiaryLabel';
        }
        return item.platformColor;
    }

    // ===================
    // 3. List Generation
    // ===================

    const SortedItems = useSortedList<IFolderItem, IFolder>({
        storageId: EStorageId.CHECKLISTS,
        storageKey: folderId,
        getItemsFromStorageObject: getFolderItemsMemoized,
        saveItemToStorage: saveTextfieldItem,
        initializeListItem: initializeEmptyFolder,
        listType
    });

    // =======
    // 4. UI
    // =======

    return (
        <SortableList<IFolderItem>
            listId={folderId}
            items={SortedItems.items}
            fillSpace
            listType={listType}
            isLoading={SortedItems.isLoading}
            onDragEnd={SortedItems.persistItemToStorage}
            toolbarIconSet={generateToolbarIcons()}
            onContentClick={handleItemClick}
            onSaveTextfieldAndCreateNew={SortedItems.saveTextfieldAndCreateNew}
            hideKeyboard={isDeleteAlertOpen || isTransferMode}
            onGetRowTextPlatformColor={item => isItemTransfering(item) ? 'systemBlue' :
                (isTransferMode && item.type === EFolderItemType.LIST) ? 'tertiaryLabel' : 'label'}
            onGetRightIconConfig={item => ({
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
            onGetLeftIconConfig={item => ({
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