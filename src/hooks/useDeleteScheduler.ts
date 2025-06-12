import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { DELETE_ITEMS_DELAY_MS } from '@/lib/constants/listConstants';
import { deleteFunctionsMapAtom, pendingDeleteItemsAtom } from '@/atoms/pendingDeletes';
import { IListItem } from '@/lib/types/listItems/core/TListItem';

export function useDeleteScheduler<T extends IListItem>() {
    const [pendingDeleteMap, setPendingDeleteMap] = useAtom(pendingDeleteItemsAtom);
    const [deleteFunctionsMap, setDeleteFunctionsMap] = useAtom(deleteFunctionsMapAtom);
    const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const getDeletingItems = useCallback((): T[] => {
        return Object.values(pendingDeleteMap);
    }, [pendingDeleteMap]);

    const isItemDeleting = (item: T) => {
        return !!pendingDeleteMap[item.id];
    };

    const registerDeleteFunction = (
        listId: string,
        deleteFunction: (items: T[]) => void
    ) => {
        setDeleteFunctionsMap(prev => ({
            ...prev,
            [listId]: deleteFunction
        }));
    };

    const scheduleItemDeletion = (item: T) => {
        setPendingDeleteMap(prev => ({
            ...prev,
            [item.id]: item,
        }));
    };

    const cancelItemDeletion = (item: T) => {
        setPendingDeleteMap(prev => {
            const newMap = { ...prev };
            delete newMap[item.id];

            return newMap;
        });
    };

    useEffect(() => {
        if (deleteTimeoutRef.current) {
            clearTimeout(deleteTimeoutRef.current);
            deleteTimeoutRef.current = null;
        }

        const deletingItems = getDeletingItems();
        const hasPendingItems = deletingItems.length > 0;

        if (hasPendingItems) {

            // Group items by listId
            const listDeletions: Record<string, T[]> = {};
            deletingItems.forEach((item) => {
                const listId = item.listId;
                if (!listDeletions[listId]) {
                    listDeletions[listId] = [];
                }
                listDeletions[listId].push(item);
            });

            deleteTimeoutRef.current = setTimeout(() => {
                Object.entries(listDeletions).forEach(([listId, items]) => {
                    const deleteFn = deleteFunctionsMap[listId];
                    if (deleteFn) {
                        deleteFn(items);
                    }
                });
                deleteTimeoutRef.current = null;
            }, DELETE_ITEMS_DELAY_MS);
        }
    }, [pendingDeleteMap]);

    return {
        getDeletingItems,
        isItemDeleting,
        scheduleItemDeletion,
        cancelItemDeletion,
        registerDeleteFunction
    };
}