import GenericIcon from "@/components/icon";
import ThinLine from "@/components/ThinLine";
import { useTextfieldItemAs } from "@/hooks/useTextfieldItemAs";
import { LIST_CONTENT_HEIGHT, LIST_ICON_SPACING, LIST_ITEM_HEIGHT, LIST_SPRING_CONFIG } from "@/lib/constants/listConstants";
import { EListType } from "@/lib/enums/EListType";
import { TListItem } from "@/lib/types/listItems/core/TListItem";
import { TListItemIconConfig } from "@/lib/types/listItems/core/TListItemIconConfig";
import { useDeleteScheduler } from "@/providers/DeleteScheduler";
import { useScrollContainer } from "@/providers/ScrollContainer";
import { generateSortId } from "@/utils/listUtils";
import { useMemo } from "react";
import { PlatformColor, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector, Pressable } from "react-native-gesture-handler";
import Animated, {
    cancelAnimation,
    DerivedValue,
    runOnJS,
    SharedValue,
    useAnimatedStyle,
    withSpring
} from "react-native-reanimated";
import { ToolbarIcon } from "./ListToolbar";
import ListTextfield from "./RowTextfield";

// ✅ 

type ListRowProps<T extends TListItem> = {
    item: T;
    items: T[];
    itemIndex: number;
    hideKeyboard: boolean;
    upperAutoScrollBound: number;
    lowerAutoScrollBound: number;
    dragConfig: {
        initialIndex: SharedValue<number>;
        initialTop: SharedValue<number>;
        isAutoScrolling: SharedValue<boolean>;
        topMax: number;
        top: SharedValue<number>;
        index: DerivedValue<number>;
        draggingRowId: SharedValue<string | null>;
        disableDrag: boolean;
        onDragStart: (rowId: string, initialIndex: number) => void;
        onDragEnd: (updatedItem?: T) => void;
    },
    listType: EListType;
    toolbarIconSet?: ToolbarIcon<T>[][];
    onSaveTextfieldAndCreateNew: (textfieldReferenceSortId?: number, isReferenceIdBelowTextfield?: boolean) => void;
    onContentClick: (item: T) => void;
    onValueChange?: (text: string, item: T) => T;
    onGetLeftIconConfig?: (item: T) => TListItemIconConfig<T>;
    onGetRightIconConfig?: (item: T) => TListItemIconConfig<T>;
    onGetRowTextPlatformColor?: (item: T) => string;
    customOnGetIsDeleting?: (item: T) => boolean;
};

const Row = Animated.createAnimatedComponent(View);

enum AutoScrollDirection {
    UP = 'UP',
    DOWN = 'DOWN'
}

enum IconPosition {
    RIGHT = 'RIGHT',
    LEFT = 'LEFT'
}

const ListRow = <T extends TListItem>({
    item: staticItem,
    items,
    dragConfig: {
        initialIndex,
        initialTop,
        isAutoScrolling,
        topMax,
        top,
        index,
        draggingRowId,
        disableDrag,
        onDragStart,
        onDragEnd
    },
    itemIndex,
    toolbarIconSet,
    upperAutoScrollBound,
    lowerAutoScrollBound,
    listType,
    hideKeyboard,
    onSaveTextfieldAndCreateNew,
    onGetLeftIconConfig,
    onGetRightIconConfig,
    onValueChange,
    onGetRowTextPlatformColor,
    onContentClick,
    customOnGetIsDeleting
}: ListRowProps<T>) => {
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<T>();
    const { handleGetIsItemDeleting: getIsItemDeleting } = useDeleteScheduler<T>();
    const {
        scrollOffset,
        handleAutoScroll: autoScroll
    } = useScrollContainer();

    const isItemDeleting = customOnGetIsDeleting ?? getIsItemDeleting;

    const item = useMemo(() =>
        textfieldItem?.id === staticItem.id ? textfieldItem : staticItem,
        [textfieldItem, staticItem]
    );

    const isPendingDelete = useMemo(
        () => isItemDeleting(item, listType),
        [getIsItemDeleting]
    );

    const textPlatformColor = useMemo(() => onGetRowTextPlatformColor?.(item), [item, onGetRowTextPlatformColor]);
    const leftIconConfig = useMemo(() => onGetLeftIconConfig?.(item), [item, onGetLeftIconConfig]);
    const rightIconConfig = useMemo(() => onGetRightIconConfig?.(item), [item, onGetRightIconConfig]);

    // ==================
    // 1. Event Handlers
    // ==================

    function handleTextfieldChange(text: string) {
        if (!textfieldItem) return;

        let newTextfieldItem = { ...textfieldItem, value: text };
        if (onValueChange) {
            newTextfieldItem = onValueChange(text, textfieldItem);
        }

        setTextfieldItem(newTextfieldItem);
    }

    function handleTextfieldSave(createNew: boolean = true) {
        onSaveTextfieldAndCreateNew(createNew ? item.sortId : undefined);
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

    function handleEndDrag() {
        if (index.value === initialIndex.value) {
            // Item didn't move. Clean up and quit.
            onDragEnd();
            return;
        }

        // Build the new list after drag.
        const withoutDragged = items.filter(i => i.id !== item.id);
        withoutDragged.splice(index.value, 0, item);
        const parentSortId = withoutDragged[index.value - 1]?.sortId ?? -1;

        onDragEnd({
            ...item,
            sortId: generateSortId(parentSortId, withoutDragged)
        });
    }

    // ============
    // 2. Gestures
    // ============

    const tapGesture = Gesture.Tap()
        .maxDuration(200)
        .onEnd(() => {
            runOnJS(onContentClick)(item)
        });

    const longPressGesture = Gesture.LongPress()
        .minDuration(500)
        .onTouchesDown((_e, state) => {
            if (disableDrag) {
                state.fail();
            }
        })
        .onStart(() => {
            onDragStart(item.id, itemIndex);
        });

    const panGesture = Gesture.Pan()
        .manualActivation(true)
        .onTouchesMove((_e, state) => {
            if (draggingRowId.value === item.id) {
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
            if (draggingRowId.value !== item.id) return;

            runOnJS(handleEndDrag)();
        })

    const dragGesture = Gesture.Simultaneous(longPressGesture, panGesture);
    const contentGesture = Gesture.Race(tapGesture, dragGesture);

    // ==============
    // 3. Animations
    // ==============

    const animatedRowStyle = useAnimatedStyle(() => {
        const isRowDragging = draggingRowId.value === item.id;
        const basePos = itemIndex * LIST_ITEM_HEIGHT;

        let rowOffset = 0;

        // Offset the row if the dragged item has shifted it.
        if (draggingRowId.value && !isRowDragging) {
            if (itemIndex > initialIndex.value && itemIndex <= index.value) {
                rowOffset = -LIST_ITEM_HEIGHT;
            } else if (itemIndex < initialIndex.value && itemIndex >= index.value) {
                rowOffset = LIST_ITEM_HEIGHT;
            }
        }

        return {
            top: isRowDragging ? top.value : withSpring(basePos + rowOffset, LIST_SPRING_CONFIG),
            transform: [
                {
                    translateY: withSpring(isRowDragging ? -6 : 0, LIST_SPRING_CONFIG)
                }
            ],
            opacity: withSpring(isRowDragging ? 0.6 : 1, LIST_SPRING_CONFIG)
        }
    });

    // ========
    // 4. UI
    // ========

    const RowIcon = ({ config, type }: { config: TListItemIconConfig<T>, type: IconPosition }) => {
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
            <Pressable onPress={() => onSaveTextfieldAndCreateNew(item.sortId, true)}>
                <ThinLine />
            </Pressable>

            <View
                className="flex-row  justify-center items-center"
                style={{
                    height: LIST_CONTENT_HEIGHT,
                    marginLeft: LIST_ICON_SPACING
                }}
            >

                {/* Left Icon */}
                {leftIconConfig && <RowIcon config={leftIconConfig} type={IconPosition.LEFT} />}

                {/* Content */}
                <GestureDetector gesture={contentGesture}>
                    <View
                        className="flex-1"
                        style={{
                            height: LIST_CONTENT_HEIGHT
                        }}
                    >
                        <ListTextfield<T>
                            item={item}
                            toolbarIconSet={toolbarIconSet}
                            onChange={handleTextfieldChange}
                            onSubmit={handleTextfieldSave}
                            hideKeyboard={hideKeyboard}
                            customStyle={{
                                color: PlatformColor(
                                    textPlatformColor ??
                                    (isPendingDelete ? 'tertiaryLabel' : 'label')
                                ),
                                textDecorationLine: isPendingDelete ? 'line-through' : undefined
                            }}
                        />
                    </View>
                </GestureDetector>

                {/* Right Icon */}
                {rightIconConfig && <RowIcon config={rightIconConfig} type={IconPosition.RIGHT} />}

            </View>
        </Row>
    );
};

export default ListRow;