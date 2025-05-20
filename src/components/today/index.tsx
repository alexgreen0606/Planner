import { useTimeModal } from '@/services/TimeModalProvider';
import { PLANNER_STORAGE_ID } from '@/constants/storageIds';
import useSortedList from '@/hooks/useSortedList';
import { useDeleteScheduler } from '@/services/DeleteScheduler';
import { useReloadScheduler } from '@/services/ReloadScheduler';
import { useScrollContainer } from '@/services/ScrollContainer';
import { buildPlannerEvents } from '@/storage/plannerStorage';
import { IPlannerEvent } from '@/types/listItems/IPlannerEvent';
import { TPlanner } from '@/types/planner/TPlanner';
import { generateEventToolbar, generateTimeIconConfig, handleDragEnd, handleEventInput } from '@/utils/commonProps/plannerEventProps';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { deleteEventsLoadChips, openTimeModal, saveEventLoadChips } from '@/utils/plannerUtils';
import { TIME_MODAL_PATHNAME } from 'app/(modals)/TimeModal';
import { usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import SortableList from '../sortedList';
import { ToolbarProps } from '../sortedList/ListItemToolbar';

interface SortablePlannerProps {
    loadAllExternalData: () => Promise<void>;
    calendarEvents: IPlannerEvent[];
};

const TodayPlanner = ({
    loadAllExternalData,
    calendarEvents
}: SortablePlannerProps) => {
    const datestamp = getTodayDatestamp();

    const { setCurrentTextfield } = useScrollContainer();

    const { isItemDeleting } = useDeleteScheduler();

    const { registerReloadFunction } = useReloadScheduler();

    const { onOpen } = useTimeModal();

    const pathname = usePathname();

    const isTimeModalOpen = pathname === TIME_MODAL_PATHNAME;

    useEffect(() => {
        registerReloadFunction(`today_calendar_data`, loadAllExternalData, pathname);
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
        return await saveEventLoadChips(planEvent, loadAllExternalData, SortedEvents.items);
    }

    async function handleDeleteEvents(planEvents: IPlannerEvent[]) {
        await deleteEventsLoadChips(planEvents, loadAllExternalData, SortedEvents.items);
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
        reloadOnNavigate: true
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
