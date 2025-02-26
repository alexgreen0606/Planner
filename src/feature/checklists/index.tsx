import React from 'react';
import useSortedList from '../../foundation/sortedLists/hooks/useSortedList';
import { isItemTextfield} from '../../foundation/sortedLists/utils';
import { LISTS_STORAGE_ID, Checklist } from './types';
import SortableList from '../../foundation/sortedLists/components/list/SortableList';
import { generateCheckboxIconConfig } from '../../foundation/sortedLists/commonProps';
import { ItemStatus, ListItem } from '../../foundation/sortedLists/types';

interface SortableListProps {
    listId: string;
};

const ChecklistList = ({
    listId,
}: SortableListProps) => {

    // Stores the current list and all handler functions to update it
    const SortedItems = useSortedList<ListItem, Checklist>(
        listId,
        LISTS_STORAGE_ID,
        (storageObject: Checklist) => storageObject.items,
        (newItems: ListItem[], currentObject: Checklist) => ({ ...currentObject, items: newItems }),
    );

    return (
        <SortableList<ListItem, never, never>
            listId={listId}
            items={SortedItems.items}
            onDragEnd={SortedItems.persistItemToStorage}
            onContentClick={SortedItems.toggleItemEdit}
            onDeleteItem={SortedItems.deleteItemFromStorage}
            getTextfieldKey={item => `${item.id}-${item.sortId}`}
            getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedItems.toggleItemDelete)}
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