import { CHECKLISTS_STORAGE_ID } from '@/constants/storageIds';
import { EItemStatus } from '@/enums/EItemStatus';
import useSortedList from '@/hooks/useSortedList';
import { generateCheckboxIconConfig, isItemTextfield } from '@/utils/listUtils';
import { IChecklist } from '@/types/checklists/IChecklist';
import { IListItem } from '@/types/listItems/core/TListItem';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import SortableList from '../sortedList';
import { useDeleteScheduler } from '@/hooks/useDeleteScheduler';

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
        <SortableList<IListItem, never, never>
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