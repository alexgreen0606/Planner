import PlannerHeader from '@/components/headers/PlannerHeader';
import Planner from '@/components/lists/Planner';
import { PLANNER_CAROUSEL_HEIGHT } from '@/lib/constants/miscLayout';
import { PageProvider } from '@/providers/PageProvider';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ✅ 

const PlannerPage = () => {
    const { datestamp } = useLocalSearchParams<{ datestamp: string }>();
    const { top: TOP_SPACER } = useSafeAreaInsets();
    return (
        <PageProvider
            hasStickyHeader
            scrollContentAbsoluteTop={TOP_SPACER + PLANNER_CAROUSEL_HEIGHT}
            emptyPageLabelProps={{ label: 'No plans' }}
        >
            <PlannerHeader datestamp={datestamp} />
            <Planner datestamp={datestamp} />
        </PageProvider>
    )
};

export default PlannerPage;