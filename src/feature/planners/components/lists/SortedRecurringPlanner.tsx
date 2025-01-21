import React, { useState } from 'react';
import useSortedList from '../../../../foundation/sortedLists/hooks/useSortedList';
import TimeModal from '../modal/TimeModal';
import Time from '../info/Time';
import { Event, generateSortIdByTimestamp, PLANNER_STORAGE_ID, RECURRING_WEEKDAY_PLANNER_KEY } from '../../timeUtils';
import colors from '../../../../foundation/theme/colors';
import SortableList from '../../../../foundation/sortedLists/components/list/SortableList';
import { isItemDeleting, ItemStatus, ListItem } from '../../../../foundation/sortedLists/utils';

const SortedRecurringPlanner = () => {
    const [timeModalOpen, setTimeModalOpen] = useState(false);

    const toggleTimeModal = () => setTimeModalOpen(curr => !curr);

    // Creates a new textfield linked to the recurring planner
    function initializeNewEvent(item: ListItem) {
        return {
            ...item,
            recurringConfig: {
                recurringId: item.id
            }
        }
    };

    // Stores the current recurring weekday planner and all handler functions to update it
    const SortedEvents = useSortedList<Event, Event[]>(
        RECURRING_WEEKDAY_PLANNER_KEY,
        PLANNER_STORAGE_ID,
    );

    return (
        <SortableList<Event, never, never>
            items={SortedEvents.items}
            loading={SortedEvents.loading}
            listId={RECURRING_WEEKDAY_PLANNER_KEY}
            getLeftIconConfig={item => ({
                icon: {
                    type: 'trash',
                    color: isItemDeleting(item) ? colors.white : colors.grey
                },
                onClick: SortedEvents.toggleDeleteItem
            })}
            initializeItem={initializeNewEvent}
            getTextfieldKey={item => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}`}
            onSaveTextfield={SortedEvents.persistItemToStorage}
            onDeleteItem={SortedEvents.deleteItemFromStorage}
            onContentClick={SortedEvents.convertItemToTextfield}
            getRightIconConfig={item => ({
                hideIcon: item.status === ItemStatus.STATIC && !item.timeConfig,
                icon: {
                    type: 'clock',
                    color: colors.grey
                },
                onClick: toggleTimeModal,
                customIcon: !!item.timeConfig?.startTime ? <Time timeValue={item.timeConfig?.startTime} /> : undefined
            })}
            getModal={item => ({
                component: TimeModal,
                props: {
                    open: timeModalOpen,
                    toggleModalOpen: toggleTimeModal,
                    event: item,
                    timestamp: RECURRING_WEEKDAY_PLANNER_KEY
                },
                onSave: (updatedItem: Event) => {
                    updatedItem.sortId = generateSortIdByTimestamp(updatedItem, [...SortedEvents.items, updatedItem]);
                    toggleTimeModal();
                    return updatedItem;
                }
            })}
        />
    );
};

export default SortedRecurringPlanner;