import PopoverList from '@/components/PopoverList';
import React, { useEffect, useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';

import RecurringPlanner from '@/components/recurringPlanner/RecurringPlanner';
import RecurringWeekdayPlanner from '@/components/recurringPlanner/RecurringWeekdayPlanner';
import { ERecurringPlannerKeys } from '@/enums/ERecurringPlannerKeys';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { useScrollContainer } from '@/services/ScrollContainer';
import { IRecurringEvent } from '@/types/listItems/IRecurringEvent';

type RecurringOption = {
    label: string;
    value: ERecurringPlannerKeys;
}

const RecurringPlanners = () => {
    const { setUpperContentHeight } = useScrollContainer();
    const [_, setTextfieldItem] = useTextfieldItemAs<IRecurringEvent>();


    const recurringPlannerOptions = useMemo(() => {
        return Object.entries(ERecurringPlannerKeys).map(([value, label]) => {
            return { label, value: value as ERecurringPlannerKeys }
        })
    }, []);

    useEffect(() => {
        setUpperContentHeight(0);

        return () => setTextfieldItem(null); // TODO: save the item instead
    }, [])

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
                    value={{
                        label: '',
                        value: ERecurringPlannerKeys.WEEKDAYS
                    }}
                    setValue={() => null}
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
