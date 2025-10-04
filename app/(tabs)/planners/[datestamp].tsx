import PlannerHeader from '@/components/headers/PlannerHeader';
import Planner from '@/components/lists/Planner';
import { PageProvider } from '@/providers/PageProvider';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

// ✅ 

const PlannerPage = () => {
    const { datestamp } = useLocalSearchParams<{ datestamp: string }>();
    return (
        <PageProvider hasStickyHeader emptyPageLabelProps={{ label: 'No plans' }}>
            <PlannerHeader datestamp={datestamp} />
            <Planner datestamp={datestamp} />
        </PageProvider>
    )
};

export default PlannerPage;