import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import useSortedList from '../../../../foundation/sortedLists/hooks/useSortedList';
import { ItemStatus, ShiftTextfieldDirection } from '../../../../foundation/sortedLists/enums';
import { Event, TimeConfig } from '../../types';
import { getPlannerStorageKey, savePlannerToStorage } from '../../storage/plannerStorage';
import { RECURRING_WEEKDAY_PLANNER } from '../../enums';
import ClickableLine from '../../../../foundation/ui/separators/ClickableLine';
import TimeModal from '../modal/TimeModal';
import Time from '../info/Time';
import { generateSortIdByTimestamp } from '../../utils';
import colors from '../../../../foundation/theme/colors';
import EmptyLabel from '../../../../foundation/sortedLists/components/EmptyLabel';
import { StorageIds } from '../../../../enums';
import SortableList from '../../../../foundation/sortedLists/components/SortableList';
import { SortableListProvider } from '../../../../foundation/sortedLists/services/SortableListProvider';

const SortedRecurringPlanner = () => {
    const [timeModalOpen, setTimeModalOpen] = useState(false);

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
    const SortedEvents = useSortedList<Event, Event[]>(
        getPlannerStorageKey(RECURRING_WEEKDAY_PLANNER),
        StorageIds.PLANNER_STORAGE,
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
                renderLeftIcon={item => ({
                    icon: {
                        type: 'MaterialCommunityIcons',
                        name: item.status === ItemStatus.DELETE ? 'trash-can' : 'trash-can-outline',
                        color: item.status === ItemStatus.DELETE ? colors.white : colors.grey
                    },
                    onClick: () => SortedEvents.toggleDeleteItem(item)
                })}
                extractTextfieldKey={item => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}`}
                onChangeTextfield={(text, item) => SortedEvents.updateItem({ ...item, value: text })}
                onSubmitTextfield={() => SortedEvents.saveTextfield(ShiftTextfieldDirection.BELOW)}
                onRowClick={item => SortedEvents.beginEditItem(item)}
                renderRightIcon={item => ({
                    hideIcon: !(!item?.timeConfig?.allDay && !!item.timeConfig?.startTime) || item.status !== ItemStatus.EDIT,
                    icon: {
                        type: 'MaterialCommunityIcons',
                        name: 'clock-plus-outline',
                        color: colors.grey
                    },
                    onClick: !item?.timeConfig?.allDay && !!item.timeConfig?.startTime ? () => {
                        SortedEvents.beginEditItem(item)
                        setTimeModalOpen(true);
                    } : toggleTimeModal,
                    customIcon: !item?.timeConfig?.allDay && !!item.timeConfig?.startTime ? <Time timeValue={item.timeConfig?.startTime} /> : undefined
                })}
                handleSeparatorClick={item => SortedEvents.createOrMoveTextfield(item.sortId)}
                renderItemModal={item =>
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
                            newEvent.sortId = generateSortIdByTimestamp(newEvent, SortedEvents.items);
                            SortedEvents.updateItem(newEvent);
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