import RecurringPlanner from '@/components/recurringPlanner/RecurringPlanner';
import ButtonText from '@/components/text/ButtonText';
import { ERecurringPlannerKey } from '@/enums/ERecurringPlannerKey';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { IRecurringEvent } from '@/types/listItems/IRecurringEvent';
import { MenuAction, MenuView } from '@react-native-menu/menu';
import React, { useEffect, useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';

const RecurringPlanners = () => {
    const [_, setTextfieldItem] = useTextfieldItemAs<IRecurringEvent>();

    const [selectedRecurring, setSelectedRecurring] = useState<ERecurringPlannerKey>(ERecurringPlannerKey.WEEKDAYS);

    const recurringPlannerOptions = useMemo(() =>
        Object.values(ERecurringPlannerKey).map((title) => ({
            id: title,
            title,
            titleColor: 'blue',
            state: selectedRecurring === title ? 'on' : 'off',
        })), 
        [selectedRecurring]
    );

    useEffect(() => {
        return () => setTextfieldItem(null); // TODO: save the item instead
    }, []);

    return (
        <View
            className='flex-1'
            style={{ backgroundColor: PlatformColor('systemBackground') }}
        >

            {/* Recurring Planner Selection */}
            <View className='p-4 flex-row' >
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
