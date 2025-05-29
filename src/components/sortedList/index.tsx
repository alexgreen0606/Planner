import ThinLine from '@/components/ThinLine';
import { BOTTOM_NAVIGATION_HEIGHT, HEADER_HEIGHT, LIST_ITEM_HEIGHT } from '@/constants/layout';
import { EItemStatus } from '@/enums/EItemStatus';
import { useKeyboardTracker } from '@/hooks/useKeyboardTracker';
import { useTextfieldData } from '@/hooks/useTextfieldData';
import { useScrollContainer } from '@/services/ScrollContainer';
import { ListItemIconConfig, ListItemUpdateComponentProps, ModifyItemConfig } from '@/types/listItems/core/rowConfigTypes';
import { IListItem } from '@/types/listItems/core/TListItem';
import React, { useMemo, useRef } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { Portal } from 'react-native-paper';
import Animated, { cancelAnimation, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableRow from './DraggableRow';
import EmptyLabel, { EmptyLabelProps } from './EmptyLabel';

const ToolbarContainer = Animated.createAnimatedComponent(View);

export enum BoundType {
    MIN = 'MIN',
    MAX = 'MAX'
}

export interface DraggableListProps<
    T extends IListItem,
    P extends ListItemUpdateComponentProps<T> = never,
    M extends ListItemUpdateComponentProps<T> = never,
> {
    listId: string;
    items: T[];
    onDeleteItem: (item: T) => Promise<void> | void;
    onDragEnd?: (updatedItem: T) => Promise<void | string> | void;
    onContentClick: (item: T) => void;
    getTextfieldKey: (item: T) => string;
    handleValueChange?: (text: string, item: T) => T;
    getLeftIconConfig?: (item: T) => ListItemIconConfig<T>;
    getRightIconConfig?: (item: T) => ListItemIconConfig<T>;
    getRowTextPlatformColor?: (item: T) => string;
    saveTextfieldAndCreateNew: (item?: T, referenceId?: number, isChildId?: boolean) => void;
    getToolbar?: (item: T) => ModifyItemConfig<T, P>;
    getModal?: (item: T) => ModifyItemConfig<T, M>;
    emptyLabelConfig?: Omit<EmptyLabelProps, 'onPress'>;
    customIsItemDeleting?: (item: T) => boolean;
    hideKeyboard?: boolean;
    isLoading?: boolean;
    fillSpace?: boolean;
    disableDrag?: boolean;
    staticList?: boolean;
}

const SortableList = <
    T extends IListItem,
    P extends ListItemUpdateComponentProps<T>,
    M extends ListItemUpdateComponentProps<T>
>({
    listId,
    items,
    isLoading,
    saveTextfieldAndCreateNew,
    emptyLabelConfig,
    fillSpace,
    staticList,
    getToolbar,
    hideKeyboard,
    ...rest
}: DraggableListProps<T, P, M>) => {
    const { currentTextfield } = useTextfieldData<T>();
    const { keyboardAbsoluteTop } = useKeyboardTracker();
    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const { top: TOP_SPACER, bottom: BOTTOM_SPACER } = useSafeAreaInsets();
    const { floatingBannerHeight, scrollOffset } = useScrollContainer();

    const pendingItem = useRef<T | null>(null);
    const toolbarConfig = useMemo(() => currentTextfield ? getToolbar?.(currentTextfield) : null, [currentTextfield, getToolbar]);
    const Toolbar = useMemo(() => toolbarConfig?.component, [toolbarConfig]);

    // Builds the list out of the existing items and the textfield.
    const currentList = useMemo(() => {
        const fullList = items.filter(item => item.status !== EItemStatus.HIDDEN);
        if (currentTextfield?.listId === listId) {
            if (currentTextfield?.status === EItemStatus.NEW) {
                fullList.push(currentTextfield);
            } else {
                const textfieldIndex = fullList.findIndex(item => item.id === currentTextfield.id);
                if (textfieldIndex !== -1) {
                    fullList[textfieldIndex] = currentTextfield;
                }
            }
        }
        if (pendingItem.current) {
            if (!fullList.find(i => i.id === pendingItem.current?.id)) {
                fullList.push(pendingItem.current);
            } else {
                pendingItem.current = null;
            }
        }
        console.log([...fullList.sort((a, b) => a.sortId - b.sortId)], 'LIST')
        return fullList.sort((a, b) => a.sortId - b.sortId);
    }, [currentTextfield?.id, currentTextfield?.sortId, items]);

    const dragInitialScrollOffset = useSharedValue(0);
    const dragInitialTop = useSharedValue(0);
    const dragInitialIndex = useSharedValue<number>(0);

    const dragScrollOffsetDelta = useSharedValue(0);
    const dragTop = useSharedValue<number>(0);
    const dragIndex = useDerivedValue(() => Math.floor(dragTop.value / LIST_ITEM_HEIGHT));
    const isAutoScrolling = useSharedValue(false);

    const dragTopMax = useMemo(() =>
        Math.max(0, LIST_ITEM_HEIGHT * (currentList.length - 1)),
        [currentList.length]
    );

    const upperAutoScrollBound = HEADER_HEIGHT + TOP_SPACER + floatingBannerHeight;
    const lowerAutoScrollBound = SCREEN_HEIGHT - BOTTOM_SPACER - BOTTOM_NAVIGATION_HEIGHT - LIST_ITEM_HEIGHT;

    // ------------- Utility Functions -------------

    function handleEmptySpaceClick() {
        handleSaveTextfieldAndCreateNew(-1, true);
    }

    /**
     * Saves the existing textfield to storage and generates a new one at the requested position.
     * @param referenceSortId The sort ID of an item to place the new textfield near
     * @param isChildId Signifies if the reference ID should be below the new textfield, else above.
     */
    async function handleSaveTextfieldAndCreateNew(referenceSortId?: number, isChildId: boolean = false) {
        if (staticList) return;

        // if (currentTextfield.status !== EItemStatus.TRANSFER) {
        //         pendingItem.current = { ...currentTextfield };
        //     }

        saveTextfieldAndCreateNew(currentTextfield, referenceSortId, isChildId);
    }

    function handleDragStart() {
        "worklet";
        dragInitialScrollOffset.value = scrollOffset.value;
        dragScrollOffsetDelta.value = 0;
    }

    function handleDragEnd() {
        "worklet";
        cancelAnimation(scrollOffset);
        dragInitialScrollOffset.value = 0;
        dragScrollOffsetDelta.value = 0;
        dragInitialTop.value = 0;
        dragInitialIndex.value = 0;
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
        left: 0,
        position: 'absolute',
        top: keyboardAbsoluteTop.value
    }));

    return (
        <View style={{ flex: fillSpace ? 1 : 0 }}>

            {/* TODO: Loading SVG */}

            {/* List */}
            <View
                className='w-full'
                style={{
                    height: currentList.length * LIST_ITEM_HEIGHT
                }}
            >
                {currentList.map((item, i) =>
                    <DraggableRow<T>
                        key={`${item.id}-row`}
                        item={item}
                        itemIndex={i}
                        upperAutoScrollBound={upperAutoScrollBound}
                        lowerAutoScrollBound={lowerAutoScrollBound}
                        hideKeyboard={Boolean(hideKeyboard)}
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
                        items={currentList}
                    />
                )}
            </View>

            {currentList.length > 0 && (
                <Pressable onPress={handleEmptySpaceClick}>
                    <ThinLine />
                </Pressable>
            )}

            {/* Empty Label or Click Area */}
            {emptyLabelConfig && currentList.length === 0 ? (
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
            {Toolbar && toolbarConfig && !hideKeyboard && currentTextfield?.listId === listId &&
                <Portal>
                    <ToolbarContainer style={toolbarStyle}>
                        <Toolbar {...toolbarConfig.props} />
                    </ToolbarContainer>
                </Portal>
            }
        </View>
    );
};

export default SortableList;