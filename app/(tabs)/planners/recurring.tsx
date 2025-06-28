import RecurringPlanner from '@/components/lists/RecurringPlanner';
import ButtonText from '@/components/text/ButtonText';
import { useTextfieldFallbackSave } from '@/hooks/useTextfieldFallbackSave';
import { ERecurringPlannerKey } from '@/lib/enums/ERecurringPlannerKey';
import { saveRecurringEvent, saveRecurringWeekdayEvent } from '@/storage/recurringPlannerStorage';
import { MenuAction, MenuView } from '@react-native-menu/menu';
import React, { useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';

const RecurringPlanners = () => {
    const [selectedRecurring, setSelectedRecurring] = useState<ERecurringPlannerKey>(ERecurringPlannerKey.WEEKDAYS);

    useTextfieldFallbackSave(
        selectedRecurring === ERecurringPlannerKey.WEEKDAYS ?
            saveRecurringWeekdayEvent : saveRecurringEvent
    );

    const recurringPlannerOptions = useMemo(() =>
        Object.values(ERecurringPlannerKey).map((title) => ({
            id: title,
            title,
            titleColor: 'blue',
            state: selectedRecurring === title ? 'on' : 'off',
        })),
        [selectedRecurring]
    );

    return (
        <View
            className='flex-1'
            style={{ backgroundColor: PlatformColor('systemBackground') }}
        >

            {/* Recurring Planner Selection */}
            <View className='p-2 flex-row'>
                <MenuView
                    onPressAction={({ nativeEvent }) => {
                        setSelectedRecurring(nativeEvent.event as ERecurringPlannerKey)
                    }}
                    actions={recurringPlannerOptions as MenuAction[]}
                    shouldOpenOnLongPress={false}
                >
                    <ButtonText>
                        {selectedRecurring}
                    </ButtonText>
                </MenuView>
            </View>

            {/* Recurring Planner Events */}
            <RecurringPlanner plannerKey={selectedRecurring} />

        </View>
    );
};

export default RecurringPlanners;
