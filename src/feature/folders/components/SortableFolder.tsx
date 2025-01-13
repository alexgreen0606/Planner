import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, UIManager, findNodeHandle, TouchableOpacity } from 'react-native';
import { Portal } from 'react-native-paper';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import { ItemStatus, ListStorageMode, ShiftTextfieldDirection } from '../../../foundation/sortedLists/enums';
import { FolderItemType } from '../enums';
import { FolderItem } from '../types';
import { useNavigatorContext } from '../../../foundation/navigation/services/TabsProvider';
import FolderItemBanner from './FolderItemBanner';
import {
    createFolderItem,
    getFolderFromStorage,
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
import globalStyles from '../../../foundation/theme/globalStyles';
import CustomText from '../../../foundation/ui/text/CustomText';
import colors from '../../../foundation/theme/colors';
import { selectableColors } from '../../../foundation/consts';
import ThinLine from '../../../foundation/ui/separators/ThinLine';
import EmptyLabel from '../../../foundation/sortedLists/components/EmptyLabel';

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
    const { currentTab } = useNavigatorContext();
    const [initialFolderItems, setInitialFolderItems] = useState(getFolderItems(folderId));
    const skipStorageSync = useRef(false);
    const inputWrapperRef = useRef<View>(null);
    const folderData = useMemo(() => getFolderFromStorage(folderId), [folderId]);
    const parentFolderData = useMemo(() => folderData.parentFolderId ? getFolderFromStorage(folderData.parentFolderId) : null, [folderData]);
    const folderStorage = useMMKV({ id: StorageIds.FOLDER_STORAGE });

    // Creates a new item in storage, and ensures the component re-render is skipped
    const customCreateNewItem = (newData: FolderItem) => {
        skipStorageSync.current = true;
        return createFolderItem(folderId, newData);
    };

    // Creates a new textfield with initial item count set to 0
    const initializeFolderItem = (newItem: FolderItem) => {
        const initializedItem = {
            ...newItem,
            childrenCount: 0,
            type: FolderItemType.FOLDER,
            color: 'yellow'
        };
        return initializedItem;
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
        {
            storageMode: ListStorageMode.ITEM_SYNC,
            storageUpdates: {
                create: customCreateNewItem,
                update: updateFolderItem,
                delete: (item: FolderItem) => deleteFolderItem(item.id, item.type)
            },
            initializeNewItem: initializeFolderItem
        },
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
            }
            return;
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
    const renderNewItemPopover = (item: FolderItem, popupPosition: { x: number, y: number }) =>
        <View
            style={[
                styles.popup,
                { top: popupPosition.y, left: popupPosition.x },
            ]}
        >
            <View style={styles.popoverRow}>
                <TouchableOpacity onPress={() => SortedFolder.updateItem({ ...item, type: FolderItemType.FOLDER })}>
                    <GenericIcon
                        type='MaterialIcons'
                        name='folder-open'
                        size={20}
                        color={item.type === FolderItemType.FOLDER ? colors.blue : colors.grey}
                    />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => SortedFolder.updateItem({ ...item, type: FolderItemType.LIST })}>
                    <GenericIcon
                        type='Ionicons'
                        name='list-outline'
                        size={20}
                        color={item.type === FolderItemType.LIST ? colors.blue : colors.grey}
                    />
                </TouchableOpacity>
            </View>
            <ThinLine style={{ alignSelf: 'stretch', width: undefined }} />
            <View style={styles.popoverRow}>
                {selectableColors.map(color =>
                    <TouchableOpacity key={color} onPress={() => SortedFolder.updateItem({ ...item, color })}>
                        <GenericIcon
                            type='FontAwesome'
                            name={item.color === color ? 'circle' : 'circle-thin'}
                            size={20}
                            color={colors[color as keyof typeof colors]}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>

    /**
     * Displays the popup for editing an item, allowing for transfering or deleting it.
     * @param item - the item being edited
     * @param popupPosition - the position on the screen of the popup
     */
    const renderEditItemPopover = (
        popupPosition: { x: number, y: number },
        item: FolderItem,
        isItemTransfering: boolean,
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
                    color={isItemTransfering ? colors.blue : colors.grey}
                />
            </TouchableOpacity>
            <ThinLine style={{ alignSelf: 'stretch', width: undefined }} />
            <TouchableOpacity
                onPress={() => customToggleItemDelete(item, false)}
            >
                <GenericIcon
                    type='Entypo'
                    name='trash'
                    size={20}
                    color={colors.grey}
                />
            </TouchableOpacity>
            <ThinLine style={{ alignSelf: 'stretch', width: undefined }} />
            <View style={styles.popoverRow}>
                {selectableColors.map(color =>
                    <TouchableOpacity key={color} onPress={() => SortedFolder.updateItem({ ...item, color })}>
                        <GenericIcon
                            type='FontAwesome'
                            name={item.color === color ? 'circle' : 'circle-thin'}
                            size={20}
                            color={colors[color as keyof typeof colors]}
                        />
                    </TouchableOpacity>
                )}
            </View>
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
        isItemTransfering: boolean
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
                            renderNewItemPopover(item, popupPosition)
                        )}
                        {item.status === ItemStatus.EDIT && (
                            renderEditItemPopover(popupPosition, item, isItemTransfering)
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
                        color: !!item.childrenCount ? 'red' : colors.blue
                    }}
                    iconConfig={{
                        type: 'Entypo',
                        name: 'trash',
                        color: 'red'
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
                            color={isItemTransferring ? colors.blue : (item.type === FolderItemType.LIST && transferMode) ? colors.grey : colors[item.color as keyof typeof colors]}
                        />
                    </TouchableOpacity>

                    {/* Row Data */}
                    {isItemEditing ? (
                        renderInputField(item, isItemTransferring)) :
                        <Text
                            onPress={() => handleItemClick(item)}
                            style={{
                                ...globalStyles.listItem,
                                color: (transferMode && item.type === FolderItemType.LIST) ? colors.grey :
                                    isItemDeleting ?
                                        colors.grey : colors.white,
                                textDecorationLine: isItemDeleting ? 'line-through' : undefined
                            }}
                        >
                            {item.value}
                        </Text>
                    }

                    {/* Item Count Marker */}
                    {!isItemEditing && (
                        <Text style={{ color: colors.grey }}>
                            {item.childrenCount}
                        </Text>
                    )}
                </View>

                {/* Separator Line */}
                <ClickableLine onPress={() => SortedFolder.createOrMoveTextfield(item.sortId)} />
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
            <ClickableLine onPress={() => SortedFolder.createOrMoveTextfield(-1)} />
            <DraggableFlatList
                data={SortedFolder.current}
                scrollEnabled={false}
                onDragEnd={SortedFolder.endDragItem}
                onDragBegin={SortedFolder.beginDragItem}
                keyExtractor={(item) => item.id}
                renderItem={renderRow}
            />
            {!SortedFolder.current.length && (
                <EmptyLabel
                    label={"It's a ghost town in here."}
                    iconConfig={{
                        type: 'FontAwesome6',
                        name: 'ghost',
                        size: 26,
                        color: colors.grey,
                    }}
                    customFontSize={14}
                    onPress={() => SortedFolder.createOrMoveTextfield(-1)}
                    style={{ height: '90%', flexDirection: 'column' }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    popup: {
        ...globalStyles.horizontallyCentered,
        ...globalStyles.backdrop,
        elevation: 4,
        padding: 12,
        gap: 8,
        flexShrink: 1,
        alignSelf: 'flex-start',
        alignItems: 'flex-start'
    },
    popoverRow: {
        flexDirection: 'row',
        gap: 16
    }
});

export default SortableFolder;