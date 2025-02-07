import React, { useState } from 'react';
import { extractTimeValue, generateSortIdByTime, getTodayGenericTimestamp } from '../../../../foundation/calendar/dateUtils';
import { isItemDeleting, isItemTextfield, ItemStatus } from '../../../../foundation/sortedLists/sortedListUtils';
import useSortedList from '../../../../foundation/sortedLists/hooks/useSortedList';
import { buildPlanner, deleteEvent, saveEvent } from '../../../../foundation/calendar/storage/plannerStorage';
import SortableList from '../../../../foundation/sortedLists/components/list/SortableList';
import PlannerEventTimeModal, { PlannerEventTimeModalProps } from '../../../planners/components/modal/TimeModal';
import TimeValue from '../../../../foundation/calendar/components/TimeValue';
import { Color } from '../../../../foundation/theme/colors';
import { PLANNER_STORAGE_ID, PlannerEvent } from '../../../../foundation/calendar/calendarUtils';

interface SortablePlannerProps {
    reloadChips: () => void;
};

const TodayPlanner = ({
    reloadChips
}: SortablePlannerProps) => {
    const timestamp = getTodayGenericTimestamp();
    const [timeModalOpen, setTimeModalOpen] = useState(false);

    const toggleTimeModal = async (item: PlannerEvent) => {
        if (!isItemTextfield(item))
            await SortedEvents.toggleItemEdit(item);
        setTimeModalOpen(curr => !curr);
    };

    // Stores the current planner and all handler functions to update it
    const SortedEvents = useSortedList<PlannerEvent, PlannerEvent[]>(
        timestamp,
        PLANNER_STORAGE_ID,
        (planner) => buildPlanner(timestamp, planner),
        undefined,
        {
            create: saveEvent,
            update: saveEvent,
            delete: deleteEvent
        }
    );

    return (
        <SortableList<PlannerEvent, never, PlannerEventTimeModalProps>
            listId={timestamp}
            items={SortedEvents.items}
            fillSpace
            getLeftIconConfig={item => ({
                icon: {
                    type: isItemDeleting(item) ? 'circle-filled' : 'circle',
                    color: isItemDeleting(item) ? Color.BLUE : Color.DIM
                },
                onClick: SortedEvents.toggleItemDelete
            })}
            onDeleteItem={SortedEvents.deleteItemFromStorage}
            onContentClick={SortedEvents.toggleItemEdit}
            getTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${timeModalOpen}`}
            handleValueChange={(text, item) => {
                const newEvent = {
                    ...item,
                    value: text,
                };
                if (!item.timeConfig) {
                    const { timeConfig, updatedText } = extractTimeValue(text, timestamp);
                    if (timeConfig) {
                        newEvent.timeConfig = timeConfig;
                        newEvent.value = updatedText;
                        const updatedList = [...SortedEvents.items];
                        const itemCurrentIndex = SortedEvents.items.findIndex(item => item.id === newEvent.id);
                        if (itemCurrentIndex !== -1) {
                            updatedList[itemCurrentIndex] = newEvent;
                        } else {
                            updatedList.push(newEvent);
                        }
                        newEvent.sortId = generateSortIdByTime(newEvent, updatedList);
                    }
                }
                return newEvent;
            }}
            onSaveTextfield={async (updatedItem) => {
                await SortedEvents.persistItemToStorage(updatedItem);
                if (updatedItem.timeConfig?.allDay)
                    reloadChips();
            }}
            onDragEnd={async (updatedItem) => {
                if (updatedItem.timeConfig) {
                    const currentItemIndex = SortedEvents.items.findIndex(item => item.id === updatedItem.id);
                    if (currentItemIndex !== -1) {
                        const initialSortId = SortedEvents.items[currentItemIndex].sortId;
                        const updatedItems = [...SortedEvents.items]
                        updatedItems[currentItemIndex] = updatedItem;
                        const newSortId = generateSortIdByTime(updatedItem, updatedItems);
                        updatedItem.sortId = newSortId;
                        if (newSortId === initialSortId) {

                            // The item has a time conflict. Cancel drag.
                            SortedEvents.refetchItems();
                        }
                    }
                }
                await SortedEvents.persistItemToStorage(updatedItem);
            }}
            getRightIconConfig={item => ({
                hideIcon: !item.timeConfig && !isItemTextfield(item),
                icon: {
                    type: 'clock',
                    color: Color.DIM
                },
                onClick: toggleTimeModal,
                customIcon: item.timeConfig ?
                    <TimeValue allDay={item.timeConfig.allDay} timeValue={item.timeConfig.startTime} />
                    : undefined
            })}
            getModal={(item: PlannerEvent) => ({
                component: PlannerEventTimeModal,
                props: {
                    open: timeModalOpen,
                    toggleModalOpen: toggleTimeModal,
                    timestamp,
                    onSave: (updatedItem: PlannerEvent) => {
                        const eventsWithItem = updatedItem.status === ItemStatus.EDIT ?
                            SortedEvents.items : [...SortedEvents.items, updatedItem];
                        updatedItem.sortId = generateSortIdByTime(updatedItem, eventsWithItem);
                        toggleTimeModal(updatedItem);
                        return updatedItem;
                    },
                    item
                },
            })}
            emptyLabelConfig={{
                label: 'All Plans Complete',
                style: { height: '100%' }
            }}
        />

    );
};

export default TodayPlanner;
