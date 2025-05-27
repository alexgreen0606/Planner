import { calendarPlannerByDate } from '@/atoms/calendarEvents';
import { PLANNER_STORAGE_ID } from '@/constants/storageIds';
import { useDeleteScheduler } from '@/hooks/useDeleteScheduler';
import { useReloadScheduler } from '@/hooks/useReloadScheduler';
import useSortedList from '@/hooks/useSortedList';
import { useTimeModal } from '@/services/TimeModalProvider';
import { IPlannerEvent } from '@/types/listItems/IPlannerEvent';
import { TPlanner } from '@/types/planner/TPlanner';
import { generatePlanner, loadCalendarData } from '@/utils/calendarUtils';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { buildPlannerEvents, deleteEventsReloadData, generateEventToolbar, generateTimeIconConfig, handleDragEnd, handleEventInput, openTimeModal, saveEventReloadData } from '@/utils/plannerUtils';
import { TIME_MODAL_PATHNAME } from 'app/(modals)/TimeModal';
import { usePathname } from 'expo-router';
import { useAtom } from 'jotai';
import React, { useEffect } from 'react';
import SortableList from '../sortedList';
import { ToolbarProps } from '../sortedList/ListItemToolbar';

const TodayPlanner = () => {
    const datestamp = getTodayDatestamp();

    const [calendarEvents] = useAtom(calendarPlannerByDate(datestamp));

    const { isItemDeleting } = useDeleteScheduler<IPlannerEvent>();

    const { registerReloadFunction } = useReloadScheduler();

    const { onOpen } = useTimeModal();

    const pathname = usePathname();

    const isTimeModalOpen = pathname === TIME_MODAL_PATHNAME;

    useEffect(() => {
        registerReloadFunction(`today_calendar_data`, loadCalendarData, pathname);
    }, []);

    async function handleOpenTimeModal(item: IPlannerEvent) {
        await openTimeModal(
            item,
            SortedEvents.toggleItemEdit,
            onOpen,
            SortedEvents.items,
            SortedEvents.saveTextfieldAndCreateNew
        );
    }

    async function handleSaveEvent(planEvent: IPlannerEvent): Promise<string | undefined> {
        return await saveEventReloadData(planEvent, SortedEvents.items);
    }

    async function handleDeleteEvents(planEvents: IPlannerEvent[]) {
        await deleteEventsReloadData(planEvents);
    }

    async function getItemsFromStorageObject(planner: TPlanner) {
        return buildPlannerEvents(datestamp, planner, calendarEvents);
    }

    const SortedEvents = useSortedList<IPlannerEvent, TPlanner>({
        storageId: PLANNER_STORAGE_ID,
        storageKey: datestamp,
        getItemsFromStorageObject,
        storageConfig: {
            create: handleSaveEvent,
            update: (updatedEvent) => { handleSaveEvent(updatedEvent) },
            delete: handleDeleteEvents
        },
        reloadTriggers: [calendarEvents],
        reloadOnNavigate: true,
        initializedStorageObject: generatePlanner(datestamp)
    });

    return (
        <SortableList<IPlannerEvent, ToolbarProps<IPlannerEvent>, never>
            listId={datestamp}
            items={SortedEvents.items}
            fillSpace
            saveTextfieldAndCreateNew={SortedEvents.saveTextfieldAndCreateNew}
            onDragEnd={(item) => handleDragEnd(item, SortedEvents.items, SortedEvents.refetchItems, SortedEvents.persistItemToStorage)}
            onDeleteItem={SortedEvents.deleteSingleItemFromStorage}
            onContentClick={SortedEvents.toggleItemEdit}
            getTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${isTimeModalOpen}`}
            handleValueChange={(text, item) => handleEventInput(text, item, SortedEvents.items, datestamp)}
            getRightIconConfig={(item) => generateTimeIconConfig(item, handleOpenTimeModal)}
            getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedEvents.toggleItemDelete, isItemDeleting(item))}
            getToolbar={(item) => generateEventToolbar(item, handleOpenTimeModal, isTimeModalOpen)}
            isLoading={SortedEvents.isLoading}
            emptyLabelConfig={{
                label: 'All Plans Complete',
                className: 'flex-1'
            }}
        />
    );
};

export default TodayPlanner;
