import React, { useEffect, useState } from 'react';
import { generateSortIdByTime, getTodayDatestamp } from '../../foundation/calendarEvents/timestampUtils';
import useSortedList from '../../foundation/sortedLists/hooks/useSortedList';
import { buildPlannerEvents } from '../../foundation/calendarEvents/storage/plannerStorage';
import SortableList from '../../foundation/sortedLists/components/list/SortableList';
import { generateEventToolbar, generateTimeIconConfig, handleDragEnd, handleEventInput } from '../../foundation/calendarEvents/sharedListProps';
import { generateCheckboxIconConfig } from '../../foundation/sortedLists/commonProps';
import { Planner, PLANNER_STORAGE_ID, PlannerEvent } from '../../foundation/calendarEvents/types';
import { useScrollContainer } from '../../foundation/sortedLists/services/ScrollContainerProvider';
import { deleteEventsLoadChips, saveEventLoadChips, openTimeModal } from '../../foundation/calendarEvents/sharedListUtils';
import { ToolbarProps } from '../../foundation/sortedLists/components/ListItemToolbar';
import { useReload } from '../../services/ReloadProvider';
import { useDeleteScheduler } from '../../foundation/sortedLists/services/DeleteScheduler';
import { useTimeModal } from '../../modals/services/TimeModalProvider';
import { usePathname } from 'expo-router';
import { TIME_MODAL_PATHNAME } from '../../../app/(modals)/TimeModal';

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
        registerReloadFunction(`external-data`, loadAllExternalData);
    }, []);

    useEffect(() => {
        SortedEvents.refetchItems();
    }, [calendarEvents]);

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
        noReload: true
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
            emptyLabelConfig={{
                label: 'All Plans Complete',
                style: { height: '100%' }
            }}
        />
    );
};

export default TodayPlanner;
