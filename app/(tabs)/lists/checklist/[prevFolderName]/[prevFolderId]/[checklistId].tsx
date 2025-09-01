import FolderItemBanner from '@/components/banners/FolderItemBanner';
import Checklist from '@/components/lists/Checklist';
import { ScrollContainerProvider } from '@/providers/ScrollContainer';
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
        <ScrollContainerProvider header={
            <FolderItemBanner
                itemId={checklistId}
                backButtonConfig={{
                    label: prevFolderName
                }}
            />
        }>
            <Checklist />
        </ScrollContainerProvider>
    )
};

export default ChecklistScreen;