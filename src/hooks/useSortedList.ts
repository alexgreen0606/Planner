import { useCallback, useEffect, useState } from 'react';
import { MMKV, useMMKVObject } from 'react-native-mmkv';

//

type SortedListConfig<S> = {
    storage: MMKV;
    storageKey: string;
    initializedStorageObject?: S;

    // Ensure a callback is used here to prevent infinite rerenders
    onGetItemsFromStorageObject?: (storageObject: S) => Promise<string[]> | string[];
};

const useSortedList = <S>({
    storageKey,
    storage,
    initializedStorageObject,
    onGetItemsFromStorageObject
}: SortedListConfig<S>) => {

    const [items, setItems] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [storageRecord] = useMMKVObject<S>(storageKey, storage);

    const buildList = useCallback(async () => {
        try {
            const fetchedItems = await onGetItemsFromStorageObject?.(storageRecord ?? initializedStorageObject ?? [] as S);
            setItems(fetchedItems ?? storageRecord as string[] ?? []);
            if (isLoading) setIsLoading(false);
        } catch (error) {
            console.error(error);
        }
    }, [storageRecord, onGetItemsFromStorageObject]);

    // Build the list whenever its dependencies change.
    useEffect(() => {
        buildList();
    }, [buildList]);

    return {
        items,
        storageObject: storageRecord ?? initializedStorageObject,
        isLoading: isLoading === true,
        refetchItems: buildList,
    };
};

export default useSortedList;