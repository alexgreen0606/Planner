import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, TextInput, useTheme } from 'react-native-paper';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { theme } from '../../../theme/theme';
import { FontAwesome } from '@expo/vector-icons';
import useSortedList from '../../../foundation/lists/hooks/useSortedList';
import { ItemStatus, TOP_OF_LIST_ID, ShiftTextfieldDirection } from '../../../foundation/lists/enums';
import { useListContext } from '../../../foundation/lists/services/ListProvider';
import { Event } from '../types';
import globalStyles from '../../../theme/globalStyles';
import DayBanner from './DayBanner';
import { getPlanner, savePlanner } from '../storage/plannerStorage';

/***
 * UPCOMING CHANGES
 * 
 * Time Modal Includes:
 *  - flag for calendar inclusion
 *  - flag for all day (default true)
 *  - box for start time
 *  - box for end time
 * 
 */

interface TimeDialog {
    syncCalendar: boolean;
    allDay: boolean;
    startTime: string;
    endTime: string;
}

interface SortablePlannerProps {
    timestamp: string;
};

const SortablePlanner = ({
    timestamp
}: SortablePlannerProps) => {
    const { colors } = useTheme();
    const planner = getPlanner(timestamp);
    const saveStoragePlanner = (newItems: Event[]) => savePlanner(timestamp, newItems);
    const { currentList, setCurrentList } = useListContext();
    const SortedList = useSortedList<Event>(planner, saveStoragePlanner);
    const pendingDeletes = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const [timeMode, setTimeMode] = useState(false);

    /**
     * When a different list on the screen is being edited, save this list's current textfield.
     */
    useEffect(() => {
        if (currentList.id !== timestamp)
            customHandleTextfieldSave(undefined, true);

        rescheduleAllDeletes();
    }, [currentList]);

    const customHandleTextfieldSave = (shiftTextfieldConfig?: string, lastUpdate?: boolean) => {
        SortedList.saveTextfield(shiftTextfieldConfig);
        if (!lastUpdate)
            setCurrentList(timestamp);
    }

    const customHandleUpdateTextfieldPosition = (parentId: string | null) => {
        setCurrentList(timestamp);
        SortedList.moveTextfield(parentId);
    };

    const customHandleItemClick = (item: Event) => {
        setCurrentList(timestamp);
        SortedList.beginEditItem(item);
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
                    SortedList.deleteItem(currentItem);
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
    const toggleDeleteItem = (item: Event, immediate?: boolean) => {
        const wasDeleting = item.status === ItemStatus.DELETING;
        const updatedStatus = wasDeleting ? undefined : ItemStatus.DELETING;
        SortedList.updateItem({ ...item, status: updatedStatus } as Event);

        if (!wasDeleting) { // Item deletion being scheduled
            rescheduleAllDeletes();
            // Begin delete process of given item
            const timeoutId = setTimeout(async () => {
                SortedList.deleteItem(item);
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
        setCurrentList(timestamp)
    };

    const renderClickableLine = useCallback((parentId: string | null) =>
        <TouchableOpacity style={styles.clickableLine} onPress={() => customHandleUpdateTextfieldPosition(parentId)}>
            <View style={styles.thinLine} />
        </TouchableOpacity>, [SortedList.current]);

    const renderInputField = useCallback((item: Event) =>
        <TextInput
            mode="flat"
            key={`${item.id}-${SortedList.current.findIndex(currItem => currItem.id === item.id)}`}
            autoFocus
            value={item.value}
            onChangeText={(text) => { SortedList.updateItem({ ...item, value: text }) }}
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
            onSubmitEditing={() => customHandleTextfieldSave(ShiftTextfieldDirection.BELOW)}
        />, [SortedList.current]);

    const renderItem = useCallback((item: Event, drag: any) =>
        item.status && ['EDIT', 'NEW'].includes(item.status) ?
            renderInputField(item) :
            <Text
                onLongPress={drag}
                onPress={() => customHandleItemClick(item)}
                style={{
                    ...styles.listItem,
                    color: item.status && ['PENDING', 'DELETING'].includes(item.status) ?
                        colors.outline : colors.secondary,
                    textDecorationLine: item.status === 'DELETING' ? 'line-through' : undefined
                }}
            >
                {item.value}
            </Text>, [SortedList.current]);

    /***
     * UPCOMING CHANGES
     * 
     * Time Modal Includes:
     *  - flag for calendar inclusion
     *  - flag for all day (default true)
     *  - box for start time
     *  - box for end time
     * 
     */
    const renderRow = useCallback(({ item, drag }: RenderItemParams<Event>) => {
        const isTextfield = !!item.status && [ItemStatus.NEW, ItemStatus.EDIT].includes(item.status);
        const isItemDeleting = item.status === 'DELETING';
        const iconStyle = isItemDeleting ? 'dot-circle-o' : isTextfield ? 'clock-o' : 'circle-thin';
        return (
            <View style={{ backgroundColor: item.status === 'DRAG' ? colors.background : undefined }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome
                        name={iconStyle}
                        size={20}
                        color={isItemDeleting ? colors.primary : colors.secondary}
                        style={{ marginLeft: 16 }}
                        onPress={() => isTextfield ? setTimeMode(true) : toggleDeleteItem(item)}
                    />
                    {renderItem(item, drag)}
                </View>
                {renderClickableLine(item.id)}
                {isTextfield && (
                    <Portal>
                        <Dialog style={styles.timeDialog} visible={timeMode} onDismiss={() => setTimeMode(false)}>
                            <Dialog.Title>Manage event time.</Dialog.Title>
                            <Dialog.Content>
                                <View />
                            </Dialog.Content>
                            <Dialog.Actions>
                                <View style={globalStyles.spacedApart}>
                                    <Button onPress={() => setTimeMode(false)}>Close</Button>
                                    <Button onPress={() => { }}>Save</Button>
                                </View>
                            </Dialog.Actions>
                        </Dialog>
                    </Portal>
                )}
            </View>
        )
    }, [SortedList.current, timeMode]);

    return (
        <View>
            <DayBanner timestamp={timestamp} />
            <View style={{ width: '100%', marginBottom: 37 }}>
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
        </View>
    );
};

const styles = StyleSheet.create({
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
    timeDialog: {
        backgroundColor: theme.colors.background
    }
});

export default SortablePlanner;