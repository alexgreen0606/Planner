import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { useCalendarData } from '@/hooks/useCalendarData';
import useSortedList from '@/hooks/useSortedList';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { EListType } from '@/lib/enums/EListType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { upsertEventToStorageAndCalendarCheckRecurring } from '@/storage/plannerStorage';
import { getDayOfWeekFromDatestamp } from '@/utils/dateUtils';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { generateEmptyPlanner, generatePlannerEventTimeIconConfig, generatePlannerToolbarIconSet, syncPlannerWithExternalDataAndUpdateStorage, updateEventValueWithSmartTimeDetect } from '@/utils/plannerUtils';
import { usePathname } from 'expo-router';
import { useAtomValue } from 'jotai';
import React, { useCallback } from 'react';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import SortableList from './components/SortableList';

// ✅ 

const TodayPlanner = () => {
    const { handleGetIsItemDeleting: getIsItemDeleting, handleToggleScheduleItemDelete: toggleScheduleItemDelete } = useDeleteScheduler<IPlannerEvent>();
    const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<IPlannerEvent>();
    const { calendarEvents } = useCalendarData(todayDatestamp);
    const pathname = usePathname();

    const getItemsFromStorageObject = useCallback(async (planner: TPlanner) => {
        return syncPlannerWithExternalDataAndUpdateStorage(planner, calendarEvents);
    }, [calendarEvents]);

    const recurringStorage = useMMKV({ id: EStorageId.RECURRING_EVENT });
    useMMKVListener((key) => {
        if (key === getDayOfWeekFromDatestamp(todayDatestamp)) {
            SortedEvents.refetchItems();
        }
    }, recurringStorage);

    const listType = EListType.PLANNER;
    const isTimeModalOpen = pathname.includes('timeModal');

    // ===================
    // 1. List Generation
    // ===================

    const SortedEvents = useSortedList<IPlannerEvent, TPlanner>({
        storageId: EStorageId.PLANNER,
        storageKey: todayDatestamp,
        onGetItemsFromStorageObject: getItemsFromStorageObject,
        onSaveItemToStorage: upsertEventToStorageAndCalendarCheckRecurring,
        initializedStorageObject: generateEmptyPlanner(todayDatestamp),
        listType
    });

    // ==================
    // 2. Event Handlers
    // ==================

    async function handleToggleScheduleEventDelete(event: IPlannerEvent) {
        if (event.id === textfieldItem?.id) {
            // If this is the textfield, save it.
            await SortedEvents.saveItem(textfieldItem);
            setTextfieldItem(null);
        }

        toggleScheduleItemDelete(event);
    }

    // ======
    // 3. UI
    // ======

    return (
        <SortableList<IPlannerEvent>
            fillSpace
            listId={todayDatestamp}
            listType={listType}
            items={SortedEvents.items}
            hideKeyboard={isTimeModalOpen}
            onSaveTextfieldAndCreateNew={SortedEvents.saveTextfieldAndCreateNew}
            onDragEnd={SortedEvents.saveItem}
            onContentClick={SortedEvents.toggleItemEdit}
            onValueChange={(text, item) => updateEventValueWithSmartTimeDetect(text, item, SortedEvents.items, todayDatestamp)}
            onGetRightIconConfig={generatePlannerEventTimeIconConfig}
            onGetLeftIconConfig={(item) => generateCheckboxIconConfig(getIsItemDeleting(item, listType), handleToggleScheduleEventDelete)}
            toolbarIconSet={generatePlannerToolbarIconSet()}
            isLoading={SortedEvents.isLoading}
            emptyLabelConfig={{
                label: 'All plans complete',
                className: 'flex-1'
            }}
        />
    );
};

export default TodayPlanner;
