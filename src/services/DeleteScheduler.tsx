import { DELETE_ITEMS_DELAY_MS } from '@/constants/listConstants';
import { IListItem } from '@/types/listItems/core/TListItem';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface DeleteSchedulerContextValue {
    getDeletingItems: () => Required<IListItem>[];
    isItemDeleting: (item: Required<IListItem>) => boolean;
    scheduleItemDeletion: (item: Required<IListItem>) => void;
    cancelItemDeletion: (item: Required<IListItem>) => void;
    registerDeleteFunction: (
        listId: string,
        deleteFunction: (items: any) => Promise<void>
    ) => void;
}

const DeleteSchedulerContext = createContext<DeleteSchedulerContextValue | null>(null);

interface DeleteSchedulerProviderProps {
    children: React.ReactNode;
}

export const DeleteSchedulerProvider = ({
    children
}: DeleteSchedulerProviderProps) => {
    const [pendingDeleteMap, setPendingDeleteMap] = useState<Record<string, Required<IListItem>[]>>({});
    const deleteFunctionsMap = useRef<Record<string, (items: Required<IListItem>[]) => void>>({});
    const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const getDeletingItems = useCallback((): Required<IListItem>[] => {
        return Object.values(pendingDeleteMap).flat();
    }, [pendingDeleteMap]);

    const isItemDeleting = (item: Required<IListItem>) => {
        return (pendingDeleteMap[item.listId] || []).some(i => i.id === item.id);
    };

    const registerDeleteFunction = (
        listId: string,
        deleteFunction: (items: Required<IListItem>[]) => void
    ) => {
        deleteFunctionsMap.current[listId] = deleteFunction;
    };

    const scheduleItemDeletion = (item: Required<IListItem>) => {
        setPendingDeleteMap(prev => {
            const updatedList = [...(prev[item.listId] || []), item];
            return {
                ...prev,
                [item.listId]: updatedList,
            };
        });
    };

    const cancelItemDeletion = (item: Required<IListItem>) => {
        setPendingDeleteMap(prev => {
            const currentList = prev[item.listId] || [];
            const filteredList = currentList.filter(i => i.id !== item.id);

            const newMap = { ...prev };
            if (filteredList.length > 0) {
                newMap[item.listId] = filteredList;
            } else {
                delete newMap[item.listId];
            }

            return newMap;
        });
    };

    useEffect(() => {
        if (deleteTimeoutRef.current) {
            clearTimeout(deleteTimeoutRef.current);
            deleteTimeoutRef.current = null;
        }

        const hasPendingItems = getDeletingItems().length > 0;

        if (hasPendingItems) {
            deleteTimeoutRef.current = setTimeout(() => {
                Object.entries(pendingDeleteMap).forEach(([listId, items]) => {
                    const deleteFn = deleteFunctionsMap.current[listId];
                    if (deleteFn) {
                        deleteFn(items);
                    }
                });

                setTimeout(() => {
                    // Allow time for chips to be reloaded.
                    // Prevents flicker of deleted multi-day chips.
                    setPendingDeleteMap({});
                }, 1500);
                deleteFunctionsMap.current = {};
                deleteTimeoutRef.current = null;
            }, DELETE_ITEMS_DELAY_MS);
        }
    }, [pendingDeleteMap]);

    return (
        <DeleteSchedulerContext.Provider
            value={{
                registerDeleteFunction,
                getDeletingItems,
                scheduleItemDeletion,
                isItemDeleting,
                cancelItemDeletion
            }}
        >
            {children}
        </DeleteSchedulerContext.Provider>
    );
};

export const useDeleteScheduler = () => {
    const context = useContext(DeleteSchedulerContext);
    if (!context) {
        throw new Error("useDeleteScheduler must be used within a DeleteSchedulerProvider");
    }
    return context;
};