import { GenericIconProps } from '@/components/icon';
import CustomText from '@/components/text/CustomText';
import { useFolderItem } from '@/hooks/useFolderItem';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { selectableColors } from '@/lib/constants/colors';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EItemStatus } from '@/lib/enums/EItemStatus';
import { EListItemType } from '@/lib/enums/EListType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { deleteFolderItemAndChildren, generateNewFolderItemAndSaveToStorage, updateListItemIndex } from '@/utils/checklistUtils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, PlatformColor } from 'react-native';
import { useMMKV } from 'react-native-mmkv';
import DragAndDropList from './components/DragAndDropList';
import { ToolbarIcon } from './components/ListToolbar';

//

type ISortedFolderProps = {
    parentClickTrigger: number;
    onOpenItem: (id: string, type: EFolderItemType) => void;
};

const SortedFolder = ({
    parentClickTrigger,
    onOpenItem,
}: ISortedFolderProps) => {

    const { folderId } = useLocalSearchParams<{ folderId: string }>();
    const router = useRouter();

    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<IFolderItem>();

    const { item: folder, itemIds } = useFolderItem(folderId);

    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const storage = useMMKV({ id: EStorageId.FOLDER });

    // TEXTFIELD ITEM status
    const isTransferMode = textfieldItem?.status === EItemStatus.TRANSFER;

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

    function handleBeginItemTransfer(item: IFolderItem) {
        setTextfieldItem({ ...item, status: EItemStatus.TRANSFER });
    }

    function handleTransferToParent() {
        // grab the parent folder list (from this item's listId)

        // insert the ID of the transfer item to the back of the list

        // save the list to folderStorage

        // chnage the item's listID and status STATIC in itemStorage
    }

    function handleTransferToChild(destinationItem: IFolderItem) {
        // add the transfer item ID to the back of its itemIds

        // save the destination folder to folderStorage

        // update the transfer item to STATIC and give it the new listId
    }

    function handleItemClick(item: IFolderItem) {
        if (isTransferMode) {
            if (item.id === textfieldItem.id) {
                // TODO: set textfield item to EDIT mode in storage
            } else if (item.type === EFolderItemType.FOLDER) {
                handleTransferToChild(item);
            }
            return;
        }

        onOpenItem(item.id, item.type);
    }

    // ====================
    // 2. Helper Functions
    // ====================

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
        return [];
        const item: IFolderItem = textfieldItem;
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
                    const hasNestedItems = item.itemIds.length > 0;

                    let message = '';
                    if (hasNestedItems) {
                        message += `This ${item.type} has ${item.itemIds.length} items. Deleting is irreversible and will lose all inner contents.`;
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
                                text: hasNestedItems ? 'Force Delete' : 'Delete',
                                style: 'destructive',
                                onPress: () => {
                                    deleteFolderItemAndChildren(item);
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

    return (
        <DragAndDropList<IFolderItem>
            fillSpace
            listId={folderId}
            itemIds={itemIds}
            storage={storage}
            listType={EListItemType.FOLDER_ITEM}
            toolbarIconSet={generateToolbarIcons()}
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
                        {item.itemIds.length}
                    </CustomText>
            })}
            onGetLeftIconConfig={item => ({
                icon: {
                    type: getIconType(item),
                    platformColor: getIconPlatformColor(item)
                },
                onClick: () => null // TODO: set the item to EDIT mode
            })}
            emptyLabelConfig={{
                label: "It's a ghost town in here.",
                className: 'flex-1'
            }}
            onDeleteItem={deleteFolderItemAndChildren}
            onCreateItem={generateNewFolderItemAndSaveToStorage}
            onContentClick={handleItemClick}
            onIndexChange={updateListItemIndex}
        />
    );
};

export default SortedFolder;