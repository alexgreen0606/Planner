import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, UIManager, findNodeHandle } from 'react-native';
import { Button, Dialog, IconButton, Portal, TextInput, useTheme } from 'react-native-paper';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { theme } from '../../../theme/theme';
import { FontAwesome } from '@expo/vector-icons';
import useSortedList from '../../../foundation/lists/hooks/useSortedList';
import { ItemStatus, TOP_OF_LIST_ID, ShiftTextfieldDirection } from '../../../foundation/lists/enums';
import { FolderItemType } from '../enums';
import { FolderItem } from '../types';
import { useFolderContext } from '../services/FolderProvider';
import { useTabsContext } from '../../../foundation/navigation/services/TabsProvider';

interface SortableFolderProps {
    listItems: FolderItem[];
    createItem: (data: FolderItem) => void;
    updateItem: (data: FolderItem, newParentId?: string) => void;
    deleteItem: (data: FolderItem) => void;
    openItem: (id: string, type: FolderItemType) => void;
    saveFolderItems: (newList: FolderItem[]) => void
};

const SortableFolder = ({
    listItems: folderItems,
    createItem,
    updateItem,
    deleteItem,
    openItem,
    saveFolderItems
}: SortableFolderProps) => {
    const { colors } = useTheme();

    const { setCurrentItem } = useFolderContext();
    const { currentTab } = useTabsContext();

    const SortedList = useSortedList<FolderItem>(
        folderItems,
        saveFolderItems,
        { type: FolderItemType.LIST, childrenCount: 0 },
        {
            create: createItem,
            update: updateItem,
            delete: deleteItem
        }
    );
    const inputWrapperRef = useRef<View>(null);
    const [transferMode, setTransferMode] = useState(false);
    const [deleteMode, setDeleteMode] = useState(false);

    useEffect(() => {
        if (transferMode)
            setCurrentItem(SortedList.getTextfield());
    }, [transferMode]);

    const customHandleTextfieldSave = () => {
        SortedList.saveTextfield(ShiftTextfieldDirection.BELOW);
        setTransferMode(false);
    }

    /**
     * Handles clicking a list item. If in transfer mode, the current item will transfer to the clicked item.
     * Otherwise, the current textfield will be saved and the clicked item will be opened.
     * @param item - the item that was clicked
     */
    const handleItemClick = (item: FolderItem) => {
        const currentItem = SortedList.getTextfield();
        if (currentItem && transferMode) {
            if (item.type === FolderItemType.FOLDER) {
                delete currentItem.status;
                SortedList.updateItem({ ...item, childrenCount: item.childrenCount + 1 })
                updateItem(currentItem, item.id);
                setTransferMode(false);
                return;
            }
        } else if (currentItem) {
            SortedList.saveTextfield();
        }
        openItem(item.id, item.type);
    };

    const renderClickableLine = useCallback((parentId: string | null) =>
        <TouchableOpacity style={styles.clickableLine} onPress={() => SortedList.moveTextfield(parentId)}>
            <View style={styles.thinLine} />
        </TouchableOpacity>, [SortedList.current]);

    const renderNewItemPopup = (item: FolderItem, popupPosition: { x: number, y: number }) =>
        <View
            style={[
                styles.popup,
                { top: popupPosition.y, left: popupPosition.x },
            ]}
        >
            <IconButton
                icon="folder-outline"
                onPress={() => SortedList.updateItem({ ...item, type: FolderItemType.FOLDER })}
                size={20}
                iconColor={item.type === FolderItemType.FOLDER ? colors.primary : colors.outline}
            />
            <IconButton
                icon="menu"
                onPress={() => SortedList.updateItem({ ...item, type: FolderItemType.LIST })}
                size={20}
                iconColor={item.type === FolderItemType.LIST ? colors.primary : colors.outline}
            />
        </View>

    const renderEditItemPopup = (popupPosition: { x: number, y: number }) =>
        <View
            style={[
                styles.popup,
                { top: popupPosition.y, left: popupPosition.x },
            ]}
        >
            <IconButton
                icon="arrow-all"
                onPress={() => setTransferMode(true)}
                size={20}
                iconColor={transferMode ? colors.primary : colors.outline}
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
                        key={`${item.id}-${SortedList.current.findIndex(currItem => currItem.id === item.id)}`}
                    >
                        <TextInput
                            mode="flat"
                            autoFocus
                            value={item.value}
                            onChangeText={(text) => SortedList.updateItem({ ...item, value: text })}
                            selectionColor="white"
                            style={styles.textInput}
                            theme={{
                                colors: {
                                    text: transferMode ? colors.primary : colors.secondary,
                                    primary: 'transparent',
                                },
                            }}
                            underlineColor="transparent"
                            textColor={transferMode ? colors.primary : colors.secondary}
                            onSubmitEditing={customHandleTextfieldSave}
                        />
                    </View>
                    {!transferMode && currentTab === 'folders' && (
                        <Portal>
                            {item.status === ItemStatus.NEW && (
                                renderNewItemPopup(item, popupPosition)
                            )}
                            {item.status === ItemStatus.EDIT && (
                                renderEditItemPopup(popupPosition)
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
                                    <Button onPress={() => SortedList.deleteItem(item)}>{!!item.childrenCount ? 'Force Delete' : 'Delete'}</Button>
                                </View>
                            </Dialog.Actions>
                        </Dialog>
                    </Portal>
                </View>
            );
        },
        [SortedList.current, transferMode, currentTab, deleteMode]
    );

    const renderItem = useCallback((item: FolderItem, isTextfield: boolean) =>
        isTextfield ?
            renderInputField(item) :
            <Text
                onPress={() => handleItemClick(item)}
                style={{
                    ...styles.listItem,
                    color: (transferMode && item.type === FolderItemType.LIST) ? colors.outline :
                        item.status && [ItemStatus.PENDING, ItemStatus.DELETING].includes(item.status) ?
                            colors.outline : colors.secondary,
                    textDecorationLine: item.status === ItemStatus.DELETING ? 'line-through' : undefined
                }}
            >
                {item.value}
            </Text>
        , [SortedList.current, transferMode, currentTab, deleteMode]);

    const renderRow = useCallback(({ item, drag }: RenderItemParams<FolderItem>) => {
        const isTextfield = !!item.status && [ItemStatus.NEW, ItemStatus.EDIT].includes(item.status);
        const isBeingMoved = isTextfield && transferMode;
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
                            onPress={() => SortedList.beginEditItem(item)}
                            name={iconStyle}
                            size={20}
                            color={isBeingMoved ? colors.primary : colors.outline}
                            style={{ marginLeft: 16 }}
                        />
                    )}
                    {renderItem(item, isTextfield)}
                    {!isTextfield && (
                        <Text style={{ color: colors.outline }}>
                            {item.childrenCount}
                        </Text>
                    )}
                </View>
                {renderClickableLine(item.id)}
            </View>
        )
    }, [SortedList.current, transferMode, currentTab, deleteMode]);

    return (
        <View style={{ width: '100%', height: '100%' }}>
            {renderClickableLine(TOP_OF_LIST_ID)}
            <DraggableFlatList
                data={SortedList.current}
                scrollEnabled={false}
                onDragEnd={SortedList.endDragItem}
                onDragBegin={SortedList.beginDragItem}
                keyExtractor={(item) => item.id}
                renderItem={renderRow}
            />
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