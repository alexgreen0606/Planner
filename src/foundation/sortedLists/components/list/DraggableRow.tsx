import Animated, { runOnJS, SharedValue, useAnimatedRef, useAnimatedStyle, useDerivedValue, useSharedValue } from "react-native-reanimated";
import {
    generateSortId,
    isItemDeleting,
    isItemTextfield,
    ItemStatus,
    LIST_ITEM_HEIGHT,
    ListItem,
    ListItemUpdateComponentProps
} from "../../utils";
import { DraggableListProps } from "./SortableList";
import { useSortableListContext } from "../../services/SortableListProvider";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import CustomText from "../../../components/text/CustomText";
import colors from "../../../theme/colors";
import ListTextfield from "../textfield/ListTextfield";
import GenericIcon from "../../../components/icons/GenericIcon";
import ClickableLine from "../separator/ClickableLine";
import { Portal } from "react-native-paper";

interface RowProps<
    T extends ListItem,
    P extends ListItemUpdateComponentProps<T> = ListItemUpdateComponentProps<T>,
    M extends ListItemUpdateComponentProps<T> = ListItemUpdateComponentProps<T>
> extends Omit<DraggableListProps<T, P, M>, 'initializeNewItem' | 'hideList' | 'listId' | 'handleSaveTextfield' | 'onSaveTextfield'> {
    item: T;
    positions: SharedValue<Record<string, number>>;
    saveTextfieldAndCreateNew: (parentSortId: number) => Promise<void>;
    listLength: number;
};

// Fetches the sort ID of the item just above the given item
function getParentSortId<T extends ListItem>(item: T, positions: SharedValue<Record<string, number>>, items: T[]) {
    'worklet';
    let itemIndex = positions.value[item.id];
    if (itemIndex === 0) return -1;
    for (const id in positions.value) {
        if (positions.value[id] === itemIndex - 1) {
            return items.find(item => item.id === id)?.sortId ?? -1;
        }
    }
    throw new Error('Error getting new item sort ID.')
};

const DraggableRow = <T extends ListItem, P extends ListItemUpdateComponentProps<T>, M extends ListItemUpdateComponentProps<T>>({
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
    onDeleteItem,
    saveTextfieldAndCreateNew,
    listLength,
    onDragEnd
}: RowProps<T, P, M>) => {
    const { scroll } = useSortableListContext();
    const { currentTextfield, setCurrentTextfield } = useSortableListContext();
    const item = useMemo(() =>
        currentTextfield?.id === staticItem.id ? currentTextfield : staticItem,
        [currentTextfield, staticItem]
    );
    const isDragging = useSharedValue(false);
    const top = useSharedValue(positions.value[item.id] * LIST_ITEM_HEIGHT);
    const initialGestureTime = useSharedValue(-1);
    const scrollMode = useSharedValue(true);
    const didScroll = useSharedValue(false);
    const prevY = useSharedValue(0);
    const dragInitialPosition = useSharedValue(0);


    // TODO: calculate this using the position in the list, plus the scroll position
    const rowYAbsolutePosition = useSharedValue<number>(0);

    // Extract row configs
    const customTextColor = useMemo(() => getRowTextColor?.(item), [item, getRowTextColor]);
    const leftIconConfig = useMemo(() => getLeftIconConfig?.(item), [item]);
    const rightIconConfig = useMemo(() => getRightIconConfig?.(item), [item]);
    const modalConfig = useMemo(() => getModal?.(item), [item, getModal]);
    const popoverConfigs = useMemo(() => getPopovers?.(item), [item, getPopovers]);
    const Modal = useMemo(() => modalConfig?.component, [modalConfig]);
    const Popovers = useMemo(() => popoverConfigs?.map(config => config.component),
        [popoverConfigs]
    );

    /**
     * Resets the state of the row back to default.
     */
    const resetGestureValues = () => {
        'worklet';
        scrollMode.value = true;
        didScroll.value = false;
        prevY.value = 0;
        initialGestureTime.value = -1;
        isDragging.value = false;
        dragInitialPosition.value = 0;
        top.value = positions.value[item.id] * LIST_ITEM_HEIGHT;
    };

    /**
     * Updates the content of the row's textfield. Will also use the provided handler to format the
     * input.
     * @param text - the new string typed in the textfield
     */
    const handleTextfieldChange = (text: string) => {
        setCurrentTextfield((curr: T) => handleValueChange?.(text, curr) ?? { ...curr, value: text });
    };

    /**
     * Saves this row's textfield to storage. If the content is empty, the row will be deleted.
     * Otherwise the row will save and a new textfield will render below it.
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

    const itemGesture = Gesture.Pan()
        .onTouchesDown(() => {
            initialGestureTime.value = Date.now();
            scrollMode.value = true;
        }).onStart(() => {
            didScroll.value = true;
            const currentTime = Date.now();
            if (initialGestureTime.value && currentTime - initialGestureTime.value > 500 && positions) {
                // long press -> begin row drag
                scrollMode.value = false;
                isDragging.value = true;
                dragInitialPosition.value = positions.value[item.id] * LIST_ITEM_HEIGHT;
            }
        }).onUpdate((event) => {
            if (scrollMode.value) {
                // scroll the page
                const newY = prevY.value - event.translationY;
                scroll(-newY);
                prevY.value = event.translationY;
            } else {
                // drag the item - prevent going beyond list bounds
                top.value = Math.max(
                    0,
                    Math.min(
                        dragInitialPosition.value + event.translationY,
                        LIST_ITEM_HEIGHT * (listLength - 1)
                    )
                );
                const newPosition = Math.floor(top.value / LIST_ITEM_HEIGHT);
                if (newPosition !== positions.value[item.id]) {
                    // swap the item with the invader taking up its new position
                    const newObject = { ...positions.value };
                    const from = positions.value[item.id]
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
            }
        }).onTouchesUp(() => {
            const currentTime = Date.now();
            if (!didScroll.value && (initialGestureTime.value && currentTime - initialGestureTime.value <= 500)) {
                // short press -> click the row
                runOnJS(onContentClick)(item);
            } else {
                // end row drag
                const newParentSortId = getParentSortId(item, positions, items);
                const newSortId = generateSortId(newParentSortId, items);
                runOnJS(onDragEnd)({ ...item, sortId: newSortId });
            }
            resetGestureValues();
        });

    const lineGesture = Gesture.Pan()
        .onTouchesDown(() => {
            initialGestureTime.value = Date.now();
            scrollMode.value = true;
        }).onStart(() => {
            didScroll.value = true;
        }).onUpdate((event) => {
            // scroll the page
            if (scrollMode.value) {
                const newY = prevY.value - event.translationY;
                runOnJS(scroll)(-newY);
                prevY.value = event.translationY;
            }
        }).onTouchesUp(() => {
            // short press -> create new textfield below row
            if (!didScroll.value) {
                runOnJS(saveTextfieldAndCreateNew)(item.sortId);
            }
            resetGestureValues();
        });

    // Set the row's position
    useDerivedValue(() => {
        if (!isDragging.value)
            top.value = positions.value[item.id] * LIST_ITEM_HEIGHT;
    }, [positions.value, item]);

    // Animate the row's position
    const rowPositionStyle = useAnimatedStyle(() => {
        return {
            height: LIST_ITEM_HEIGHT,
            width: '100%',
            position: 'absolute',
            top: top.value,
        }
    }, [top.value]);

    const popoverPositionStyle = useAnimatedStyle(() => ({
        left: 4,
        position: 'absolute',
        top: rowYAbsolutePosition.value
    }), [rowYAbsolutePosition.value]);

    return (
        <Animated.View style={rowPositionStyle}>
            <View
                key={item.id}
                style={styles.row}
            >

                {/* Left Icon */}
                {leftIconConfig && !leftIconConfig.hideIcon && (leftIconConfig.icon || leftIconConfig.customIcon) && (
                    <TouchableOpacity onPress={() => leftIconConfig.onClick?.(item)}>
                        {leftIconConfig.customIcon || leftIconConfig.icon && (
                            <GenericIcon
                                {...leftIconConfig.icon}
                                size={20}
                            />
                        )}
                    </TouchableOpacity>
                )}

                {/* Content */}
                {isItemTextfield(item) ?
                    <ListTextfield<T>
                        key={getTextfieldKey(item)}
                        item={item}
                        onChange={handleTextfieldChange}
                        onSubmit={handleTextfieldSave}
                    /> :
                    <GestureDetector gesture={itemGesture}>
                        <View style={styles.content}>
                            <CustomText
                                type='standard'
                                style={{
                                    color: customTextColor ||
                                        (isItemDeleting(item) ? colors.grey : colors.white),
                                    textDecorationLine: isItemDeleting(item) ?
                                        'line-through' : undefined,
                                    height: 25
                                }}
                            >
                                {item.value}
                            </CustomText>
                        </View>
                    </GestureDetector>
                }

                {/* Right Icon */}
                {rightIconConfig && !rightIconConfig.hideIcon && (rightIconConfig.icon || rightIconConfig.customIcon) && (
                    <TouchableOpacity onPress={() => {
                        rightIconConfig.onClick?.(item);
                    }}>
                        {rightIconConfig.customIcon || rightIconConfig.icon && (
                            <GenericIcon
                                {...rightIconConfig.icon}
                                size={18}
                            />
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* Separator Line */}
            <GestureDetector gesture={lineGesture}>
                <ClickableLine onPress={() => null} />
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
            ))
            }
        </Animated.View>
    )
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 4,
        height: '100%',
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
