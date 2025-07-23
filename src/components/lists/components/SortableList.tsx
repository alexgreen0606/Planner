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
import { cancelAnimation, runOnJS, runOnUI, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ListRow from './ListRow';
import EmptyLabel, { EmptyLabelProps } from '../../EmptyLabel';
import ScrollContainerAnchor from '../../ScrollContainerAnchor';
import ListToolbar, { ToolbarIcon } from './ListToolbar';

// ✅ 

type SortableListProps<T extends IListItem> = {
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
    onValueChange?: (text: string, item: T) => T;
    onGetLeftIconConfig?: (item: T) => TListItemIconConfig<T>;
    onGetRightIconConfig?: (item: T) => TListItemIconConfig<T>;
    onGetRowTextPlatformColor?: (item: T) => string;
    onSaveTextfieldAndCreateNew: (referenceId?: number, isChildId?: boolean) => void;
    customOnGetIsDeleting?: (item: T) => boolean;
};

const SortableList = <T extends IListItem>({
    listId,
    items,
    isLoading,
    emptyLabelConfig,
    fillSpace,
    toolbarIconSet,
    hideKeyboard,
    disableDrag = false,
    onDragEnd,
    onSaveTextfieldAndCreateNew,
    ...rest
}: SortableListProps<T>) => {
    const { floatingBannerHeight, scrollOffset, measureContentHeight } = useScrollContainer();
    const { top: TOP_SPACER, bottom: BOTTOM_SPACER } = useSafeAreaInsets();
    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const [textfieldItem] = useTextfieldItemAs<T>();

    // ------------- Drag Variables -------------

    const draggingRowId = useSharedValue<string | null>(null);
    const isAutoScrolling = useSharedValue(false);

    const dragInitialScrollOffset = useSharedValue(0);
    const dragInitialIndex = useSharedValue(0);
    const dragInitialTop = useSharedValue(0);

    const dragTop = useSharedValue(0);
    const dragIndex = useDerivedValue(() => Math.floor(dragTop.value / LIST_ITEM_HEIGHT));

    const upperAutoScrollBound = HEADER_HEIGHT + TOP_SPACER + floatingBannerHeight;
    const lowerAutoScrollBound = SCREEN_HEIGHT - BOTTOM_SPACER - BOTTOM_NAVIGATION_HEIGHT - LIST_ITEM_HEIGHT;

    // ==================
    // 1. Event Handlers
    // ==================

    function handleEmptySpaceClick() {
        onSaveTextfieldAndCreateNew(-1, true);
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

    function handleDragEnd(updatedItem?: T) {
        "worklet";

        cancelAnimation(scrollOffset);
        isAutoScrolling.value = false;

        if (updatedItem && onDragEnd) {
            runOnJS(onDragEnd)(updatedItem);
        } else {
            draggingRowId.value = null;
        }
    }

    // ===================
    // 2. List Generation
    // ===================

    const list = useMemo(() => {
        let fullList = items.filter(item => item.status !== EItemStatus.HIDDEN);

        if (textfieldItem?.listId === listId) {
            fullList = sanitizeList(fullList, textfieldItem);
        }

        if (draggingRowId.value) {
            handleDragEnd();
        }

        return fullList.sort((a, b) => a.sortId - b.sortId);
    }, [
        textfieldItem?.id,
        items
    ]);

    // ------------- Drag Bounds Tracker -------------
    const dragTopMax = Math.max(0, LIST_ITEM_HEIGHT * (list.length - 1));

    // =============
    // 3. Reactions
    // =============

    // Auto Scrolling
    useAnimatedReaction(
        () => scrollOffset.value - dragInitialScrollOffset.value,
        (displacement) => {
            dragTop.value += displacement;
            dragInitialTop.value += displacement;
            dragInitialScrollOffset.value = scrollOffset.value;
        }
    );

    // Evaluate the scroll container height every time the list length changes.
    useEffect(() => {
        runOnUI(measureContentHeight)();
    }, [list.length]);

    // ========
    // 4. UI
    // ========

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
                        height: list.length * LIST_ITEM_HEIGHT
                    }}
                >
                    {list.map((item, i) =>
                        <ListRow<T>
                            key={`${item.id}-row`}
                            item={item}
                            itemIndex={i}
                            toolbarIconSet={toolbarIconSet}
                            upperAutoScrollBound={upperAutoScrollBound}
                            lowerAutoScrollBound={lowerAutoScrollBound}
                            hideKeyboard={Boolean(hideKeyboard)}
                            dragConfig={{
                                disableDrag: disableDrag,
                                topMax: dragTopMax,
                                isAutoScrolling: isAutoScrolling,
                                draggingRowId: draggingRowId,
                                initialTop: dragInitialTop,
                                initialIndex: dragInitialIndex,
                                top: dragTop,
                                index: dragIndex,
                                onDragEnd: handleDragEnd,
                                onDragStart: handleDragStart
                            }}
                            {...rest}
                            items={list}
                            onSaveTextfieldAndCreateNew={onSaveTextfieldAndCreateNew}
                        />
                    )}
                </View>

                {/* Lower List Line */}
                {list.length > 0 && (
                    <Pressable onPress={handleEmptySpaceClick}>
                        <ThinLine />
                    </Pressable>
                )}

                {/* Track Position of List End */}
                {fillSpace && (
                    <ScrollContainerAnchor />
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
                    <ListToolbar iconSets={toolbarIconSet} accessoryKey='PLACEHOLDER' />
                )}

            </View>
        </MotiView>
    );
};

export default SortableList;