import RecurringPlanner from '@/components/lists/RecurringPlanner';
import ButtonText from '@/components/text/ButtonText';
import { useTextfieldFallbackSave } from '@/hooks/useTextfieldFallbackSave';
import { ERecurringPlannerId } from '@/lib/enums/ERecurringPlannerKey';
import { MenuAction, MenuView } from '@react-native-menu/menu';
import React, { useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';

//

const RecurringPlanners = () => {
    const [selectedRecurring, setSelectedRecurring] = useState<ERecurringPlannerId>(ERecurringPlannerId.WEEKDAYS);

    const recurringPlannerOptions = useMemo(() =>
        Object.values(ERecurringPlannerId).map((title) => ({
            id: title,
            title,
            titleColor: 'blue',
            state: selectedRecurring === title ? 'on' : 'off',
        })),
        [selectedRecurring]
    );

    // useTextfieldFallbackSave(
    //     selectedRecurring === ERecurringPlannerKey.WEEKDAYS ?
    //         upsertRecurringWeekdayEvent : upsertRecurringEvent
    // );

    return (
        <View
            className='flex-1'
            style={{ backgroundColor: PlatformColor('systemBackground') }}
        >

            {/* Recurring Planner Selection */}
            <View className='p-2 flex-row'>
                <MenuView
                    onPressAction={({ nativeEvent }) => {
                        setSelectedRecurring(nativeEvent.event as ERecurringPlannerId)
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
            <RecurringPlanner recurringPlannerId={selectedRecurring} />

        </View>
    );
};

export default RecurringPlanners;
