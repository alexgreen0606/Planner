import PlannerHeader from '@/components/headers/PlannerHeader';
import Planner from '@/_deprecated/DEP_Planner';
import PlannerEventToolbar from '@/components/toolbars/PlannerEventToolbar';
import usePlanner from '@/hooks/planners/usePlanner';
import usePlannerEventTimeParser from '@/hooks/planners/usePlannerEventTimeParser';
import useGetPlannerEventToggle from '@/hooks/planners/usePlannerEventToggle';
import { PLANNER_CAROUSEL_HEIGHT } from '@/lib/constants/miscLayout';
import { EStorageId } from '@/lib/enums/EStorageId';
import ListPage from '@/components/ListPage';
import { createPlannerEventInStorageAndFocusTextfield, createPlannerEventTimeIcon, deletePlannerEventsFromStorageAndCalendar, updateDeviceCalendarEventByPlannerEvent } from '@/utils/plannerUtils';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useMMKV } from 'react-native-mmkv';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ✅ 

const PlannerPage = () => {
    const { datestamp } = useLocalSearchParams<{ datestamp: string }>();
    const eventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });
    const { top: TOP_SPACER } = useSafeAreaInsets();

    const { onUpdatePlannerEventValueWithTimeParsing } = usePlannerEventTimeParser(datestamp, eventStorage);

    const {
        planner: { eventIds },
        onUpdatePlannerEventIndexWithChronologicalCheck
    } = usePlanner(datestamp);

    return (
        <ListPage
            scrollContentAbsoluteTop={TOP_SPACER + PLANNER_CAROUSEL_HEIGHT}
            emptyPageLabelProps={{ label: 'No plans' }}
            toolbar={<PlannerEventToolbar />}
            stickyHeader={<PlannerHeader datestamp={datestamp} />}
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

export default PlannerPage;