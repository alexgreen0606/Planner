import useSortedList from '@/hooks/useSortedList';
import { EListType } from '@/lib/enums/EListType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IChecklist } from '@/lib/types/checklists/IChecklist';
import { IListItem } from '@/lib/types/listItems/core/TListItem';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { saveChecklistItem } from '@/storage/checklistsStorage';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback } from 'react';
import SortableList from './components/SortableList';

const Checklist = () => {
    const { checklistId } = useLocalSearchParams<{ checklistId: string }>();
    const { getIsItemDeleting, toggleScheduleItemDelete } = useDeleteScheduler<IListItem>();

    const listType = EListType.CHECKLIST;

    const getItemsFromStorageObject = useCallback(
        (storageObject: IChecklist) => storageObject.items,
        []
    );

    function setItemsInStorageObject(newItems: IListItem[], currentObject: IChecklist) {
        return { ...currentObject, items: newItems };
    }

    function toggleScheduleChecklistItemDelete(item: IListItem) {
        toggleScheduleItemDelete(item, listType);
    }

    const SortedItems = useSortedList<IListItem, IChecklist>({
        storageId: EStorageId.CHECKLISTS,
        storageKey: checklistId,
        getItemsFromStorageObject,
        saveItemToStorage: saveChecklistItem,
        listType
    });

    return (
        <SortableList<IListItem>
            listId={checklistId}
            fillSpace
            listType={listType}
            items={SortedItems.items}
            onDragEnd={SortedItems.persistItemToStorage}
            onContentClick={SortedItems.toggleItemEdit}
            getLeftIconConfig={(item) => generateCheckboxIconConfig(item, toggleScheduleChecklistItemDelete, getIsItemDeleting(item, listType))}
            saveTextfieldAndCreateNew={SortedItems.saveTextfieldAndCreateNew}
            emptyLabelConfig={{
                label: "It's a ghost town in here.",
                className: 'flex-1'
            }}
        />
    );
};

export default Checklist;