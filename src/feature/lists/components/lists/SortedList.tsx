import React from 'react';
import useSortedList from '../../../../foundation/sortedLists/hooks/useSortedList';
import { isItemDeleting, isItemTextfield, ItemStatus, ListItem } from '../../../../foundation/sortedLists/sortedListUtils';
import { LISTS_STORAGE_ID, List } from '../../listUtils';
import SortableList from '../../../../foundation/sortedLists/components/list/SortableList';
import { Color } from '../../../../foundation/theme/colors';

interface SortableListProps {
    listId: string;
};

const SortedList = ({
    listId,
}: SortableListProps) => {

    // Stores the current list and all handler functions to update it
    const SortedItems = useSortedList<ListItem, List>(
        listId,
        LISTS_STORAGE_ID,
        (storageObject: List) => storageObject.items,
        (newItems: ListItem[], currentObject: List) => ({ ...currentObject, items: newItems }),
    );

    return (
        <SortableList<ListItem, never, never>
            listId={listId}
            items={SortedItems.items}
            onDragEnd={SortedItems.persistItemToStorage}
            onSaveTextfield={(updatedItem: ListItem) => {
                const item = { ...updatedItem, status: isItemTextfield(updatedItem) ? ItemStatus.STATIC : updatedItem.status }
                SortedItems.persistItemToStorage(item);
            }}
            onContentClick={SortedItems.toggleItemEdit}
            onDeleteItem={SortedItems.deleteItemFromStorage}
            getTextfieldKey={item => `${item.id}-${item.sortId}`}
            getLeftIconConfig={item => ({
                icon: {
                    type: isItemDeleting(item) ? 'circle-filled' : 'circle',
                    color: isItemDeleting(item) ? Color.BLUE : Color.DIM
                },
                onClick: SortedItems.toggleItemDelete
            })}
            emptyLabelConfig={{
                label: "It's a ghost town in here.",
                iconConfig: {
                    type: 'ghost',
                    size: 20,
                    color: Color.DIM,
                },
                style: { height: 500 }
            }}
        />
    );
};

export default SortedList;