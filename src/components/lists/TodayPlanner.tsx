import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { useCalendarData } from '@/hooks/useCalendarData';
import useSortedList from '@/hooks/useSortedList';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { EListType } from '@/lib/enums/EListType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { saveEventWithRecurringAndCalendarCheck } from '@/storage/plannerStorage';
import { datestampToDayOfWeek } from '@/utils/dateUtils';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { buildEventToolbarIconSet, buildPlannerEvents, generatePlanner, generateTimeIconConfig, handleNewEventValue, openTimeModal } from '@/utils/plannerUtils';
import { usePathname, useRouter } from 'expo-router';
import { useAtomValue } from 'jotai';
import React, { useCallback } from 'react';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import SortableList from './components/SortableList';

// ✅ 

const TodayPlanner = () => {
    const { getIsItemDeleting, toggleScheduleItemDelete } = useDeleteScheduler<IPlannerEvent>();
    const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<IPlannerEvent>();
    const { calendarEvents } = useCalendarData(todayDatestamp);
    const pathname = usePathname();
    const router = useRouter();

    const getItemsFromStorageObject = useCallback(async (planner: TPlanner) => {
        return buildPlannerEvents(todayDatestamp, planner, calendarEvents);
    }, [calendarEvents]);

    const recurringStorage = useMMKV({ id: EStorageId.RECURRING_EVENT });
    useMMKVListener((key) => {
        if (key === datestampToDayOfWeek(todayDatestamp)) {
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
        getItemsFromStorageObject,
        saveItemToStorage: saveEventWithRecurringAndCalendarCheck,
        initializedStorageObject: generatePlanner(todayDatestamp),
        listType
    });

    // ==================
    // 2. Event Handlers
    // ==================

    function handleOpenTimeModal(event?: IPlannerEvent) {
        const eventToOpen = event ?? textfieldItem;
        if (!eventToOpen) throw new Error('No event to open.')

        openTimeModal(todayDatestamp, eventToOpen!, router);
    }

    async function handleToggleScheduleEventDelete(event: IPlannerEvent) {
        if (event.id === textfieldItem?.id) {
            // If this is the textfield, save it.
            await SortedEvents.persistItemToStorage(textfieldItem);
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
            onDragEnd={SortedEvents.persistItemToStorage}
            onContentClick={SortedEvents.toggleItemEdit}
            onValueChange={(text, item) => handleNewEventValue(text, item, SortedEvents.items, todayDatestamp)}
            onGetRightIconConfig={(item) => generateTimeIconConfig(item, handleOpenTimeModal)}
            onGetLeftIconConfig={(item) => generateCheckboxIconConfig(item, handleToggleScheduleEventDelete, getIsItemDeleting(item, listType))}
            toolbarIconSet={buildEventToolbarIconSet(handleOpenTimeModal)}
            isLoading={SortedEvents.isLoading}
            emptyLabelConfig={{
                label: 'All plans complete',
                className: 'flex-1'
            }}
        />
    );
};

export default TodayPlanner;
