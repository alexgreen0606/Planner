import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, UIManager, findNodeHandle, TouchableOpacity } from 'react-native';
import { Portal, useTheme } from 'react-native-paper';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import { ItemStatus, ShiftTextfieldDirection } from '../../../foundation/sortedLists/enums';
import { FolderItemType } from '../enums';
import { FolderItem } from '../types';
import { useNavigatorContext } from '../../../foundation/navigation/services/TabsProvider';
import FolderItemBanner from './FolderItemBanner';
import {
    createFolderItem,
    getFolder,
    updateFolderItem,
    getFolderItems,
    getStorageKey,
    deleteFolderItem
} from '../storage/folderStorage';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import { StorageIds } from '../../../enums';
import Modal from '../../../foundation/ui/modal/Modal';
import ClickableLine from '../../../foundation/ui/separators/ClickableLine';
import ListTextfield from '../../../foundation/sortedLists/components/ListTextfield';
import GenericIcon, { IconType } from '../../../foundation/ui/icons/GenericIcon';
import globalStyles from '../../../theme/globalStyles';
import CustomText from '../../../foundation/ui/text';

interface SortableFolderProps {
    folderId: string;
    onBackClick: (parentFolderId: string) => void;
    onOpenItem: (id: string, type: FolderItemType) => void;
};

const SortableFolder = ({
    folderId,
    onBackClick,
    onOpenItem
}: SortableFolderProps) => {
    const { colors } = useTheme();
    const { currentTab } = useNavigatorContext();
    const [initialFolderItems, setInitialFolderItems] = useState(getFolderItems(folderId));
    const skipStorageSync = useRef(false);
    const inputWrapperRef = useRef<View>(null);
    const folderData = useMemo(() => getFolder(folderId), [folderId]);
    const parentFolderData = useMemo(() => folderData.parentFolderId ? getFolder(folderData.parentFolderId) : null, [folderData]);
    const folderStorage = useMMKV({ id: StorageIds.FOLDER_STORAGE });

    // Creates a new item in storage, and ensures the component re-render is skipped
    const customCreateNewItem = (newData: FolderItem) => {
        skipStorageSync.current = true;
        return createFolderItem(folderId, newData);
    };

    // Creates a new textfield with initial item count set to 0
    const customCreateNewTextfield = (newItem: FolderItem) => {
        return {
            ...newItem,
            childrenCount: 0
        }
    };

    // Toggles an item in and out of delete status
    const customToggleItemDelete = (item: FolderItem, isModalOpen: boolean) => {
        SortedFolder.updateItem({
            ...item,
            status: isModalOpen ? ItemStatus.EDIT : ItemStatus.DELETE
        })
    }

    // Stores the current folder and all handler functions to update it
    const SortedFolder = useSortedList<FolderItem>(
        initialFolderItems,
        undefined,
        customCreateNewTextfield,
        {
            create: customCreateNewItem,
            update: updateFolderItem,
            delete: (item: FolderItem) => deleteFolderItem(item.id, item.type)
        }
    );

    // Sync the sorted list with storage
    useMMKVListener((key) => {
        if (key === getStorageKey(folderId)) {
            if (skipStorageSync.current) {
                skipStorageSync.current = false;
            } else {
                setInitialFolderItems(getFolderItems(folderId));
            }
        }
    }, folderStorage);

    /**
     * Transfers the focused item to a new folder.
     * @param destination - the folder being transferred to
     */
    const handleItemTransfer = (destination?: FolderItem) => {
        const focusedItem = SortedFolder.getFocusedItem();
        if (!destination && !parentFolderData?.id || !focusedItem) return;
        const destinationId = destination ? destination.id : parentFolderData?.id;

        // Transfer the item to the destination
        updateFolderItem({ ...focusedItem, status: ItemStatus.STATIC }, destinationId);
    };

    /**
     * If the focused item is being transferred, transfer it to the parent folder.
     * Otherwise, open the parent folder.
     */
    const handleParentFolderClick = () => {
        const focusedItem = SortedFolder.getFocusedItem();
        if (focusedItem?.status === ItemStatus.TRANSFER) {
            handleItemTransfer();
            return;

        } else if (folderData.parentFolderId) {
            onBackClick(folderData.parentFolderId);
        }
    };

    /**
     * Deletes the item from storage.
     * @param item - the item to delete
     */
    const handleDeleteItem = (item: FolderItem) => {
        deleteFolderItem(item.id, item.type);
    };


    /**
     * Handles clicking a list item. In transfer mode, the textfield item will transfer to the clicked item.
     * Otherwise, the focused item will be saved and the clicked item will be opened.
     * @param item - the item that was clicked
     */
    const handleItemClick = (item: FolderItem) => {
        const currentItem = SortedFolder.getFocusedItem();
        if (currentItem && currentItem.status === ItemStatus.TRANSFER) {
            if (item.type === FolderItemType.FOLDER) {
                handleItemTransfer(item);
                return;
            }
        } else if (currentItem) {
            SortedFolder.saveTextfield();
        }
        onOpenItem(item.id, item.type);
    };

    /**
     * Displays the popup for creating a new item, allowing for setting its type as a folder or a list.
     * @param item - the item being created
     * @param popupPosition - the position on the screen of the popup
     */
    const renderNewItemPopup = (item: FolderItem, popupPosition: { x: number, y: number }) =>
        <View
            style={[
                styles.popup,
                { top: popupPosition.y, left: popupPosition.x },
            ]}
        >
            <TouchableOpacity onPress={() => SortedFolder.updateItem({ ...item, type: FolderItemType.FOLDER })}>
                <GenericIcon
                    type='MaterialIcons'
                    name='folder-open'
                    size={20}
                    color={item.type === FolderItemType.FOLDER ? colors.primary : colors.outline}
                />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => SortedFolder.updateItem({ ...item, type: FolderItemType.LIST })}>
                <GenericIcon
                    type='Ionicons'
                    name='list-outline'
                    size={20}
                    color={item.type === FolderItemType.LIST ? colors.primary : colors.outline}
                />
            </TouchableOpacity>
        </View>

    /**
     * Displays the popup for editing an item, allowing for transfering or deleting it.
     * @param item - the item being edited
     * @param popupPosition - the position on the screen of the popup
     */
    const renderEditItemPopup = (
        popupPosition: { x: number, y: number },
        item: FolderItem,
        isItemTransfering: boolean,
        isItemDeleting: boolean
    ) =>
        <View
            style={[
                styles.popup,
                { top: popupPosition.y, left: popupPosition.x },
            ]}
        >
            <TouchableOpacity
                onPress={() => SortedFolder.beginTransferItem(item)}
            >
                <GenericIcon
                    type='MaterialCommunityIcons'
                    name='arrow-down-right'
                    size={20}
                    color={isItemTransfering ? colors.primary : colors.outline}
                />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => customToggleItemDelete(item, false)}
            >
                <GenericIcon
                    type='Entypo'
                    name='trash'
                    size={20}
                    color={isItemDeleting ? colors.outline : colors.outline}
                />
            </TouchableOpacity>
        </View>

    /**
     * Displays the textfield for editing and creating an item, as well as 
     * the delete popup and edit popovers.
     * @param item - the item being modified
     * @param isItemTransfering - true if the item is being moved to a new parent
     * @param isItemDeleting - true if the item is being deleted
     */
    const renderInputField = (
        item: FolderItem,
        isItemTransfering: boolean,
        isItemDeleting: boolean
    ) => {
        const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
        const itemType = item.type === FolderItemType.FOLDER ? 'folder' : 'list';

        // Calculates the position of the popover
        const handleInputLayout = () => {
            if (inputWrapperRef.current) {
                UIManager.measure(
                    findNodeHandle(inputWrapperRef.current)!,
                    (_, __, ___, height, pageX, pageY) => {
                        setPopupPosition({ x: pageX + 7, y: pageY + height });
                    }
                );
            }
        };

        return (
            <View>
                <View
                    onLayout={handleInputLayout}
                    key={`${item.id}-${item.sortId}`}
                >

                    {/* Textfield */}
                    <ListTextfield
                        item={item}
                        onChange={(text) => SortedFolder.updateItem({ ...item, value: text })}
                        onSubmit={() => SortedFolder.saveTextfield(ShiftTextfieldDirection.BELOW)}
                    />
                </View>

                {/* Edit Popovers */}
                {!isItemTransfering && currentTab === 'folders' && (
                    <Portal>
                        {item.status === ItemStatus.NEW && (
                            renderNewItemPopup(item, popupPosition)
                        )}
                        {item.status === ItemStatus.EDIT && (
                            renderEditItemPopup(popupPosition, item, isItemTransfering, isItemDeleting)
                        )}
                    </Portal>
                )}

                {/* Delete popup */}
                <Modal
                    title={`${!!item.childrenCount ? 'Force delete' : 'Delete'} ${itemType}?`}
                    open={item.status === ItemStatus.DELETE}
                    toggleModalOpen={() => customToggleItemDelete(item, true)}
                    primaryButtonConfig={{
                        label: !!item.childrenCount ? 'Force Delete' : 'Delete',
                        onClick: () => handleDeleteItem(item),
                        color: !!item.childrenCount ? 'red' : colors.primary
                    }}
                >
                    {!!item.childrenCount ? (
                        <CustomText type='standard'>
                            This {itemType} has {item.childrenCount} items. Deleting is irreversible and will lose all inner contents.
                        </CustomText>
                    ) : (
                        <CustomText type='standard'>
                            Would you like to delete this {itemType}?
                        </CustomText>
                    )}
                </Modal>
            </View>
        );
    }

    /**
     * Displays the item based on its state. If being edited, a textfield is displayed.
     * Otherwise, the item is displayed as a string.
     * @param item - the item data
     * @param isItemEditing - true if the item is being modified
     * @param transferMode - true if any item in the list is being transferred
     * @param isItemTransferring - true if this item is being transferred
     * @param isItemDeleting - true if the item is being deleted
     */
    const renderItem = (
        item: FolderItem,
        isItemEditing: boolean,
        transferMode: boolean,
        isItemTransferring: boolean,
        isItemDeleting: boolean
    ) =>
        isItemEditing ?
            renderInputField(item, isItemTransferring, isItemDeleting) :
            <Text
                onPress={() => handleItemClick(item)}
                style={{
                    ...globalStyles.listItem,
                    color: (transferMode && item.type === FolderItemType.LIST) ? colors.outline :
                        isItemDeleting ?
                            colors.outline : colors.secondary,
                    textDecorationLine: isItemDeleting ? 'line-through' : undefined
                }}
            >
                {item.value}
            </Text>

    /**
     * Displays a row representing an item within the folder. A row includes an edit icon, the data,
     * and a line allowing for creating new items below it.
     * @param param0 - the item data and the drag function for sorting
     */
    const renderRow = ({ item, drag }: RenderItemParams<FolderItem>) => {
        const transferMode = SortedFolder.getFocusedItem()?.status === ItemStatus.TRANSFER;
        const isItemEditing = [ItemStatus.NEW, ItemStatus.EDIT, ItemStatus.TRANSFER, ItemStatus.DELETE].includes(item.status);
        const isItemTransferring = item.status === ItemStatus.TRANSFER;
        const isItemDeleting = item.status === ItemStatus.DELETE;
        const iconStyle: { type: IconType, name: string } | undefined =
            isItemTransferring ? { type: 'MaterialCommunityIcons', name: 'arrow-down-right' } :
                item.type === FolderItemType.FOLDER ? { type: 'MaterialIcons', name: 'folder-open' } :
                    { type: 'Ionicons', name: 'list-outline' };
        return (
            <View ref={isItemEditing ? inputWrapperRef : undefined}>
                <View style={globalStyles.listRow}>

                    {/* Edit Icon */}
                    <TouchableOpacity
                        onLongPress={drag}
                        onPress={() => SortedFolder.beginEditItem(item)}
                    >
                        <GenericIcon
                            type={iconStyle.type}
                            name={iconStyle.name}
                            size={20}
                            color={isItemTransferring ? colors.primary : colors.outline}
                        />
                    </TouchableOpacity>

                    {/* Row Data */}
                    {renderItem(item, isItemEditing, transferMode, isItemTransferring, isItemDeleting)}

                    {/* Item Count Marker */}
                    {!isItemEditing && (
                        <Text style={{ color: colors.outline }}>
                            {item.childrenCount}
                        </Text>
                    )}
                </View>

                {/* Separator Line */}
                <ClickableLine onPress={() => SortedFolder.moveTextfield(item.sortId)} />
            </View>
        )
    }

    return (
        <View>
            <FolderItemBanner
                itemId={folderData.id}
                backButtonConfig={{
                    display: !!parentFolderData,
                    label: parentFolderData?.value,
                    onClick: handleParentFolderClick
                }}
                itemType={FolderItemType.FOLDER}
            />
            <ClickableLine onPress={() => SortedFolder.moveTextfield(-1)} />
            <DraggableFlatList
                data={SortedFolder.current}
                scrollEnabled={false}
                onDragEnd={SortedFolder.endDragItem}
                onDragBegin={SortedFolder.beginDragItem}
                keyExtractor={(item) => item.id}
                renderItem={renderRow}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    popup: {
        ...globalStyles.verticallyCentered,
        ...globalStyles.background,
        borderRadius: 4,
        elevation: 4,
        padding: 12,
        gap: 16
    }
});

export default SortableFolder;