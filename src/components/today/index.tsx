import { calendarPlannerByDate } from '@/atoms/calendarEvents';
import { PLANNER_STORAGE_ID, RECURRING_EVENT_STORAGE_ID } from '@/lib/constants/storage';
import { useDeleteScheduler } from '@/hooks/useDeleteScheduler';
import { useReloadScheduler } from '@/hooks/useReloadScheduler';
import useSortedList from '@/hooks/useSortedList';
import { loadCalendarData } from '@/utils/calendarUtils';
import { datestampToDayOfWeek, getTodayDatestamp } from '@/utils/dateUtils';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { buildPlannerEvents, deleteEventsReloadData, generateEventToolbar, generatePlanner, generateTimeIconConfig, handleEventValueUserInput, openTimeModal, saveEventReloadData } from '@/utils/plannerUtils';
import { usePathname, useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import React, { useEffect } from 'react';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import SortableList from '../sortedList';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlanner } from '@/lib/types/planner/TPlanner';

const TodayPlanner = () => {
    const { isItemDeleting } = useDeleteScheduler<IPlannerEvent>();
    const { registerReloadFunction } = useReloadScheduler();
    const datestamp = getTodayDatestamp();
    const pathname = usePathname();
    const router = useRouter();

    const [calendarEvents] = useAtom(calendarPlannerByDate(datestamp));

    const isTimeModalOpen = pathname.includes('timeModal');

    useEffect(() => {
        registerReloadFunction(`today_calendar_data`, loadCalendarData, pathname);
    }, []);

    function handleOpenTimeModal(item: IPlannerEvent) {
        openTimeModal(datestamp, item, router);
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
            createItem: saveEventReloadData,
            updateItem: saveEventReloadData,
            deleteItems: handleDeleteEvents
        },
        reloadTriggers: [calendarEvents],
        initializedStorageObject: generatePlanner(datestamp)
    });

    const recurringStorage = useMMKV({ id: RECURRING_EVENT_STORAGE_ID });
        useMMKVListener((key) => {
            if (key === datestampToDayOfWeek(datestamp)) {
                SortedEvents.refetchItems();
            }
        }, recurringStorage);

    return (
        <SortableList<IPlannerEvent>
            listId={datestamp}
            items={SortedEvents.items}
            fillSpace
            hideKeyboard={isTimeModalOpen}
            saveTextfieldAndCreateNew={SortedEvents.saveTextfieldAndCreateNew}
            onDragEnd={SortedEvents.persistItemToStorage}
            onDeleteItem={SortedEvents.deleteSingleItemFromStorage}
            onContentClick={SortedEvents.toggleItemEdit}
            getTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${isTimeModalOpen}`}
            handleValueChange={(text, item) => handleEventValueUserInput(text, item, SortedEvents.items, datestamp)}
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
