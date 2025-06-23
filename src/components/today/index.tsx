import { useCalendarData } from '@/hooks/useCalendarData';
import useSortedList from '@/hooks/useSortedList';
import { EListType } from '@/lib/enums/EListType';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { savePlannerEvent } from '@/storage/plannerStorage';
import { datestampToDayOfWeek } from '@/utils/dateUtils';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { buildPlannerEvents, generatePlanner, generateTimeIconConfig, buildEventToolbarIconSet, handleEventValueUserInput, openTimeModal } from '@/utils/plannerUtils';
import { usePathname, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import SortableList from '../sortedList';
import { useAtomValue } from 'jotai';
import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { EStorageId } from '@/lib/enums/EStorageId';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';

const TodayPlanner = () => {
    const { getIsItemDeleting, toggleScheduleItemDelete } = useDeleteScheduler<IPlannerEvent>();
    const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);
    const pathname = usePathname();
    const router = useRouter();

    const [textfieldItem] = useTextfieldItemAs<IPlannerEvent>();

    const listType = EListType.PLANNER;

    const { calendarEvents } = useCalendarData(todayDatestamp);

    const isTimeModalOpen = pathname.includes('timeModal');

    function handleOpenTimeModal(event?: IPlannerEvent) {
        const eventToOpen = event ?? textfieldItem;
        openTimeModal(todayDatestamp, eventToOpen!, router);
    }

    function toggleScheduleEventDelete(event: IPlannerEvent) {
        toggleScheduleItemDelete(event, listType);
    }

    const getItemsFromStorageObject = useCallback(async (planner: TPlanner) => {
        return buildPlannerEvents(todayDatestamp, planner, calendarEvents);
    }, [calendarEvents]);

    const SortedEvents = useSortedList<IPlannerEvent, TPlanner>({
        storageId: EStorageId.PLANNER,
        storageKey: todayDatestamp,
        getItemsFromStorageObject,
        storageConfig: {
            createItem: savePlannerEvent,
            updateItem: savePlannerEvent
        },
        initializedStorageObject: generatePlanner(todayDatestamp),
        listType
    });

    const recurringStorage = useMMKV({ id: EStorageId.RECURRING_EVENT });
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
            toolbarIconSet={buildEventToolbarIconSet(handleOpenTimeModal)}
            isLoading={SortedEvents.isLoading}
            emptyLabelConfig={{
                label: 'All Plans Complete',
                className: 'flex-1'
            }}
        />
    );
};

export default TodayPlanner;
