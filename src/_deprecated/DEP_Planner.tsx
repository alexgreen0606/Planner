import usePlanner from '@/hooks/planners/usePlanner';
import usePlannerEventTimeParser from '@/hooks/planners/usePlannerEventTimeParser';
import useGetPlannerEventToggle from '@/hooks/planners/usePlannerEventToggle';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { createPlannerEventInStorageAndFocusTextfield, createPlannerEventTimeIcon, deletePlannerEventsFromStorageAndCalendar, updateDeviceCalendarEventByPlannerEvent } from '@/utils/plannerUtils';
import React from 'react';
import { useMMKV } from 'react-native-mmkv';
import DragAndDropList from './DEP_DragAndDropList';

// ✅ 

type TPlannerProps = {
    datestamp: string;
}

const Planner = ({ datestamp }: TPlannerProps) => {
    const eventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });

    const { onUpdatePlannerEventValueWithTimeParsing } = usePlannerEventTimeParser(datestamp, eventStorage);

    const {
        planner: { eventIds },
        onUpdatePlannerEventIndexWithChronologicalCheck
    } = usePlanner(datestamp);

    return (
        <DragAndDropList<IPlannerEvent>
            listId={datestamp}
            storageId={EStorageId.PLANNER_EVENT}
            storage={eventStorage}
            itemIds={eventIds}
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

export default Planner;
