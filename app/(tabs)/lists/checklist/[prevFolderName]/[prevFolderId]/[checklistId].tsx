import FolderItemBanner from '@/components/banners/FolderItemBanner';
import Checklist from '@/components/lists/Checklist';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { ScrollContainerProvider } from '@/providers/ScrollContainer';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { PlatformColor, View } from 'react-native';

// ✅ 

const ChecklistScreen = () => {
    const { checklistId, prevFolderName } = useLocalSearchParams<{
        checklistId: string,
        prevFolderName: string
    }>();

    return (
        <View
            className='flex-1'
            style={{ backgroundColor: PlatformColor('systemBackground') }}
        >
            <ScrollContainerProvider
                header={
                    <FolderItemBanner
                        itemId={checklistId}
                        backButtonConfig={{
                            label: prevFolderName
                        }}
                        itemType={EFolderItemType.LIST}
                    />
                }
            >
                <Checklist />
            </ScrollContainerProvider>
        </View>
    );
};

export default ChecklistScreen;