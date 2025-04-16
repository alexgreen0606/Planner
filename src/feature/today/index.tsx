import React, { useEffect, useState } from 'react';
import { getTodayDatestamp } from '../../foundation/calendarEvents/timestampUtils';
import useSortedList from '../../foundation/sortedLists/hooks/useSortedList';
import { buildPlanner } from '../../foundation/calendarEvents/storage/plannerStorage';
import SortableList from '../../foundation/sortedLists/components/list/SortableList';
import { generateEventToolbar, generateTimeIconConfig, generateTimeModalConfig, handleDragEnd, handleEventInput } from '../../foundation/calendarEvents/sharedListProps';
import { generateCheckboxIconConfig } from '../../foundation/sortedLists/commonProps';
import { TimeModalProps } from '../../foundation/calendarEvents/components/timeModal/TimeModal';
import { PLANNER_STORAGE_ID, PlannerEvent } from '../../foundation/calendarEvents/types';
import { useSortableList } from '../../foundation/sortedLists/services/SortableListProvider';
import { deleteEventsLoadChips, saveEventLoadChips, toggleTimeModal } from '../../foundation/calendarEvents/sharedListUtils';
import { ToolbarProps } from '../../foundation/sortedLists/components/ListItemToolbar';
import { useNavigation } from '../../foundation/navigation/services/NavigationProvider';
import { useDeleteScheduler } from '../../foundation/sortedLists/services/DeleteScheduler';
import { Screens } from '../../foundation/navigation/constants';

interface SortablePlannerProps {
    loadAllExternalData: () => Promise<void>;
    calendarEvents: PlannerEvent[];
};

const TodayPlanner = ({
    loadAllExternalData,
    calendarEvents
}: SortablePlannerProps) => {
    const datestamp = getTodayDatestamp();
    const [timeModalOpen, setTimeModalOpen] = useState(false);

    const { setCurrentTextfield } = useSortableList();

    const { isItemDeleting } = useDeleteScheduler();

    const { registerReloadFunction: addReloadFunction } = useNavigation();

    async function handleToggleTimeModal(item: PlannerEvent) {
        await toggleTimeModal(item, SortedEvents.toggleItemEdit, setTimeModalOpen);
    };

    async function handleSaveEvent(planEvent: PlannerEvent): Promise<string | undefined> {
        return await saveEventLoadChips(planEvent, loadAllExternalData, SortedEvents.items);
    }

    async function handleDeleteEvents(planEvents: PlannerEvent[]) {
        await deleteEventsLoadChips(planEvents, loadAllExternalData, SortedEvents.items);
    }

    async function getItemsFromStorageObject(planner: PlannerEvent[]) {
        return buildPlanner(datestamp, planner, calendarEvents);
    }

    const SortedEvents = useSortedList<PlannerEvent, PlannerEvent[]>({
        storageId: PLANNER_STORAGE_ID,
        storageKey: datestamp,
        getItemsFromStorageObject,
        storageConfig: {
            create: handleSaveEvent,
            update: (updatedEvent) => { handleSaveEvent(updatedEvent) },
            delete: handleDeleteEvents
        },
        noReload: true
    });

    useEffect(() => {
        addReloadFunction(`external-data`, loadAllExternalData);
    }, []);

    return (
        <SortableList<PlannerEvent, ToolbarProps<PlannerEvent>, TimeModalProps>
            listId={datestamp}
            items={SortedEvents.items}
            fillSpace
            getModal={(item) => generateTimeModalConfig(item, timeModalOpen, handleToggleTimeModal, datestamp, SortedEvents.items, setCurrentTextfield)}
            onDragEnd={(item) => handleDragEnd(item, SortedEvents.items, SortedEvents.refetchItems, SortedEvents.persistItemToStorage)}
            onDeleteItem={SortedEvents.deleteSingleItemFromStorage}
            onContentClick={SortedEvents.toggleItemEdit}
            getTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${timeModalOpen}`}
            handleValueChange={(text, item) => handleEventInput(text, item, SortedEvents.items, datestamp)}
            getRightIconConfig={(item) => generateTimeIconConfig(item, handleToggleTimeModal)}
            getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedEvents.toggleItemDelete, isItemDeleting(item))}
            getToolbar={(item) => generateEventToolbar(item, handleToggleTimeModal, timeModalOpen)}
            onSaveTextfield={SortedEvents.persistItemToStorage}
            emptyLabelConfig={{
                label: 'All Plans Complete',
                style: { height: '100%' }
            }}
        />
    );
};

export default TodayPlanner;
