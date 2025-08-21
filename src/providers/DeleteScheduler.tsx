import { pendingDeleteItemsAtom } from '@/atoms/pendingDeletes';
import { textfieldIdAtom } from '@/atoms/textfieldId';
import { DELETE_ITEMS_DELAY_MS } from '@/lib/constants/listConstants';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { deleteChecklistItems } from '@/utils/checklistUtils';
import { deletePlannerEventsFromStorageAndCalendar } from '@/utils/plannerUtils';
import { deleteRecurringEventsFromStorageHideWeekday } from '@/utils/recurringPlannerUtils';
import { useAtom } from 'jotai';
import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';

// ✅ 

type DeleteSchedulerContextType<T extends TListItem> = {
    onGetDeletingItemsByStorageIdCallback: (deleteFunctionKey: EStorageId) => T[];
    onGetIsItemDeletingCallback: (item: T | undefined) => boolean;
    onToggleScheduleItemDeleteCallback: (item: T) => void;
};

const deletionMap: Partial<Record<EStorageId, (items: any[]) => Promise<void> | void>> = {
    [EStorageId.PLANNER_EVENT]: deletePlannerEventsFromStorageAndCalendar,
    [EStorageId.RECURRING_PLANNER_EVENT]: deleteRecurringEventsFromStorageHideWeekday,
    [EStorageId.CHECKLIST_ITEM]: deleteChecklistItems
};

const DeleteSchedulerContext = createContext<DeleteSchedulerContextType<any> | undefined>(undefined);

export function DeleteSchedulerProvider<T extends TListItem>({ children }: { children: React.ReactNode }) {
    
    const [pendingDeleteMap, setPendingDeleteMap] = useAtom(pendingDeleteItemsAtom);
    const [textfieldId, setTextfieldId] = useAtom(textfieldIdAtom);

    const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Schedule deletion of pending items.
    useEffect(() => {
        if (deleteTimeoutRef.current) {
            clearTimeout(deleteTimeoutRef.current);
        }

        const hasAnyPendingDeletes = Object.values(pendingDeleteMap).some(
            typeMap => typeMap && Object.keys(typeMap).length > 0
        );

        if (hasAnyPendingDeletes) {
            deleteTimeoutRef.current = setTimeout(() => {
                Object.entries(pendingDeleteMap).forEach(([deleteFunctionKey, itemsMap]) => {
                    if (itemsMap && Object.keys(itemsMap).length > 0) {
                        const items = Object.values(itemsMap);
                        const deleteFn = deletionMap[deleteFunctionKey as EStorageId];

                        deleteFn?.(items);
                    }
                });

                setPendingDeleteMap({});
                deleteTimeoutRef.current = null;
            }, DELETE_ITEMS_DELAY_MS);
        }
    }, [pendingDeleteMap]);

    // =====================
    // 2. Exposed Functions
    // =====================

    const handleGetDeletingItemsByStorageIdCallback = useCallback((deleteFunctionKey: EStorageId): T[] => {
        const typeMap = pendingDeleteMap[deleteFunctionKey] ?? {};
        return Object.values(typeMap);
    }, [pendingDeleteMap]);

    const handleGetIsItemDeletingCallback = useCallback((item: T | undefined) => {
        return item ? Boolean(pendingDeleteMap[item.storageId]?.[item?.id]) : false;
    }, [pendingDeleteMap])

    const handleToggleScheduleItemDeleteCallback = useCallback(async (item: T) => {
        const storageId = item.storageId;

        if (item.id === textfieldId) {
            setTextfieldId(null);
            if (item.value.trim() === '') {
                const deleteFunction = deletionMap[item.storageId];
                if (deleteFunction) {
                    await deleteFunction([item]);
                }
                return;
            }
        }

        setPendingDeleteMap(prev => {
            const newMap = { ...prev };
            const typeMap = { ...newMap[storageId] };
            const isScheduled = typeMap[item.id];

            if (isScheduled) {
                delete typeMap[item.id];
            } else {
                typeMap[item.id] = item;
            }

            newMap[storageId] = typeMap;
            return newMap;
        });
    }, [setPendingDeleteMap]);

    return (
        <DeleteSchedulerContext.Provider value={{
            onGetDeletingItemsByStorageIdCallback: handleGetDeletingItemsByStorageIdCallback,
            onGetIsItemDeletingCallback: handleGetIsItemDeletingCallback,
            onToggleScheduleItemDeleteCallback: handleToggleScheduleItemDeleteCallback
        }}>
            {children}
        </DeleteSchedulerContext.Provider>
    );
}

export function useDeleteScheduler<T extends TListItem>(): DeleteSchedulerContextType<T> {
    const context = useContext(DeleteSchedulerContext);
    if (!context) {
        throw new Error('useDeleteScheduler must be used within a DeleteSchedulerProvider');
    }
    return context;
}
