import PopoverList from '@/components/PopoverList';
import React, { useEffect, useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';

import RecurringPlanner from '@/components/recurringPlanner/RecurringPlanner';
import RecurringWeekdayPlanner from '@/components/recurringPlanner/RecurringWeekdayPlanner';
import { ERecurringPlannerKey } from '@/enums/ERecurringPlannerKey';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { useScrollContainer } from '@/services/ScrollContainer';
import { IRecurringEvent } from '@/types/listItems/IRecurringEvent';

type RecurringOption = {
    label: string;
    value: ERecurringPlannerKey;
}

const RecurringPlanners = () => {
    const { setUpperContentHeight } = useScrollContainer();
    const [_, setTextfieldItem] = useTextfieldItemAs<IRecurringEvent>();


    const recurringPlannerOptions = useMemo(() => {
        return Object.entries(ERecurringPlannerKey).map(([key]) => {
            return { label: key, value: key }
        })
    }, []);

    useEffect(() => {
        setUpperContentHeight(0);

        return () => setTextfieldItem(null); // TODO: save the item instead
    }, [])

    const [recurringModalOpen, setRecurringModalOpen] = useState(false);
    const [selectedRecurring, setSelectedRecurring] = useState<string>(ERecurringPlannerKey.WEEKDAYS);

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
                <PopoverList
                    options={Object.values(ERecurringPlannerKey)}
                    value={selectedRecurring}
                    setValue={() => null}
                    onChange={(newSet) => setSelectedRecurring(newSet)}
                />
            </View>

            {/* Recurring Planner Events */}
            {selectedRecurring === ERecurringPlannerKey.WEEKDAYS ?
                <RecurringWeekdayPlanner key='weekday-recurring-planner' /> :
                <RecurringPlanner weekday={selectedRecurring} />
            }

        </View>
    );
};

export default RecurringPlanners;
