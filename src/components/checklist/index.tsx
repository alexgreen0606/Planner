import { CHECKLISTS_STORAGE_ID } from '@/lib/constants/storage';
import { useDeleteScheduler } from '@/hooks/useDeleteScheduler';
import useSortedList from '@/hooks/useSortedList';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import SortableList from '../sortedList';
import { IChecklist } from '@/lib/types/checklists/IChecklist';
import { IListItem } from '@/lib/types/listItems/core/TListItem';

const Checklist = () => {

    const { checklistId } = useLocalSearchParams<{ checklistId: string }>();

    const { isItemDeleting } = useDeleteScheduler<IListItem>();

    function getItemsFromStorageObject(storageObject: IChecklist) {
        return storageObject.items;
    }

    function setItemsInStorageObject(newItems: IListItem[], currentObject: IChecklist) {
        return { ...currentObject, items: newItems };
    }

    const SortedItems = useSortedList<IListItem, IChecklist>({
        storageId: CHECKLISTS_STORAGE_ID,
        storageKey: checklistId,
        getItemsFromStorageObject,
        setItemsInStorageObject
    });

    return (
        <SortableList<IListItem>
            listId={checklistId}
            fillSpace
            items={SortedItems.items}
            onDragEnd={SortedItems.persistItemToStorage}
            onContentClick={SortedItems.toggleItemEdit}
            onDeleteItem={SortedItems.deleteSingleItemFromStorage}
            getTextfieldKey={item => `${item.id}-${item.sortId}`}
            getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedItems.toggleItemDelete, isItemDeleting(item))}
            saveTextfieldAndCreateNew={SortedItems.saveTextfieldAndCreateNew}
            emptyLabelConfig={{
                label: "It's a ghost town in here.",
                className: 'flex-1'
            }}
        />
    );
};

export default Checklist;