import ThinLine from '@/components/ThinLine';
import useTextfieldItemAs from '@/hooks/useTextfieldItemAs';
import { LIST_ITEM_HEIGHT } from '@/lib/constants/listConstants';
import { BOTTOM_NAVIGATION_HEIGHT, HEADER_HEIGHT } from '@/lib/constants/miscLayout';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useScrollContainerContext } from '@/providers/ScrollContainer';
import { MotiView } from 'moti';
import React, { ReactNode, useEffect } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { cancelAnimation, runOnJS, runOnUI, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyLabel, { IEmptyLabelProps } from '../../EmptyLabel';
import ScrollContainerAnchor from '../../ScrollContainerAnchor';
import ListItem from './ListItem';
import ListToolbar, { IToolbarIconConfig } from './ListToolbar';

// ✅ 

type TDragAndDropListProps<T extends TListItem, S = T> = {
    itemIds: string[];
    listId: string;
    toolbarIconSet?: IToolbarIconConfig<T>[][];
    emptyLabelConfig?: Omit<IEmptyLabelProps, 'onPress'>;
    storageId: EStorageId;
    isLoading?: boolean;
    fillSpace?: boolean;
    storage: MMKV;
    defaultStorageObject?: S;
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
    isLoading,
    emptyLabelConfig,
    fillSpace,
    toolbarIconSet,
    storage,
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

    const {
        floatingBannerHeight,
        scrollOffset,
        onMeasureScrollContentHeight: onMeasureContentHeight
    } = useScrollContainerContext();

    const { textfieldItem, onCloseTextfield } = useTextfieldItemAs<T>(storage);

    const upperAutoScrollBound = HEADER_HEIGHT + TOP_SPACER + floatingBannerHeight;
    const lowerAutoScrollBound = SCREEN_HEIGHT - BOTTOM_SPACER - BOTTOM_NAVIGATION_HEIGHT - LIST_ITEM_HEIGHT;
    const dragTopMax = Math.max(0, LIST_ITEM_HEIGHT * (itemIds.length - 1));

    const placeholderItem: T = {
        id: 'PLACEHOLDER',
        listId: 'PLACEHOLDER',
        value: 'PLACEHOLDER',
        storageId
    } as T;

    // Auto Scrolling.
    useAnimatedReaction(
        () => scrollOffset.value - dragInitialScrollOffset.value,
        (displacement) => {
            dragTop.value += displacement;
            dragInitialTop.value += displacement;
            dragInitialScrollOffset.value = scrollOffset.value;
        }
    );

    useEffect(() => {
        draggingRowId.value = null;
    }, [itemIds]);

    // Evaluate the scroll container height every time the list length changes.
    useEffect(() => {
        runOnUI(onMeasureContentHeight)();
    }, [itemIds.length]);

    // ==================
    // 1. Event Handlers
    // ==================

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
    }

    // ======
    // 2. UI
    // ======

    return (
        <MotiView
            animate={{ opacity: isLoading ? 0 : 1 }}
            style={{ flex: fillSpace ? 1 : 0 }}
        >
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
                            toolbarIconSet={toolbarIconSet}
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

                {/* Track Position of List End */}
                {fillSpace && (
                    <ScrollContainerAnchor />
                )}

                {/* Empty Label or Click Area */}
                {emptyLabelConfig && itemIds.length === 0 ? (
                    <EmptyLabel
                        {...emptyLabelConfig}
                        onPress={handleEmptySpaceClick}
                    />
                ) : !isLoading && (
                    <Pressable
                        className='flex-1'
                        onPress={handleEmptySpaceClick}
                    />
                )}

                {/* Placeholder Toolbar (prevent flickering between textfields) */}
                {toolbarIconSet && (
                    <ListToolbar item={placeholderItem} iconSets={toolbarIconSet} accessoryKey='PLACEHOLDER' />
                )}

            </View>
        </MotiView>
    )
};

export default DragAndDropList;