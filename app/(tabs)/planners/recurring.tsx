import GenericIcon from '@/components/GenericIcon';
import PopoverList from '@/components/PopoverList';
import React, { useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';

import { ERecurringPlannerKeys } from '@/enums/ERecurringPlannerKeys';
import RecurringPlanner from '@/components/recurringPlanner/RecurringPlanner';
import RecurringWeekdayPlanner from '@/components/recurringPlanner/RecurringWeekdayPlanner';

type RecurringOption = {
    label: string;
    value: ERecurringPlannerKeys;
}

const RecurringPlanners = () => {
    const recurringPlannerOptions = useMemo(() => {
        return Object.entries(ERecurringPlannerKeys).map(([value, label]) => {
            return { label, value: value as ERecurringPlannerKeys }
        })
    }, []);

    const [recurringModalOpen, setRecurringModalOpen] = useState(false);
    const [selectedRecurring, setSelectedRecurring] = useState(ERecurringPlannerKeys.WEEKDAYS);

    function toggleRecurringModalOpen() {
        setRecurringModalOpen(curr => !curr);
    }

    return (
        <View
            className='flex-1'
            style={{ backgroundColor: PlatformColor('systemBackground') }}
        >

            {/* Recurring Planner Selection */}
            <View className='p-4' >
                <PopoverList<RecurringOption>
                    getLabelFromObject={(set) => set.label}
                    options={recurringPlannerOptions}
                    onChange={(newSet) => setSelectedRecurring(newSet.value)}
                />
            </View>

            {/* Recurring Planner Events */}
            {selectedRecurring === ERecurringPlannerKeys.WEEKDAYS ?
                <RecurringWeekdayPlanner key='weekday-recurring-planner' /> :
                <RecurringPlanner plannerKey={selectedRecurring} />
            }

        </View>
    );
};

export default RecurringPlanners;
