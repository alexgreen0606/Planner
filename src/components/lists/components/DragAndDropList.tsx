import ThinLine from '@/components/ThinLine';
import useTextfieldItemAs from '@/hooks/useTextfieldItemAs';
import { SCROLL_THROTTLE } from '@/lib/constants/listConstants';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { usePageContext } from '@/providers/PageProvider';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import DraggableFlatList, {
    RenderItemParams
} from 'react-native-draggable-flatlist';
import { MMKV } from 'react-native-mmkv';
import { FadeOut } from 'react-native-reanimated';
import ListItem from './ListItem';

// ✅ 

type TDragAndDropListProps<T extends TListItem, S = T> = {
    itemIds: string[];
    listId: string;
    storageId: EStorageId;
    storage: MMKV;
    defaultStorageObject?: S;
    collapsed?: boolean;
    onCreateItem: (listId: string, index: number) => void;
    onDeleteItem: (item: T) => void;
    onValueChange?: (newValue: string) => void;
    onIndexChange?: (newIndex: number, prev: T) => void;
    onSaveToExternalStorage?: (item: T) => void;
    onContentClick?: (item: T) => void;
    onGetRowTextPlatformColor?: (item: T) => string;
    onGetIsItemDeletingCustom?: (item: T) => boolean;
    onGetLeftIcon?: (item: T) => ReactNode;
    onGetRightIcon?: (item: T) => ReactNode;
};

const DragAndDropList = <T extends TListItem, S = T>({
    itemIds,
    listId,
    storageId,
    storage,
    collapsed,
    onIndexChange,
    onCreateItem,
    onDeleteItem,
    ...rest
}: TDragAndDropListProps<T, S>) => {
    const { onSetIsPageEmpty } = usePageContext();

    const [draggingItemInitialIndex, setDraggingItemIndex] = useState<number | null>(null);

    const { textfieldItem, onCloseTextfield } = useTextfieldItemAs<T>(storage);

    const isDraggingItem = Boolean(draggingItemInitialIndex);

    // Show the empty page label whenever the list length is 0.
    useEffect(() => {
        onSetIsPageEmpty(itemIds.length === 0);
    }, [itemIds.length]);

    // ================
    //  Event Handlers
    // ================

    function handleEmptySpaceClick() {
        if (!textfieldItem) {
            // Open a textfield at the bottom of the list.
            onCreateItem(listId, itemIds.length);
            return;
        }

        onCloseTextfield();

        if (textfieldItem.value.trim() === '') {
            onDeleteItem(textfieldItem);
        }
    }

    const handleDragRelease = useCallback((index: number) => {
        if (!draggingItemInitialIndex) return;

        if (index !== draggingItemInitialIndex && onIndexChange) {
            const itemId = itemIds[draggingItemInitialIndex];
            const item = storage.getString(itemId);
            if (item) {
                const parsedItem = JSON.parse(item) as T;
                onIndexChange(index, parsedItem);
            }
        }

        setDraggingItemIndex(null);
    }, [itemIds, onIndexChange, storage]);

    const handleDragBegin = useCallback((index: number) => {
        setDraggingItemIndex(index);
        onCloseTextfield();
    }, [onCloseTextfield]);

    const renderItem = useCallback(({ item: itemId, drag, isActive, getIndex }: RenderItemParams<string>) => (
        <ListItem<T>
            itemIndex={getIndex() ?? 0}
            listId={listId}
            itemId={itemId}
            storage={storage}
            isActive={isActive}
            isDragging={isDraggingItem}
            onLongPress={drag}
            onCreateItem={onCreateItem}
            onDeleteItem={onDeleteItem}
            {...rest}
        />
    ), [listId, storage, draggingItemInitialIndex, onCreateItem, onDeleteItem, rest]);

    const renderFooter = useCallback(() => (
        <>
            {/* Lower List Line */}
            {itemIds.length > 0 && (
                <Pressable onPress={handleEmptySpaceClick}>
                    <ThinLine />
                </Pressable>
            )}

            {/* Empty Click Area */}
            <Pressable
                className='flex-1 min-h-10'
                onPress={handleEmptySpaceClick}
            />
        </>
    ), [itemIds.length, handleEmptySpaceClick]);

    // ================
    //  User Interface
    // ================

    return (
        <DraggableFlatList
            data={itemIds}
            itemExitingAnimation={FadeOut}
            keyExtractor={(itemId) => `${itemId}-row`}
            contentInsetAdjustmentBehavior='automatic'
            scrollEventThrottle={SCROLL_THROTTLE}
            scrollEnabled={!isDraggingItem}
            renderItem={renderItem}
            onRelease={handleDragRelease}
            onDragBegin={handleDragBegin}
            ListFooterComponent={renderFooter}
            containerStyle={{ flex: 1 }}
            automaticallyAdjustKeyboardInsets
            dragItemOverflow
        />
    );
};

export default DragAndDropList;