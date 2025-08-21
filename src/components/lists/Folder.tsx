import { textfieldIdAtom } from '@/atoms/textfieldId';
import CustomText from '@/components/text/CustomText';
import { useFolderItem } from '@/hooks/useFolderItem';
import useFolderTextfield from '@/hooks/textfields/useFolderTextfield';
import { selectableColors } from '@/lib/constants/colors';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { getFolderItemFromStorageById, saveFolderItemToStorage } from '@/storage/checklistsStorage';
import { deleteFolderItemAndChildren, generateNewFolderItemAndSaveToStorage, updateListItemIndex } from '@/utils/checklistUtils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSetAtom } from 'jotai';
import React, { useEffect } from 'react';
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

    const setTextfieldId = useSetAtom(textfieldIdAtom);

    const { folderId } = useLocalSearchParams<{ folderId: string }>();
    const router = useRouter();

    const {
        item: folder,
        itemIds
    } = useFolderItem(folderId);

    const {
        isTransferMode,
        textfieldItem,
        onEndTransfer,
        onBeginTransfer,
        onChangeColor,
        onToggleType,
        onCloseTextfield
    } = useFolderTextfield();

    const storage = useMMKV({ id: EStorageId.FOLDER_ITEM });

    const toolbarIconSet: ToolbarIcon<IFolderItem>[][] = !textfieldItem
        ? []
        : [
            // Folder/List toggle
            textfieldItem.itemIds.length === 0
                ? [
                    {
                        type: "folder",
                        onClick: onToggleType,
                        platformColor:
                            textfieldItem.type === EFolderItemType.FOLDER
                                ? textfieldItem.platformColor
                                : "secondaryLabel",
                    },
                    {
                        type: "list",
                        onClick: onToggleType,
                        platformColor:
                            textfieldItem.type === EFolderItemType.LIST
                                ? textfieldItem.platformColor
                                : "secondaryLabel",
                    },
                ]
                : [],

            // Color selection
            Object.values(selectableColors).map(color => ({
                type: textfieldItem?.platformColor === color ? 'circleFilled' : 'circle',
                platformColor: color,
                onClick: () => onChangeColor(color),
            })),

            // Transfer
            [
                {
                    type: "transfer",
                    onClick: onBeginTransfer,
                },
            ],

            // Delete
            [
                {
                    onClick: () => {
                        const title = `Delete ${textfieldItem.type}?`;
                        const hasNestedItems = textfieldItem.itemIds.length > 0;

                        let message = "";
                        if (hasNestedItems) {
                            message += `This ${textfieldItem.type} has ${textfieldItem.itemIds.length} items. Deleting is irreversible and will lose all inner contents.`;
                        } else {
                            message += `Would you like to delete this ${textfieldItem.type}?`;
                        }

                        Alert.alert(title, message, [
                            {
                                text: "Cancel",
                                style: "cancel",
                            },
                            {
                                text: hasNestedItems ? "Force Delete" : "Delete",
                                style: "destructive",
                                onPress: () => {
                                    onCloseTextfield();
                                    deleteFolderItemAndChildren(textfieldItem);
                                },
                            },
                        ]);
                    },
                    type: "trash",
                },
            ],
        ];

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

    function handleTransferToParent() {
        if (!folder || !textfieldItem) return;

        const parentFolder = getFolderItemFromStorageById(folder.listId);
        parentFolder.itemIds.push(textfieldItem.id);
        saveFolderItemToStorage(parentFolder);

        saveFolderItemToStorage({ ...folder, itemIds: folder.itemIds.filter((id) => id !== textfieldItem.id) });
        saveFolderItemToStorage({ ...textfieldItem, listId: folder.listId });

        onEndTransfer();
    }

    function handleTransferToChild(destinationItem: IFolderItem) {
        if (!folder || !textfieldItem) return;

        const childFolder = getFolderItemFromStorageById(destinationItem.id);
        childFolder.itemIds.push(textfieldItem.id);
        saveFolderItemToStorage(childFolder);

        saveFolderItemToStorage({ ...folder, itemIds: folder.itemIds.filter((id) => id !== textfieldItem.id) });
        saveFolderItemToStorage({ ...textfieldItem, listId: destinationItem.id });
    }

    function handleItemClick(item: IFolderItem) {
        if (isTransferMode) {
            if (item.type === EFolderItemType.FOLDER && item.id !== textfieldItem?.id) {
                handleTransferToChild(item);
            }
            onEndTransfer();
            return;
        }

        onOpenItem(item.id, item.type);
    }

    // ====================
    // 2. Helper Functions
    // ====================

    function getIsItemTransfering(item: IFolderItem) {
        return isTransferMode && textfieldItem?.id === item.id;
    }

    function getIconType(item: IFolderItem) {
        return getIsItemTransfering(item) ? 'transfer' : item.type;
    }

    function getIconPlatformColor(item: IFolderItem) {
        if (getIsItemTransfering(item)) {
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
            storageId={EStorageId.FOLDER_ITEM}
            hideTextfield={isTransferMode}
            toolbarIconSet={toolbarIconSet}
            onGetRowTextPlatformColor={item => getIsItemTransfering(item) ? 'systemBlue' :
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
                onClick: () => setTextfieldId(item.id)
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
