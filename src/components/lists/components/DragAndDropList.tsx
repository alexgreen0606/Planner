import ThinLine from '@/components/ThinLine';
import useTextfieldItemAs from '@/hooks/useTextfieldItemAs';
import { LIST_ITEM_HEIGHT } from '@/lib/constants/listConstants';
import { BOTTOM_NAVIGATION_HEIGHT, HEADER_HEIGHT } from '@/lib/constants/miscLayout';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useScrollContext } from '@/providers/ScrollProvider';
import React, { ReactNode, useEffect } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { cancelAnimation, runOnJS, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyLabel, { IEmptyLabelProps } from '../../EmptyLabel';
import ListItem from './ListItem';
import { useScrollPageContext } from '@/providers/ScrollPageProvider';

// ✅ 

type TDragAndDropListProps<T extends TListItem, S = T> = {
    itemIds: string[];
    listId: string;
    emptyLabelConfig?: Omit<IEmptyLabelProps, 'onPress'>;
    storageId: EStorageId;
    fillSpace?: boolean;
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
    emptyLabelConfig,
    fillSpace,
    storage,
    collapsed,
    onIndexChange,
    onCreateItem,
    onDeleteItem,
    ...rest
}: TDragAndDropListProps<T, S>) => {
    const { top: TOP_SPACER, bottom: BOTTOM_SPACER } = useSafeAreaInsets();
    const { height: SCREEN_HEIGHT } = useWindowDimensions();

    const draggingRowId = useSharedValue<string | null>(null);
    const isAutoScrolling = useSharedValue(false);

    const dragInitialScrollOffset = useSharedValue(0);
    const dragInitialIndex = useSharedValue(0);
    const dragInitialTop = useSharedValue(0);
    const dragTop = useSharedValue(0);

    const dragIndex = useDerivedValue(() => Math.floor(dragTop.value / LIST_ITEM_HEIGHT));

    const { floatingHeaderHeight } = useScrollPageContext();
    const { scrollOffset } = useScrollContext();

    const { textfieldItem, onCloseTextfield } = useTextfieldItemAs<T>(storage);

    const upperAutoScrollBound = HEADER_HEIGHT + TOP_SPACER + floatingHeaderHeight;
    const lowerAutoScrollBound = SCREEN_HEIGHT - BOTTOM_SPACER - BOTTOM_NAVIGATION_HEIGHT - LIST_ITEM_HEIGHT;
    const dragTopMax = Math.max(0, LIST_ITEM_HEIGHT * (itemIds.length - 1));

    // Auto Scrolling.
    useAnimatedReaction(
        () => scrollOffset.value - dragInitialScrollOffset.value,
        (displacement) => {
            dragTop.value += displacement;
            dragInitialTop.value += displacement;
            dragInitialScrollOffset.value = scrollOffset.value;
        }
    );

    // Clear any pending drag once the result is officially saved.
    useEffect(() => {
        draggingRowId.value = null;
    }, [itemIds]);

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

    function handleDragStartWorklet(rowId: string, initialIndex: number) {
        "worklet";
        const initialTop = initialIndex * LIST_ITEM_HEIGHT;

        dragInitialScrollOffset.value = scrollOffset.value;
        dragInitialIndex.value = initialIndex;
        dragInitialTop.value = initialTop;

        dragTop.value = initialTop;
        draggingRowId.value = rowId;

        runOnJS(onCloseTextfield)();
    }

    function handleDragEndWorklet(newIndex: number, item?: T) {
        "worklet";

        cancelAnimation(scrollOffset);
        isAutoScrolling.value = false;

        if (onIndexChange && item) {
            runOnJS(onIndexChange)(newIndex, item);
        }

        // Ensure the drag is cancelled in cases where the drag result was denied.
        runOnJS(setTimeout)(() => draggingRowId.value = null, 250);
    }

    // ================
    //  User Interface
    // ================

    return (
        <View style={{ flex: fillSpace ? 1 : 0 }}>

            {/* List Items */}
            <View
                className='w-full'
                style={{
                    height: itemIds.length * LIST_ITEM_HEIGHT
                }}
            >
                {itemIds.map((id, i) =>
                    <ListItem<T>
                        key={`${id}-row`}
                        itemIndex={i}
                        listId={listId}
                        upperAutoScrollBound={upperAutoScrollBound}
                        lowerAutoScrollBound={lowerAutoScrollBound}
                        itemId={id}
                        storage={storage}
                        dragConfig={{
                            topMax: dragTopMax,
                            isAutoScrolling: isAutoScrolling,
                            draggingRowId: draggingRowId,
                            initialTop: dragInitialTop,
                            initialIndex: dragInitialIndex,
                            top: dragTop,
                            index: dragIndex,
                            onDragEnd: handleDragEndWorklet,
                            onDragStart: handleDragStartWorklet
                        }}
                        {...rest}
                        onCreateItem={onCreateItem}
                        onDeleteItem={onDeleteItem}
                    />
                )}
            </View>

            {/* Lower List Line */}
            {itemIds.length > 0 && (
                <Pressable onPress={handleEmptySpaceClick}>
                    <ThinLine />
                </Pressable>
            )}

            {/* Empty Label or Click Area */}
            {emptyLabelConfig && itemIds.length === 0 ? (
                <EmptyLabel
                    {...emptyLabelConfig}
                    onPress={handleEmptySpaceClick}
                />
            ) : (
                <Pressable
                    className='flex-1'
                    onPress={handleEmptySpaceClick}
                />
            )}

        </View>
    )
};

export default DragAndDropList;