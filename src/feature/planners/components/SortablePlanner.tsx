import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, TextInput, useTheme } from 'react-native-paper';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { theme } from '../../../theme/theme';
import { FontAwesome } from '@expo/vector-icons';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import { ItemStatus, TOP_OF_LIST_ID, ShiftTextfieldDirection } from '../../../foundation/sortedLists/enums';
import { usePlannerContext } from '../services/PlannerProvider';
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
    const { focusedPlanner, setFocusedPlanner } = usePlannerContext();
    const [timeMode, setTimeMode] = useState(false);
    const planner = getPlanner(timestamp);
    const customSavePlanner = (newItems: Event[]) => savePlanner(timestamp, newItems);
    const SortedList = useSortedList<Event>(planner, customSavePlanner);

    /**
     * When a different planner on the screen is focused, save this list's current textfield
     * and reset the items that are pending delete.
     */
    useEffect(() => {
        if (focusedPlanner.timestamp !== timestamp)
            SortedList.saveTextfield();

        SortedList.rescheduleAllDeletes();
    }, [focusedPlanner]);

    /**
     * Moves the textfield to its new position, and sets this as the focused planner within
     * the context.
     */
    const customMoveTextfield = (parentId: string | null) => {
        SortedList.moveTextfield(parentId);
        setFocusedPlanner(timestamp);
    };

    /**
     * Initializes edit mode for the clicked item, and sets this as the focused planner within
     * the context.
     */
    const customBeginEditItem = (item: Event) => {
        SortedList.beginEditItem(item);
        setFocusedPlanner(timestamp);
    };

    /**
     * Schedules the item for delete, and sets this as the focused planner within
     * the context.
     */
    const customToggleDeleteItem = (item: Event) => {
        SortedList.toggleDeleteItem(item);
        setFocusedPlanner(timestamp);
    };

    const renderClickableLine = useCallback((parentId: string | null) =>
        <TouchableOpacity style={styles.clickableLine} onPress={() => customMoveTextfield(parentId)}>
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
            onSubmitEditing={() => SortedList.saveTextfield(ShiftTextfieldDirection.BELOW)}
        />, [SortedList.current]);

    const renderItem = useCallback((item: Event, drag: any) =>
        item.status && [ItemStatus.EDIT, ItemStatus.NEW].includes(item.status) ?
            renderInputField(item) :
            <Text
                onLongPress={drag}
                onPress={() => customBeginEditItem(item)}
                style={{
                    ...styles.listItem,
                    color: item.status && [ItemStatus.DELETE].includes(item.status) ?
                        colors.outline : colors.secondary,
                    textDecorationLine: item.status === ItemStatus.DELETE ? 'line-through' : undefined
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
        const isItemDeleting = item.status === ItemStatus.DELETE;
        const iconStyle = isItemDeleting ? 'dot-circle-o' : isTextfield ? 'clock-o' : 'circle-thin';
        return (
            <View style={{ backgroundColor: item.status === 'DRAG' ? colors.background : undefined }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome
                        name={iconStyle}
                        size={20}
                        color={isItemDeleting ? colors.primary : colors.secondary}
                        style={{ marginLeft: 16 }}
                        onPress={() => isTextfield ? setTimeMode(true) : customToggleDeleteItem(item)}
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