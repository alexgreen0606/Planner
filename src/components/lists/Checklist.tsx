import useSortedList from '@/hooks/useSortedList';
import { EListType } from '@/lib/enums/EListType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IChecklist } from '@/lib/types/checklists/IChecklist';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { upsertChecklistItem } from '@/storage/checklistsStorage';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback } from 'react';
import DragAndDropList from './components/DragAndDropList';

// ✅ 

const Checklist = () => {
    const { handleGetIsItemDeleting: getIsItemDeleting, handleToggleScheduleItemDelete: toggleScheduleItemDelete } = useDeleteScheduler<TListItem>();
    const { checklistId } = useLocalSearchParams<{ checklistId: string }>();

    const listType = EListType.CHECKLIST;

    const getItemsFromStorageObject = useCallback(
        (storageObject: IChecklist) => storageObject.items,
        []
    );

    // ===================
    // 1. List Generation
    // ===================

    const SortedItems = useSortedList<TListItem, IChecklist>({
        storageId: EStorageId.CHECKLISTS,
        storageKey: checklistId,
        listType,
        onGetItemsFromStorageObject: getItemsFromStorageObject,
        onSaveItemToStorage: upsertChecklistItem,
    });

    // ======
    // 2. UI
    // ======

    return (
        <DragAndDropList<TListItem>
            listId={checklistId}
            fillSpace
            listType={listType}
            items={SortedItems.items}
            onDragEnd={SortedItems.saveItem}
            onContentClick={SortedItems.toggleItemEdit}
            onGetLeftIconConfig={(item) => generateCheckboxIconConfig(getIsItemDeleting(item, listType), toggleScheduleItemDelete)}
            onSaveTextfieldAndCreateNew={SortedItems.saveTextfieldAndCreateNew}
            emptyLabelConfig={{
                label: "It's a ghost town in here.",
                className: 'flex-1'
            }}
        />
    );
};

export default Checklist;