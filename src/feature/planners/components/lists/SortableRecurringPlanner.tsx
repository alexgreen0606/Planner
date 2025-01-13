import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import useSortedList from '../../../../foundation/sortedLists/hooks/useSortedList';
import { ItemStatus, ListStorageMode, ShiftTextfieldDirection } from '../../../../foundation/sortedLists/enums';
import { Event, TimeConfig } from '../../types';
import { getPlannerFromStorage, savePlannerToStorage } from '../../storage/plannerStorage';
import { RECURRING_WEEKDAY_PLANNER } from '../../enums';
import ClickableLine from '../../../../foundation/ui/separators/ClickableLine';
import ListTextfield from '../../../../foundation/sortedLists/components/ListTextfield';
import TimeModal from '../modal/TimeModal';
import CustomText from '../../../../foundation/ui/text/CustomText';
import Time from '../info/Time';
import { generateSortIdByTimestamp } from '../../utils';
import GenericIcon from '../../../../foundation/ui/icons/GenericIcon';
import globalStyles from '../../../../foundation/theme/globalStyles';
import colors from '../../../../foundation/theme/colors';
import EmptyLabel from '../../../../foundation/sortedLists/components/EmptyLabel';

interface SortableRecurringPlannerProps {
    manualSaveTrigger: string;
};

const SortableRecurringPlanner = ({
    manualSaveTrigger
}: SortableRecurringPlannerProps) => {
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const initialPlanner = useMemo(() => getPlannerFromStorage(RECURRING_WEEKDAY_PLANNER), []);
    const savePlanner = useRef(false);

    const toggleTimeModal = () => setTimeModalOpen(curr => !curr);

    // Creates a new textfield linked to the recurring planner
    const initializeNewEvent = (newEvent: Event) => ({
        ...newEvent,
        plannerId: RECURRING_WEEKDAY_PLANNER,
        recurringConfig: {
            recurringId: newEvent.id
        }
    } as Event);

    // Stores the current recurring weekday planner and all handler functions to update it
    const SortedPlanner = useSortedList<Event>(initialPlanner, {
        storageMode: ListStorageMode.CUSTOM_SYNC,
        initializeNewItem: initializeNewEvent
    });

    // Manually trigger the list to update
    useEffect(() => {
        if (savePlanner.current)
            savePlannerToStorage(
                RECURRING_WEEKDAY_PLANNER,
                SortedPlanner.current
                    .filter(event => !!event.value.length)
                    .map(event => ({
                        ...event,
                        status: ItemStatus.STATIC
                    })));

        else
            savePlanner.current = true;
    }, [manualSaveTrigger]);

    /**
     * Displays a row representing an event within the planner. A row includes
     * an icon for toggling its delete, the row's data and controls for changing
     * the event's time.
     * @param param0 - the item data and the drag function for sorting
     */
    const renderRow = ({ item, drag }: RenderItemParams<Event>) => {
        const isItemEditing = [ItemStatus.NEW, ItemStatus.EDIT].includes(item.status);
        const isItemDeleting = item.status === ItemStatus.DELETE;
        return (
            <View style={globalStyles.backdrop}>
                <View style={globalStyles.spacedApart}>

                    {/* Toggle Delete Icon */}
                    <TouchableOpacity onPress={() => SortedPlanner.toggleDeleteItem(item)}>
                        <GenericIcon
                            type='MaterialCommunityIcons'
                            name={isItemDeleting ? 'trash-can' : 'trash-can-outline'}
                            size={20}
                            color={isItemDeleting ? colors.white : colors.grey}
                        />
                    </TouchableOpacity>

                    {/* Event Data */}
                    {isItemEditing ?
                        <ListTextfield
                            key={`${item.id}-${item.sortId}-${item.timeConfig?.startTime}`}
                            item={item}
                            onChange={(text) => { SortedPlanner.updateItem({ ...item, value: text }) }}
                            onSubmit={() => SortedPlanner.saveTextfield(ShiftTextfieldDirection.BELOW)}
                        /> :
                        <TouchableOpacity
                            onLongPress={drag}
                            onPress={() => SortedPlanner.beginEditItem(item)}
                            style={globalStyles.listItem}
                        >
                            <CustomText
                                type='standard'
                                style={{
                                    color: item.status && [ItemStatus.DELETE].includes(item.status) ?
                                        colors.grey : colors.white,
                                    textDecorationLine: item.status === ItemStatus.DELETE ? 'line-through' : undefined
                                }}
                            >
                                {item.value}
                            </CustomText>
                        </TouchableOpacity>
                    }

                    {/* Time */}
                    {!item?.timeConfig?.allDay && !!item.timeConfig?.startTime ? (
                        <TouchableOpacity onPress={() => {
                            SortedPlanner.beginEditItem(item)
                            setTimeModalOpen(true);
                        }}>
                            <Time timeValue={item.timeConfig?.startTime} />
                        </TouchableOpacity>
                    ) : isItemEditing && (
                        <TouchableOpacity onPress={toggleTimeModal}>
                            <GenericIcon
                                type='MaterialCommunityIcons'
                                name='clock-plus-outline'
                                size={20}
                                color={colors.grey}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Separator Line */}
                <ClickableLine onPress={() => SortedPlanner.createOrMoveTextfield(item.sortId)} />

                {/* Time Modal */}
                {isItemEditing && (
                    <TimeModal
                        open={timeModalOpen}
                        toggleModalOpen={toggleTimeModal}
                        event={item}
                        timestamp={RECURRING_WEEKDAY_PLANNER}
                        onSaveItem={(timeConfig: TimeConfig) => {
                            const newEvent: Event = {
                                ...item,
                                timeConfig
                            };
                            newEvent.sortId = generateSortIdByTimestamp(newEvent, SortedPlanner.current);
                            SortedPlanner.updateItem(newEvent);
                            toggleTimeModal();
                        }}
                    />
                )}
            </View>
        )
    };

    return (
        <View style={styles.container}>
            <ClickableLine onPress={() => SortedPlanner.createOrMoveTextfield(-1)} />
            <DraggableFlatList
                data={SortedPlanner.current}
                nestedScrollEnabled
                onDragEnd={SortedPlanner.endDragItem}
                onDragBegin={SortedPlanner.beginDragItem}
                keyExtractor={(item) => item.id}
                renderItem={renderRow}
            />
            {!SortedPlanner.current.length && (
                <EmptyLabel
                    label='No Recurring Plans'
                    onPress={() => SortedPlanner.createOrMoveTextfield(-1)}
                    style={{ flex: 1 }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 600
    }
});

export default SortableRecurringPlanner;