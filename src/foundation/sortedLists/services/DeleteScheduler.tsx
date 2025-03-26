import React, { createContext, useCallback, useContext, useState } from 'react';
import { ListItem } from '../types';

interface DeleteSchedulerContextValue {
    pendingDeleteItems: Required<ListItem>[];
    setPendingDeleteItems: React.Dispatch<React.SetStateAction<Required<ListItem>[]>>;
    scheduledDeletionItems: (listId: string) => Required<ListItem>[];
    isItemDeleting: (item: Required<ListItem>) => boolean;
}

const DeleteSchedulerContext = createContext<DeleteSchedulerContextValue | null>(null);

interface DeleteSchedulerProviderProps {
    children: React.ReactNode;
}

export const DeleteSchedulerProvider = ({
    children
}: DeleteSchedulerProviderProps) => {
    const [pendingDeleteItems, setPendingDeleteItems] = useState<Required<ListItem>[]>([]);

    const scheduledDeletionItems = useCallback((listId: string): Required<ListItem>[] => {
        return pendingDeleteItems.filter(item => item.listId === listId);
    }, [pendingDeleteItems]);

    /**
     * Checks if an item is currently marked for deletion.
     * 
     * @param item - The item to check
     * @returns true if the item is in the pending delete list, false otherwise
     */
    function isItemDeleting(item: Required<ListItem>) {
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