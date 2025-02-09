import React, { useState } from 'react';
import { getTodayGenericTimestamp } from '../../../../foundation/calendar/dateUtils';
import { isItemTextfield } from '../../../../foundation/sortedLists/sortedListUtils';
import useSortedList from '../../../../foundation/sortedLists/hooks/useSortedList';
import { buildPlanner, deleteEvent, saveEvent } from '../../../../foundation/calendar/storage/plannerStorage';
import SortableList from '../../../../foundation/sortedLists/components/list/SortableList';
import { PlannerEventTimeModalProps } from '../../../planners/components/modal/TimeModal';
import { PLANNER_STORAGE_ID, PlannerEvent } from '../../../../foundation/calendar/calendarUtils';
import { generateCheckboxIconConfig, generateTimeIconConfig, generateTimeModalConfig, handleDragEnd, handleEventInput } from '../../../../foundation/calendar/sharedListProps';

interface SortablePlannerProps {
    reloadChips: () => void;
};

const TodayPlanner = ({
    reloadChips
}: SortablePlannerProps) => {
    const datestamp = getTodayGenericTimestamp();
    const [timeModalOpen, setTimeModalOpen] = useState(false);

    const toggleTimeModal = async (item: PlannerEvent) => {
        if (!isItemTextfield(item))
            await SortedEvents.toggleItemEdit(item);
        setTimeModalOpen(curr => !curr);
    };

    // Stores the current planner and all handler functions to update it
    const SortedEvents = useSortedList<PlannerEvent, PlannerEvent[]>(
        datestamp,
        PLANNER_STORAGE_ID,
        (planner) => buildPlanner(datestamp, planner),
        undefined,
        {
            create: saveEvent,
            update: saveEvent,
            delete: deleteEvent
        }
    );

    return (
        <SortableList<PlannerEvent, never, PlannerEventTimeModalProps>
            listId={datestamp}
            items={SortedEvents.items}
            fillSpace
            getModal={(item) => generateTimeModalConfig(item, timeModalOpen, toggleTimeModal, datestamp, SortedEvents.items)}
            onDragEnd={(item) => handleDragEnd(item, SortedEvents.items, SortedEvents.refetchItems, SortedEvents.persistItemToStorage)}
            onDeleteItem={SortedEvents.deleteItemFromStorage}
            onContentClick={SortedEvents.toggleItemEdit}
            getTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${timeModalOpen}`}
            handleValueChange={(text, item) => handleEventInput(text, item, SortedEvents.items, datestamp)}
            getRightIconConfig={(item) => generateTimeIconConfig(item, toggleTimeModal)}
            getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedEvents.toggleItemDelete)}
            onSaveTextfield={async (updatedItem) => {
                await SortedEvents.persistItemToStorage(updatedItem);
                if (updatedItem.timeConfig?.allDay)
                    reloadChips();
            }}
            emptyLabelConfig={{
                label: 'All Plans Complete',
                style: { height: '100%' }
            }}
        />

    );
};

export default TodayPlanner;
