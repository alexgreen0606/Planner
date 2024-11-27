import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { theme } from '../../../theme/theme';
import { getNewSortId } from '../../../feature/planner/utils';
import { FontAwesome } from '@expo/vector-icons';
import { ListItem } from '../types';
import useSortedList from '../hooks/useSortedList';
import { ItemStatus, ShiftTextfieldDirection } from '../enums';
import { usePlannersContext } from '../../../feature/planner/services/PlannersProvider';

// TODO: moving the input field of current item - textfield should remain focused
// TODO: reset deletes when other list is edited?

interface SortableListProps<T extends ListItem> {
    listId: string;
    listItems: T[];
    createDbItem: (newItem: ListItem) => Promise<T | null>;
    updateDbItem: (data: T) => Promise<T | null>;
    deleteDbItem: (data: T) => Promise<T | null>;
    isLoading: boolean;
};

const SortableList = <T extends ListItem>({
    listItems,
    createDbItem,
    updateDbItem,
    listId,
    deleteDbItem,
    isLoading
}: SortableListProps<T>) => {
    const { colors } = useTheme();
    const { currentList, setCurrentList } = usePlannersContext();
    const SortedList = useSortedList<T>(listItems);
    const pendingDeletes = useRef<Map<string, NodeJS.Timeout>>(new Map());

    /**
     * When a different list on the screen is being edited, save this list's current textfield.
     */
    useEffect(() => {
        if (currentList !== listId) {
            rescheduleAllDeletes();
            handleUpdateList();
        }
    }, [currentList]);

    /**
     * Updates both the local list and the backend list. If an error occurs in the API, this component will
     * re-render. API errors do not need to be handled here.
     */
    const handleUpdateList = async (shiftTextfieldConfig?: string) => {
        const currentItem = SortedList.getTextfield();
        let newBackendItem: T | null = null;
        let newParentSortId: number | null = null;
        switch (currentItem?.status) {
            case 'NEW':
                if (currentItem.value.trim().length) {
                    SortedList.updateItem({ ...currentItem, status: ItemStatus.PENDING });
                    newBackendItem = await createDbItem(currentItem as T);
                    SortedList.updateItem(newBackendItem as T, true);
                    if (shiftTextfieldConfig) {
                        newParentSortId = shiftTextfieldConfig === ShiftTextfieldDirection.BELOW ?
                            currentItem.sortId : SortedList.getParentSortId(currentItem.id);
                        SortedList.moveTextfield(newParentSortId);
                    }
                } else {
                    SortedList.deleteItem(currentItem.id);
                }
                break;
            case 'EDIT':
                if (currentItem.value.trim().length) {
                    SortedList.updateItem({ ...currentItem, status: ItemStatus.PENDING });
                    newBackendItem = await updateDbItem(currentItem as T);
                    SortedList.updateItem(newBackendItem as T);
                    if (shiftTextfieldConfig) {
                        newParentSortId = shiftTextfieldConfig === ShiftTextfieldDirection.BELOW ?
                            currentItem.sortId : SortedList.getParentSortId(currentItem.id);
                        SortedList.moveTextfield(newParentSortId);
                    }
                } else {
                    toggleDeleteItem(currentItem, true);
                }
                break;
        }
    };

    /**
     * Generates a textfield to create a new item.
     * 
     * 1. If a textfield exists: 
     *  a. if the line clicked is just below the textfield
     *      i. if the textfield has a value: save the textfield, generate a new textfield just below it, and exit
     *      ii. otherwise: do nothing and exit
     *  b. if the line clicked is just above the textfield
     *      i. if the textfield has a value: save the textfield, then generate a new textfield just above it, and exit
     *      ii: otherwise: do nothing and exit
     *  c. otherwise move the textfield to the new position
     * 
     * 2. Otherwise: add a new textfield just below the list item with a sort ID that matches the given parent sort ID
     * 
     * @param parentSortId - the sort ID of the list item just above this line
     */
    const handleLineClick = async (parentSortId: number) => {
        setCurrentList(listId)
        const currentItem = SortedList.getTextfield();
        if (currentItem) {
            if (parentSortId === currentItem.sortId) {
                if (currentItem.value.trim().length) {
                    await handleUpdateList(ShiftTextfieldDirection.BELOW);
                } else {
                    return;
                }
            } else if (parentSortId === SortedList.getParentSortId(currentItem.id)) {
                if (currentItem.value.trim().length) {
                    await handleUpdateList(ShiftTextfieldDirection.ABOVE)
                } else {
                    return;
                }
            } else {
                SortedList.moveItem({
                    ...SortedList.getTextfield(),
                    sortId: getNewSortId(parentSortId, SortedList.current)
                } as (T | ListItem));
            }
        } else {
            SortedList.addNewTextfield(parentSortId);
        }
    };

    /**
     * Generates a textfield to edit an existing item.
     * 
     * 1. The item is deleting: do nothing and exit
     * 
     * 2. A textfield exists: save the textfield, then
     * 
     * 3. Turn the item into a textfield
     * 
     * @param item - the item that was clicked
     */
    const handleItemClick = async (item: T) => {
        setCurrentList(listId)
        if (item.status === ItemStatus.DELETING)
            return;
        if (SortedList.getTextfield())
            await handleUpdateList();

        SortedList.updateItem({ ...item, status: ItemStatus.EDIT });
    };

    /**
     * Clears any pending deletes and re-schedules them 3 seconds into the future.
     */
    const rescheduleAllDeletes = () => {
        pendingDeletes.current.forEach((timeoutId, id) => {
            clearTimeout(timeoutId);
            const newTimeoutId = setTimeout(async () => {
                const currentItem = SortedList.getItemById(id);
                if (currentItem) {
                    await deleteDbItem(currentItem as T);
                    SortedList.deleteItem(id);
                    pendingDeletes.current.delete(id);
                }
            }, 3000);
            pendingDeletes.current.set(id, newTimeoutId);
        });
    }

    /**
     * Toggles an item in and out of deleting. Changing the delete status of 
     * any item in the list will reset the timeouts for all deleting items. Items are deleted 3 seconds after clicked.
     * @param item - the item to delete
     * @param immediate - if true, delete the item without delay
     */
    const toggleDeleteItem = (item: T | ListItem, immediate?: boolean) => {
        const wasDeleting = item.status === ItemStatus.DELETING;
        const updatedStatus = wasDeleting ? undefined : ItemStatus.DELETING;
        SortedList.updateItem({ ...item, status: updatedStatus } as T);

        if (!wasDeleting) { // Item deletion being scheduled
            rescheduleAllDeletes();
            // Begin delete process of given item
            const timeoutId = setTimeout(async () => {
                await deleteDbItem(item as T);
                SortedList.deleteItem(item.id);
                pendingDeletes.current.delete(item.id);
            }, immediate ? 0 : 3000);
            pendingDeletes.current.set(item.id, timeoutId);
        } else { // Item deletion being undone
            // Exit delete process of the item
            const timeoutId = pendingDeletes.current.get(item.id);
            if (timeoutId) {
                clearTimeout(timeoutId);
                pendingDeletes.current.delete(item.id);
            }
            // Re-schedule all existing deletes
            rescheduleAllDeletes();
        }
    };

    /**
     * Places a dragged item into its new location.
     */
    const handleDropItem = async ({ data, from, to }: { data: T[]; from: number; to: number }) => {
        const draggedItem = data[to];
        if (from !== to) {
            const newParentSortId = to > 0 ?
                data[to - 1]?.sortId :
                -1
            const newListItem = {
                ...draggedItem,
                sortId: getNewSortId(newParentSortId, SortedList.current),
            };
            SortedList.moveItem(newListItem);
            const response = await updateDbItem(newListItem as T);
            SortedList.updateItem(response as T);
        }
        SortedList.updateItem({ ...draggedItem, status: undefined })
    };

    const renderClickableLine = useCallback((parentSortId: number | null) =>
        <TouchableOpacity style={styles.clickableLine} onPress={parentSortId ? () => handleLineClick(parentSortId) : undefined}>
            <View style={styles.thinLine} />
        </TouchableOpacity>, [SortedList.current]);

    const renderInputField = useCallback((item: T | ListItem) =>
        <TextInput
            mode="flat"
            key={`${item.id}-textfield`}
            autoFocus
            value={item.value}
            onChangeText={(text) => { if (!isLoading) SortedList.updateItem({ ...item, value: text }) }}
            selectionColor="white"
            style={styles.textInput}
            theme={{
                colors: {
                    text: 'white',
                    primary: 'transparent',
                },
            }}
            underlineColor='transparent'
            textColor='white'
            onSubmitEditing={() => handleUpdateList(ShiftTextfieldDirection.BELOW)}
        />, [SortedList.current]);

    const renderItem = useCallback((item: T, drag: any) => {

        return item.status && ['EDIT', 'NEW'].includes(item.status) ?
            renderInputField(item) :
            <Text
                onLongPress={drag}
                onPress={() => handleItemClick(item)}
                style={{
                    ...styles.listItem,
                    color: item.status && ['PENDING', 'DELETING'].includes(item.status) ?
                        colors.outline : colors.secondary,
                    textDecorationLine: item.status === 'DELETING' ? 'line-through' : undefined
                }}
            >
                {item.value}
            </Text>
    }, [SortedList.current]);

    const renderRow = useCallback(({ item, drag }: RenderItemParams<T>) => {
        const isItemDeleting = item.status === 'DELETING';
        const iconStyle = isItemDeleting ? 'dot-circle-o' : 'circle-thin';
        return (
            <View style={{ backgroundColor: item.status === 'DRAG' ? colors.background : undefined }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome
                        name={iconStyle}
                        size={20}
                        color={isItemDeleting ? colors.primary : colors.secondary}
                        style={{ marginLeft: 16 }}
                        onPress={() => toggleDeleteItem(item)}
                    />
                    {renderItem(item, drag)}
                </View>
                {renderClickableLine(item.sortId)}
            </View>
        )
    }, [SortedList.current]);

    return (
        <View style={{ width: '100%', marginBottom: 37 }}>
            {renderClickableLine(-1)}
            {isLoading && <View style={styles.overlay} />}
            <DraggableFlatList
                // @ts-ignore
                data={SortedList.current}
                scrollEnabled={false}
                onDragEnd={handleDropItem}
                onDragBegin={SortedList.dragItem}
                keyExtractor={(item) => item.id}
                renderItem={renderRow}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
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
        width: '100%',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 4,
        paddingBottom: 4,
        minHeight: 25,
        color: theme.colors.secondary,
        fontSize: 16
    },
    textInput: {
        backgroundColor: 'transparent',
        color: 'white',
        paddingTop: 1,
        paddingBottom: 1,
        width: '100%',
        height: 25,
        fontSize: 16
    },
});

export default SortableList;