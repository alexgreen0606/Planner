import ThinLine from '@/components/ThinLine';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { BOTTOM_NAVIGATION_HEIGHT, HEADER_HEIGHT, LIST_ITEM_HEIGHT } from '@/lib/constants/layout';
import { EItemStatus } from '@/lib/enums/EItemStatus';
import { EListType } from '@/lib/enums/EListType';
import { IListItem } from '@/lib/types/listItems/core/TListItem';
import { TListItemIconConfig } from '@/lib/types/listItems/core/TListItemIconConfig';
import { useScrollContainer } from '@/providers/ScrollContainer';
import { sanitizeList } from '@/utils/listUtils';
import { MotiView } from 'moti';
import React, { useEffect, useMemo } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { cancelAnimation, runOnUI, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableRow from './Row';
import EmptyLabel, { EmptyLabelProps } from './EmptyLabel';
import ScrollAnchor from './ScrollAnchor';
import Toolbar, { ToolbarIcon } from './Toolbar';

type DraggableListProps<T extends IListItem> = {
    listId: string;
    items: T[];
    toolbarIconSet?: ToolbarIcon<T>[][];
    emptyLabelConfig?: Omit<EmptyLabelProps, 'onPress'>;
    listType: EListType;
    hideKeyboard?: boolean;
    isLoading?: boolean;
    fillSpace?: boolean;
    disableDrag?: boolean;
    onDragEnd?: (updatedItem: T) => Promise<any> | any;
    onContentClick: (item: T) => void;
    handleValueChange?: (text: string, item: T) => T;
    getLeftIconConfig?: (item: T) => TListItemIconConfig<T>;
    getRightIconConfig?: (item: T) => TListItemIconConfig<T>;
    getRowTextPlatformColor?: (item: T) => string;
    saveTextfieldAndCreateNew: (referenceId?: number, isChildId?: boolean) => void;
    customGetIsDeleting?: (item: T) => boolean;
};

const SortableList = <T extends IListItem>({
    listId,
    items,
    isLoading,
    saveTextfieldAndCreateNew,
    emptyLabelConfig,
    fillSpace,
    toolbarIconSet,
    disableDrag = false,
    hideKeyboard,
    ...rest
}: DraggableListProps<T>) => {
    const { floatingBannerHeight, scrollOffset, measureContentHeight } = useScrollContainer();
    const { top: TOP_SPACER, bottom: BOTTOM_SPACER } = useSafeAreaInsets();
    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const [textfieldItem] = useTextfieldItemAs<T>();

    const draggingRowId = useSharedValue<string | null>(null);
    const isAutoScrolling = useSharedValue(false);

    const dragInitialScrollOffset = useSharedValue(0);
    const dragInitialIndex = useSharedValue<number>(0);
    const dragInitialTop = useSharedValue(0);

    const dragScrollOffsetDelta = useSharedValue(0);
    const dragTop = useSharedValue<number>(0);

    const dragIndex = useDerivedValue(() => Math.floor(dragTop.value / LIST_ITEM_HEIGHT));

    const upperAutoScrollBound = HEADER_HEIGHT + TOP_SPACER + floatingBannerHeight;
    const lowerAutoScrollBound = SCREEN_HEIGHT - BOTTOM_SPACER - BOTTOM_NAVIGATION_HEIGHT - LIST_ITEM_HEIGHT;

    // Builds the list out of the existing items and the textfield.
    const list = useMemo(() => {
        let fullList = items.filter(item => item.status !== EItemStatus.HIDDEN);

        if (textfieldItem?.listId === listId) {
            fullList = sanitizeList(fullList, textfieldItem);
        }

        // If the list updates, assume no drag is occuring.
        draggingRowId.value = null;

        return fullList.sort((a, b) => a.sortId - b.sortId);
    }, [
        textfieldItem?.id,
        items
    ]);

    const dragTopMax = useMemo(() =>
        Math.max(0, LIST_ITEM_HEIGHT * (list.length - 1)),
        [list.length]
    );

    useEffect(() => {
        runOnUI(measureContentHeight)();
    }, [list.length]);

    // ------------- Utility Functions -------------

    function handleEmptySpaceClick() {
        handleSaveTextfieldAndCreateNew(-1, true);
    }

    async function handleSaveTextfieldAndCreateNew(referenceSortId?: number, isChildId: boolean = false) {
        saveTextfieldAndCreateNew(referenceSortId, isChildId);
    }

    function handleDragStart(rowId: string, initialIndex: number) {
        "worklet";
        const initialTop = initialIndex * LIST_ITEM_HEIGHT;

        dragInitialScrollOffset.value = scrollOffset.value;
        dragInitialIndex.value = initialIndex;
        dragInitialTop.value = initialTop;

        dragTop.value = initialTop;
        draggingRowId.value = rowId;
    }

    function handleDragEnd() {
        "worklet";
        cancelAnimation(scrollOffset);
        dragScrollOffsetDelta.value = 0;
        isAutoScrolling.value = false;
    }

    // ------------- Animation -------------

    // Auto scroll.
    useAnimatedReaction(
        () => ({
            displacement: scrollOffset.value - dragInitialScrollOffset.value,
            delta: dragScrollOffsetDelta.value
        }),
        ({ displacement, delta }) => {
            dragTop.value += (displacement - delta);
            dragScrollOffsetDelta.value = displacement;
            dragInitialTop.value += (displacement - delta);
        }
    );

    return (
        <MotiView
            animate={{ opacity: isLoading ? 0 : 1 }}
            style={{ flex: fillSpace ? 1 : 0 }}
        >
            <View style={{ flex: fillSpace ? 1 : 0 }}>

                {/* List */}
                <View
                    className='w-full'
                    style={{
                        height: list.length * LIST_ITEM_HEIGHT
                    }}
                >
                    {list.map((item, i) =>
                        <DraggableRow<T>
                            key={`${item.id}-row`}
                            item={item}
                            itemIndex={i}
                            toolbarIconSet={toolbarIconSet}
                            disableDrag={disableDrag}
                            upperAutoScrollBound={upperAutoScrollBound}
                            lowerAutoScrollBound={lowerAutoScrollBound}
                            hideKeyboard={Boolean(hideKeyboard)}
                            draggingRowId={draggingRowId}
                            dragControls={{
                                top: dragTop,
                                index: dragIndex,
                                initialIndex: dragInitialIndex,
                                initialTop: dragInitialTop,
                                isAutoScrolling: isAutoScrolling,
                                topMax: dragTopMax,
                                handleDragEnd,
                                handleDragStart
                            }}
                            saveTextfieldAndCreateNew={handleSaveTextfieldAndCreateNew}
                            {...rest}
                            items={list}
                        />
                    )}
                </View>

                {list.length > 0 && (
                    <Pressable onPress={handleEmptySpaceClick}>
                        <ThinLine />
                    </Pressable>
                )}

                {/* Track Position of List End */}
                {fillSpace && (
                    <ScrollAnchor />
                )}

                {/* Empty Label or Click Area */}
                {emptyLabelConfig && list.length === 0 ? (
                    <EmptyLabel
                        {...emptyLabelConfig}
                        onPress={handleEmptySpaceClick}
                    />
                ) : !isLoading && (
                    <Pressable
                        style={{ flex: 1 }}
                        onPress={handleEmptySpaceClick}
                    />
                )}

                {/* Placeholder Toolbar (prevent flickering between textfields) */}
                {toolbarIconSet && (
                    <Toolbar iconSets={toolbarIconSet} accessoryKey='PLACEHOLDER' />
                )}
            </View>
        </MotiView>
    );
};

export default SortableList;