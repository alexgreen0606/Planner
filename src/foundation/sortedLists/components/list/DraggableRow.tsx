import Animated, {
    cancelAnimation,
    runOnJS,
    runOnUI,
    SharedValue,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import {
    AUTO_SCROLL_SPEED,
    ItemStatus,
    LIST_ITEM_HEIGHT,
    LIST_SPRING_CONFIG,
    ListItem,
    ListItemUpdateComponentProps,
    SCROLL_THROTTLE
} from "../../types";
import { DraggableListProps } from "./SortableList";
import { useSortableListContext } from "../../services/SortableListProvider";
import { useCallback, useMemo, useRef, useState } from "react";
import { Gesture, GestureDetector, Pressable } from "react-native-gesture-handler";
import { StyleSheet, TouchableOpacity, useWindowDimensions, View } from "react-native";
import CustomText from "../../../components/text/CustomText";
import ListTextfield from "../ListTextfield";
import { Portal } from "react-native-paper";
import { Palette } from "../../../theme/colors";
import GenericIcon from "../../../components/GenericIcon";
import ThinLine from "../../../components/ThinLine";
import { generateSortId, getParentSortIdFromPositions, isItemDeleting, isItemTextfield } from "../../utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BANNER_HEIGHT } from "../../../components/constants";

/**
 * Props for the DraggableRow component.
 */
interface RowProps<
    T extends ListItem,
    P extends ListItemUpdateComponentProps<T> = ListItemUpdateComponentProps<T>,
    M extends ListItemUpdateComponentProps<T> = ListItemUpdateComponentProps<T>
> extends Omit<DraggableListProps<T, P, M>, 'initializeNewItem' | 'staticList' | 'hideList' | 'listId' | 'handleSaveTextfield' | 'onSaveTextfield' | 'emptyLabelConfig'> {
    /** The item to be rendered */
    item: T;
    /** Shared value containing the positions of all items in the list */
    positions: SharedValue<Record<string, number>>;
    /** Function to save the current textfield and create a new item after the current one */
    saveTextfieldAndCreateNew: (parentSortId: number) => Promise<void>;
    /** Total number of items in the list */
    listLength: number;
}

/**
 * A draggable row component for sortable lists that supports drag-to-reorder,
 * textfields, icons, modals, and popovers.
 */
const DraggableRow = <
    T extends ListItem,
    P extends ListItemUpdateComponentProps<T>,
    M extends ListItemUpdateComponentProps<T>
>({
    positions,
    getTextfieldKey,
    item: staticItem,
    items,
    getLeftIconConfig,
    getRightIconConfig,
    getModal,
    handleValueChange,
    getRowTextColor,
    onContentClick,
    getPopovers,
    disableDrag,
    onDeleteItem,
    saveTextfieldAndCreateNew,
    listLength,
    onDragEnd
}: RowProps<T, P, M>) => {
    const windowDimensions = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const TOP_AUTO_SCROLL_BOUND = insets.top + BANNER_HEIGHT;
    const BOTTOM_AUTO_SCROLL_BOUND = windowDimensions.height - insets.bottom - BANNER_HEIGHT - LIST_ITEM_HEIGHT;

    // Context for the sortable list operations
    const {
        scroll,
        scrollPosition,
        currentTextfield,
        setCurrentTextfield,
        endScroll,
        isManualScrolling,
        sanitizeScrollPosition,
        unboundedScrollPosition
    } = useSortableListContext();

    /**
     * The current item, either from static props or from the context if it's being edited
     */
    const item = useMemo(() =>
        currentTextfield?.id === staticItem.id ? currentTextfield : staticItem,
        [currentTextfield, staticItem]
    );

    const [isLoadingInitialPosition, setIsLoadingInitialPosition] = useState(true);

    // ------------- Animation and Gesture State -------------
    const isDragging = useSharedValue(false);
    const top = useSharedValue(-1000);
    const isScrolling = useSharedValue(false);
    const prevY = useSharedValue(0);
    const dragInitialPosition = useSharedValue(0);
    const beginDragTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const autoScrollTrigger = useSharedValue(0);
    const isAutoScrolling = useSharedValue(false);
    const autoScrollDirection = useSharedValue<'up' | 'down' | null>(null);

    // ------------- Row Configuration -------------
    const customTextColor = useMemo(() => getRowTextColor?.(item), [item, getRowTextColor]);
    const leftIconConfig = useMemo(() => getLeftIconConfig?.(item), [item, getLeftIconConfig]);
    const rightIconConfig = useMemo(() => getRightIconConfig?.(item), [item, getRightIconConfig]);
    const modalConfig = useMemo(() => getModal?.(item), [item, getModal]);
    const popoverConfigs = useMemo(() => getPopovers?.(item), [item, getPopovers]);
    const Modal = useMemo(() => modalConfig?.component, [modalConfig]);
    const Popovers = useMemo(() => popoverConfigs?.map(config => config.component),
        [popoverConfigs]
    );

    // ------------- Utility Functions -------------

    /**
     * Clears any active drag timeout
     */
    const clearDragTimeout = () => {
        if (beginDragTimeoutRef.current) {
            clearTimeout(beginDragTimeoutRef.current);
            beginDragTimeoutRef.current = undefined;
        }
    };

    /**
     * Resets all UI thread animated values to their defaults
     */
    const resetUIThreadValues = () => {
        'worklet';
        isScrolling.value = false;
        isDragging.value = false;
        prevY.value = 0;
        dragInitialPosition.value = 0;
        top.value = positions.value[item.id] * LIST_ITEM_HEIGHT;
        isManualScrolling.value = false;
    };

    /**
     * Starts a timeout that will trigger drag mode if the user holds down
     * on a content area for long enough
     */
    const startDragTimeout = () => {
        beginDragTimeoutRef.current = setTimeout(() => {
            runOnUI(() => {
                isScrolling.value = false;
                isDragging.value = true;
                dragInitialPosition.value = positions.value[item.id] * LIST_ITEM_HEIGHT;
            })();
        }, 500);
    };

    /**
     * Updates the content of the row's textfield, with optional formatting
     * @param text The new text value from the input field
     */
    const handleTextfieldChange = (text: string) => {
        setCurrentTextfield((curr: T) => handleValueChange?.(text, curr) ?? { ...curr, value: text });
    };

    /**
     * Saves the textfield content or deletes empty items
     */
    const handleTextfieldSave = () => {
        if (item.value.trim() !== '') {
            saveTextfieldAndCreateNew(item.sortId);
        } else {
            if (item.status === ItemStatus.NEW) {
                setCurrentTextfield(undefined);
            } else {
                onDeleteItem(item);
            }
        }
    };

    /**
     * Gets the minimum and maximum boundary values for dragging
     */
    const getTopValueBoundaries = () => {
        'worklet';
        const minBound = 0;
        const maxBound = Math.max(0, LIST_ITEM_HEIGHT * (listLength - 1));
        return { minBound, maxBound };
    };

    /**
     * Ensures the top value stays within valid boundaries
     * @param newPosition Optional new position value (defaults to current scroll position)
     * @returns A valid top value that stays within list boundaries
     */
    const sanitizeTopValue = (newPosition: number = scrollPosition.value) => {
        'worklet';
        const { minBound, maxBound } = getTopValueBoundaries();
        return Math.max(minBound, Math.min(newPosition, maxBound));
    };

    /**
     * Updates the positions of all items in the list based on the current
     * drag position
     */
    const updateListPosition = () => {
        'worklet';
        const newPosition = Math.floor(top.value / LIST_ITEM_HEIGHT);
        if (newPosition !== positions.value[item.id]) {
            const newObject = { ...positions.value };
            const from = positions.value[item.id];
            for (const id in positions.value) {
                if (positions.value[id] === from) {
                    newObject[id] = newPosition;
                }
                if (positions.value[id] === newPosition) {
                    newObject[id] = from;
                }
            }
            positions.value = newObject;
        }
    };

    // const autoScroll = (direction: 'up' | 'down' | null) => {
    //     'worklet';
    //     cancelAnimation(autoScrollTrigger);

    //     if (direction === null) {
    //         // Stop auto-scrolling
    //         isAutoScrolling.value = false;
    //         autoScrollDirection.value = null;
    //         return;
    //     }

    //     // Start new auto-scroll
    //     isAutoScrolling.value = true;
    //     autoScrollDirection.value = direction;
    //     autoScrollTrigger.value = withRepeat(
    //         withTiming(1, { duration: SCROLL_THROTTLE }),
    //         -1,
    //         false
    //     );
    // };

    /**
     * Creates a gesture handler for item content or separator lines.
     * Content areas can be dragged (after long press) or clicked, while
     * separator lines can only be scrolled or clicked to create new items.
     * 
     * @param isContentArea Whether this handler is for content (true) or separator (false)
     * @returns A Gesture.Pan() handler with appropriate behavior
     */
    const createGestureHandler = useCallback((isContentArea = true) => {
        return Gesture.Pan()
            .onTouchesDown(() => {
                if (!disableDrag) {
                    runOnJS(startDragTimeout)();
                }
            })
            .onStart(() => {
                if (isDragging.value) return;

                runOnJS(clearDragTimeout)();
                isScrolling.value = true;
            })
            .onUpdate((event) => {
                if (isScrolling.value) { // Scrolling
                    const newY = prevY.value - event.translationY;
                    scroll(-newY);
                    prevY.value = event.translationY;
                } else if (isDragging.value) { // Dragging
                    isManualScrolling.value = true;
                    const fingerPositionY = event.absoluteY;
                    const fingerBelowUpperBound = fingerPositionY > TOP_AUTO_SCROLL_BOUND + 30;
                    const fingerAboveLowerBound = fingerPositionY < BOTTOM_AUTO_SCROLL_BOUND - 30;

                    console.log(fingerPositionY, 'position')
                    console.log(insets)

                    if (isAutoScrolling.value) {
                        // Container is scrolling
                        const pullingDownFromUpperBound = autoScrollDirection.value === 'up' && fingerBelowUpperBound;
                        const pullingUpFromLowerBound = autoScrollDirection.value === 'down' && fingerAboveLowerBound;
                        if (!pullingDownFromUpperBound && !pullingUpFromLowerBound) {
                            return;
                        } else {
                            // autoScroll(null);
                            isAutoScrolling.value = false;
                            autoScrollDirection.value = null;
                            cancelAnimation(scrollPosition);
                            cancelAnimation(top);
                        }
                    }

                    const { minBound, maxBound } = getTopValueBoundaries();

                    if (fingerPositionY <= TOP_AUTO_SCROLL_BOUND && !isScrolling.value) {
                        // Begin scrolling up
                        // autoScroll('up');
                        scrollPosition.value = withTiming(0, { duration: positions.value[item.id] * 1000 }, () => unboundedScrollPosition.value = scrollPosition.value);
                        top.value = withTiming(minBound, { duration: positions.value[item.id] * 1000 });
                        isAutoScrolling.value = true;
                        autoScrollDirection.value = 'up';
                        return;
                    }
                    else if (fingerPositionY >= BOTTOM_AUTO_SCROLL_BOUND && !isScrolling.value) {
                        // Begin scrolling down
                        // autoScroll('down');
                        scrollPosition.value = withTiming(2000, { duration: item.length - positions.value[item.id] * 1000 }, () => unboundedScrollPosition.value = scrollPosition.value);
                        top.value = withTiming(maxBound, { duration: items.length - positions.value[item.id] * 1000 });
                        isAutoScrolling.value = true;
                        autoScrollDirection.value = 'down';
                        return;
                    }

                    // Drag the item
                    const newPosition = sanitizeTopValue(dragInitialPosition.value + event.translationY);
                    top.value = withTiming(newPosition, { duration: 16 });
                    // updateListPosition();
                }
            })
            .onFinalize((event) => {
                if (isScrolling.value) {
                    endScroll(event.velocityY);
                } else if (isDragging.value) {
                    // Update item sort ID after drag is complete
                    const newParentSortId = getParentSortIdFromPositions(item, positions, items);
                    const newSortId = generateSortId(newParentSortId, items);
                    runOnJS(onDragEnd)({ ...item, sortId: newSortId });

                    if (isAutoScrolling.value) {
                        // autoScroll(null);
                        isAutoScrolling.value = false;
                        autoScrollDirection.value = null;
                        cancelAnimation(scrollPosition);
                        cancelAnimation(top);
                    }
                } else {
                    if (isContentArea) {
                        runOnJS(onContentClick)(item);
                    } else {
                        runOnJS(saveTextfieldAndCreateNew)(item.sortId);
                    }
                }
                resetUIThreadValues();
                runOnJS(clearDragTimeout)();
            }
            )
    }, []);

    // ------------- Animations -------------

    // Move swapped items
    useAnimatedReaction(
        () => positions.value[item.id],
        (currPosition, prevPosition) => {
            if (currPosition !== prevPosition && !isDragging.value) {
                if (isLoadingInitialPosition) {
                    top.value = positions.value[item.id] * LIST_ITEM_HEIGHT;
                    runOnJS(setIsLoadingInitialPosition)(false);
                } else {
                    top.value = withSpring(positions.value[item.id] * LIST_ITEM_HEIGHT, LIST_SPRING_CONFIG);
                }
            }
        },
        [isDragging.value, isLoadingInitialPosition]
    );

    // Add use animated reaction to update positions whenever top changes?
    useAnimatedReaction(
        () => top.value,
        (curr, prev) => {
            if (curr !== prev) {
                updateListPosition();
            }
        }
    )

    // Auto scrolling
    // useAnimatedReaction(
    //     () => ({
    //         isScrolling: isAutoScrolling.value,
    //         direction: autoScrollDirection.value,
    //         trigger: autoScrollTrigger.value
    //     }),
    //     ({ isScrolling, direction }) => {
    //         if (!isScrolling || !direction || !isDragging.value) return;

    //         const moveAmount = direction === 'up' ? -AUTO_SCROLL_SPEED : AUTO_SCROLL_SPEED;
    //         const newTop = sanitizeTopValue(top.value + moveAmount);
    //         const newScroll = sanitizeScrollPosition(scrollPosition.value + moveAmount);
    //         const { maxBound } = getTopValueBoundaries();

    //         // Stop auto-scrolling if we reach the bounds
    //         if (newTop === (direction === 'up' ? 0 : maxBound) || newScroll === (direction === 'up' ? 0 : 2000)) {
    //             isAutoScrolling.value = false;
    //             autoScrollDirection.value = null;
    //             cancelAnimation(autoScrollTrigger);
    //             return;
    //         }

    //         top.value = newTop;
    //         scrollPosition.value = newScroll;
    //         dragInitialPosition.value += moveAmount;
    //         updateListPosition();
    //     },
    //     [isDragging.value]
    // );

    /**
     * Animated style for positioning the row and scaling when dragged
     */
    const rowPositionStyle = useAnimatedStyle(() => {
        return {
            height: LIST_ITEM_HEIGHT,
            width: '100%',
            position: 'absolute',
            top: top.value,
            transform: [
                {
                    scale: withSpring(isDragging.value ? 0.8 : 1, {
                        damping: 15,
                        stiffness: 200,
                        mass: 1,
                        overshootClamping: true,
                    }),
                },
            ],
        }
    }, [top.value, isDragging.value]);

    /**
     * Animated style for positioning popovers relative to the row
     */
    const popoverPositionStyle = useAnimatedStyle(() => ({
        left: 4,
        position: 'absolute',
        top: top.value + LIST_ITEM_HEIGHT - scrollPosition.value + 100
    }), [top.value, scrollPosition.value]);

    return <Animated.View style={rowPositionStyle}>
        <View key={item.id} style={styles.row}>
            {/* Left Icon */}
            {leftIconConfig &&
                !leftIconConfig.hideIcon &&
                (leftIconConfig.customIcon ? (
                    <TouchableOpacity
                        activeOpacity={leftIconConfig.onClick ? 0 : 1}
                        onPress={() => leftIconConfig.onClick?.(item)}
                    >
                        {leftIconConfig.customIcon}
                    </TouchableOpacity>
                ) : leftIconConfig.icon ? (
                    <GenericIcon
                        {...leftIconConfig.icon}
                        onClick={() => leftIconConfig.onClick?.(item)}
                        size='m'
                    />
                ) : null)}

            {/* Content */}
            {isItemTextfield(item) ? (
                <ListTextfield<T>
                    key={getTextfieldKey(item)}
                    item={item}
                    onChange={handleTextfieldChange}
                    onSubmit={handleTextfieldSave}
                />
            ) : (
                <GestureDetector gesture={createGestureHandler(true)}>
                    <View style={styles.content}>
                        <CustomText
                            adjustsFontSizeToFit
                            numberOfLines={1}
                            type='standard'
                            style={{
                                color: customTextColor ||
                                    (isItemDeleting(item) ? Palette.DIM : item.recurringId ? Palette.GREY : Palette.WHITE),
                                textDecorationLine: isItemDeleting(item) ?
                                    'line-through' : undefined,
                                width: '100%'
                            }}
                        >
                            {item.value}
                        </CustomText>
                    </View>
                </GestureDetector>
            )}

            {/* Right Icon */}
            {rightIconConfig &&
                !rightIconConfig.hideIcon &&
                (rightIconConfig.customIcon ? (
                    <TouchableOpacity
                        activeOpacity={rightIconConfig.onClick ? 0 : 1}
                        onPress={() => rightIconConfig.onClick?.(item)}
                    >
                        {rightIconConfig.customIcon}
                    </TouchableOpacity>
                ) : rightIconConfig.icon ? (
                    <GenericIcon
                        {...rightIconConfig.icon}
                        onClick={() => rightIconConfig.onClick?.(item)}
                        size='s'
                    />
                ) : null)}
        </View>

        {/* Separator Line */}
        <GestureDetector gesture={createGestureHandler(false)}>
            <Pressable>
                <ThinLine />
            </Pressable>
        </GestureDetector>

        {/* Row Modal */}
        {isItemTextfield(item) && modalConfig && Modal && (
            <Modal
                {...modalConfig.props}
                onSave={(newItem: T) => setCurrentTextfield(modalConfig.props.onSave(newItem))}
            />
        )}

        {/* Row Popovers */}
        {isItemTextfield(item) && popoverConfigs && Popovers && Popovers.map((Popover, i) => (
            <Portal key={`${item.id}-popover-${i}`}>
                <Animated.View style={popoverPositionStyle}>
                    <Popover
                        {...popoverConfigs[i].props}
                        onSave={(newItem: T) => setCurrentTextfield(popoverConfigs[i].props.onSave(newItem))}
                    />
                </Animated.View>
            </Portal>
        ))}
    </Animated.View>
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
        paddingHorizontal: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        height: 25,
        width: '100%',
    }
});

export default DraggableRow;