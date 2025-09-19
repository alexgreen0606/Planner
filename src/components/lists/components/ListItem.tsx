import { textfieldIdAtom } from "@/atoms/textfieldId";
import CustomText from "@/components/text/CustomText";
import ThinLine from "@/components/ThinLine";
import { LIST_CONTENT_HEIGHT, LIST_ICON_SPACING, LIST_ITEM_HEIGHT, LIST_SPRING_CONFIG } from "@/lib/constants/listConstants";
import { TListItem } from "@/lib/types/listItems/core/TListItem";
import { useDeleteSchedulerContext } from "@/providers/DeleteScheduler";
import { useScrollContainerContext } from "@/providers/ScrollContainer";
import { useAtom } from "jotai";
import React, { ReactNode, useMemo } from "react";
import { PlatformColor, TextStyle, View } from "react-native";
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

// ✅ 

type TListItemProps<T extends TListItem> = {
    listId: string;
    itemId: string;
    itemIndex: number;
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
        onDragStart: (rowId: string, initialIndex: number) => void;
        onDragEnd: (newValue: number, prev?: T) => void;
    },
    storage: MMKV;
    onCreateItem: (listId: string, index: number) => void;
    onDeleteItem: (item: T) => void;
    onValueChange?: (newValue: string) => void;
    onSaveToExternalStorage?: (item: T) => void;
    onContentClick?: (item: T) => void;
    onGetRowTextPlatformColor?: (item: T) => string;
    onGetLeftIcon?: (item: T) => ReactNode;
    onGetRightIcon?: (item: T) => ReactNode;
    onGetIsItemDeletingCustom?: (item: T) => boolean;
};

const Row = Animated.createAnimatedComponent(View);

enum AutoScrollDirection {
    UP = 'UP',
    DOWN = 'DOWN'
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
        onDragStart,
        onDragEnd
    },
    itemIndex,
    upperAutoScrollBound,
    lowerAutoScrollBound,
    onValueChange,
    onCreateItem,
    onDeleteItem,
    onContentClick,
    onSaveToExternalStorage,
    onGetRightIcon,
    onGetRowTextPlatformColor,
    onGetLeftIcon,
    onGetIsItemDeletingCustom
}: TListItemProps<T>) => {
    const [textfieldId, setTextfieldId] = useAtom(textfieldIdAtom);

    const { onGetIsItemDeletingCallback } = useDeleteSchedulerContext<T>();

    const {
        scrollOffset,
        onAutoScroll: onAutoScroll,
        onFocusPlaceholder: handleFocusPlaceholder
    } = useScrollContainerContext();

    const [item, setItem] = useMMKVObject<T>(itemId, storage);

    const textPlatformColor = useMemo(() => item ? onGetRowTextPlatformColor?.(item) : 'label', [item, onGetRowTextPlatformColor]);

    const isPendingDelete = item ? (onGetIsItemDeletingCustom?.(item) ?? onGetIsItemDeletingCallback(item)) : false;

    const valueStyles: TextStyle = {
        color: PlatformColor(
            textPlatformColor ??
            (isPendingDelete ? 'tertiaryLabel' : 'label')
        ),
        textDecorationLine: isPendingDelete ? 'line-through' : undefined
    };

    const isEditable = textfieldId === item?.id;

    // ================
    //  Event Handlers
    // ================

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

    // ==========
    //  Gestures
    // ==========

    const tapGesture = Gesture.Tap()
        .maxDuration(200)
        .onEnd(() => {
            if (!item || isPendingDelete) return;

            if (!onContentClick) {
                runOnJS(handleFocusPlaceholder)();
                runOnJS(setTextfieldId)(itemId);
                return;
            }

            runOnJS(onContentClick)(item);
        });

    const longPressGesture = Gesture.LongPress()
        .minDuration(300)
        .onTouchesDown((_e, state) => {
            if (!item || isPendingDelete) {
                state.fail();
            }
        })
        .onStart(() => {
            if (!item || isPendingDelete) return
            onDragStart(item.id, itemIndex);
        });

    const panGesture = Gesture.Pan()
        .manualActivation(true)
        .onTouchesDown((_e, state) => {
            if (!item || isPendingDelete) {
                state.fail();
            }
        })
        .onTouchesMove((_e, state) => {
            if (!item || isPendingDelete) {
                state.fail();
                return;
            }

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

    // ============
    //  Animations
    // ============

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
                { translateY: withSpring(isRowDragging ? -6 : 0, LIST_SPRING_CONFIG) }
            ],
            opacity: withSpring(isRowDragging ? 0.6 : 1, LIST_SPRING_CONFIG)
        }
    });

    // ================
    //  User Interface
    // ================

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
                className="flex-row  justify-center items-center gap-2 pr-2"
                style={{
                    height: LIST_CONTENT_HEIGHT,
                    marginLeft: LIST_ICON_SPACING
                }}
            >

                {/* Left Icon */}
                {onGetLeftIcon?.(item)}

                {/* Content */}
                <GestureDetector gesture={contentGesture}>
                    <View
                        className="flex-1"
                        style={{
                            height: LIST_CONTENT_HEIGHT
                        }}
                    >
                        {isEditable ? (
                            <ListItemTextfield<T>
                                item={item}
                                customStyle={valueStyles}
                                onDeleteItem={onDeleteItem}
                                onSetItemInStorage={setItem}
                                onValueChange={onValueChange}
                                onSaveToExternalStorage={onSaveToExternalStorage}
                                onCreateChildTextfield={() => onCreateItem(listId, itemIndex + 1)}
                            />
                        ) : (
                            <CustomText
                                variant='standard'
                                className='flex-1 bg-transparent text-[16px] w-full absolute pr-2'
                                style={
                                    [
                                        {
                                            height: LIST_ITEM_HEIGHT,
                                            paddingTop: LIST_CONTENT_HEIGHT / 8,
                                            marginRight: LIST_ICON_SPACING / 2,
                                            color: PlatformColor('label'),
                                            fontFamily: 'Text',
                                        },
                                        valueStyles
                                    ]
                                }
                            >
                                {item.value}
                            </CustomText>
                        )}
                    </View>
                </GestureDetector>

                {/* Right Icon */}
                {onGetRightIcon?.(item)}

            </View >
        </Row >
    )
};

export default ListItem;