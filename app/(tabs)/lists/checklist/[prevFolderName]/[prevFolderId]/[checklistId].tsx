import { EFolderItemType } from '@/enums/EFolderItemType';
import Checklist from '@/feature/checklistContents';
import FolderItemBanner from '@/feature/checklists/components/FolderItemBanner';
import { ScrollContainerProvider } from '@/services/ScrollContainer';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { PlatformColor, View } from 'react-native';

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