import GenericIcon from "@/components/GenericIcon";
import ThinLine from "@/components/ThinLine";
import { useMemo } from "react";
import { PlatformColor, StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector, Pressable } from "react-native-gesture-handler";
import Animated, {
    cancelAnimation,
    runOnJS,
    scrollTo,
    SharedValue,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming
} from "react-native-reanimated";
import { useDeleteScheduler } from "../../../services/DeleteScheduler";
import { useScrollContainer } from "../../../services/ScrollContainerProvider";
import { generateSortId, getParentSortIdFromPositions } from "../utils";
import ListTextfield from "./ListTextfield";
import { HEADER_HEIGHT, BOTTOM_NAVIGATION_HEIGHT, LIST_CONTENT_HEIGHT, LIST_ICON_SPACING, LIST_ITEM_HEIGHT, spacing } from "@/constants/layout";
import { useDimensions } from "@/services/DimensionsProvider";
import { ListItemIconConfig } from "../lib/listRowConfig";
import { IListItem } from "@/types/listItems/core/TListItem";
import { EItemStatus } from "@/enums/EItemStatus";
import { AUTO_SCROLL_SPEED, LIST_SPRING_CONFIG } from "@/constants/listConstants";

const Row = Animated.createAnimatedComponent(View);

enum AutoScrollDirection {
    UP = 'UP',
    DOWN = 'DOWN'
}

export interface RowProps<T extends IListItem> {
    item: T;
    items: T[];
    listLength: number;
    positions: SharedValue<Record<string, number>>;
    disableDrag?: boolean;
    hideKeyboard: boolean;
    saveTextfieldAndCreateNew: (referenceSortId?: number, isChildId?: boolean) => Promise<void>;
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
const DraggableRow = <T extends IListItem>({
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
        scrollRef,
        currentTextfield,
        setCurrentTextfield,
        disableNativeScroll,
        scrollOffsetBounds,
        floatingBannerHeight
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

    const topBoundaries = useMemo(() => {
        const min = 0;
        const max = Math.max(0, LIST_ITEM_HEIGHT * (listLength - 1));
        return { min, max };
    }, [listLength]);

    // ------------- Animation Variables -------------
    const TOP_AUTO_SCROLL_BOUND = HEADER_HEIGHT + TOP_SPACER + floatingBannerHeight;
    const BOTTOM_AUTO_SCROLL_BOUND = SCREEN_HEIGHT - BOTTOM_SPACER - BOTTOM_NAVIGATION_HEIGHT - LIST_ITEM_HEIGHT;

    const isAutoScrolling = useSharedValue(false);
    const isAwaitingInitialPosition = useSharedValue(positions.value[item.id] === undefined);
    const isDragging = useSharedValue(false);
    const top = useSharedValue(positions.value[item.id] ?? 0);
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
            if (item.status === EItemStatus.NEW) {
                setCurrentTextfield(undefined);
            } else {
                onDeleteItem(item);
            }
        }
    }

    // ------------- Drag Utilities -------------

    const sanitizeTopValue = (value: number) => {
        'worklet';
        const { min, max } = topBoundaries;
        return Math.max(min, Math.min(value, max));
    };

    const sanitizeScrollOffset = (value: number) => {
        'worklet';
        const { min, max } = scrollOffsetBounds.value;
        return Math.max(min, Math.min(value, max));
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
        isDragging.value = false;
        isAutoScrolling.value = false;
        initialGesturePosition.value = 0;
        top.value = positions.value[item.id] * LIST_ITEM_HEIGHT;
    };

    // ------------- Animations -------------

    // Move swapped items
    useAnimatedReaction(
        () => positions.value[item.id],
        (currPosition, prevPosition) => {
            if (currPosition !== prevPosition && !isDragging.value) {
                if (isAwaitingInitialPosition.value || (item.status === EItemStatus.NEW)) {
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

            if ([topBoundaries.min, topBoundaries.max].includes(newTop)) {
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

    // ------------- Gestures -------------

    const pressGesture = Gesture.Tap()
        .onEnd(() => {
            runOnJS(onContentClick)(item)
        });

    const longPressGesture = Gesture.LongPress()
        .minDuration(500)
        .onStart(() => {
            if (disableDrag) return;

            isDragging.value = true;
            initialGesturePosition.value = top.value;
        });

    const dragGesture = Gesture.Pan()
        .manualActivation(true)
        .onTouchesMove((_e, state) => {
            if (isDragging.value) {
                state.activate();
            } else {
                state.fail();
            }
        })
        .onUpdate((event) => {
            drag(
                event.translationY,
                event.absoluteY
            );
        })
        .onFinalize(() => {
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
        })
        .simultaneousWithExternalGesture(longPressGesture);

    const contentGesture = Gesture.Race(dragGesture, longPressGesture, pressGesture);

    // ------------- Render Helper Functions -------------

    const renderIcon = (config: ListItemIconConfig<T>, type: 'left' | 'right') => {
        if (config.hideIcon) return null;

        const size = type === 'left' ? 'm' : 's';

        if (config.customIcon) {
            return (
                <TouchableOpacity
                    activeOpacity={config.onClick ? 0 : 1}
                    onPress={() => config.onClick?.(item)}
                    className='mr-4'
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
                    className='mr-4'
                />
            );
        }

        return null;
    };

    return (
        <Row style={[animatedRowStyle, styles.row]}>

            {/* Separator Line */}
            <Pressable onPress={() => saveTextfieldAndCreateNew(item.sortId, true)}>
                <ThinLine />
            </Pressable>

            <View style={styles.content}>

                {/* Left Icon */}
                {leftIconConfig && renderIcon(leftIconConfig, 'left')}

                {/* Content */}
                <GestureDetector gesture={contentGesture}>
                    <ListTextfield<T>
                        key={getTextfieldKey(item)}
                        item={item}
                        onChange={handleTextfieldChange}
                        onSubmit={handleTextfieldSave}
                        hideKeyboard={hideKeyboard}
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

        </Row>
    )
};

const styles = StyleSheet.create({
    row: {
        position: 'absolute',
        width: '100%',
        height: LIST_ITEM_HEIGHT,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: LIST_CONTENT_HEIGHT,
        marginLeft: LIST_ICON_SPACING
    },
});

export default DraggableRow;