import useListItemToggle from '@/hooks/useListItemToggle';
import useRecurringPlanner from '@/hooks/useRecurringPlanner';
import { ERecurringPlannerId } from '@/lib/enums/ERecurringPlannerKey';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';
import { createRecurringEventInStorageAndFocusTextfield, createRecurringEventTimeIcon, deleteRecurringEventsFromStorageHideWeekday, upsertEventToWeekdayPlanners } from '@/utils/recurringPlannerUtils';
import React from 'react';
import { useMMKV } from 'react-native-mmkv';
import DragAndDropList from './components/DragAndDropList';

// ✅ 

type TSortedRecurringPlannerProps = {
    recurringPlannerId: ERecurringPlannerId;
};

const RecurringPlanner = ({ recurringPlannerId }: TSortedRecurringPlannerProps) => {
    const recurringEventStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER_EVENT });

    const {
        eventIds,
        toolbarIcons,
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
            onSaveToExternalStorage={isWeekdayPlanner ? upsertEventToWeekdayPlanners : undefined}
            onDeleteItem={(event) => deleteRecurringEventsFromStorageHideWeekday([event])}
            onGetRightIcon={createRecurringEventTimeIcon}
            onGetLeftIcon={useListItemToggle}
        />
    )
};

export default RecurringPlanner;