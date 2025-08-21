import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import usePlanner from '@/hooks/usePlanner';
import { plannerToolbarIconConfig } from '@/lib/constants/plannerToolbar';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { deletePlannerEventsFromStorageAndCalendar, generateNewPlannerEventAndSaveToStorage, generatePlannerEventTimeIconConfig, updatePlannerEventIndexWithChronologicalCheck, updatePlannerEventValueWithSmartTimeDetect } from '@/utils/plannerUtils';
import { useAtomValue } from 'jotai';
import React from 'react';
import { useMMKV } from 'react-native-mmkv';
import DragAndDropList from './components/DragAndDropList';

// ✅ 

const TodayPlanner = () => {

    const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);

    const {
        onGetIsItemDeletingCallback: onGetIsItemDeleting,
        onToggleScheduleItemDeleteCallback: onToggleScheduleItemDelete
    } = useDeleteScheduler<IPlannerEvent>();

    const { visibleEventIds, isLoading } = usePlanner(todayDatestamp);

    const eventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });

    return (
        <DragAndDropList<IPlannerEvent>
            fillSpace
            listId={todayDatestamp}
            storageId={EStorageId.PLANNER_EVENT}
            isLoading={isLoading}
            storage={eventStorage}
            itemIds={visibleEventIds}
            emptyLabelConfig={{
                label: 'All plans complete',
                className: 'flex-1'
            }}
            toolbarIconSet={plannerToolbarIconConfig}
            onCreateItem={generateNewPlannerEventAndSaveToStorage}
            onDeleteItem={(event) => deletePlannerEventsFromStorageAndCalendar([event])}
            onValueChange={updatePlannerEventValueWithSmartTimeDetect}
            onIndexChange={updatePlannerEventIndexWithChronologicalCheck}
            onGetRightIconConfig={generatePlannerEventTimeIconConfig}
            onGetLeftIconConfig={(item) => generateCheckboxIconConfig(onGetIsItemDeleting(item), onToggleScheduleItemDelete)}
        />
    );
};

export default TodayPlanner;
