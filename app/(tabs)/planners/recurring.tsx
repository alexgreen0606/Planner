import GenericIcon from '@/components/GenericIcon';
import PopoverList from '@/components/PopoverList';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import RecurringPlanner from '../../../src/feature/recurringPlanner/components/RecurringPlanner';
import RecurringWeekdayPlanner from '../../../src/feature/recurringPlanner/components/RecurringWeekdayPlanner';
import { RecurringPlannerKeys } from '../../../src/feature/recurringPlanner/constants';
import globalStyles from '../../../src/theme/globalStyles';

type RecurringOption = {
    label: string;
    value: RecurringPlannerKeys;
}

const RecurringPlanners = () => {
    const recurringPlannerOptions = useMemo(() => {
        return Object.entries(RecurringPlannerKeys).map(([value, label]) => {
            return { label, value: value as RecurringPlannerKeys }
        })
    }, []);

    const [recurringModalOpen, setRecurringModalOpen] = useState(false);
    const [selectedRecurring, setSelectedRecurring] = useState(RecurringPlannerKeys.WEEKDAYS);

    function toggleRecurringModalOpen() {
        setRecurringModalOpen(curr => !curr);
    }

    return (
        <View style={globalStyles.blackFilledSpace}>

            {/* Recurring Planner Selection */}
            <View className='py-8 px-16 flex-row justify-between items-center w-full' >
                <PopoverList<RecurringOption>
                    getLabelFromObject={(set) => set.label}
                    options={recurringPlannerOptions}
                    onChange={(newSet) => setSelectedRecurring(newSet.value)}
                />
                <GenericIcon
                    type='add'
                    platformColor='systemBlue'
                    onClick={toggleRecurringModalOpen}
                />
            </View>

            {/* Recurring Planner Events */}
            {selectedRecurring === RecurringPlannerKeys.WEEKDAYS ?
                <RecurringWeekdayPlanner key='weekday-recurring-planner' /> :
                <RecurringPlanner plannerKey={selectedRecurring} />
            }

        </View>
    );
};

export default RecurringPlanners;
