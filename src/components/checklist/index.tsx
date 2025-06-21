import { CHECKLISTS_STORAGE_ID } from '@/lib/constants/storage';
import useSortedList from '@/hooks/useSortedList';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback } from 'react';
import SortableList from '../sortedList';
import { IChecklist } from '@/lib/types/checklists/IChecklist';
import { IListItem } from '@/lib/types/listItems/core/TListItem';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { EListType } from '@/lib/enums/EListType';

const Checklist = () => {
    const { checklistId } = useLocalSearchParams<{ checklistId: string }>();
    const { getIsItemDeleting } = useDeleteScheduler<IListItem>();

    const deleteFunctionKey = EListType.CHECKLIST;

    const getItemsFromStorageObject = useCallback(
        (storageObject: IChecklist) => storageObject.items,
        []
    );

    function setItemsInStorageObject(newItems: IListItem[], currentObject: IChecklist) {
        return { ...currentObject, items: newItems };
    }

    const SortedItems = useSortedList<IListItem, IChecklist>({
        storageId: CHECKLISTS_STORAGE_ID,
        storageKey: checklistId,
        getItemsFromStorageObject,
        setItemsInStorageObject,
        toggleDeleteFunctionKey: deleteFunctionKey
    });

    return (
        <SortableList<IListItem>
            listId={checklistId}
            fillSpace
            deleteFunctionKey={deleteFunctionKey}
            items={SortedItems.items}
            onDragEnd={SortedItems.persistItemToStorage}
            onContentClick={SortedItems.toggleItemEdit}
            onDeleteItem={SortedItems.deleteSingleItemFromStorage}
            getTextfieldKey={item => `${item.id}-${item.sortId}`}
            getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedItems.toggleItemDelete, getIsItemDeleting(item, deleteFunctionKey))}
            saveTextfieldAndCreateNew={SortedItems.saveTextfieldAndCreateNew}
            emptyLabelConfig={{
                label: "It's a ghost town in here.",
                className: 'flex-1'
            }}
        />
    );
};

export default Checklist;