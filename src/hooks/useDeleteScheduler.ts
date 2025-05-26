import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { DELETE_ITEMS_DELAY_MS } from '@/constants/listConstants';
import { IListItem } from '@/types/listItems/core/TListItem';
import { deleteFunctionsMapAtom, pendingDeleteMapAtom } from '@/atoms/pendingDeletes';

export function useDeleteScheduler <T extends IListItem>() {
    const [pendingDeleteMap, setPendingDeleteMap] = useAtom(pendingDeleteMapAtom);
    const [deleteFunctionsMap, setDeleteFunctionsMap] = useAtom(deleteFunctionsMapAtom);
    const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const getDeletingItems = useCallback((): Required<IListItem>[] => {
        return Object.values(pendingDeleteMap).flat();
    }, [pendingDeleteMap]);

    const isItemDeleting = (item: T) => {
        return (pendingDeleteMap[item.listId] || []).some(i => i.id === item.id);
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
        setPendingDeleteMap(prev => {
            const updatedList = [...(prev[item.listId] || []), item];
            return {
                ...prev,
                [item.listId]: updatedList,
            };
        });
    };

    const cancelItemDeletion = (item: T) => {
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
                    const deleteFn = deleteFunctionsMap[listId];
                    if (deleteFn) {
                        deleteFn(items);
                    }
                });

                setTimeout(() => {
                    // Allow time for chips to be reloaded.
                    // Prevents flicker of deleted multi-day chips.
                    setPendingDeleteMap({});
                }, 1500);
                setDeleteFunctionsMap({});
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