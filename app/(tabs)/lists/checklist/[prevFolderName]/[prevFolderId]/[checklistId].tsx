import FolderItemBanner from '@/feature/checklists/components/FolderItemBanner';
import { LISTS_STORAGE_ID } from '@/feature/checklists/constants';
import { Checklist, FolderItemTypes } from '@/feature/checklists/types';
import { generateCheckboxIconConfig } from '@/foundation/sortedLists/commonProps';
import SortableList from '@/foundation/sortedLists/components/list/SortableList';
import { ItemStatus } from '@/foundation/sortedLists/constants';
import useSortedList from '@/foundation/sortedLists/hooks/useSortedList';
import { useDeleteScheduler } from '@/foundation/sortedLists/services/DeleteScheduler';
import { ScrollContainerProvider } from '@/foundation/sortedLists/services/ScrollContainerProvider';
import { ListItem } from '@/foundation/sortedLists/types';
import { isItemTextfield } from '@/foundation/sortedLists/utils';
import globalStyles from '@/theme/globalStyles';
import { LISTS_STACK_ID } from 'app/(tabs)/lists';
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