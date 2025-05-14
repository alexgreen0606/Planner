import { generateCheckboxIconConfig } from '@/feature/sortedList/commonProps';
import { ToolbarProps } from '@/feature/sortedList/components/ListItemToolbar';
import useSortedList from '@/feature/sortedList/hooks/useSortedList';
import { useDeleteScheduler } from '@/feature/sortedList/services/DeleteScheduler';
import { useScrollContainer } from '@/feature/sortedList/services/ScrollContainerProvider';
import { useTimeModal } from '@/modals/services/TimeModalProvider';
import { useReload } from '@/services/ReloadProvider';
import { generateEventToolbar, generateTimeIconConfig, handleDragEnd, handleEventInput } from '@/utils/calendarUtils/sharedListProps';
import { deleteEventsLoadChips, openTimeModal, saveEventLoadChips } from '@/utils/calendarUtils/sharedListUtils';
import { buildPlannerEvents } from '@/utils/calendarUtils/storage/plannerStorage';
import { getTodayDatestamp } from '@/utils/calendarUtils/timestampUtils';
import { Planner, PLANNER_STORAGE_ID, PlannerEvent } from '@/utils/calendarUtils/types';
import { TIME_MODAL_PATHNAME } from 'app/(modals)/TimeModal';
import { usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import SortableList from '../sortedList';

interface SortablePlannerProps {
    loadAllExternalData: () => Promise<void>;
    calendarEvents: PlannerEvent[];
};

const TodayPlanner = ({
    loadAllExternalData,
    calendarEvents
}: SortablePlannerProps) => {
    const datestamp = getTodayDatestamp();

    const { setCurrentTextfield } = useScrollContainer();

    const { isItemDeleting } = useDeleteScheduler();

    const { registerReloadFunction } = useReload();

    const { onOpen } = useTimeModal();

    const pathname = usePathname();

    const isTimeModalOpen = pathname === TIME_MODAL_PATHNAME;

    useEffect(() => {
        registerReloadFunction(`today_calendar_data`, loadAllExternalData, pathname);
    }, []);

    async function handleOpenTimeModal(item: PlannerEvent) {
        await openTimeModal(
            item,
            SortedEvents.toggleItemEdit,
            onOpen,
            SortedEvents.items,
            setCurrentTextfield
        );
    }

    async function handleSaveEvent(planEvent: PlannerEvent): Promise<string | undefined> {
        return await saveEventLoadChips(planEvent, loadAllExternalData, SortedEvents.items);
    }

    async function handleDeleteEvents(planEvents: PlannerEvent[]) {
        await deleteEventsLoadChips(planEvents, loadAllExternalData, SortedEvents.items);
    }

    async function getItemsFromStorageObject(planner: Planner) {
        return buildPlannerEvents(datestamp, planner, calendarEvents);
    }

    const SortedEvents = useSortedList<PlannerEvent, Planner>({
        storageId: PLANNER_STORAGE_ID,
        storageKey: datestamp,
        getItemsFromStorageObject,
        storageConfig: {
            create: handleSaveEvent,
            update: (updatedEvent) => { handleSaveEvent(updatedEvent) },
            delete: handleDeleteEvents
        },
        reloadTriggers: [calendarEvents]
    });

    return (
        <SortableList<PlannerEvent, ToolbarProps<PlannerEvent>, never>
            listId={datestamp}
            items={SortedEvents.items}
            fillSpace
            onDragEnd={(item) => handleDragEnd(item, SortedEvents.items, SortedEvents.refetchItems, SortedEvents.persistItemToStorage)}
            onDeleteItem={SortedEvents.deleteSingleItemFromStorage}
            onContentClick={SortedEvents.toggleItemEdit}
            getTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${isTimeModalOpen}`}
            handleValueChange={(text, item) => handleEventInput(text, item, SortedEvents.items, datestamp)}
            getRightIconConfig={(item) => generateTimeIconConfig(item, handleOpenTimeModal)}
            getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedEvents.toggleItemDelete, isItemDeleting(item))}
            getToolbar={(item) => generateEventToolbar(item, handleOpenTimeModal, isTimeModalOpen)}
            onSaveTextfield={SortedEvents.persistItemToStorage}
            isLoading={SortedEvents.isLoading}
            emptyLabelConfig={{
                label: 'All Plans Complete',
                className: 'flex-1'
            }}
        />
    );
};

export default TodayPlanner;
