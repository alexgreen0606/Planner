import React, { createContext, useContext, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAtom } from 'jotai';
import { pendingDeleteItemsAtom } from '@/atoms/pendingDeletes';
import { DELETE_ITEMS_DELAY_MS } from '@/lib/constants/listConstants';
import { IListItem } from '@/lib/types/listItems/core/TListItem';
import { EListType } from '@/lib/enums/EListType';
import { deletePlannerEvents } from '@/storage/plannerStorage';
import { deleteRecurringEvents, deleteRecurringWeekdayEvents } from '@/storage/recurringPlannerStorage';
import { deleteChecklistItems } from '@/storage/checklistsStorage';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';

type DeleteSchedulerContextType<T extends IListItem> = {
    getDeletingItems: (deleteFunctionKey: EListType) => T[];
    getIsItemDeleting: (item: T, deleteFunctionKey: EListType) => boolean;
    toggleScheduleItemDelete: (item: T) => void;
}

export const deletionMap: Partial<Record<EListType, (items: any[]) => Promise<void> | void>> = {
    [EListType.PLANNER]: deletePlannerEvents,
    [EListType.RECURRING]: deleteRecurringEvents,
    [EListType.RECURRING_WEEKDAY]: deleteRecurringWeekdayEvents,
    [EListType.CHECKLIST]: deleteChecklistItems
};

const DeleteSchedulerContext = createContext<DeleteSchedulerContextType<any> | undefined>(undefined);

export function DeleteSchedulerProvider<T extends IListItem>({ children }: { children: React.ReactNode }) {
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<T>();
    const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [pendingDeleteMap, setPendingDeleteMap] = useAtom(pendingDeleteItemsAtom);

    const getDeletingItems = useCallback((deleteFunctionKey: EListType): T[] => {
        const typeMap = pendingDeleteMap[deleteFunctionKey] ?? {};
        return Object.values(typeMap);
    }, [pendingDeleteMap]);

    const getIsItemDeleting = useCallback((item: T, deleteFunctionKey: EListType) => {
        return Boolean(pendingDeleteMap[deleteFunctionKey]?.[item.id]);
    }, [pendingDeleteMap]);

    const toggleScheduleItemDelete = useCallback(async (item: T) => {
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
    },
        [setPendingDeleteMap]
    );

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
            getDeletingItems,
            getIsItemDeleting,
            toggleScheduleItemDelete
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
