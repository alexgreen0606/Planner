import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import usePlannerEventTimeParser from '@/hooks/planners/usePlannerEventTimeParser';
import useGetPlannerEventToggle from '@/hooks/planners/usePlannerEventToggle';
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
    eventIds: string[];
    onUpdatePlannerEventIndexWithChronologicalCheck: (index: number, event: IPlannerEvent) => void;
}

const TodayPlanner = ({
    eventIds,
    eventStorage,
    onUpdatePlannerEventIndexWithChronologicalCheck,
}: TTodayPlannerProps) => {
    const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);

    const { onUpdatePlannerEventValueWithTimeParsing } = usePlannerEventTimeParser(todayDatestamp, eventStorage);

    return (
        <DragAndDropList<IPlannerEvent>
            fillSpace
            listId={todayDatestamp}
            storageId={EStorageId.PLANNER_EVENT}
            storage={eventStorage}
            itemIds={eventIds}
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
