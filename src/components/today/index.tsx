import { useCalendarData } from '@/hooks/useCalendarData';
import useSortedList from '@/hooks/useSortedList';
import { useTodayDatestamp } from '@/hooks/useTodayDatestamp';
import { PLANNER_STORAGE_ID, RECURRING_EVENT_STORAGE_ID } from '@/lib/constants/storage';
import { EListType } from '@/lib/enums/EListType';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { savePlannerEvent } from '@/storage/plannerStorage';
import { datestampToDayOfWeek } from '@/utils/dateUtils';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { buildPlannerEvents, generateEventToolbar, generatePlanner, generateTimeIconConfig, handleEventValueUserInput, openTimeModal } from '@/utils/plannerUtils';
import { usePathname, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import SortableList from '../sortedList';

const TodayPlanner = () => {
    const { getIsItemDeleting, toggleScheduleItemDelete } = useDeleteScheduler<IPlannerEvent>();
    const todayDatestamp = useTodayDatestamp();
    const pathname = usePathname();
    const router = useRouter();

    const listType = EListType.PLANNER;

    const { calendarEvents } = useCalendarData(todayDatestamp);

    const isTimeModalOpen = pathname.includes('timeModal');

    function handleOpenTimeModal(item: IPlannerEvent) {
        openTimeModal(todayDatestamp, item, router);
    }

    function toggleScheduleEventDelete(event: IPlannerEvent) {
        toggleScheduleItemDelete(event, listType);
    }

    const getItemsFromStorageObject = useCallback(async (planner: TPlanner) => {
        return buildPlannerEvents(todayDatestamp, planner, calendarEvents);
    }, [calendarEvents]);

    const SortedEvents = useSortedList<IPlannerEvent, TPlanner>({
        storageId: PLANNER_STORAGE_ID,
        storageKey: todayDatestamp,
        getItemsFromStorageObject,
        storageConfig: {
            createItem: savePlannerEvent,
            updateItem: savePlannerEvent
        },
        initializedStorageObject: generatePlanner(todayDatestamp),
        listType
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
            listType={listType}
            hideKeyboard={isTimeModalOpen}
            saveTextfieldAndCreateNew={SortedEvents.saveTextfieldAndCreateNew}
            onDragEnd={SortedEvents.persistItemToStorage}
            onContentClick={SortedEvents.toggleItemEdit}
            getTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startIso}-${isTimeModalOpen}`}
            handleValueChange={(text, item) => handleEventValueUserInput(text, item, SortedEvents.items, todayDatestamp)}
            getRightIconConfig={(item) => generateTimeIconConfig(item, handleOpenTimeModal)}
            getLeftIconConfig={(item) => generateCheckboxIconConfig(item, toggleScheduleEventDelete, getIsItemDeleting(item, listType))}
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
