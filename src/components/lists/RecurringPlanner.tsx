import useRecurringPlanner from '@/hooks/useRecurringPlanner';
import { ERecurringPlannerId } from '@/lib/enums/ERecurringPlannerKey';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { createRecurringEventInStorageAndFocusTextfield, createRecurringEventTimeIconConfig, deleteRecurringEventsFromStorageHideWeekday, updateWeekdayPlannersWithWeekdayEvent } from '@/utils/recurringPlannerUtils';
import React from 'react';
import { useMMKV } from 'react-native-mmkv';
import DragAndDropList from './components/DragAndDropList';

// ✅ 

type SortedRecurringPlannerProps = {
    recurringPlannerId: ERecurringPlannerId;
};

const RecurringPlanner = ({ recurringPlannerId }: SortedRecurringPlannerProps) => {
    const recurringEventStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER_EVENT });

    const {
        onGetIsItemDeletingCallback: onGetIsItemDeleting,
        onToggleScheduleItemDeleteCallback: onToggleScheduleItemDelete
    } = useDeleteScheduler<IRecurringEvent>();

    const {
        eventIds,
        toolbarIcons,
        onShowEventTime,
        onUpdateRecurringEventIndexWithChronologicalCheck,
        onUpdateRecurringEventValueWithTimeParsing
    } = useRecurringPlanner(recurringPlannerId, recurringEventStorage);

    const isWeekdayPlanner = recurringPlannerId === ERecurringPlannerId.WEEKDAYS;

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
            onCreateItem={createRecurringEventInStorageAndFocusTextfield}
            onIndexChange={onUpdateRecurringEventIndexWithChronologicalCheck}
            onValueChange={onUpdateRecurringEventValueWithTimeParsing}
            onSaveToExternalStorage={isWeekdayPlanner ? updateWeekdayPlannersWithWeekdayEvent : undefined}
            onDeleteItem={(event) => deleteRecurringEventsFromStorageHideWeekday([event])}
            onGetRightIconConfig={(event) => createRecurringEventTimeIconConfig(event, onShowEventTime)}
            onGetLeftIconConfig={(item) => generateCheckboxIconConfig(onGetIsItemDeleting(item), onToggleScheduleItemDelete)}
        />
    );
};

export default RecurringPlanner;