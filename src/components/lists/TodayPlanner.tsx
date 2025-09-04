import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import useGetPlannerEventToggle from '@/hooks/usePlannerEventToggle';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { createPlannerEventInStorageAndFocusTextfield, createPlannerEventTimeIcon, deletePlannerEventsFromStorageAndCalendar, updateDeviceCalendarEventByPlannerEvent } from '@/utils/plannerUtils';
import { useAtomValue } from 'jotai';
import React from 'react';
import { MMKV } from 'react-native-mmkv';
import DragAndDropList from './components/DragAndDropList';

// ✅ 

type TTodayPlannerProps = {
    eventStorage: MMKV;
    visibleEventIds: string[];
    onUpdatePlannerEventIndexWithChronologicalCheck: (index: number, event: IPlannerEvent) => void
    onUpdatePlannerEventValueWithTimeParsing: (userInput: string) => void
}

const TodayPlanner = ({
    visibleEventIds,
    eventStorage,
    onUpdatePlannerEventIndexWithChronologicalCheck,
    onUpdatePlannerEventValueWithTimeParsing
}: TTodayPlannerProps) => {
    const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);
    return (
        <DragAndDropList<IPlannerEvent>
            fillSpace
            listId={todayDatestamp}
            storageId={EStorageId.PLANNER_EVENT}
            storage={eventStorage}
            itemIds={visibleEventIds}
            emptyLabelConfig={{
                label: 'All plans complete',
                className: 'flex-1'
            }}
            onCreateItem={createPlannerEventInStorageAndFocusTextfield}
            onDeleteItem={(event) => deletePlannerEventsFromStorageAndCalendar([event])}
            onValueChange={onUpdatePlannerEventValueWithTimeParsing}
            onIndexChange={onUpdatePlannerEventIndexWithChronologicalCheck}
            onSaveToExternalStorage={updateDeviceCalendarEventByPlannerEvent}
            onGetRightIcon={createPlannerEventTimeIcon}
            onGetLeftIcon={useGetPlannerEventToggle}
        />
    )
};

export default TodayPlanner;
