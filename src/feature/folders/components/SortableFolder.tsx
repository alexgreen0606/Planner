import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, UIManager, findNodeHandle } from 'react-native';
import { IconButton, Portal, useTheme } from 'react-native-paper';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { theme } from '../../../theme/theme';
import { FontAwesome } from '@expo/vector-icons';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import { ItemStatus, ShiftTextfieldDirection } from '../../../foundation/sortedLists/enums';
import { FolderItemType } from '../enums';
import { Folder, FolderItem } from '../types';
import { useNavigatorContext } from '../../../foundation/navigation/services/TabsProvider';
import LabelBanner from './LabelBanner';
import { createFolderItem, getFolder, updateFolderItem, getFolderItems, getStorageKey, deleteFolderItem } from '../storage/folderStorage';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import { StorageIds } from '../../../enums';
import Modal from '../../../foundation/ui/modal/Modal';
import ClickableLine from '../../../foundation/ui/separators/ClickableLine';
import ListTextfield from '../../../foundation/sortedLists/components/ListTextfield';

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
    const [folderItems, setFolderItems] = useState(getFolderItems(folderId));
    const skipStorageSync = useRef(false);
    const inputWrapperRef = useRef<View>(null);
    const folder = useMemo(() => getFolder(folderId), [folderId]);
    const parentFolder: Folder | null = folder.parentFolderId ? getFolder(folder.parentFolderId) : null;
    const storage = useMMKV({ id: StorageIds.FOLDER_STORAGE });

    const customCreateNewItem = (newData: FolderItem) => {
        skipStorageSync.current = true;
        createFolderItem(folderId, newData);
    }

    const SortedFolder = useSortedList<FolderItem>(
        folderItems,
        undefined,
        undefined,
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
                setFolderItems(getFolderItems(folderId));
            }
        }
    }, storage)

    const handleItemTransfer = (destination?: FolderItem) => {
        const focusedItem = SortedFolder.getFocusedItem();
        if (!destination && !parentFolder?.id || !focusedItem) return;
        const destinationId = destination ? destination.id : parentFolder?.id;

        // Transfer the item to the destination
        updateFolderItem({ ...focusedItem, status: ItemStatus.STATIC }, destinationId);
    }

    const handleParentFolderClick = () => {
        const focusedItem = SortedFolder.getFocusedItem();
        if (focusedItem?.status === ItemStatus.TRANSFER) {
            handleItemTransfer();
            return;

        } else if (folder.parentFolderId) {
            onBackClick(folder.parentFolderId);
        }
    };

    const handleDeleteItem = (item: FolderItem) => {
        deleteFolderItem(item.id, item.type);
    }


    /**
     * Handles clicking a list item. In transfer mode, the textfield item will transfer to the clicked item.
     * Otherwise, the textfield will be saved and the clicked item will be opened.
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

    const renderNewItemPopup = (item: FolderItem, popupPosition: { x: number, y: number }) =>
        <View
            style={[
                styles.popup,
                { top: popupPosition.y, left: popupPosition.x },
            ]}
        >
            <IconButton
                icon="folder-outline"
                onPress={() => SortedFolder.updateItem({ ...item, type: FolderItemType.FOLDER })}
                size={20}
                iconColor={item.type === FolderItemType.FOLDER ? colors.primary : colors.outline}
            />
            <IconButton
                icon="menu"
                onPress={() => SortedFolder.updateItem({ ...item, type: FolderItemType.LIST })}
                size={20}
                iconColor={item.type === FolderItemType.LIST ? colors.primary : colors.outline}
            />
        </View>

    const renderEditItemPopup = (popupPosition: { x: number, y: number }, item: FolderItem) =>
        <View
            style={[
                styles.popup,
                { top: popupPosition.y, left: popupPosition.x },
            ]}
        >
            <IconButton
                icon="arrow-all"
                onPress={() => SortedFolder.beginTransferItem(item)}
                size={20}
                iconColor={item.status === ItemStatus.TRANSFER ? colors.primary : colors.outline}
            />
            <IconButton
                icon="delete-outline"
                onPress={() => SortedFolder.updateItem({ ...item, status: ItemStatus.DELETE })}
                size={20}
                iconColor={item.status === ItemStatus.DELETE ? colors.outline : colors.outline}
            />
        </View>

    const renderInputField = useCallback(
        (item: FolderItem) => {
            const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
            const itemType = item.type === FolderItemType.FOLDER ? 'folder' : 'list';

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
                        <ListTextfield
                            item={item}
                            onChange={(text) => SortedFolder.updateItem({ ...item, value: text })}
                            onSubmit={() => SortedFolder.saveTextfield(ShiftTextfieldDirection.BELOW)}
                        />
                    </View>
                    {item.status !== ItemStatus.TRANSFER && currentTab === 'folders' && (
                        <Portal>
                            {item.status === ItemStatus.NEW && (
                                renderNewItemPopup(item, popupPosition)
                            )}
                            {item.status === ItemStatus.EDIT && (
                                renderEditItemPopup(popupPosition, item)
                            )}
                        </Portal>
                    )}
                    <Modal
                        title={`${!!item.childrenCount ? 'Force delete' : 'Delete'} ${itemType}?`}
                        open={item.status === ItemStatus.DELETE}
                        toggleModalOpen={() => SortedFolder.updateItem({ ...item, status: item.status === ItemStatus.EDIT ? ItemStatus.DELETE : ItemStatus.EDIT })}
                        primaryButtonConfig={{
                            label: !!item.childrenCount ? 'Force Delete' : 'Delete',
                            onClick: () => handleDeleteItem(item),
                            color: !!item.childrenCount ? 'red' : colors.primary
                        }}
                    >
                        {!!item.childrenCount ? (
                            <Text style={styles.deletePopupText}>This {itemType} has {item.childrenCount} items. Deleting is irreversible and will lose all inner contents.</Text>
                        ) : (
                            <Text style={styles.deletePopupText}>Would you like to delete this {itemType}?</Text>
                        )}
                    </Modal>
                </View>
            );
        },
        [SortedFolder.current, currentTab]
    );

    const renderItem = useCallback((item: FolderItem, isTextfield: boolean, transferMode: boolean) =>
        isTextfield ?
            renderInputField(item) :
            <Text
                onPress={() => handleItemClick(item)}
                style={{
                    ...styles.listItem,
                    color: (transferMode && item.type === FolderItemType.LIST) ? colors.outline :
                        item.status && [ItemStatus.DELETE].includes(item.status) ?
                            colors.outline : colors.secondary,
                    textDecorationLine: item.status === ItemStatus.DELETE ? 'line-through' : undefined
                }}
            >
                {item.value}
            </Text>
        , [SortedFolder.current, currentTab]);

    const renderRow = useCallback(({ item, drag }: RenderItemParams<FolderItem>) => {
        const isItemTransfering = SortedFolder.getFocusedItem()?.status === ItemStatus.TRANSFER;
        const isTextfield = !!item.status && [ItemStatus.NEW, ItemStatus.EDIT, ItemStatus.TRANSFER, ItemStatus.DELETE
        ].includes(item.status);
        const isBeingMoved = item.status === ItemStatus.TRANSFER;
        const iconStyle =
            isBeingMoved ? 'arrows' :
                item.type === FolderItemType.FOLDER ? 'folder-o' :
                    item.type === FolderItemType.LIST ? 'bars' :
                        undefined;
        return (
            <View
                style={{ ...styles.row }}
                ref={isTextfield ? inputWrapperRef : undefined}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {iconStyle && (
                        <FontAwesome
                            onLongPress={drag}
                            onPress={() => SortedFolder.beginEditItem(item)}
                            name={iconStyle}
                            size={20}
                            color={isBeingMoved ? colors.primary : colors.outline}
                            style={{ marginLeft: 16 }}
                        />
                    )}
                    {renderItem(item, isTextfield, isItemTransfering)}
                    {!isTextfield && (
                        <Text style={{ color: colors.outline }}>
                            {item.childrenCount}
                        </Text>
                    )}
                </View>
                <ClickableLine onPress={() => SortedFolder.moveTextfield(item.sortId)} />
            </View>
        )
    }, [SortedFolder.current, currentTab]);

    return (
        <View>
            <LabelBanner
                dataId={folder.id}
                backButtonConfig={{
                    display: !!parentFolder,
                    label: parentFolder?.value,
                    onClick: handleParentFolderClick
                }}
                type={FolderItemType.FOLDER}
            />
            <View style={{ width: '100%', height: '100%' }}>
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
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10
    },
    listItem: {
        width: '85%',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 4,
        paddingBottom: 4,
        minHeight: 25,
        color: theme.colors.secondary,
        fontSize: 16,
    },
    row: {
        backgroundColor: theme.colors.background,
        position: 'relative'
    },
    popup: {
        position: 'absolute',
        backgroundColor: '#333',
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
    },
    deletePopup: {
        backgroundColor: theme.colors.background
    },
    deletePopupHeader: {
        color: theme.colors.secondary
    },
    deletePopupText: {
        color: theme.colors.outline
    },
    deletePopupTextButtons: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        width: '100%'
    }
});

export default SortableFolder;