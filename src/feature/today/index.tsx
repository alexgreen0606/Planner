import React, { useEffect, useState } from 'react';
import { getTodayDatestamp } from '../../foundation/calendarEvents/timestampUtils';
import useSortedList from '../../foundation/sortedLists/hooks/useSortedList';
import { buildPlanner } from '../../foundation/calendarEvents/storage/plannerStorage';
import SortableList from '../../foundation/sortedLists/components/list/SortableList';
import { generateTimeIconConfig, generateTimeModalConfig, handleDragEnd, handleEventInput } from '../../foundation/calendarEvents/sharedListProps';
import { generateCheckboxIconConfig } from '../../foundation/sortedLists/commonProps';
import { TimeModalProps } from '../../foundation/calendarEvents/components/TimeModal';
import { PLANNER_STORAGE_ID, PlannerEvent } from '../../foundation/calendarEvents/types';
import { useSortableListContext } from '../../foundation/sortedLists/services/SortableListProvider';
import { deleteEventLoadChips, saveEventLoadChips, toggleTimeModal } from '../../foundation/calendarEvents/sharedListUtils';

interface SortablePlannerProps {
    reloadChips: () => void;
};

const TodayPlanner = ({
    reloadChips
}: SortablePlannerProps) => {
    const datestamp = getTodayDatestamp();
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const { loadingData } = useSortableListContext();

    async function handleToggleTimeModal(item: PlannerEvent) {
        await toggleTimeModal(item, SortedEvents.toggleItemEdit, setTimeModalOpen);
    };

    async function handleSaveEvent(planEvent: PlannerEvent) {
        await saveEventLoadChips(planEvent, reloadChips, SortedEvents.items);
    }

    async function handleDeleteEvent(planEvent: PlannerEvent) {
        await deleteEventLoadChips(planEvent, reloadChips, SortedEvents.items);
    }

    // Stores the current planner and all handler functions to update it
    const SortedEvents = useSortedList<PlannerEvent, PlannerEvent[]>(
        datestamp,
        PLANNER_STORAGE_ID,
        (planner) => buildPlanner(datestamp, planner),
        undefined,
        {
            create: handleSaveEvent,
            update: handleSaveEvent,
            delete: handleDeleteEvent
        }
    );

    useEffect(() => {
        if (loadingData) {
            reloadChips();
        }
    }, [loadingData]);

    return (
        <SortableList<PlannerEvent, never, TimeModalProps>
            listId={datestamp}
            items={SortedEvents.items}
            fillSpace
            getModal={(item) => generateTimeModalConfig(item, timeModalOpen, handleToggleTimeModal, datestamp, SortedEvents.items)}
            onDragEnd={(item) => handleDragEnd(item, SortedEvents.items, SortedEvents.refetchItems, SortedEvents.persistItemToStorage)}
            onDeleteItem={SortedEvents.deleteItemFromStorage}
            onContentClick={SortedEvents.toggleItemEdit}
            getTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${timeModalOpen}`}
            handleValueChange={(text, item) => handleEventInput(text, item, SortedEvents.items, datestamp)}
            getRightIconConfig={(item) => generateTimeIconConfig(item, handleToggleTimeModal)}
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
