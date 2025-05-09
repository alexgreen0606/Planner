import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { RecurringPlannerKeys } from '../../../src/feature/recurringPlanner/constants';
import globalStyles from '../../../src/theme/globalStyles';
import GenericIcon from '../../../src/foundation/components/GenericIcon';
import RecurringWeekdayPlanner from '../../../src/feature/recurringPlanner/components/RecurringWeekdayPlanner';
import RecurringPlanner from '../../../src/feature/recurringPlanner/components/RecurringPlanner';
import PopoverList from '../../../src/foundation/components/PopoverList';

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
            <View style={[
                globalStyles.spacedApart,
                styles.dropdownContainer
            ]} >
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

const styles = StyleSheet.create({
    dropdownContainer: {
        paddingVertical: 8,
        paddingHorizontal: 16
    }
});

export default RecurringPlanners;
