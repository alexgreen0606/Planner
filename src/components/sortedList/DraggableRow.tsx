import GenericIcon from "@/components/icon";
import ThinLine from "@/components/ThinLine";
import { LIST_CONTENT_HEIGHT, LIST_ICON_SPACING, LIST_ITEM_HEIGHT } from "@/lib/constants/layout";
import { LIST_SPRING_CONFIG } from "@/lib/constants/listConstants";
import { EItemStatus } from "@/lib/enums/EItemStatus";
import { useScrollContainer } from "@/providers/ScrollContainer";
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
import { useTextfieldItemAs } from "@/hooks/useTextfieldItemAs";
import { IListItem } from "@/lib/types/listItems/core/TListItem";
import { TListItemIconConfig } from "@/lib/types/listItems/core/TListItemIconConfig";
import { useDeleteScheduler } from "@/providers/DeleteScheduler";
import { EListType } from "@/lib/enums/EListType";

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
    isListDragging: SharedValue<boolean>;
    disableDrag: boolean;
    dragControls: {
        handleDragStart: (initialTop: number, initialIndex: number) => void;
        initialIndex: SharedValue<number>;
        initialTop: SharedValue<number>;
        isAutoScrolling: SharedValue<boolean>;
        topMax: number;
        top: SharedValue<number>;
        index: DerivedValue<number>;
        handleDragEnd: () => void;
    },
    listType: EListType;
    saveTextfieldAndCreateNew: (referenceSortId?: number, isChildId?: boolean) => Promise<void>;
    onDragEnd?: (updatedItem: T) => Promise<void | string> | void;
    onContentClick: (item: T) => void;
    getTextfieldKey: (item: T) => string;
    handleValueChange?: (text: string, item: T) => T;
    getLeftIconConfig?: (item: T) => TListItemIconConfig<T>;
    getRightIconConfig?: (item: T) => TListItemIconConfig<T>;
    getRowTextPlatformColor?: (item: T) => string;
    customGetIsDeleting?: (item: T) => boolean;
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
    disableDrag,
    getLeftIconConfig,
    getRightIconConfig,
    handleValueChange,
    getRowTextPlatformColor,
    onContentClick,
    itemIndex,
    isListDragging,
    upperAutoScrollBound,
    lowerAutoScrollBound,
    saveTextfieldAndCreateNew,
    onDragEnd,
    listType,
    hideKeyboard,
    customGetIsDeleting
}: RowProps<T>) => {
    const [currentTextfield, setCurrentTextfield] = useTextfieldItemAs<T>();
    const { getIsItemDeleting } = useDeleteScheduler<T>();
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

    const item = useMemo(() =>
        currentTextfield?.id === staticItem.id ? currentTextfield : staticItem,
        [currentTextfield, staticItem]
    );

    const isItemDeleting = customGetIsDeleting ?? getIsItemDeleting;
    const pendingDelete = useMemo(
        () => isItemDeleting(item, listType),
        [getIsItemDeleting]
    );

    const basePosition = useSharedValue(itemIndex * LIST_ITEM_HEIGHT);
    useEffect(() => {
        basePosition.value = itemIndex * LIST_ITEM_HEIGHT;
    }, [itemIndex]);

    const isRowDragging = useSharedValue(false);

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
        saveTextfieldAndCreateNew(createNew ? item.sortId : undefined);
    }

    function handleDrag(
        currentDragDisplacement: number,
        currentTopAbsoluteYPosition: number
    ) {
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
    }

    async function handleEndDragAndSave() {
        if (index.value === initialIndex.value) {
            // Item didn't move. Clean up and quit.
            handleDragEnd();
            isRowDragging.value = false;
            return;
        }

        // Build the new list after drag.
        const withoutDragged = items.filter(i => i.id !== item.id);
        withoutDragged.splice(index.value, 0, item);

        // Generate the item's new sort ID.
        const parentSortId = withoutDragged[index.value - 1]?.sortId ?? -1;
        const newSort = generateSortId(parentSortId, withoutDragged);

        const updatedItem = { ...item, sortId: newSort };
        await onDragEnd?.(updatedItem);

        isRowDragging.value = false;
        handleDragEnd();
    }

    // ------------- Gestures -------------

    const pressGesture = Gesture.Tap()
        .onEnd(() => {
            runOnJS(onContentClick)(item)
        });

    const longPressGesture = Gesture.LongPress()
        .minDuration(500)
        .onTouchesDown((_e, state) => {
            if (disableDrag) {
                state.fail(); // prevent recognition
            }
        })
        .onStart(() => {
            handleDragStart(basePosition.value, itemIndex);
            isRowDragging.value = true;
        });

    const dragGesture = Gesture.Pan()
        .manualActivation(true)
        .onTouchesMove((_e, state) => {
            if (isRowDragging.value) {
                state.activate();
            } else {
                state.fail();
            }
        })
        .onUpdate((event) => {
            handleDrag(
                event.translationY,
                event.absoluteY
            );
        })
        .onFinalize(() => {
            if (!isRowDragging.value) return;

            runOnJS(handleEndDragAndSave)();
        })
        .simultaneousWithExternalGesture(longPressGesture);

    const contentGesture = Gesture.Race(dragGesture, longPressGesture, pressGesture);

    // ------------- Row Animation -------------

    // Position the row and style it when dragging
    const animatedRowStyle = useAnimatedStyle(() => {

        let rowOffset = 0;
        if (isListDragging.value && !isRowDragging.value) {
            if (itemIndex > initialIndex.value && itemIndex <= index.value) {
                rowOffset = -LIST_ITEM_HEIGHT;
            } else if (itemIndex < initialIndex.value && itemIndex >= index.value) {
                rowOffset = LIST_ITEM_HEIGHT;
            }
        }

        return {
            top: isRowDragging.value ? top.value : withSpring(basePosition.value + rowOffset, LIST_SPRING_CONFIG),
            transform: [
                {
                    translateY: withSpring(isRowDragging.value ? -6 : 0, LIST_SPRING_CONFIG)
                }
            ],
            opacity: withSpring(isRowDragging.value ? 0.6 : 1, LIST_SPRING_CONFIG)
        }
    });

    // ------------- Render Helper Functions -------------

    const renderIcon = (config: TListItemIconConfig<T>, type: IconPosition) => {
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
                            color: PlatformColor(customTextPlatformColor ?? (pendingDelete ? 'tertiaryLabel' : 'label')),
                            textDecorationLine: pendingDelete ? 'line-through' : undefined
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