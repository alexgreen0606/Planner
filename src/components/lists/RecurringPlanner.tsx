import useRecurringTextfield from '@/hooks/textfields/useRecurringTextfield';
import useRecurringPlanner from '@/hooks/useRecurringPlanner';
import { ERecurringPlannerKey } from '@/lib/enums/ERecurringPlannerKey';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { deleteRecurringEventsFromStorageHideWeekday, generateNewRecurringEventAndSaveToStorage, generateRecurringEventTimeIconConfig, updateRecurringEventIndexWithChronologicalCheck, updateRecurringEventValueWithCloningAndSmartTimeDetect, updateWeekdayPlannersWithWeekdayEvent } from '@/utils/recurringPlannerUtils';
import React from 'react';
import { PlatformColor, View } from 'react-native';
import { useMMKV } from 'react-native-mmkv';
import DragAndDropList from './components/DragAndDropList';

//

type SortedRecurringPlannerProps = {
    recurringPlannerId: ERecurringPlannerKey;
};

const RecurringPlanner = ({ recurringPlannerId }: SortedRecurringPlannerProps) => {

    const recurringEventStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER_EVENT });

    const {
        onGetIsItemDeletingCallback: onGetIsItemDeleting,
        onToggleScheduleItemDeleteCallback: onToggleScheduleItemDelete
    } = useDeleteScheduler<IRecurringEvent>();

    const { eventIds } = useRecurringPlanner(recurringPlannerId);

    const { toolbarIcons, onShowEventTime } = useRecurringTextfield();

    const isWeekdayPlanner = recurringPlannerId === ERecurringPlannerKey.WEEKDAYS;

    return (
        <DragAndDropList<IRecurringEvent>
            listId={recurringPlannerId}
            fillSpace
            storage={recurringEventStorage}
            itemIds={eventIds}
            storageId={EStorageId.RECURRING_PLANNER_EVENT}
            toolbarIconSet={toolbarIcons}
            emptyLabelConfig={{
                label: `No recurring ${isWeekdayPlanner ? 'weekday' : recurringPlannerId} plans`,
                className: 'flex-1'
            }}
            onCreateItem={generateNewRecurringEventAndSaveToStorage}
            onIndexChange={updateRecurringEventIndexWithChronologicalCheck}
            onValueChange={updateRecurringEventValueWithCloningAndSmartTimeDetect}
            onSaveToExternalStorage={isWeekdayPlanner ? updateWeekdayPlannersWithWeekdayEvent : undefined}
            onDeleteItem={(event) => deleteRecurringEventsFromStorageHideWeekday([event])}
            onGetRightIconConfig={(event) => generateRecurringEventTimeIconConfig(event, onShowEventTime)}
            onGetLeftIconConfig={(item) => generateCheckboxIconConfig(onGetIsItemDeleting(item), onToggleScheduleItemDelete)}
        />
    );
};

export default RecurringPlanner;