import GenericIcon from "@/components/icon";
import ThinLine from "@/components/ThinLine";
import { LIST_CONTENT_HEIGHT, LIST_ICON_SPACING, LIST_ITEM_HEIGHT, LIST_SPRING_CONFIG } from "@/lib/constants/listConstants";
import { EItemStatus } from "@/lib/enums/EItemStatus";
import { TListItem } from "@/lib/types/listItems/core/TListItem";
import { TListItemIconConfig } from "@/lib/types/listItems/core/TListItemIconConfig";
import { useDeleteScheduler } from "@/providers/DeleteScheduler";
import { useScrollContainer } from "@/providers/ScrollContainer";
import { useEffect, useMemo } from "react";
import { PlatformColor, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector, Pressable } from "react-native-gesture-handler";
import { MMKV, useMMKVObject } from "react-native-mmkv";
import Animated, {
    cancelAnimation,
    DerivedValue,
    runOnJS,
    SharedValue,
    useAnimatedStyle,
    withSpring
} from "react-native-reanimated";
import ListItemTextfield from "./ListItemTextfield";
import { ToolbarIcon } from "./ListToolbar";

//

type TListItemProps<T extends TListItem> = {
    listId: string;
    itemId: string;
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
        onDragEnd: (newValue: number, prev?: T) => void;
    },
    toolbarIconSet?: ToolbarIcon<T>[][];
    storage: MMKV;
    onCreateItem: (listId: string, index: number) => void;
    onDeleteItem: (item: T) => void;
    onValueChange?: (newValue: string, prev: T) => T;
    onSaveToExternalStorage?: (item: T) => void;
    onContentClick?: (item: T) => void;
    onGetLeftIconConfig?: (item: T) => TListItemIconConfig<T>;
    onGetRightIconConfig?: (item: T) => TListItemIconConfig<T>;
    onGetRowTextPlatformColor?: (item: T) => string;
    customOnGetIsDeleting?: (item: T | undefined) => boolean;
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

const ListItem = <T extends TListItem>({
    listId,
    itemId,
    storage,
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
    hideKeyboard,
    onValueChange,
    onCreateItem,
    onDeleteItem,
    onContentClick,
    onSaveToExternalStorage,
    onGetLeftIconConfig,
    onGetRightIconConfig,
    onGetRowTextPlatformColor,
    customOnGetIsDeleting
}: TListItemProps<T>) => {

    const { handleGetIsItemDeleting: onGetIsItemDeleting } = useDeleteScheduler<T>();

    const {
        scrollOffset,
        handleAutoScroll: onAutoScroll
    } = useScrollContainer();

    const [item, setItem] = useMMKVObject<T>(itemId, storage);

    const isPendingDelete = useMemo(
        () => customOnGetIsDeleting?.(item) ?? onGetIsItemDeleting(item),
        [onGetIsItemDeleting, customOnGetIsDeleting]
    );

    // Mark the item static whenever it is deleting.
    useEffect(() => {
        if (isPendingDelete) {
            setItem((prev) => prev ? ({ ...prev, status: EItemStatus.STATIC }) : prev);
        }
    }, [isPendingDelete]);

    // ==================
    // 1. Event Handlers
    // ==================

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
            onAutoScroll(distanceToBound);
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
        if (!item) return;

        if (index.value === initialIndex.value) {
            // Item didn't move. Clean up and quit.
            onDragEnd(index.value);
            return;
        }

        onDragEnd(index.value, item);
    }

    // ============
    // 2. Gestures
    // ============

    const tapGesture = Gesture.Tap()
        .maxDuration(200)
        .onEnd(() => {
            if (!item || isPendingDelete) return;
            if (!onContentClick) {
                runOnJS(setItem)({ ...item, status: EItemStatus.EDIT });
                return;
            }

            runOnJS(onContentClick)(item);
        });

    const longPressGesture = Gesture.LongPress()
        .minDuration(500)
        .onTouchesDown((_e, state) => {
            if (disableDrag) {
                state.fail();
            }
        })
        .onStart(() => {
            if (!item) return;
            onDragStart(item.id, itemIndex);
        });

    const panGesture = Gesture.Pan()
        .manualActivation(true)
        .onTouchesMove((_e, state) => {
            if (!item) return;

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
            if (!item) return;

            if (draggingRowId.value !== item.id) return;

            runOnJS(handleEndDrag)();
        });

    const dragGesture = Gesture.Simultaneous(longPressGesture, panGesture);
    const contentGesture = Gesture.Race(tapGesture, dragGesture);

    // ==============
    // 3. Animations
    // ==============

    const animatedRowStyle = useAnimatedStyle(() => {
        const isRowDragging = item && draggingRowId.value === item.id;
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
                    onPress={() => item && config.onClick?.(item)}
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
                    onClick={() => item && config.onClick?.(item)}
                    size={size}
                    className='mr-4'
                />
            );
        }

        return null;
    };

    const textPlatformColor = useMemo(() => item ? onGetRowTextPlatformColor?.(item) : 'label', [item, onGetRowTextPlatformColor]);
    const leftIconConfig = useMemo(() => item ? onGetLeftIconConfig?.(item) : undefined, [item, onGetLeftIconConfig]);
    const rightIconConfig = useMemo(() => item ? onGetRightIconConfig?.(item) : undefined, [item, onGetRightIconConfig]);

    if (!item) return null;

    return (
        <Row
            className="w-full absolute"
            style={[
                animatedRowStyle,
                { height: LIST_ITEM_HEIGHT }
            ]}
        >

            {/* Separator Line */}
            <Pressable onPress={() => onCreateItem(listId, itemIndex)}>
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
                        <ListItemTextfield<T>
                            item={item}
                            toolbarIconSet={toolbarIconSet}
                            hideKeyboard={hideKeyboard}
                            customStyle={{
                                color: PlatformColor(
                                    textPlatformColor ??
                                    (isPendingDelete ? 'tertiaryLabel' : 'label')
                                ),
                                textDecorationLine: isPendingDelete ? 'line-through' : undefined
                            }}
                            onDeleteItem={onDeleteItem}
                            onSetItemInStorage={setItem}
                            onValueChange={onValueChange}
                            onSaveToExternalStorage={onSaveToExternalStorage}
                            onCreateChildTextfield={() => onCreateItem(listId, itemIndex + 1)}
                        />
                    </View>
                </GestureDetector>

                {/* Right Icon */}
                {rightIconConfig && <RowIcon config={rightIconConfig} type={IconPosition.RIGHT} />}

            </View>
        </Row>
    );
};

export default ListItem;