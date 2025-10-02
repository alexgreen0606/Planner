import Checklist from '@/components/lists/Checklist';
import { NULL } from '@/lib/constants/generic';
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
        <PageProvider>
            <Checklist checklistId={checklistId ?? NULL} />
        </PageProvider>
    )
};

export default ChecklistPage;