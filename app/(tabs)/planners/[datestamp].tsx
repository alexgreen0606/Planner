import Planner from '@/components/lists/Planner';
import { PageProvider } from '@/providers/PageProvider';
import { useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from "@react-navigation/elements";
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ✅ 

const PlannerPage = () => {
    const { datestamp } = useLocalSearchParams<{ datestamp: string }>();
    const { top: TOP_SPACER } = useSafeAreaInsets();
    const height = useHeaderHeight();
    return (
        <PageProvider additionalHeaderHeight={height - TOP_SPACER}>
            <Planner datestamp={datestamp} />
        </PageProvider>
    )
};

export default PlannerPage;