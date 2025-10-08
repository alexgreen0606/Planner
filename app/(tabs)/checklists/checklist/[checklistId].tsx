import Checklist from '@/components/lists/Checklist';
import { PageProvider } from '@/providers/PageProvider';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

// ✅ 

type TChecklistParams = {
    checklistId: string;
};

const ChecklistPage = () => {
    const { checklistId } = useLocalSearchParams<TChecklistParams>();
    return (
        <PageProvider emptyPageLabelProps={{ label: 'All items complete' }}>
            <Checklist checklistId={checklistId} />
        </PageProvider>
    )
};

export default ChecklistPage;