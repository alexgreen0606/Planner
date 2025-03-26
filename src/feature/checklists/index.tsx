import React from 'react';
import useSortedList from '../../foundation/sortedLists/hooks/useSortedList';
import { isItemTextfield } from '../../foundation/sortedLists/utils';
import { Checklist } from './types';
import SortableList from '../../foundation/sortedLists/components/list/SortableList';
import { generateCheckboxIconConfig } from '../../foundation/sortedLists/commonProps';
import { ListItem } from '../../foundation/sortedLists/types';
import { useSortableList } from '../../foundation/sortedLists/services/SortableListProvider';
import { ItemStatus } from '../../foundation/sortedLists/constants';
import { LISTS_STORAGE_ID } from './constants';
import { useDeleteScheduler } from '../../foundation/sortedLists/services/DeleteScheduler';

interface SortableListProps {
    listId: string;
};

const ChecklistList = ({
    listId,
}: SortableListProps) => {
    const { isItemDeleting } = useDeleteScheduler();

    function getItemsFromStorageObject(storageObject: Checklist) {
        return storageObject.items;
    }

    function setItemsInStorageObject(newItems: ListItem[], currentObject: Checklist) {
        return { ...currentObject, items: newItems };
    }

    const SortedItems = useSortedList<ListItem, Checklist>({
        storageId: LISTS_STORAGE_ID,
        storageKey: listId,
        getItemsFromStorageObject,
        setItemsInStorageObject
    });

    return (
        <SortableList<ListItem, never, never>
            listId={listId}
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
    );
};

export default ChecklistList;