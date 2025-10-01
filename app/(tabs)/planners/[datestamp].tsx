import PlannerHeader from '@/components/headers/PlannerHeader';
import Planner from '@/components/lists/Planner';
import { ScrollPageProvider } from '@/providers/ScrollPageProvider';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

// ✅ 

const PlannerPage = () => {
    const { datestamp } = useLocalSearchParams<{ datestamp: string }>();
    return (
        <ScrollPageProvider>
            <PlannerHeader isSpacer datestamp={datestamp}/>
            <Planner datestamp={datestamp} />
        </ScrollPageProvider>
    )
};

export default PlannerPage;