import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import usePlanner from '@/hooks/usePlanner';
import { plannerToolbarIconConfig } from '@/lib/constants/plannerToolbar';
import { EListType } from '@/lib/enums/EListType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { deletePlannerEventsFromStorageAndCalendar, generateNewPlannerEventAndSaveToStorage, generatePlannerEventTimeIconConfig, updatePlannerEventIndexWithChronologicalCheck, updatePlannerEventValueWithSmartTimeDetect } from '@/utils/plannerUtils';
import { usePathname } from 'expo-router';
import { useAtomValue } from 'jotai';
import React from 'react';
import { useMMKV } from 'react-native-mmkv';
import DragAndDropList from './components/DragAndDropList';

//

const TodayPlanner = () => {
    const pathname = usePathname();

    const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);

    const {
        handleGetIsItemDeleting: onGetIsItemDeleting,
        handleToggleScheduleItemDelete: onToggleScheduleItemDelete
    } = useDeleteScheduler<IPlannerEvent>();

    const { visibleEventIds, isLoading } = usePlanner(todayDatestamp);

    const eventStorage = useMMKV({ id: EStorageId.EVENT });

    const isTimeModalOpen = pathname.includes('timeModal');

    return (
        <DragAndDropList<IPlannerEvent>
            fillSpace
            listId={todayDatestamp}
            listType={EListType.EVENT}
            hideKeyboard={isTimeModalOpen}
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
            onGetLeftIconConfig={(item) => generateCheckboxIconConfig(onGetIsItemDeleting(item, EListType.EVENT), onToggleScheduleItemDelete)}
        />
    );
};

export default TodayPlanner;
