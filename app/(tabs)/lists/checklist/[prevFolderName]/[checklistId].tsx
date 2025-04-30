import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Checklist, FolderItemTypes } from '../../../../../src/feature/checklists/types';
import { LISTS_STORAGE_ID } from '../../../../../src/feature/checklists/constants';
import { ScrollContainerProvider } from '../../../../../src/foundation/sortedLists/services/ScrollContainerProvider';
import globalStyles from '../../../../../src/foundation/theme/globalStyles';
import { useDeleteScheduler } from '../../../../../src/foundation/sortedLists/services/DeleteScheduler';
import { ListItem } from '../../../../../src/foundation/sortedLists/types';
import useSortedList from '../../../../../src/foundation/sortedLists/hooks/useSortedList';
import SortableList from '../../../../../src/foundation/sortedLists/components/list/SortableList';
import { generateCheckboxIconConfig } from '../../../../../src/foundation/sortedLists/commonProps';
import { isItemTextfield } from '../../../../../src/foundation/sortedLists/utils';
import { ItemStatus } from '../../../../../src/foundation/sortedLists/constants';
import FolderItemBanner from '../../../../../src/feature/checklists/components/FolderItemBanner';

const ChecklistScreen = () => {
    const { checklistId, prevFolderName } = useLocalSearchParams<{ checklistId: string, prevFolderName: string }>();

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
                            display: true,
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
                        style: { height: 500 }
                    }}
                />
            </ScrollContainerProvider>
        </View>
    );
};

export default ChecklistScreen;