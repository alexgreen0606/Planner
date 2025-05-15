import { IListItem } from '@/types/listItems/core/TListItem';
import React, { createContext, useCallback, useContext, useState } from 'react';

interface DeleteSchedulerContextValue {
    pendingDeleteItems: Required<IListItem>[];
    setPendingDeleteItems: React.Dispatch<React.SetStateAction<Required<IListItem>[]>>;
    scheduledDeletionItems: (listId: string) => Required<IListItem>[];
    isItemDeleting: (item: Required<IListItem>) => boolean;
}

const DeleteSchedulerContext = createContext<DeleteSchedulerContextValue | null>(null);

interface DeleteSchedulerProviderProps {
    children: React.ReactNode;
}

export const DeleteSchedulerProvider = ({
    children
}: DeleteSchedulerProviderProps) => {
    const [pendingDeleteItems, setPendingDeleteItems] = useState<Required<IListItem>[]>([]);

    const scheduledDeletionItems = useCallback((listId: string): Required<IListItem>[] => {
        return pendingDeleteItems.filter(item => item.listId === listId);
    }, [pendingDeleteItems]);

    /**
     * Checks if an item is currently marked for deletion.
     * 
     * @param item - The item to check
     * @returns true if the item is in the pending delete list, false otherwise
     */
    function isItemDeleting(item: Required<IListItem>) {
        return pendingDeleteItems.some(deleteItem => deleteItem.id === item.id);
    }

    return (
        <DeleteSchedulerContext.Provider
            value={{
                pendingDeleteItems,
                setPendingDeleteItems,
                scheduledDeletionItems,
                isItemDeleting
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