import { EItemStatus } from '@/lib/enums/EItemStatus';
import { EListType } from '@/lib/enums/EListType';
import { IListItem } from '@/lib/types/listItems/core/TListItem';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { useScrollContainer } from '@/providers/ScrollContainer';
import { uuid } from 'expo-modules-core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';
import { generateSortId, sanitizeList } from '../utils/listUtils';
import { useTextfieldItemAs } from './useTextfieldItemAs';

type StorageHandlers<T extends IListItem> = {
    updateItem: (item: T) => Promise<any> | void;
    createItem: (item: T) => Promise<any> | void;
};

interface SortedListConfig<T extends IListItem, S> {
    storageId: string;
    storageKey: string;
    handleListChange?: () => Promise<void>;
    // Ensure a callback is used here to prevent infinite rerenders
    getItemsFromStorageObject?: (storageObject: S) => Promise<T[]> | T[];
    setItemsInStorageObject?: (items: T[], currentObject: S) => S;
    initializeListItem?: (item: IListItem) => T;
    storageConfig?: StorageHandlers<T>;
    initializedStorageObject?: S;
    listType: EListType;
}

const useSortedList = <T extends IListItem, S>({
    storageKey,
    storageId,
    getItemsFromStorageObject,
    setItemsInStorageObject,
    initializeListItem,
    storageConfig,
    initializedStorageObject,
    handleListChange,
    listType
}: SortedListConfig<T, S>) => {
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<T>();
    const { getIsItemDeleting } = useDeleteScheduler<T>();
    const { focusPlaceholder } = useScrollContainer();

    const storage = useMMKV({ id: storageId });
    const [storageObject, setStorageObject] = useMMKVObject<S>(storageKey, storage);

    const isTogglingTextfields = useRef(false);

    const [items, setItems] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // ------------- BUILD Logic -------------

    const buildList = useCallback(async () => {
        try {
            const fetchedItems = await getItemsFromStorageObject?.(storageObject ?? initializedStorageObject ?? [] as S);
            setItems(fetchedItems ?? storageObject as T[] ?? []);
            if (isLoading) setIsLoading(false);
        } catch (error) {
            console.error(error);
        }
    }, [storageObject, getItemsFromStorageObject]);

    // ------------- RELOAD Logic -------------

    // Standard list rebuild
    useEffect(() => {
        buildList();
    }, [buildList]);

    /**
     * Updates or creates an item in storage.
     * @returns - true if the item still exists in the list, else false
     */
    async function persistItemToStorage(item: T) {
        let newId = undefined;
        if (storageConfig) {

            // Handle the storage update directly
            if (item.status === EItemStatus.NEW) {
                newId = await storageConfig.createItem({ ...item, status: EItemStatus.STATIC });
            } else {
                await storageConfig.updateItem({ ...item, status: EItemStatus.STATIC });
            }
        } else {

            // Update the list with the new item and save
            const updatedList = [...items];
            const replaceIndex = updatedList.findIndex((existingItem) =>
                existingItem.id === item.id
            );
            if (replaceIndex !== -1) {
                updatedList[replaceIndex] = item;
            } else {
                updatedList.push(item);
            }
            const objectToSave = setItemsInStorageObject && storageObject ? setItemsInStorageObject(updatedList, { ...storageObject }) : updatedList;
            setStorageObject(objectToSave as S);
        }

        await handleListChange?.();

        return newId;
    }

    /**
     * Toggles an item between a textfield and static.
     * If another textfield exists, it will be saved first.
     */
    async function toggleItemEdit(item: T) {
        if (getIsItemDeleting(item, listType)) return;

        isTogglingTextfields.current = true;

        if (textfieldItem && textfieldItem.value.trim() !== '') {
            // Focus the hidden placeholder field.
            // Needed to ensure the keyboard doesn't flicker shut during transition to new textfield item.
            focusPlaceholder();
            await persistItemToStorage({ ...textfieldItem, status: EItemStatus.STATIC });
        }

        setTextfieldItem({ ...item, status: EItemStatus.EDIT });

        setTimeout(() => {
            isTogglingTextfields.current = false;
        }, 200);

    };

    /**
     * ✅ Saves an item to the current list and creates a new textfield item.
     * 
     * @param referenceSortId - The sort ID of an item to place the new textfield near
     * @param isChildId - Signifies if the reference ID should be below the new textfield, else above.
     */
    async function saveTextfieldAndCreateNew(referenceSortId?: number, isChildId: boolean = false) {
        if (isTogglingTextfields.current) return;

        const item = textfieldItem ? { ...textfieldItem } : null;

        // Phase 1: Clear the textfield and exit if the input is empty.
        if (item?.value.trim() === '') {
            setTextfieldItem(null);
            return;
        }

        // Phase 2: Save the item
        if (item) await persistItemToStorage(item);


        // Phase 3: Clear the textfield and exit if no reference ID was given
        if (!referenceSortId) {
            setTextfieldItem(undefined);
            return;
        }

        // Phase 4: Focus the hidden placeholder field.
        // Needed to ensure the keyboard doesn't flicker shut during transition to new textfield item.
        focusPlaceholder();

        // Phase 5: Create a new list item.
        const updatedList = sanitizeList(items, item);
        const genericListItem: IListItem = {
            id: uuid.v4(),
            sortId: generateSortId(referenceSortId!, updatedList, isChildId),
            status: EItemStatus.NEW,
            listId: storageKey,
            value: '',
            listType
        };
        const newItem: T = initializeListItem?.(genericListItem) ?? genericListItem as T;

        setTextfieldItem(newItem);
    }

    return {
        items,
        refetchItems: buildList,
        persistItemToStorage,
        toggleItemEdit,
        saveTextfieldAndCreateNew,
        storageObject: storageObject ?? initializedStorageObject,
        isLoading: isLoading === true
    };
};

export default useSortedList;
