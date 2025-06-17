import { useCalendarData } from '@/hooks/useCalendarData';
import { useDeleteScheduler } from '@/hooks/useDeleteScheduler';
import useSortedList from '@/hooks/useSortedList';
import { PLANNER_STORAGE_ID, RECURRING_EVENT_STORAGE_ID } from '@/lib/constants/storage';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { datestampToDayOfWeek, getTodayDatestamp } from '@/utils/dateUtils';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { buildPlannerEvents, deleteEventsReloadData, generateEventToolbar, generatePlanner, generateTimeIconConfig, handleEventValueUserInput, openTimeModal, saveEventReloadData } from '@/utils/plannerUtils';
import { usePathname, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import SortableList from '../sortedList';
import { useTodayDatestamp } from '@/hooks/useTodayDatestamp';

const TodayPlanner = () => {
    const { isItemDeleting } = useDeleteScheduler<IPlannerEvent>();
    const todayDatestamp = useTodayDatestamp();
    const pathname = usePathname();
    const router = useRouter();

    const { calendarEvents } = useCalendarData(todayDatestamp);

    const isTimeModalOpen = pathname.includes('timeModal');

    function handleOpenTimeModal(item: IPlannerEvent) {
        openTimeModal(todayDatestamp, item, router);
    }

    async function handleDeleteEvents(planEvents: IPlannerEvent[]) {
        await deleteEventsReloadData(planEvents);
    }

    const getItemsFromStorageObject = useCallback(async (planner: TPlanner) => {
        return buildPlannerEvents(todayDatestamp, planner, calendarEvents);
    }, [calendarEvents]);

    const SortedEvents = useSortedList<IPlannerEvent, TPlanner>({
        storageId: PLANNER_STORAGE_ID,
        storageKey: todayDatestamp,
        getItemsFromStorageObject,
        storageConfig: {
            createItem: (event) => saveEventReloadData(event, true),
            updateItem: (event) => saveEventReloadData(event, true),
            deleteItems: handleDeleteEvents
        },
        initializedStorageObject: generatePlanner(todayDatestamp)
    });

    const recurringStorage = useMMKV({ id: RECURRING_EVENT_STORAGE_ID });
    useMMKVListener((key) => {
        if (key === datestampToDayOfWeek(todayDatestamp)) {
            SortedEvents.refetchItems();
        }
    }, recurringStorage);

    return (
        <SortableList<IPlannerEvent>
            listId={todayDatestamp}
            items={SortedEvents.items}
            fillSpace
            hideKeyboard={isTimeModalOpen}
            saveTextfieldAndCreateNew={SortedEvents.saveTextfieldAndCreateNew}
            onDragEnd={SortedEvents.persistItemToStorage}
            onDeleteItem={SortedEvents.deleteSingleItemFromStorage}
            onContentClick={SortedEvents.toggleItemEdit}
            getTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${isTimeModalOpen}`}
            handleValueChange={(text, item) => handleEventValueUserInput(text, item, SortedEvents.items, todayDatestamp)}
            getRightIconConfig={(item) => generateTimeIconConfig(item, handleOpenTimeModal)}
            getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedEvents.toggleItemDelete, isItemDeleting(item))}
            getToolbarProps={(item) => generateEventToolbar(item, handleOpenTimeModal, isTimeModalOpen)}
            isLoading={SortedEvents.isLoading}
            emptyLabelConfig={{
                label: 'All Plans Complete',
                className: 'flex-1'
            }}
        />
    );
};

export default TodayPlanner;
