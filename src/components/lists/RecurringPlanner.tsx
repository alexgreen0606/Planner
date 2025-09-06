import useListItemToggle from '@/hooks/useListItemToggle';
import useRecurringPlanner from '@/hooks/useRecurringPlanner';
import { ERecurringPlannerId } from '@/lib/enums/ERecurringPlannerKey';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';
import { createRecurringEventInStorageAndFocusTextfield, createRecurringEventTimeIcon, deleteRecurringEventsFromStorageHideWeekday, upsertWeekdayEventToRecurringPlanners } from '@/utils/recurringPlannerUtils';
import { MenuAction, MenuView } from '@react-native-menu/menu';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useMMKV } from 'react-native-mmkv';
import ButtonText from '../text/ButtonText';
import DragAndDropList from './components/DragAndDropList';

// ✅ 

const RecurringPlanner = () => {
    const recurringEventStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER_EVENT });

    const [recurringPlannerId, setRecurringPlannerId] = useState<ERecurringPlannerId>(ERecurringPlannerId.WEEKDAYS);

    const recurringPlannerOptions = useMemo(() =>
        Object.values(ERecurringPlannerId).map((title) => ({
            id: title,
            title,
            titleColor: 'blue',
            state: recurringPlannerId === title ? 'on' : 'off',
        })),
        [recurringPlannerId]
    );

    const {
        eventIds,
        OverflowIcon,
        onUpdateRecurringEventIndexWithChronologicalCheck,
        onUpdateRecurringEventValueWithTimeParsing
    } = useRecurringPlanner(recurringPlannerId, recurringEventStorage);

    const isWeekdayPlanner = recurringPlannerId === ERecurringPlannerId.WEEKDAYS;

    return (
        <View className='flex-1'>
            <View className='px-3 pt-3 flex-row justify-between'>
                <MenuView
                    onPressAction={({ nativeEvent }) => {
                        setRecurringPlannerId(nativeEvent.event as ERecurringPlannerId)
                    }}
                    actions={recurringPlannerOptions as MenuAction[]}
                    shouldOpenOnLongPress={false}
                >
                    <ButtonText>
                        {recurringPlannerId}
                    </ButtonText>
                </MenuView>
                <OverflowIcon />
            </View>
            <DragAndDropList<IRecurringEvent>
                listId={recurringPlannerId}
                fillSpace
                storage={recurringEventStorage}
                itemIds={eventIds}
                storageId={EStorageId.RECURRING_PLANNER_EVENT}
                emptyLabelConfig={{
                    label: `No recurring ${isWeekdayPlanner ? 'weekday' : recurringPlannerId} plans`,
                    className: 'flex-1'
                }}
                onCreateItem={createRecurringEventInStorageAndFocusTextfield}
                onIndexChange={onUpdateRecurringEventIndexWithChronologicalCheck}
                onValueChange={onUpdateRecurringEventValueWithTimeParsing}
                onSaveToExternalStorage={isWeekdayPlanner ? upsertWeekdayEventToRecurringPlanners : undefined}
                onDeleteItem={(event) => deleteRecurringEventsFromStorageHideWeekday([event])}
                onGetRightIcon={createRecurringEventTimeIcon}
                onGetLeftIcon={useListItemToggle}
            />
        </View>
    )
};

export default RecurringPlanner;