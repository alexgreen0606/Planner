import FolderItemBanner from '@/components/banner/FolderItemBanner';
import Checklist from '@/components/lists/Checklist';
import { PageProvider } from '@/providers/PageProvider';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

// ✅ 

type TChecklistParams = {
    checklistId: string,
    prevFolderName: string
};

const ChecklistScreen = () => {
    const { checklistId, prevFolderName } = useLocalSearchParams<TChecklistParams>();
    return (
        <PageProvider floatingHeader={
            <FolderItemBanner
                itemId={checklistId}
                backButtonConfig={{
                    label: prevFolderName
                }}
            />
        }>
            <Checklist />
        </PageProvider>
    )
};

export default ChecklistScreen;