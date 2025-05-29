import GenericIcon from "@/components/GenericIcon";
import ThinLine from "@/components/ThinLine";
import { LIST_CONTENT_HEIGHT, LIST_ICON_SPACING, LIST_ITEM_HEIGHT } from "@/constants/layout";
import { LIST_SPRING_CONFIG } from "@/constants/listConstants";
import { EItemStatus } from "@/enums/EItemStatus";
import { useDeleteScheduler } from "@/hooks/useDeleteScheduler";
import { useTextfieldData } from "@/hooks/useTextfieldData";
import { useScrollContainer } from "@/services/ScrollContainer";
import { ListItemIconConfig } from "@/types/listItems/core/rowConfigTypes";
import { IListItem } from "@/types/listItems/core/TListItem";
import { generateSortId } from "@/utils/listUtils";
import { useEffect, useMemo } from "react";
import { PlatformColor, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector, Pressable } from "react-native-gesture-handler";
import Animated, {
    cancelAnimation,
    DerivedValue,
    runOnJS,
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from "react-native-reanimated";
import ListTextfield from "./ListTextfield";

const Row = Animated.createAnimatedComponent(View);

enum AutoScrollDirection {
    UP = 'UP',
    DOWN = 'DOWN'
}

enum IconPosition {
    RIGHT = 'RIGHT',
    LEFT = 'LEFT'
}

export interface RowProps<T extends IListItem> {
    item: T;
    items: T[];
    itemIndex: number;
    hideKeyboard: boolean;
    upperAutoScrollBound: number;
    lowerAutoScrollBound: number;
    dragControls: {
        handleDragStart: () => void;
        initialIndex: SharedValue<number>;
        initialTop: SharedValue<number>;
        isAutoScrolling: SharedValue<boolean>;
        topMax: number;
        top: SharedValue<number>;
        index: DerivedValue<number>;
        handleDragEnd: () => void;
    },
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
    getTextfieldKey,
    item: staticItem,
    items,
    dragControls,
    getLeftIconConfig,
    getRightIconConfig,
    handleValueChange,
    getRowTextPlatformColor,
    onContentClick,
    itemIndex,
    upperAutoScrollBound,
    lowerAutoScrollBound,
    onDeleteItem,
    saveTextfieldAndCreateNew,
    onDragEnd,
    hideKeyboard,
    customIsItemDeleting
}: RowProps<T>) => {
    const { currentTextfield, setCurrentTextfield } = useTextfieldData<T>();
    const { isItemDeleting } = useDeleteScheduler<T>();
    const {
        scrollOffset,
        autoScroll
    } = useScrollContainer();

    const {
        handleDragStart,
        handleDragEnd,
        initialIndex,
        initialTop,
        isAutoScrolling,
        topMax,
        top,
        index,
    } = dragControls;

    const isItemDeletingCustom = customIsItemDeleting ?? isItemDeleting;

    const item = useMemo(() =>
        currentTextfield?.id === staticItem.id ? currentTextfield : staticItem,
        [currentTextfield, staticItem]
    );

    const baseTop = useSharedValue(itemIndex * LIST_ITEM_HEIGHT);
    useEffect(() => {
        baseTop.value = itemIndex * LIST_ITEM_HEIGHT;
    }, [itemIndex]);

    const isDragging = useSharedValue(false);

    // ------------- Row Configuration Variables -------------
    const customTextPlatformColor = useMemo(() => getRowTextPlatformColor?.(item), [item, getRowTextPlatformColor]);
    const leftIconConfig = useMemo(() => getLeftIconConfig?.(item), [item, getLeftIconConfig]);
    const rightIconConfig = useMemo(() => getRightIconConfig?.(item), [item, getRightIconConfig]);

    // ------------- Utility Functions -------------

    function handleTextfieldChange(text: string) {
        if (!currentTextfield) return;
        setCurrentTextfield(handleValueChange?.(text, currentTextfield) ?? { ...currentTextfield, value: text });
    }

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

    const drag = (
        currentDragDisplacement: number,
        currentTopAbsoluteYPosition: number
    ) => {
        'worklet';

        const beginAutoScroll = (direction: AutoScrollDirection) => {
            'worklet';

            const targetBound = direction === AutoScrollDirection.UP ? 0 : topMax;
            const distanceToBound = targetBound - top.value;

            isAutoScrolling.value = true;
            autoScroll(distanceToBound);
        };

        if (!isAutoScrolling.value) {
            if (currentTopAbsoluteYPosition <= upperAutoScrollBound) {
                // --- Auto Scroll Up ---
                beginAutoScroll(AutoScrollDirection.UP)
                return;
            }
            else if (currentTopAbsoluteYPosition >= lowerAutoScrollBound) {
                // --- Auto Scroll Down ---
                beginAutoScroll(AutoScrollDirection.DOWN)
                return;
            }
        } else if (
            currentTopAbsoluteYPosition > upperAutoScrollBound &&
            currentTopAbsoluteYPosition < lowerAutoScrollBound
        ) {
            // --- Cancel Auto Scroll ---
            cancelAnimation(scrollOffset);
            isAutoScrolling.value = false;
        }

        // --- Drag the item ---
        top.value = Math.max(0, Math.min(initialTop.value + currentDragDisplacement, topMax));
    };

    // Reset all animated variables to their default values
    function endDrag() {
        'worklet';

        isDragging.value = false;
        baseTop.value = index.value * LIST_ITEM_HEIGHT;
        handleDragEnd();
    }

    // ------------- Row Animation -------------

    // Position the row and style it when dragging
    const animatedRowStyle = useAnimatedStyle(() => {
        let rowOffset = 0;

        if (!isDragging.value) {
            if (itemIndex > initialIndex.value && itemIndex <= index.value) {
                rowOffset = -LIST_ITEM_HEIGHT;
            } else if (itemIndex < initialIndex.value && itemIndex >= index.value) {
                rowOffset = LIST_ITEM_HEIGHT;
            }
        }

        return {
            top: isDragging.value ? top.value : withSpring(baseTop.value + rowOffset, LIST_SPRING_CONFIG),
            transform: [
                {
                    translateY: withSpring(isDragging.value ? -6 : 0, LIST_SPRING_CONFIG)
                }
            ],
            opacity: withSpring(isDragging.value ? 0.6 : 1, LIST_SPRING_CONFIG)
        }
    });

    // ------------- Gestures -------------

    const pressGesture = Gesture.Tap()
        .onEnd(() => {
            runOnJS(onContentClick)(item)
        });

    const longPressGesture = Gesture.LongPress()
        .minDuration(500)
        .onStart(() => {
            handleDragStart();
            initialTop.value = baseTop.value;
            initialIndex.value = itemIndex;
            isDragging.value = true;
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
            if (onDragEnd && index.value !== initialIndex.value) {
                const updatedItem = {
                    ...item,
                    sortId: generateSortId(items[(index.value ?? 0) - 1]?.sortId ?? -1, items)
                };
                console.log(updatedItem, 'NEW ITEM')
                runOnJS(onDragEnd)(updatedItem);
            }
            endDrag();
        })
        .simultaneousWithExternalGesture(longPressGesture);

    const contentGesture = Gesture.Race(dragGesture, longPressGesture, pressGesture);

    // ------------- Render Helper Functions -------------

    const renderIcon = (config: ListItemIconConfig<T>, type: IconPosition) => {
        if (config.hideIcon) return null;

        const size = type === IconPosition.LEFT ? 'm' : 's';

        if (config.customIcon) {
            return (
                <TouchableOpacity
                    activeOpacity={config.onClick ? 0 : 1}
                    onPress={() => config.onClick?.(item)}
                    className='mr-2'
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
        <Row
            className="w-full absolute"
            style={[
                animatedRowStyle,
                { height: LIST_ITEM_HEIGHT }
            ]}
        >

            {/* Separator Line */}
            <Pressable onPress={() => saveTextfieldAndCreateNew(item.sortId, true)}>
                <ThinLine />
            </Pressable>

            <View
                className="items-center justify-center flex-row"
                style={{
                    height: LIST_CONTENT_HEIGHT,
                    marginLeft: LIST_ICON_SPACING
                }}
            >

                {/* Left Icon */}
                {leftIconConfig && renderIcon(leftIconConfig, IconPosition.LEFT)}

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
                                (isItemDeletingCustom(item) ? 'tertiaryLabel' : 'label')
                            ),
                            textDecorationLine: isItemDeletingCustom(item) ?
                                'line-through' : undefined
                        }}
                    />
                </GestureDetector>

                {/* Right Icon */}
                {rightIconConfig && renderIcon(rightIconConfig, IconPosition.RIGHT)}

            </View>
        </Row>
    )
};

export default DraggableRow;