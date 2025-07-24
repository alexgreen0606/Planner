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

// ✅ 

type SortedListConfig<T extends IListItem, S> = {
    storageId: string;
    storageKey: string;
    listType: EListType;
    initializedStorageObject?: S;
    onSaveItemToStorage: (item: T) => Promise<void> | any;

    // Ensure a callback is used here to prevent infinite rerenders
    onGetItemsFromStorageObject?: (storageObject: S) => Promise<T[]> | T[];

    onHandleListChange?: () => Promise<void> | void;
    onInitializeListItem?: (item: IListItem) => T;
};

const useSortedList = <T extends IListItem, S>({
    storageKey,
    storageId,
    initializedStorageObject,
    listType,
    onHandleListChange,
    onGetItemsFromStorageObject,
    onInitializeListItem,
    onSaveItemToStorage
}: SortedListConfig<T, S>) => {
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<T>();
    const { getIsItemDeleting } = useDeleteScheduler<T>();
    const { focusPlaceholder } = useScrollContainer();

    const isTogglingTextfields = useRef(false);

    const [items, setItems] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const storage = useMMKV({ id: storageId });
    const [storageRecord] = useMMKVObject<S>(storageKey, storage);

    const buildList = useCallback(async () => {
        try {
            const fetchedItems = await onGetItemsFromStorageObject?.(storageRecord ?? initializedStorageObject ?? [] as S);
            setItems(fetchedItems ?? storageRecord as T[] ?? []);
            if (isLoading) setIsLoading(false);
        } catch (error) {
            console.error(error);
        }
    }, [storageRecord, onGetItemsFromStorageObject]);

    // =============
    // 1. Reactions
    // =============

    // Build the list whenever its dependencies change.
    useEffect(() => {
        buildList();
    }, [buildList]);

    // =====================
    // 2. Utility Functions
    // =====================

    async function saveItem(item: T) {
        onSaveItemToStorage(item);
        await onHandleListChange?.();
    }

    async function toggleItemEdit(item: T) {
        if (getIsItemDeleting(item, listType)) return;

        isTogglingTextfields.current = true;

        if (textfieldItem) {
            // Focus the hidden placeholder field.
            // Needed to ensure the keyboard doesn't flicker shut during transition to new textfield item.
            focusPlaceholder();

            if (textfieldItem.value.trim() !== '') {
                await saveItem({ ...textfieldItem, status: EItemStatus.STATIC });
            }
        }

        setTextfieldItem({ ...item, status: EItemStatus.EDIT });

        setTimeout(() => {
            isTogglingTextfields.current = false;
        }, 200);

    }

    async function saveTextfieldAndCreateNew(
        textfieldReferenceSortId?: number,
        isReferenceIdBelowTextfield: boolean = false
    ) {
        if (isTogglingTextfields.current) return;

        const item = textfieldItem ? { ...textfieldItem } : null;

        // Phase 1: Clear the textfield and exit if the input is empty.
        if (item?.value.trim() === '') {
            setTextfieldItem(null);
            return;
        }

        // Phase 2: Save the item
        if (item) await saveItem(item);


        // Phase 3: Clear the textfield and exit if no reference ID was given
        if (!textfieldReferenceSortId) {
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
            status: EItemStatus.NEW,
            listId: storageKey,
            value: '',
            listType,
            sortId: generateSortId(
                textfieldReferenceSortId!,
                updatedList,
                isReferenceIdBelowTextfield
            )
        };
        const newItem: T = onInitializeListItem?.(genericListItem) ?? genericListItem as T;

        setTextfieldItem(newItem);
    }

    return {
        items,
        storageObject: storageRecord ?? initializedStorageObject,
        isLoading: isLoading === true,
        refetchItems: buildList,
        saveItem,
        toggleItemEdit,
        saveTextfieldAndCreateNew
    };
};

export default useSortedList;