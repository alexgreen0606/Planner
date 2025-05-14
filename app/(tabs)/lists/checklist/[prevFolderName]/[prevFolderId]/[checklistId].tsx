import FolderItemBanner from '@/feature/checklists/components/FolderItemBanner';
import { LISTS_STORAGE_ID } from '@/feature/checklists/constants';
import { Checklist, FolderItemTypes } from '@/feature/checklists/types';
import SortableList from '@/feature/sortedList';
import { generateCheckboxIconConfig } from '@/feature/sortedList/commonProps';
import { ItemStatus } from '@/feature/sortedList/constants';
import useSortedList from '@/feature/sortedList/hooks/useSortedList';
import { useDeleteScheduler } from '@/feature/sortedList/services/DeleteScheduler';
import { ScrollContainerProvider } from '@/feature/sortedList/services/ScrollContainerProvider';
import { ListItem } from '@/feature/sortedList/types';
import { isItemTextfield } from '@/feature/sortedList/utils';
import globalStyles from '@/theme/globalStyles';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

const ChecklistScreen = () => {
    const { checklistId, prevFolderName, prevFolderId } = useLocalSearchParams<{
        checklistId: string,
        prevFolderName: string,
        prevFolderId: string
    }>();

    const { isItemDeleting } = useDeleteScheduler();

    function getItemsFromStorageObject(storageObject: Checklist) {
        return storageObject.items;
    }

    function setItemsInStorageObject(newItems: ListItem[], currentObject: Checklist) {
        return { ...currentObject, items: newItems };
    }

    const SortedItems = useSortedList<ListItem, Checklist>({
        storageId: LISTS_STORAGE_ID,
        storageKey: checklistId,
        getItemsFromStorageObject,
        setItemsInStorageObject
    });

    return (
        <View style={globalStyles.blackFilledSpace}>
            <ScrollContainerProvider
                header={
                    <FolderItemBanner
                        itemId={checklistId}
                        backButtonConfig={{
                            pathname: `/lists/folder/${prevFolderName}/${prevFolderId}`,
                            label: prevFolderName
                        }}
                        itemType={FolderItemTypes.LIST}
                    />
                }
            >
                <SortableList<ListItem, never, never>
                    listId={checklistId}
                    items={SortedItems.items}
                    onDragEnd={SortedItems.persistItemToStorage}
                    onContentClick={SortedItems.toggleItemEdit}
                    onDeleteItem={SortedItems.deleteSingleItemFromStorage}
                    getTextfieldKey={item => `${item.id}-${item.sortId}`}
                    getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedItems.toggleItemDelete, isItemDeleting(item))}
                    onSaveTextfield={(updatedItem: ListItem) => {
                        const item = { ...updatedItem, status: isItemTextfield(updatedItem) ? ItemStatus.STATIC : updatedItem.status }
                        SortedItems.persistItemToStorage(item);
                    }}
                    emptyLabelConfig={{
                        label: "It's a ghost town in here.",
                        className: 'h-[500px]'
                    }}
                />
            </ScrollContainerProvider>
        </View>
    );
};

export default ChecklistScreen;