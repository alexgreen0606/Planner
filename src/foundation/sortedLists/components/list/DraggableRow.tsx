import Animated, {
    cancelAnimation,
    runOnJS,
    SharedValue,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withDecay,
    withDelay,
    withRepeat,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import {
    ListItem,
    ListItemIconConfig,
} from "../../types";
import { useScrollContainer } from "../../services/ScrollContainerProvider";
import { useCallback, useMemo } from "react";
import { Gesture, GestureDetector, Pressable } from "react-native-gesture-handler";
import { PlatformColor, StyleSheet, TouchableOpacity, View } from "react-native";
import ListTextfield from "../ListTextfield";
import GenericIcon from "../../../components/GenericIcon";
import ThinLine from "./ThinLine";
import { generateSortId, getParentSortIdFromPositions } from "../../utils";
import { AUTO_SCROLL_SPEED, ItemStatus, LIST_ICON_SPACING, LIST_ITEM_HEIGHT, LIST_SEPARATOR_HEIGHT, LIST_SPRING_CONFIG, SCROLL_OUT_OF_BOUNDS_RESISTANCE } from "../../constants";
import { useDeleteScheduler } from "../../services/DeleteScheduler";
import useDimensions from "../../../hooks/useDimensions";
import { BOTTOM_NAVIGATION_HEIGHT, HEADER_HEIGHT } from "../../../../constants";
import globalStyles from "../../../../theme/globalStyles";

const Row = Animated.createAnimatedComponent(View);

enum AutoScrollDirection {
    UP = 'UP',
    DOWN = 'DOWN'
}

export interface RowProps<T extends ListItem> {
    item: T;
    items: T[];
    listLength: number;
    positions: SharedValue<Record<string, number>>;
    disableDrag?: boolean;
    hideKeyboard: boolean;
    saveTextfieldAndCreateNew: (parentSortId?: number) => Promise<void>;
    onDeleteItem: (item: T) => Promise<void> | void;
    onDragEnd?: (updatedItem: T) => Promise<void | string> | void;
    onContentClick: (item: T) => void;
    getTextfieldKey: (item: T) => string;
    handleValueChange?: (text: string, item: T) => T;
    getLeftIconConfig?: (item: T) => ListItemIconConfig<T>;
    getRightIconConfig?: (item: T) => ListItemIconConfig<T>;
    getRowTextPlatformColor?: (item: T) => string;
    customIsItemDeleting?: (item: T) => boolean;
}

/**
 * A draggable row component for sortable lists that supports drag-to-reorder,
 * textfields, and icons.
 */
const DraggableRow = <T extends ListItem>({
    positions,
    getTextfieldKey,
    item: staticItem,
    items,
    getLeftIconConfig,
    getRightIconConfig,
    handleValueChange,
    getRowTextPlatformColor,
    onContentClick,
    disableDrag,
    onDeleteItem,
    saveTextfieldAndCreateNew,
    listLength,
    onDragEnd,
    hideKeyboard,
    customIsItemDeleting
}: RowProps<T>) => {

    const {
        BOTTOM_SPACER,
        SCREEN_HEIGHT,
        TOP_SPACER
    } = useDimensions();

    const {
        scrollOffset,
        currentTextfield,
        setCurrentTextfield,
        disableNativeScroll,
        scrollOffsetBounds,
    } = useScrollContainer();

    const { isItemDeleting } = useDeleteScheduler();
    const isItemDeletingCustom = customIsItemDeleting ?? isItemDeleting;

    /**
     * The current item, either from static props or from the context if it is being edited.
     */
    const item = useMemo(() =>
        currentTextfield?.id === staticItem.id ? currentTextfield : staticItem,
        [currentTextfield, staticItem]
    );

    // ------------- Animation Variables -------------
    const TOP_AUTO_SCROLL_BOUND = HEADER_HEIGHT + TOP_SPACER; // TODO: add in height of floating navbar too
    const BOTTOM_AUTO_SCROLL_BOUND = SCREEN_HEIGHT - BOTTOM_SPACER - BOTTOM_NAVIGATION_HEIGHT - LIST_ITEM_HEIGHT;

    const isAwaitingInitialPosition = useSharedValue(!!positions.value[item.id]);
    const isDragging = useSharedValue(0);
    const isManualScrolling = useSharedValue(false);
    const top = useSharedValue(0);
    const initialGesturePosition = useSharedValue(0);
    const autoScrollTrigger = useSharedValue<number | null>(null);

    // ------------- Row Configuration Variables -------------
    const customTextPlatformColor = useMemo(() => getRowTextPlatformColor?.(item), [item, getRowTextPlatformColor]);
    const leftIconConfig = useMemo(() => getLeftIconConfig?.(item), [item, getLeftIconConfig]);
    const rightIconConfig = useMemo(() => getRightIconConfig?.(item), [item, getRightIconConfig]);

    // ------------- Edit Utilities -------------

    /**
     * Updates the content of the row's textfield, with optional formatting
     * @param text The new text value from the input field
     */
    function handleTextfieldChange(text: string) {
        setCurrentTextfield(handleValueChange?.(text, currentTextfield) ?? { ...currentTextfield, value: text });
    }

    /**
     * Saves the textfield content or deletes empty items
     */
    function handleTextfieldSave(createNew: boolean = true) {
        if (item.value.trim() !== '') {
            saveTextfieldAndCreateNew(createNew ? item.sortId : undefined);
        } else {
            if (item.status === ItemStatus.NEW) {
                setCurrentTextfield(undefined);
            } else {
                onDeleteItem(item);
            }
        }
    }

    // ------------- Drag Utilities -------------

    /**
     * Finds the smallest and largest number the top value can be to keep it within its relative container.
     * @returns Minimum and Maximum numbers the top can contain.
     */
    const getTopBoundaries = () => {
        'worklet';
        const minBound = 0;
        const maxBound = Math.max(0, LIST_ITEM_HEIGHT * (listLength - 1));
        return { minBound, maxBound };
    };

    const sanitizeTopValue = (newPosition: number = scrollOffset.value) => {
        'worklet';
        const { minBound, maxBound } = getTopBoundaries();
        return Math.max(minBound, Math.min(newPosition, maxBound));
    };

    /**
     * Updates the position map so that this row aligns with the user's
     * drag.
     */
    const updateRowPosition = () => {
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

    const drag = (
        currentDragDisplacement: number,
        currentTopAbsoluteYPosition: number
    ) => {
        'worklet';

        const beginAutoScroll = (direction: AutoScrollDirection) => {
            'worklet';
            const displacement = direction === AutoScrollDirection.UP ? -AUTO_SCROLL_SPEED : AUTO_SCROLL_SPEED;
            disableNativeScroll.value = true;

            const handleAutoScrollEnd = () => {
                'worklet';
                autoScrollTrigger.value = null;
                disableNativeScroll.value = false;
            };

            autoScrollTrigger.value = withRepeat(
                withTiming(displacement, { duration: 0 }),
                -1,
                false,
                handleAutoScrollEnd
            );
            return;
        };

        if (!autoScrollTrigger.value) {
            if (currentTopAbsoluteYPosition <= TOP_AUTO_SCROLL_BOUND) {
                // --- Auto Scroll Up ---
                beginAutoScroll(AutoScrollDirection.UP)
                return;
            }
            else if (currentTopAbsoluteYPosition >= BOTTOM_AUTO_SCROLL_BOUND) {
                // --- Auto Scroll Down ---
                beginAutoScroll(AutoScrollDirection.DOWN)
                return;
            }
        } else if (
            currentTopAbsoluteYPosition > TOP_AUTO_SCROLL_BOUND &&
            currentTopAbsoluteYPosition < BOTTOM_AUTO_SCROLL_BOUND
        ) {
            // --- Cancel Auto Scroll ---
            cancelAnimation(autoScrollTrigger);
        }

        // --- Drag the item ---
        top.value = withTiming(
            sanitizeTopValue(initialGesturePosition.value + currentDragDisplacement),
            { duration: 16 }
        );
        updateRowPosition();
    };

    /**
     * Resets all UI thread animated values to their defaults
     */
    const endDrag = () => {
        'worklet';
        cancelAnimation(autoScrollTrigger);
        cancelAnimation(isDragging);
        isDragging.value = 0;
        initialGesturePosition.value = 0;
        top.value = positions.value[item.id] * LIST_ITEM_HEIGHT;
    };

    // ------------- Scroll Utilities -------------

    const sanitizeScrollOffset = (newPosition: number = scrollOffset.value) => {
        'worklet';
        return Math.max(scrollOffsetBounds.value.min, Math.min(newPosition, scrollOffsetBounds.value.max));
    };

    const beginManulaScroll = () => {
        'worklet';
        cancelAnimation(isDragging);
        isManualScrolling.value = true;
        disableNativeScroll.value = true;
        initialGesturePosition.value = scrollOffset.value;
    };

    /**
     * Handles scrolling with elastic resistance.
     * @param distance Scroll distance (negative for down, positive for up)
     */
    const manualScroll = (currentDragDisplacement: number) => {
        'worklet';
        const unresistedScrollPosition = initialGesturePosition.value - currentDragDisplacement;

        // --- Apply Resistance When Out of Bounds ---
        let resistedScrollPosition;
        if (unresistedScrollPosition < scrollOffsetBounds.value.min) {
            const overscroll = scrollOffsetBounds.value.min - unresistedScrollPosition;
            resistedScrollPosition = scrollOffsetBounds.value.min - (overscroll * SCROLL_OUT_OF_BOUNDS_RESISTANCE);
        } else if (unresistedScrollPosition > scrollOffsetBounds.value.max) {
            const overscroll = unresistedScrollPosition - scrollOffsetBounds.value.max;
            resistedScrollPosition = scrollOffsetBounds.value.max + (overscroll * SCROLL_OUT_OF_BOUNDS_RESISTANCE);
        } else {
            resistedScrollPosition = unresistedScrollPosition;
        }

        scrollOffset.value = withTiming(resistedScrollPosition, { duration: 16 });
    };

    /**
     * Executes a scroll rebound if user scrolled past container bounds,
     * or continues scrolling with momentum if within bounds.
     * @param velocity The velocity at which the user was scrolling
     */
    const endManualScroll = (velocity: number = 0) => {
        'worklet';
        const isScrollOutOfBounds =
            scrollOffset.value < scrollOffsetBounds.value.min ||
            scrollOffset.value > scrollOffsetBounds.value.max;

        const handleScrollEnd = () => {
            'worklet';
            isManualScrolling.value = false;
            disableNativeScroll.value = false;
            initialGesturePosition.value = 0;
        };

        if (isScrollOutOfBounds) {
            // --- Rebound to valid position ---
            scrollOffset.value = withSpring(
                sanitizeScrollOffset(),
                {
                    stiffness: 100,
                    damping: 40,
                    mass: .6,
                    overshootClamping: true
                },
                handleScrollEnd
            );
        } else {
            // --- Momentum Decay ---
            scrollOffset.value = withDecay(
                {
                    velocity: -velocity,
                    rubberBandEffect: true,
                    clamp: [scrollOffsetBounds.value.min, scrollOffsetBounds.value.max],
                    rubberBandFactor: SCROLL_OUT_OF_BOUNDS_RESISTANCE
                },
                handleScrollEnd
            );
        }
    };

    /**
     * Creates a gesture handler for item content or separator lines.
     * Content areas can be dragged (after long press) or clicked, while
     * separator lines can only be scrolled or clicked to create new items.
     * 
     * @param isContentArea Whether this handler is for content (true) or separator (false)
     * @returns A Gesture.Pan() handler with appropriate behavior
     */
    const createGestureHandler = useCallback((onClick: () => void) => {
        return Gesture.Pan()
            .onTouchesDown(() => {
                if (disableDrag) return;
                // --- Initiate Drag After Delay ---
                isDragging.value = withDelay(500, withTiming(1, { duration: 0 }, (finished) => {
                    if (finished) {
                        initialGesturePosition.value = top.value;
                    }
                }));
            })
            .onStart(() => {
                if (isDragging.value) return;
                // --- Initiate Scroll If Drag Hasn't Begun ---
                beginManulaScroll();
            })
            .onUpdate((event) => {
                if (isManualScrolling.value) {
                    // --- Scroll ---
                    manualScroll(event.translationY);
                } else if (isDragging.value) {
                    // --- Drag ---
                    drag(
                        event.translationY,
                        event.absoluteY
                    );
                }
            })
            .onFinalize((event) => {
                if (isManualScrolling.value) {
                    // --- End Manual Scroll ---
                    endManualScroll(event.velocityY);
                } else if (isDragging.value) {
                    // --- End Drag ---
                    endDrag();
                    if (onDragEnd) {
                        runOnJS(onDragEnd)({
                            ...item,
                            sortId: generateSortId(
                                getParentSortIdFromPositions(item, positions, items),
                                items
                            )
                        });
                    }
                } else {
                    // --- Click ---
                    cancelAnimation(isDragging);
                    if (item.id !== currentTextfield?.id) {
                        runOnJS(onClick)();
                    }
                }
            })
    }, [item]);

    // ------------- Animations -------------

    // Move swapped items
    useAnimatedReaction(
        () => positions.value[item.id],
        (currPosition, prevPosition) => {
            if (currPosition !== prevPosition && !isDragging.value) {
                if (isAwaitingInitialPosition.value || item.status === ItemStatus.NEW) {
                    top.value = positions.value[item.id] * LIST_ITEM_HEIGHT;
                    isAwaitingInitialPosition.value = false;
                } else {
                    top.value = withSpring(positions.value[item.id] * LIST_ITEM_HEIGHT, LIST_SPRING_CONFIG);
                }
            }
        },
        [isDragging.value]
    );

    // Auto Scroll
    useAnimatedReaction(
        () => ({
            trigger: autoScrollTrigger.value
        }),
        ({ trigger }) => {
            if (!trigger) return;

            const newTop = sanitizeTopValue(top.value + trigger);
            const newScroll = sanitizeScrollOffset(scrollOffset.value + trigger);
            const { maxBound } = getTopBoundaries();
            if ([0, maxBound].includes(newTop) || [0, 2000].includes(newScroll)) {
                cancelAnimation(autoScrollTrigger);
            }

            top.value = newTop;
            scrollOffset.value = newScroll;
            initialGesturePosition.value += trigger;
            updateRowPosition();
        },
        [isDragging.value]
    );

    /**
     * Animated style for positioning the row and scaling when dragged.
     */
    const animatedRowStyle = useAnimatedStyle(() => ({
        top: top.value,
        transform: [
            {
                scale: withSpring(isDragging.value ? 0.8 : 1, {
                    damping: 15,
                    stiffness: 200,
                    mass: 1,
                    overshootClamping: true, // TODO: make opacity instead
                })
            }
        ]
    }));

    // ------------- Render Helper Functions -------------

    const renderIcon = (config: ListItemIconConfig<T>, type: 'left' | 'right') => {
        if (config.hideIcon) return null;

        const iconStyle = type === 'left' ? {
            marginLeft: LIST_ICON_SPACING,
            marginBottom: LIST_SEPARATOR_HEIGHT
        } : {
            marginRight: LIST_ICON_SPACING / 2
        }
        const size = type === 'left' ? 'm' : 's';

        if (config.customIcon) {
            return (
                <TouchableOpacity
                    activeOpacity={config.onClick ? 0 : 1}
                    onPress={() => config.onClick?.(item)}
                    style={iconStyle}
                >
                    {config.customIcon}
                </TouchableOpacity>
            );
        }

        if (config.icon) {
            return (
                <GenericIcon
                    {...config.icon}
                    onClick={() => config.onClick?.(item)}
                    size={size}
                    style={iconStyle}
                />
            );
        }

        return null;
    };

    return (
        <Row style={[animatedRowStyle, styles.row]}>

            {/* Left Icon */}
            {leftIconConfig && renderIcon(leftIconConfig, 'left')}

            {/* Content */}
            <View style={styles.content}>
                <View style={globalStyles.verticallyCentered}>
                    <GestureDetector gesture={createGestureHandler(() => onContentClick(item))}>
                        <ListTextfield<T>
                            key={getTextfieldKey(item)}
                            item={item}
                            onChange={handleTextfieldChange}
                            onSubmit={handleTextfieldSave}
                            hideKeyboard={hideKeyboard}
                            isAwaitingInitialPosition={isAwaitingInitialPosition}
                            customStyle={{
                                color: PlatformColor(customTextPlatformColor ??
                                    (isItemDeletingCustom(item) ? 'tertiaryLabel' :
                                        item.recurringId ? 'secondaryLabel' : 'label')
                                ),
                                textDecorationLine: isItemDeletingCustom(item) ?
                                    'line-through' : undefined,
                            }}
                        />
                    </GestureDetector>

                    {/* Right Icon */}
                    {rightIconConfig && renderIcon(rightIconConfig, 'right')}
                </View>

                {/* Separator Line */}
                <GestureDetector gesture={createGestureHandler(() => saveTextfieldAndCreateNew(item.sortId))}>
                    <Pressable>
                        <ThinLine />
                    </Pressable>
                </GestureDetector>
            </View>

        </Row>
    )
};

const styles = StyleSheet.create({
    row: {
        position: 'absolute',
        alignItems: 'center',
        flexDirection: 'row',
        width: '100%',
        height: LIST_ITEM_HEIGHT,
    },
    content: {
        flex: 1,
        height: LIST_ITEM_HEIGHT,
        marginLeft: LIST_ICON_SPACING
    },
});

export default DraggableRow;