import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, UIManager, findNodeHandle } from 'react-native';
import { Button, Dialog, IconButton, Portal, TextInput, useTheme } from 'react-native-paper';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { theme } from '../../../theme/theme';
import { FontAwesome } from '@expo/vector-icons';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import { ItemStatus, TOP_OF_LIST_ID, ShiftTextfieldDirection } from '../../../foundation/sortedLists/enums';
import { FolderItemType } from '../enums';
import { FolderItem } from '../types';
import { useFolderContext } from '../services/FolderProvider';
import { useNavigatorContext } from '../../../foundation/navigation/services/TabsProvider';
import LabelBanner from './LabelBanner';
import { createFolder, deleteFolder, getFolder, saveFolderItems, updateFolder } from '../storage/folderStorage';
import { createList, deleteList, updateList } from '../storage/listStorage';

interface SortableFolderProps {
    folderId: string;
    onBackClick: (parentFolderId: string) => void;
    onOpenItem: (id: string, type: FolderItemType) => void;

    // folderItems: FolderItem[];
    // createItem: (data: FolderItem) => void;
    // updateItem: (data: FolderItem, newParentId?: string) => void;
    // deleteItem: (data: FolderItem) => void;
    // openItem: (id: string, type: FolderItemType) => void;
    // saveFolderItems: (newList: FolderItem[]) => void;
    // manualDeleteItem: FolderItem | undefined;
};

const SortableFolder = ({
    // folderItems,
    // createItem,
    // updateItem,
    // deleteItem,
    // openItem,
    // saveFolderItems,
    // manualDeleteItem
    folderId,
    onBackClick,
    onOpenItem
}: SortableFolderProps) => {

    const handleCreateItem = async (item: FolderItem) => {
        switch (item.type) {
            case FolderItemType.FOLDER:
                createFolder(folderId, item);
                break;
            case FolderItemType.LIST:
                createList(folderId, item);
                break;
            default:
                throw Error('Item does not have a type.');
        }
    };

    const handleUpdateItem = (item: FolderItem, newParentId?: string) => {
        switch (item.type) {
            case FolderItemType.FOLDER:
                updateFolder(item, newParentId);
                break;
            case FolderItemType.LIST:
                updateList(item, newParentId);
                break;
            default:
                throw Error('Item does not have a type.');
        }
    };

    const handleDeleteItem = (item: FolderItem) => {
        switch (item.type) {
            case FolderItemType.FOLDER:
                deleteFolder(item.id);
                break;
            case FolderItemType.LIST:
                deleteList(item.id);
                break;
            default:
                throw Error('Item does not have a type.');
        }
    };


    const folder = getFolder(folderId);
    if (!folder) return;

    const parentFolder = getFolder(folder.parentFolderId)

    const { colors } = useTheme();
    const { currentTab } = useNavigatorContext();
    const [deleteMode, setDeleteMode] = useState(false);
    const inputWrapperRef = useRef<View>(null);
    const SortedFolder = useSortedList<FolderItem>(
        folder.items,
        (newItems: FolderItem[]) => saveFolderItems(folderId, newItems),
        { type: FolderItemType.LIST, childrenCount: 0 },
        {
            create: handleCreateItem,
            update: handleUpdateItem,
            delete: handleDeleteItem
        }
    );

    const handleItemTransfer = (destination?: FolderItem) => {
        const item = SortedFolder.getFocusedItem();
        if (!item) return;
        if (!destination && !parentFolder?.id) return;
        delete item.status;

        // Increment the destination item's child count
        let destinationId = parentFolder?.id;
        if (destination) {
            SortedFolder.updateItem({ ...destination, childrenCount: destination.childrenCount + 1 });
            destinationId = destination.id;
        }
        // Transfer the item to the destination
        handleUpdateItem(item, destinationId);

        // Remove the item from this folder
        SortedFolder.deleteItem(item, true);
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

    const renderClickableLine = useCallback((parentId: string | null) =>
        <TouchableOpacity style={styles.clickableLine} onPress={() => SortedFolder.moveTextfield(parentId)}>
            <View style={styles.thinLine} />
        </TouchableOpacity>, [SortedFolder.current]);

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
                onPress={() => setDeleteMode(true)}
                size={20}
                iconColor={deleteMode ? colors.outline : colors.outline}
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
                        key={`${item.id}-${SortedFolder.current.findIndex(currItem => currItem.id === item.id)}`}
                    >
                        <TextInput
                            mode="flat"
                            autoFocus
                            value={item.value}
                            onChangeText={(text) => SortedFolder.updateItem({ ...item, value: text })}
                            selectionColor="white"
                            style={styles.textInput}
                            theme={{
                                colors: {
                                    text: item.status === ItemStatus.TRANSFER ? colors.primary : colors.secondary,
                                    primary: 'transparent',
                                },
                            }}
                            underlineColor="transparent"
                            textColor={item.status === ItemStatus.TRANSFER ? colors.primary : colors.secondary}
                            onSubmitEditing={() => SortedFolder.saveTextfield(ShiftTextfieldDirection.BELOW)}
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
                    <Portal>
                        <Dialog style={styles.deletePopup} visible={deleteMode} onDismiss={() => setDeleteMode(false)}>
                            <Dialog.Title style={styles.deletePopupHeader}>{!!item.childrenCount ? 'Force delete' : 'Delete'} {itemType}?</Dialog.Title>
                            <Dialog.Content>
                                {!!item.childrenCount ? (
                                    <Text style={styles.deletePopupText}>This {itemType} has {item.childrenCount} items. Deleting is irreversible and will lose all inner contents.</Text>
                                ) : (
                                    <Text style={styles.deletePopupText}>Would you like to delete this {itemType}?</Text>
                                )}
                            </Dialog.Content>
                            <Dialog.Actions>
                                <View style={styles.deletePopupTextButtons}>
                                    <Button onPress={() => setDeleteMode(false)}>Close</Button>
                                    <Button onPress={() => SortedFolder.deleteItem(item)}>{!!item.childrenCount ? 'Force Delete' : 'Delete'}</Button>
                                </View>
                            </Dialog.Actions>
                        </Dialog>
                    </Portal>
                </View>
            );
        },
        [SortedFolder.current, currentTab, deleteMode]
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
        , [SortedFolder.current, currentTab, deleteMode]);

    const renderRow = useCallback(({ item, drag }: RenderItemParams<FolderItem>) => {
        const isItemTransfering = SortedFolder.getFocusedItem()?.status === ItemStatus.TRANSFER;
        const isTextfield = !!item.status && [ItemStatus.NEW, ItemStatus.EDIT, ItemStatus.TRANSFER
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
                {renderClickableLine(item.id)}
            </View>
        )
    }, [SortedFolder.current, currentTab, deleteMode]);

    return (
        <View>
            <LabelBanner
                label={folder.value}
                backButtonConfig={{
                    display: !!parentFolder,
                    label: parentFolder?.value,
                    onClick: handleParentFolderClick
                }}
                type={FolderItemType.FOLDER}
            />
            <View style={{ width: '100%', height: '100%' }}>
                {renderClickableLine(TOP_OF_LIST_ID)}
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
    clickableLine: {
        width: '100%',
        height: 15,
        backgroundColor: 'transparent',
        justifyContent: 'center'
    },
    thinLine: {
        width: '100%',
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.outline,
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
    textInput: {
        backgroundColor: theme.colors.background,
        color: 'white',
        paddingTop: 1,
        paddingBottom: 1,
        width: '100%',
        height: 25,
        fontSize: 16,
        zIndex: 2
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