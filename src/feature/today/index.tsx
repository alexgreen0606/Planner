import React, { useState } from 'react';
import { getTodayDatestamp } from '../../foundation/calendarEvents/timestampUtils';
import { isItemTextfield } from '../../foundation/sortedLists/sortedListUtils';
import useSortedList from '../../foundation/sortedLists/hooks/useSortedList';
import { buildPlanner, deleteEvent, saveEvent } from '../../foundation/calendarEvents/storage/plannerStorage';
import SortableList from '../../foundation/sortedLists/components/list/SortableList';
import { generateTimeIconConfig, generateTimeModalConfig, handleDragEnd, handleEventInput } from '../../foundation/calendarEvents/sharedListProps';
import { generateCheckboxIconConfig } from '../../foundation/sortedLists/sharedListProps';
import { TimeModalProps } from '../../foundation/calendarEvents/components/TimeModal';
import { PLANNER_STORAGE_ID, PlannerEvent } from '../../foundation/calendarEvents/types';

interface SortablePlannerProps {
    reloadChips: () => void;
};

const TodayPlanner = ({
    reloadChips
}: SortablePlannerProps) => {
    const datestamp = getTodayDatestamp();
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
        <SortableList<PlannerEvent, never, TimeModalProps>
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
