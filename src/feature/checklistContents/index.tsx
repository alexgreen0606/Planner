import { EItemStatus } from '@/enums/EItemStatus';
import { LISTS_STORAGE_ID } from '@/feature/checklists/constants';
import SortableList from '@/feature/sortedList';
import { generateCheckboxIconConfig } from '@/feature/sortedList/commonProps';
import useSortedList from '@/feature/sortedList/hooks/useSortedList';
import { isItemTextfield } from '@/feature/sortedList/utils';
import { useDeleteScheduler } from '@/services/DeleteScheduler';
import { IChecklist } from '@/types/checklists/IChecklist';
import { IListItem } from '@/types/listItems/core/TListItem';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

const Checklist = () => {
    
    const { checklistId } = useLocalSearchParams<{ checklistId: string }>();

    const { isItemDeleting } = useDeleteScheduler();

    function getItemsFromStorageObject(storageObject: IChecklist) {
        return storageObject.items;
    }

    function setItemsInStorageObject(newItems: IListItem[], currentObject: IChecklist) {
        return { ...currentObject, items: newItems };
    }

    const SortedItems = useSortedList<IListItem, IChecklist>({
        storageId: LISTS_STORAGE_ID,
        storageKey: checklistId,
        getItemsFromStorageObject,
        setItemsInStorageObject
    });

    return (
        <SortableList<IListItem, never, never>
            listId={checklistId}
            fillSpace
            items={SortedItems.items}
            onDragEnd={SortedItems.persistItemToStorage}
            onContentClick={SortedItems.toggleItemEdit}
            onDeleteItem={SortedItems.deleteSingleItemFromStorage}
            getTextfieldKey={item => `${item.id}-${item.sortId}`}
            getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedItems.toggleItemDelete, isItemDeleting(item))}
            onSaveTextfield={(updatedItem) => {
                const item = {
                    ...updatedItem,
                    status: isItemTextfield(updatedItem) ? EItemStatus.STATIC : updatedItem.status
                };
                SortedItems.persistItemToStorage(item);
            }}
            emptyLabelConfig={{
                label: "It's a ghost town in here.",
                className: 'flex-1'
            }}
        />
    );
};

export default Checklist;