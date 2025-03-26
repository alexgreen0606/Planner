import React, { useEffect, useState } from 'react';
import { getTodayDatestamp } from '../../foundation/calendarEvents/timestampUtils';
import useSortedList from '../../foundation/sortedLists/hooks/useSortedList';
import { buildPlanner } from '../../foundation/calendarEvents/storage/plannerStorage';
import SortableList from '../../foundation/sortedLists/components/list/SortableList';
import { generateEventToolbar, generateTimeIconConfig, generateTimeModalConfig, handleDragEnd, handleEventInput } from '../../foundation/calendarEvents/sharedListProps';
import { generateCheckboxIconConfig } from '../../foundation/sortedLists/commonProps';
import { TimeModalProps } from '../../foundation/calendarEvents/components/TimeModal';
import { PLANNER_STORAGE_ID, PlannerEvent } from '../../foundation/calendarEvents/types';
import { useSortableList } from '../../foundation/sortedLists/services/SortableListProvider';
import { deleteEventsLoadChips, saveEventLoadChips, toggleTimeModal } from '../../foundation/calendarEvents/sharedListUtils';
import { generatePlannerEventMap } from '../../foundation/calendarEvents/calendarUtils';
import { ToolbarProps } from '../../foundation/sortedLists/components/ListItemToolbar';
import { ReloadProvider, useReload } from '../../foundation/sortedLists/services/ReloadProvider';
import { useDeleteScheduler } from '../../foundation/sortedLists/services/DeleteScheduler';

interface SortablePlannerProps {
    reloadChips: () => Promise<void>;
};

const TodayPlanner = ({
    reloadChips
}: SortablePlannerProps) => {
    const datestamp = getTodayDatestamp();
    const [timeModalOpen, setTimeModalOpen] = useState(false);

    const {
        setCurrentTextfield
    } = useSortableList();

    const {
        isItemDeleting
    } = useDeleteScheduler();

    const {
        addReloadFunction
    } = useReload();

    async function handleToggleTimeModal(item: PlannerEvent) {
        await toggleTimeModal(item, SortedEvents.toggleItemEdit, setTimeModalOpen);
    };

    async function handleSaveEvent(planEvent: PlannerEvent): Promise<string | undefined> {
        return await saveEventLoadChips(planEvent, reloadChips, SortedEvents.items);
    }

    async function handleDeleteEvents(planEvents: PlannerEvent[]) {
        await deleteEventsLoadChips(planEvents, reloadChips, SortedEvents.items);
    }

    async function getItemsFromStorageObject(planner: PlannerEvent[]) {
        const todayEvents = await generatePlannerEventMap([datestamp]);
        return buildPlanner(datestamp, planner, todayEvents[datestamp]);
    }

    const SortedEvents = useSortedList<PlannerEvent, PlannerEvent[]>({
        storageId: PLANNER_STORAGE_ID,
        storageKey: datestamp,
        getItemsFromStorageObject,
        storageConfig: {
            create: handleSaveEvent,
            update: (updatedEvent) => { handleSaveEvent(updatedEvent) },
            delete: handleDeleteEvents
        }
    });

    useEffect(() => {
        addReloadFunction(`${datestamp}-chips-and-calendar-events`, reloadChips);
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
            onSaveTextfield={async (updatedItem) => {
                await SortedEvents.persistItemToStorage(updatedItem);
                if (updatedItem.timeConfig?.allDay) {
                    reloadChips();
                }
            }}
            emptyLabelConfig={{
                label: 'All Plans Complete',
                style: { height: '100%' }
            }}
        />
    );
};

export default TodayPlanner;
