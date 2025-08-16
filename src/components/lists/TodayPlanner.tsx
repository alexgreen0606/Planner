import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { useCalendarData } from '@/hooks/useCalendarData';
import useSortedList from '@/hooks/useSortedList';
import { EListType } from '@/lib/enums/EListType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { getDayOfWeekFromDatestamp } from '@/utils/dateUtils';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { deletePlannerEventsFromStorageAndCalendar, generateEmptyPlanner, generateNewPlannerEventAndSaveToStorage, generatePlannerEventTimeIconConfig, generatePlannerToolbarIconSet, syncPlannerWithExternalDataAndUpdateStorage, updatePlannerEventIndexWithChronologicalCheck, updatePlannerEventValueWithSmartTimeDetect } from '@/utils/plannerUtils';
import { usePathname } from 'expo-router';
import { useAtomValue } from 'jotai';
import React, { useCallback } from 'react';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import DragAndDropList from './components/DragAndDropList';

//

const TodayPlanner = () => {
    const pathname = usePathname();

    const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);

    const {
        handleGetIsItemDeleting: getIsItemDeleting,
        handleToggleScheduleItemDelete: toggleScheduleItemDelete
    } = useDeleteScheduler<IPlannerEvent>();

    const { calendarEvents } = useCalendarData(todayDatestamp);

    const getItemsFromStorageObject = useCallback(async (planner: TPlanner) => {
        return syncPlannerWithExternalDataAndUpdateStorage(planner, calendarEvents);
    }, [calendarEvents]);

    const plannerStorage = useMMKV({ id: EStorageId.PLANNER });
    const eventStorage = useMMKV({ id: EStorageId.EVENT });
    const recurringStorage = useMMKV({ id: EStorageId.RECURRING_EVENT });

    // plannerStorage.clearAll()
    // eventStorage.clearAll()

    // TODO: update mounted datestamp events whenever recurring events change
    useMMKVListener((key) => {
        if (key === getDayOfWeekFromDatestamp(todayDatestamp)) {
            SortedEvents.refetchItems();
        }
    }, recurringStorage);

    const listType = EListType.EVENT;
    const isTimeModalOpen = pathname.includes('timeModal');

    const SortedEvents = useSortedList<TPlanner>({
        storage: plannerStorage,
        storageKey: todayDatestamp,
        onGetItemsFromStorageObject: getItemsFromStorageObject,
        initializedStorageObject: generateEmptyPlanner(todayDatestamp)
    });

    return (
        <DragAndDropList<IPlannerEvent>
            fillSpace
            listId={todayDatestamp}
            listType={listType}
            hideKeyboard={isTimeModalOpen}
            isLoading={SortedEvents.isLoading}
            storage={eventStorage}
            itemIds={SortedEvents.items}
            emptyLabelConfig={{
                label: 'All plans complete',
                className: 'flex-1'
            }}
            toolbarIconSet={generatePlannerToolbarIconSet()}
            onCreateItem={generateNewPlannerEventAndSaveToStorage}
            onDeleteItem={(event) => deletePlannerEventsFromStorageAndCalendar([event])}
            onValueChange={updatePlannerEventValueWithSmartTimeDetect}
            onIndexChange={updatePlannerEventIndexWithChronologicalCheck}
            onGetRightIconConfig={generatePlannerEventTimeIconConfig}
            onGetLeftIconConfig={(item) => generateCheckboxIconConfig(getIsItemDeleting(item, listType), toggleScheduleItemDelete)}
        />
    );
};

export default TodayPlanner;
