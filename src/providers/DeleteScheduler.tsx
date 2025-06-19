import React, { createContext, useContext, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAtom } from 'jotai';
import { pendingDeleteItemsAtom } from '@/atoms/pendingDeletes';
import { DELETE_ITEMS_DELAY_MS } from '@/lib/constants/listConstants';
import { IListItem } from '@/lib/types/listItems/core/TListItem';
import { EDeleteFunctionKey } from '@/lib/enums/EDeleteFunctionKeys';
import { deleteCountdowns } from '@/utils/countdownUtils';
import { deletePlannerEvents } from '@/storage/plannerStorage';
import { deleteRecurringEvents, deleteRecurringWeekdayEvents } from '@/storage/recurringPlannerStorage';
import { deleteChecklistItems, deleteFolderItem } from '@/storage/checklistsStorage';
import { deletePlannerSet } from '@/storage/plannerSetsStorage';

type DeleteSchedulerContextType<T extends IListItem> = {
    getDeletingItems: (deleteFunctionKey: EDeleteFunctionKey) => T[];
    getIsItemDeleting: (item: T, deleteFunctionKey: EDeleteFunctionKey) => boolean;
    scheduleItemDeletion: (item: T, deleteFunctionKey: EDeleteFunctionKey) => void;
    cancelItemDeletion: (item: T, deleteFunctionKey: EDeleteFunctionKey) => void;
};

export const deletionMap: Record<EDeleteFunctionKey, (items: any[]) => Promise<void> | void> = {
    [EDeleteFunctionKey.COUNTDOWN]: deleteCountdowns,
    [EDeleteFunctionKey.PLANNER_EVENT]: deletePlannerEvents,
    [EDeleteFunctionKey.RECURRING]: deleteRecurringEvents,
    [EDeleteFunctionKey.RECURRING_WEEKDAY]: deleteRecurringWeekdayEvents,
    [EDeleteFunctionKey.CHECKLIST]: deleteChecklistItems,
    [EDeleteFunctionKey.FOLDER]: (folders) => deleteFolderItem(folders[0].id, folders[0].type),
    [EDeleteFunctionKey.PLANNER_SET]: (sets) => deletePlannerSet(sets[0])
}

const DeleteSchedulerContext = createContext<DeleteSchedulerContextType<any> | undefined>(undefined);

export function DeleteSchedulerProvider<T extends IListItem>({ children }: { children: React.ReactNode }) {
    const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [pendingDeleteMap, setPendingDeleteMap] = useAtom(pendingDeleteItemsAtom);

    useEffect(() => {
        console.log(pendingDeleteMap)
    }, [pendingDeleteMap])

    const getDeletingItems = useCallback((deleteFunctionKey: EDeleteFunctionKey): T[] => {
        const typeMap = pendingDeleteMap[deleteFunctionKey] ?? {};
        return Object.values(typeMap);
    }, [pendingDeleteMap]);

    const getIsItemDeleting = useCallback((item: T, deleteFunctionKey: EDeleteFunctionKey) => {
        return Boolean(pendingDeleteMap[deleteFunctionKey]?.[item.id]);
    }, [pendingDeleteMap]);

    const scheduleItemDeletion = useCallback((item: T, deleteFunctionKey: EDeleteFunctionKey) => {
        setPendingDeleteMap(prev => ({
            ...prev,
            [deleteFunctionKey]: {
                ...prev[deleteFunctionKey],
                [item.id]: item
            }
        }));
    }, [setPendingDeleteMap]);

    const cancelItemDeletion = useCallback((item: T, deleteFunctionKey: EDeleteFunctionKey) => {
        setPendingDeleteMap(prev => {
            const newMap = { ...prev };

            if (newMap[deleteFunctionKey]) {
                const typeMap = { ...newMap[deleteFunctionKey] };
                delete typeMap[item.id];
                newMap[deleteFunctionKey] = typeMap;
            }

            return newMap;
        });
    }, [setPendingDeleteMap]);

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
                        const deleteFn = deletionMap[deleteFunctionKey as EDeleteFunctionKey];

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
            getDeletingItems,
            getIsItemDeleting,
            scheduleItemDeletion,
            cancelItemDeletion,
        }}>
            {children}
        </DeleteSchedulerContext.Provider>
    );
}

export function useDeleteScheduler<T extends IListItem>(): DeleteSchedulerContextType<T> {
    const context = useContext(DeleteSchedulerContext);
    if (!context) {
        throw new Error('useDeleteScheduler must be used within a DeleteSchedulerProvider');
    }
    return context;
}
