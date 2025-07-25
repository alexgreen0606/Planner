import { pendingDeleteItemsAtom } from '@/atoms/pendingDeletes';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { DELETE_ITEMS_DELAY_MS } from '@/lib/constants/listConstants';
import { EListType } from '@/lib/enums/EListType';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { deleteChecklistItems } from '@/storage/checklistsStorage';
import { deletePlannerEventsFromStorageAndCalendar } from '@/storage/plannerStorage';
import { deleteRecurringEventsHideWeekday, deleteRecurringWeekdayEvents } from '@/storage/recurringPlannerStorage';
import { useAtom } from 'jotai';
import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';

// ✅ 

type DeleteSchedulerContextType<T extends TListItem> = {
    handleGetDeletingItemsByType: (deleteFunctionKey: EListType) => T[];
    handleGetIsItemDeleting: (item: T, deleteFunctionKey: EListType) => boolean;
    handleToggleScheduleItemDelete: (item: T) => void;
};

const deletionMap: Partial<Record<EListType, (items: any[]) => Promise<void> | void>> = {
    [EListType.PLANNER]: deletePlannerEventsFromStorageAndCalendar,
    [EListType.RECURRING]: deleteRecurringEventsHideWeekday,
    [EListType.RECURRING_WEEKDAY]: deleteRecurringWeekdayEvents,
    [EListType.CHECKLIST]: deleteChecklistItems
};

const DeleteSchedulerContext = createContext<DeleteSchedulerContextType<any> | undefined>(undefined);

export function DeleteSchedulerProvider<T extends TListItem>({ children }: { children: React.ReactNode }) {
    const [pendingDeleteMap, setPendingDeleteMap] = useAtom(pendingDeleteItemsAtom);

    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<T>();

    const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // =====================
    // 1. Exposed Functions
    // =====================

    const handleGetDeletingItemsByType = useCallback((deleteFunctionKey: EListType): T[] => {
        const typeMap = pendingDeleteMap[deleteFunctionKey] ?? {};
        return Object.values(typeMap);
    }, [pendingDeleteMap]);

    const handleGetIsItemDeleting = useCallback((item: T, deleteFunctionKey: EListType) => {
        return Boolean(pendingDeleteMap[deleteFunctionKey]?.[item.id]);
    }, [pendingDeleteMap])

    const handleToggleScheduleItemDelete = useCallback(async (item: T) => {
        const listType = item.listType;

        if (item.id === textfieldItem?.id) {
            setTextfieldItem(null);
            if (item.value.trim() === '') {
                const deleteFunction = deletionMap[item.listType];
                if (deleteFunction) {
                    await deleteFunction([item]);
                }
                return;
            }
        }

        setPendingDeleteMap(prev => {
            const newMap = { ...prev };
            const typeMap = { ...newMap[listType] };
            const isScheduled = typeMap[item.id];

            if (isScheduled) {
                delete typeMap[item.id];
            } else {
                typeMap[item.id] = item;
            }

            newMap[listType] = typeMap;
            return newMap;
        });
    }, [setPendingDeleteMap]);

    // =============
    // 2. Reactions
    // =============

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
                        const deleteFn = deletionMap[deleteFunctionKey as EListType];

                        deleteFn?.(items);
                    }
                });

                setPendingDeleteMap({});
                deleteTimeoutRef.current = null;
            }, DELETE_ITEMS_DELAY_MS);
        }
    }, [pendingDeleteMap]);

    return (
        <DeleteSchedulerContext.Provider value={{
            handleGetDeletingItemsByType,
            handleGetIsItemDeleting: handleGetIsItemDeleting,
            handleToggleScheduleItemDelete: handleToggleScheduleItemDelete
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
