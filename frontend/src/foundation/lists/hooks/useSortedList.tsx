import { useState } from 'react';
import { ListItem } from '../types';

const useSortedList = <T extends ListItem>(initialItems: T[]) => {
    const [current, setCurrent] = useState<T[]>(initialItems);

    const createItem = (newItem: T & { sortId: number }) => {
        setCurrent((curr) => {
            const newList = [...curr];
            const insertIndex = newList.findIndex(item => item.sortId > newItem.sortId);
            insertIndex === -1 ?
                newList.push(newItem) :
                newList.splice(insertIndex, 0, newItem);
            return newList;
        });
    };

    const updateItem = (newItem: T, replaceId?: string) => {
        setCurrent((curr) => {
            const newList = [...curr];
            const replaceIndex = newList.findIndex((item) => item.id === (replaceId || newItem.id));
            if (replaceIndex !== -1) {
                newList[replaceIndex] = newItem;
            }
            return newList;
        });
    };

    const deleteItem = (itemId: string) => {
        setCurrent((curr) => {
            const newList = [...curr];
            const deleteIndex = newList.findIndex((item) => item.id === itemId);
            if (deleteIndex !== -1) {
                newList.splice(deleteIndex, 1);
            }
            return newList;
        });
    };

    const moveItem = (newItem: T) => {
        setCurrent((curr) => {
            const newList = [...curr];
            const deleteIndex = newList.findIndex((item) => item.id === newItem.id);
            if (deleteIndex !== -1) {
                newList.splice(deleteIndex, 1);
            }
            const insertIndex = newList.findIndex(item => item.sortId > newItem.sortId);
            insertIndex === -1 ?
                newList.push(newItem) :
                newList.splice(insertIndex, 0, newItem);
            return newList;
        });
    };

    return { current, createItem, updateItem, deleteItem, moveItem };
};

export default useSortedList;
