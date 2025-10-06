import { textfieldIdAtom } from "@/atoms/textfieldId";
import CustomText from "@/components/text/CustomText";
import ThinLine from "@/components/ThinLine";
import { LIST_CONTENT_HEIGHT, LIST_ICON_SPACING, LIST_ITEM_HEIGHT, LIST_SPRING_CONFIG } from "@/lib/constants/listConstants";
import { TListItem } from "@/lib/types/listItems/core/TListItem";
import { useDeleteSchedulerContext } from "@/providers/DeleteScheduler";
import { usePageContext } from "@/providers/PageProvider";
import { useScrollContext } from "@/providers/ScrollProvider";
import { useAtom } from "jotai";
import React, { ReactNode, useMemo, useState } from "react";
import { PlatformColor, TextStyle, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { MMKV, useMMKVObject } from "react-native-mmkv";
import Animated, {
    cancelAnimation,
    DerivedValue,
    FadeInDown,
    FadeInUp,
    FadeOutUp,
    LinearTransition,
    runOnJS,
    SequencedTransition,
    SharedValue,
    useAnimatedReaction,
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
        onAutoScroll,
    } = useScrollContext();

    const { onFocusPlaceholder } = usePageContext();

    const [item, setItem] = useMMKVObject<T>(itemId, storage);

    const [isRowDragging, setIsRowDragging] = useState(false);

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

    // Track through state when the row is dragging.
    useAnimatedReaction(
        () => draggingRowId.value,
        (dragId) => {
            runOnJS(setIsRowDragging)(dragId === item?.id);
        }
    );

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

    const createItemGesture = (onTap: () => void) => {
        const tapGesture = Gesture.Tap()
            .maxDuration(200)
            .onEnd(() => {
                if (!item || isPendingDelete) return;
                runOnJS(onTap)();
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
        return Gesture.Race(tapGesture, dragGesture);
    };

    const separatorGesture = createItemGesture(() => {
        onCreateItem(listId, itemIndex);
    });

    const contentGesture = createItemGesture(() => {
        if (!onContentClick) {
            onFocusPlaceholder();
            setTextfieldId(itemId);
            return;
        }
        onContentClick(item!);
    });

    // ============
    //  Animations
    // ============

    const animatedRowStyle = useAnimatedStyle(() => {
        if (!item || draggingRowId.value === null) return {};

        const isDragging = draggingRowId.value === item.id;
        if (!isDragging && index.value === itemIndex - 1) {
            return { marginTop: LIST_ITEM_HEIGHT };
        } else if (!isRowDragging) return { marginTop: 0 };

        return {
            top: top.value,
            transform: [
                { translateY: withSpring(-6, LIST_SPRING_CONFIG) }
            ],
            position: 'absolute',
            opacity: withSpring(0.6, LIST_SPRING_CONFIG)
        }
    });

    // ================
    //  User Interface
    // ================

    if (!item) return null;

    return (
        <Animated.View
            layout={isRowDragging ? undefined : LinearTransition}
            exiting={FadeOutUp}
            entering={FadeInDown}
            className="w-full"
            style={[
                animatedRowStyle,
                { height: LIST_ITEM_HEIGHT }
            ]}
        >

            {/* Separator Line */}
            <GestureDetector gesture={separatorGesture}>
                <View>
                    <ThinLine />
                </View>
            </GestureDetector>

            <View
                className="flex-row  justify-center items-center gap-4 pr-2"
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
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {item.value}
                            </CustomText>
                        )}
                    </View>
                </GestureDetector>

                {/* Right Icon */}
                {onGetRightIcon?.(item)}

            </View >
        </Animated.View>
    )
};

export default ListItem;