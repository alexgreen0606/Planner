import ThinLine from '@/components/ThinLine';
import { BOTTOM_NAVIGATION_HEIGHT, HEADER_HEIGHT, LIST_ITEM_HEIGHT } from '@/constants/layout';
import { EItemStatus } from '@/enums/EItemStatus';
import { useKeyboardTracker } from '@/hooks/useKeyboardTracker';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { useScrollContainer } from '@/services/ScrollContainer';
import { TListItemIconConfig } from '@/types/listItems/core/TListItemIconConfig';
import { IListItem } from '@/types/listItems/core/TListItem';
import { sanitizeList } from '@/utils/listUtils';
import React, { useEffect, useMemo } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { Portal } from 'react-native-paper';
import Animated, { cancelAnimation, runOnUI, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScrollAnchor from '../ScrollAnchor';
import DraggableRow from './DraggableRow';
import EmptyLabel, { EmptyLabelProps } from './EmptyLabel';
import Toolbar, { ToolbarProps } from './ListItemToolbar';

const ToolbarContainer = Animated.createAnimatedComponent(View);

interface DraggableListProps<T extends IListItem> {
    listId: string;
    items: T[];
    onDeleteItem: (item: T) => Promise<void> | void;
    onDragEnd?: (updatedItem: T) => Promise<void | string> | void;
    onContentClick: (item: T) => void;
    getTextfieldKey: (item: T) => string;
    handleValueChange?: (text: string, item: T) => T;
    getLeftIconConfig?: (item: T) => TListItemIconConfig<T>;
    getRightIconConfig?: (item: T) => TListItemIconConfig<T>;
    getRowTextPlatformColor?: (item: T) => string;
    saveTextfieldAndCreateNew: (referenceId?: number, isChildId?: boolean) => void;
    getToolbarProps?: (item: T) => ToolbarProps<T>;
    emptyLabelConfig?: Omit<EmptyLabelProps, 'onPress'>;
    customIsItemDeleting?: (item: T) => boolean;
    hideKeyboard?: boolean;
    isLoading?: boolean;
    fillSpace?: boolean;
    disableDrag?: boolean;
}

const SortableList = <T extends IListItem>({
    listId,
    items,
    isLoading,
    saveTextfieldAndCreateNew,
    emptyLabelConfig,
    fillSpace,
    getToolbarProps,
    disableDrag = false,
    hideKeyboard,
    ...rest
}: DraggableListProps<T>) => {
    const [textfieldItem] = useTextfieldItemAs<T>();
    const { keyboardAbsoluteTop } = useKeyboardTracker();
    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const { top: TOP_SPACER, bottom: BOTTOM_SPACER } = useSafeAreaInsets();
    const { floatingBannerHeight, scrollOffset, measureContentHeight } = useScrollContainer();

    const toolbarProps = useMemo(() => textfieldItem ? getToolbarProps?.(textfieldItem) : null, [textfieldItem, getToolbarProps]);

    const isListDragging = useSharedValue<boolean>(false);
    const isAutoScrolling = useSharedValue(false);

    // Builds the list out of the existing items and the textfield.
    const list = useMemo(() => {
        let fullList = items.filter(item => item.status !== EItemStatus.HIDDEN);

        if (textfieldItem?.listId === listId) {
            fullList = sanitizeList(fullList, textfieldItem);
        }

        if (isListDragging.value) {
            isListDragging.value = false;
        }

        return fullList.sort((a, b) => a.sortId - b.sortId);
    }, [
        textfieldItem?.id, 
        textfieldItem?.sortId, 
        items
    ]);

    useEffect(() => {
        runOnUI(measureContentHeight)();
    }, [list.length]);

    const dragInitialScrollOffset = useSharedValue(0);
    const dragInitialTop = useSharedValue(0);
    const dragInitialIndex = useSharedValue<number>(0);

    const dragScrollOffsetDelta = useSharedValue(0);
    const dragTop = useSharedValue<number>(0);
    const dragIndex = useDerivedValue(() => Math.floor(dragTop.value / LIST_ITEM_HEIGHT));

    const dragTopMax = useMemo(() =>
        Math.max(0, LIST_ITEM_HEIGHT * (list.length - 1)),
        [list.length]
    );

    const upperAutoScrollBound = HEADER_HEIGHT + TOP_SPACER + floatingBannerHeight;
    const lowerAutoScrollBound = SCREEN_HEIGHT - BOTTOM_SPACER - BOTTOM_NAVIGATION_HEIGHT - LIST_ITEM_HEIGHT;

    // ------------- Utility Functions -------------

    function handleEmptySpaceClick() {
        handleSaveTextfieldAndCreateNew(-1, true);
    }

    async function handleSaveTextfieldAndCreateNew(referenceSortId?: number, isChildId: boolean = false) {
        saveTextfieldAndCreateNew(referenceSortId, isChildId);
    }

    function handleDragStart(initialTop: number, initialIndex: number) {
        "worklet";
        dragInitialScrollOffset.value = scrollOffset.value;
        dragScrollOffsetDelta.value = 0;
        dragInitialIndex.value = initialIndex;
        dragInitialTop.value = initialTop;
        dragTop.value = initialTop;
        isListDragging.value = true;
    }

    function handleDragEnd() {
        "worklet";
        cancelAnimation(scrollOffset);
        isAutoScrolling.value = false;
    }

    // ------------- Animations -------------

    // Auto scroll
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

    // Animate the toolbar above the textfield
    const toolbarStyle = useAnimatedStyle(() => ({
        top: keyboardAbsoluteTop.value
    }));

    return (
        <View style={{ flex: fillSpace ? 1 : 0 }}>

            {/* TODO: Loading SVG */}

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
                        disableDrag={disableDrag}
                        upperAutoScrollBound={upperAutoScrollBound}
                        lowerAutoScrollBound={lowerAutoScrollBound}
                        hideKeyboard={Boolean(hideKeyboard)}
                        isListDragging={isListDragging}
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

            {/* Toolbar */}
            {toolbarProps && !hideKeyboard && textfieldItem?.listId === listId &&
                <Portal>
                    <ToolbarContainer className='absolute left-0' style={toolbarStyle}>
                        <Toolbar {...toolbarProps} />
                    </ToolbarContainer>
                </Portal>
            }
        </View>
    );
};

export default SortableList;