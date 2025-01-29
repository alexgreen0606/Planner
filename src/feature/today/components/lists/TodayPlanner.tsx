import React, { useState } from 'react';
import { Event, extractTimeValue, generateSortIdByTimestamp, getTodayTimestamp, PLANNER_STORAGE_ID } from '../../../../foundation/planners/timeUtils';
import { isItemDeleting, isItemTextfield, ItemStatus } from '../../../../foundation/sortedLists/utils';
import useSortedList from '../../../../foundation/sortedLists/hooks/useSortedList';
import { buildPlanner, deleteEvent, persistEvent } from '../../../../foundation/planners/storage/plannerStorage';
import SortableList from '../../../../foundation/sortedLists/components/list/SortableList';
import TimeModal, { TimeModalProps } from '../../../planner/components/modal/TimeModal';
import colors from '../../../../foundation/theme/colors';
import TimeValue from '../../../../foundation/planners/components/TimeValue';

interface SortablePlannerProps {
    reloadChips: () => void;
};

const TodayPlanner = ({
    reloadChips
}: SortablePlannerProps) => {
    const timestamp = getTodayTimestamp();
    const [timeModalOpen, setTimeModalOpen] = useState(false);

    const toggleTimeModal = async (item: Event) => {
        if (!isItemTextfield(item))
            await SortedEvents.toggleItemEdit(item);
        setTimeModalOpen(curr => !curr);
    };

    // Stores the current planner and all handler functions to update it
    const SortedEvents = useSortedList<Event, Event[]>(
        timestamp,
        PLANNER_STORAGE_ID,
        (planner) => buildPlanner(timestamp, planner),
        undefined,
        {
            create: persistEvent,
            update: persistEvent,
            delete: deleteEvent
        }
    );

    return (
        <SortableList<Event, never, TimeModalProps>
            listId={timestamp}
            items={SortedEvents.items}
            fillSpace
            getLeftIconConfig={item => ({
                icon: {
                    type: isItemDeleting(item) ? 'circle-filled' : 'circle',
                    color: isItemDeleting(item) ? colors.blue : colors.grey
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
                    const { timeConfig, updatedText } = extractTimeValue(text);
                    if (timeConfig) {
                        const eventsWithItem = item.status === ItemStatus.EDIT ?
                            SortedEvents.items : [...SortedEvents.items, item];
                        newEvent.timeConfig = timeConfig;
                        newEvent.value = updatedText;
                        newEvent.sortId = generateSortIdByTimestamp(newEvent, eventsWithItem);
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
                        const newSortId = generateSortIdByTimestamp(updatedItem, updatedItems, initialSortId);
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
                    color: colors.grey
                },
                onClick: toggleTimeModal,
                customIcon: item.timeConfig ? <TimeValue allDay={item.timeConfig.allDay} timeValue={item.timeConfig.startTime} /> : undefined
            })}
            getModal={(item: Event) => ({
                component: TimeModal,
                props: {
                    open: timeModalOpen,
                    toggleModalOpen: toggleTimeModal,
                    timestamp,
                    onSave: (updatedItem: Event) => {
                        const eventsWithItem = updatedItem.status === ItemStatus.EDIT ?
                            SortedEvents.items : [...SortedEvents.items, updatedItem];
                        updatedItem.sortId = generateSortIdByTimestamp(updatedItem, eventsWithItem);
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
