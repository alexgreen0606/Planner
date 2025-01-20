import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import useSortedList from '../../../../foundation/sortedLists/hooks/useSortedList';
import TimeModal from '../modal/TimeModal';
import Time from '../info/Time';
import { Event, generateSortIdByTimestamp, PLANNER_STORAGE_ID, RECURRING_WEEKDAY_PLANNER_KEY, TimeConfig } from '../../timeUtils';
import colors from '../../../../foundation/theme/colors';
import SortableList from '../../../../foundation/sortedLists/components/list/SortableList';
import { SortableListProvider } from '../../../../foundation/sortedLists/services/SortableListProvider';
import { ItemStatus, ShiftTextfieldDirection } from '../../../../foundation/sortedLists/utils';
import ClickableLine from '../../../../foundation/sortedLists/components/separator/ClickableLine';
import EmptyLabel from '../../../../foundation/sortedLists/components/emptyLabel/EmptyLabel';

const SortedRecurringPlanner = () => {
    const [timeModalOpen, setTimeModalOpen] = useState(false);

    const toggleTimeModal = () => setTimeModalOpen(curr => !curr);

    // Creates a new textfield linked to the recurring planner
    const initializeNewEvent = (newEvent: Event) => ({
        ...newEvent,
        plannerId: RECURRING_WEEKDAY_PLANNER_KEY,
        recurringConfig: {
            recurringId: newEvent.id
        }
    } as Event);

    // Stores the current recurring weekday planner and all handler functions to update it
    const SortedEvents = useSortedList<Event, Event[]>(
        RECURRING_WEEKDAY_PLANNER_KEY,
        PLANNER_STORAGE_ID,
        (events) => events,
        (events) => events,
        initializeNewEvent
    );

    /**
     * Displays a row representing an event within the planner. A row includes
     * an icon for toggling its delete, the row's data and controls for changing
     * the event's time.
     * @param param0 - the item data and the drag function for sorting
     */
    // const renderRow = ({ item, drag }: RenderItemParams<Event>) => {
    //     const isItemEditing = [ItemStatus.NEW, ItemStatus.EDIT].includes(item.status);
    //     const isItemDeleting = item.status === ItemStatus.DELETE;
    //     return (
    //         <View style={globalStyles.backdrop}>
    //             <View style={globalStyles.spacedApart}>

    //                 {/* Toggle Delete Icon */}
    //                 <TouchableOpacity onPress={() => SortedEvents.toggleDeleteItem(item)}>
    //                     <GenericIcon
    //                         type='MaterialCommunityIcons'
    //                         name={isItemDeleting ? 'trash-can' : 'trash-can-outline'}
    //                         size={20}
    //                         color={isItemDeleting ? colors.white : colors.grey}
    //                     />
    //                 </TouchableOpacity>

    //                 {/* Event Data */}
    //                 {isItemEditing ?
    //                     <ListTextfield
    //                         key={`${item.id}-${item.sortId}-${item.timeConfig?.startTime}`}
    //                         item={item}
    //                         onChange={(text) => { SortedEvents.updateItem({ ...item, value: text }) }}
    //                         onSubmit={() => SortedEvents.saveTextfield(ShiftTextfieldDirection.BELOW)}
    //                     /> :
    //                     <TouchableOpacity
    //                         onLongPress={drag}
    //                         onPress={() => SortedEvents.beginEditItem(item)}
    //                         style={globalStyles.listItem}
    //                     >
    //                         <CustomText
    //                             type='standard'
    //                             style={{
    //                                 color: item.status && [ItemStatus.DELETE].includes(item.status) ?
    //                                     colors.grey : colors.white,
    //                                 textDecorationLine: item.status === ItemStatus.DELETE ? 'line-through' : undefined
    //                             }}
    //                         >
    //                             {item.value}
    //                         </CustomText>
    //                     </TouchableOpacity>
    //                 }

    //                 {/* Time */}
    //                 {!item?.timeConfig?.allDay && !!item.timeConfig?.startTime ? (
    //                     <TouchableOpacity onPress={() => {
    //                         SortedEvents.beginEditItem(item)
    //                         setTimeModalOpen(true);
    //                     }}>
    //                         <Time timeValue={item.timeConfig?.startTime} />
    //                     </TouchableOpacity>
    //                 ) : isItemEditing && (
    //                     <TouchableOpacity onPress={toggleTimeModal}>
    //                         <GenericIcon
    //                             type='MaterialCommunityIcons'
    //                             name='clock-plus-outline'
    //                             size={20}
    //                             color={colors.grey}
    //                         />
    //                     </TouchableOpacity>
    //                 )}
    //             </View>

    //             {/* Separator Line */}
    //             <ClickableLine onPress={() => SortedEvents.createOrMoveTextfield(item.sortId)} />

    //             {/* Time Modal */}
    //             {isItemEditing && (
    //                 <TimeModal
    //                     open={timeModalOpen}
    //                     toggleModalOpen={toggleTimeModal}
    //                     event={item}
    //                     timestamp={RECURRING_WEEKDAY_PLANNER}
    //                     onSaveItem={(timeConfig: TimeConfig) => {
    //                         const newEvent: Event = {
    //                             ...item,
    //                             timeConfig
    //                         };
    //                         newEvent.sortId = generateSortIdByTimestamp(newEvent, SortedEvents.items);
    //                         SortedEvents.updateItem(newEvent);
    //                         toggleTimeModal();
    //                     }}
    //                 />
    //             )}
    //         </View>
    //     )
    // };

    return (
        <View style={styles.container}>
            <SortableListProvider>

            {/* Separator Line */}
            <ClickableLine onPress={() => SortedEvents.createOrMoveTextfield(-1)} />

            {/* Planner List */}
            <SortableList<Event>
                items={SortedEvents.items}
                endDrag={SortedEvents.endDragItem}
                getLeftIconConfig={item => ({
                    icon: {
                        type: 'trash',
                        color: item.status === ItemStatus.DELETE ? colors.white : colors.grey
                    },
                    onClick: () => SortedEvents.toggleDeleteItem(item)
                })}
                getTextfieldKey={item => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}`}
                handleValueChange={(text, item) => SortedEvents.persistItemToStorage({ ...item, value: text })}
                onSaveTextfield={() => SortedEvents.saveTextfield(ShiftTextfieldDirection.BELOW)}
                onContentClick={item => SortedEvents.beginEditItem(item)}
                getRightIconConfig={item => ({
                    hideIcon: !(!item?.timeConfig?.allDay && !!item.timeConfig?.startTime) || item.status !== ItemStatus.EDIT,
                    icon: {
                        type: 'clock',
                        color: colors.grey
                    },
                    onClick: !item?.timeConfig?.allDay && !!item.timeConfig?.startTime ? () => {
                        SortedEvents.beginEditItem(item)
                        setTimeModalOpen(true);
                    } : toggleTimeModal,
                    customIcon: !item?.timeConfig?.allDay && !!item.timeConfig?.startTime ? <Time timeValue={item.timeConfig?.startTime} /> : undefined
                })}
                onLineClick={item => SortedEvents.createOrMoveTextfield(item.sortId)}
                getModal={item =>
                    <TimeModal
                        open={timeModalOpen}
                        toggleModalOpen={toggleTimeModal}
                        event={item}
                        timestamp={RECURRING_WEEKDAY_PLANNER_KEY}
                        onSaveItem={(timeConfig: TimeConfig) => {
                            const newEvent: Event = {
                                ...item,
                                timeConfig
                            };
                            newEvent.sortId = generateSortIdByTimestamp(newEvent, SortedEvents.items);
                            SortedEvents.persistItemToStorage(newEvent);
                            toggleTimeModal();
                        }}
                    />
                }
            />

            {/* Empty Label */}
            {!SortedEvents.items.length && (
                <EmptyLabel
                    label='No Recurring Plans'
                    onPress={() => SortedEvents.createOrMoveTextfield(-1)}
                    style={{ flex: 1 }}
                />
            )}
            </SortableListProvider>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 600
    }
});

export default SortedRecurringPlanner;