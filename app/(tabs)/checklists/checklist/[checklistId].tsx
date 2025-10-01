import Checklist from '@/components/lists/Checklist';
import { NULL } from '@/lib/constants/generic';
import { ScrollPageProvider } from '@/providers/ScrollPageProvider';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

// ✅ 

type TChecklistParams = {
    checklistId: string;
};

const ChecklistPage = () => {
    const { checklistId } = useLocalSearchParams<TChecklistParams>();
    return (
        <ScrollPageProvider>
            <Checklist checklistId={checklistId ?? NULL} />
        </ScrollPageProvider>
    )
};

export default ChecklistPage;