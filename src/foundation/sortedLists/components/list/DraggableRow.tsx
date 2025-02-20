import Animated, { SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring } from "react-native-reanimated";
import {
    ItemStatus,
    LIST_ITEM_HEIGHT,
    ListItem,
    ListItemUpdateComponentProps
} from "../../types";
import { DraggableListProps } from "./SortableList";
import { useSortableListContext } from "../../services/SortableListProvider";
import { useMemo } from "react";
import { Gesture, GestureDetector, Pressable } from "react-native-gesture-handler";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import CustomText from "../../../components/text/CustomText";
import ListTextfield from "../ListTextfield";
import { Portal } from "react-native-paper";
import { Palette } from "../../../theme/colors";
import GenericIcon from "../../../components/GenericIcon";
import ThinLine from "../../../components/ThinLine";
import { generateSortId, isItemDeleting, isItemTextfield } from "../../sortedListUtils";

interface RowProps<
    T extends ListItem,
    P extends ListItemUpdateComponentProps<T> = ListItemUpdateComponentProps<T>,
    M extends ListItemUpdateComponentProps<T> = ListItemUpdateComponentProps<T>
> extends Omit<DraggableListProps<T, P, M>, 'initializeNewItem' | 'staticList' | 'hideList' | 'listId' | 'handleSaveTextfield' | 'onSaveTextfield' | 'emptyLabelConfig'> {
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
    disableDrag,
    onDeleteItem,
    saveTextfieldAndCreateNew,
    listLength,
    onDragEnd
}: RowProps<T, P, M>) => {
    const { scroll, scrollPosition } = useSortableListContext();
    const { currentTextfield, setCurrentTextfield } = useSortableListContext();
    const item = useMemo(() =>
        currentTextfield?.id === staticItem.id ? currentTextfield : staticItem,
        [currentTextfield, staticItem]
    );

    // Drag vs Scroll Controls
    const isDragging = useSharedValue(false);
    const top = useSharedValue(positions.value[item.id] * LIST_ITEM_HEIGHT);
    const isScrolling = useSharedValue(false);
    const prevY = useSharedValue(0);
    const dragInitialPosition = useSharedValue(0);
    const beginDragTimeout = useSharedValue<NodeJS.Timeout | undefined>(undefined);

    // Extract row configs
    const customTextColor = useMemo(() => getRowTextColor?.(item), [item, getRowTextColor]);
    const leftIconConfig = useMemo(() => getLeftIconConfig?.(item), [item, getLeftIconConfig]);
    const rightIconConfig = useMemo(() => getRightIconConfig?.(item), [item, getRightIconConfig]);
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
        isScrolling.value = false;
        isDragging.value = false;
        prevY.value = 0;
        dragInitialPosition.value = 0;
        top.value = positions.value[item.id] * LIST_ITEM_HEIGHT;
        clearTimeout(beginDragTimeout.value);
        beginDragTimeout.value = undefined;
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

    const contentGesture = Gesture.Pan()
        .onTouchesDown(() => {
            if (!disableDrag)
                beginDragTimeout.value = setTimeout(() => {
                    isScrolling.value = false;
                    isDragging.value = true;
                    dragInitialPosition.value = positions.value[item.id] * LIST_ITEM_HEIGHT;
                    beginDragTimeout.value = undefined;
                }, 500);
        }).onStart(() => {
            if (!isDragging.value) {

                // Begin scroll
                clearTimeout(beginDragTimeout.value);
                beginDragTimeout.value = undefined;
                isScrolling.value = true;
            }
        }).onUpdate((event) => {
            if (isScrolling.value) {

                // Scroll the page
                const newY = prevY.value - event.translationY;
                scroll(-newY);
                prevY.value = event.translationY;
            } else if (isDragging.value) {

                // Drag the item
                top.value = Math.max(
                    0,
                    Math.min(
                        dragInitialPosition.value + event.translationY,
                        LIST_ITEM_HEIGHT * (listLength - 1)
                    )
                );
                const newPosition = Math.floor(top.value / LIST_ITEM_HEIGHT);
                if (newPosition !== positions.value[item.id]) {

                    // Swap the item with the invader taking up its new position
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
            if (!isScrolling.value && !isDragging.value) {

                // Click the content
                clearTimeout(beginDragTimeout.value);
                beginDragTimeout.value = undefined;
                onContentClick(item);
            } else if (isDragging.value) {

                // End row drag
                const newParentSortId = getParentSortId(item, positions, items);
                const newSortId = generateSortId(newParentSortId, items);
                onDragEnd({ ...item, sortId: newSortId });
            }
            resetGestureValues();
        }).runOnJS(true);

    const separatorGesture = Gesture.Pan()
        .onUpdate((event) => {
            isScrolling.value = true;
            const newY = prevY.value - event.translationY;
            scroll(-newY);
            prevY.value = event.translationY;
        }).onTouchesUp(() => {

            // Short press -> create new textfield below row
            if (!isScrolling.value) {
                saveTextfieldAndCreateNew(item.sortId);
            }
            resetGestureValues();
        }).runOnJS(true);

    // Set the row's position
    useDerivedValue(() => {
        if (!isDragging.value)
            top.value = positions.value[item.id] * LIST_ITEM_HEIGHT;
    }, [positions.value[item.id]]);

    // Animate the row's position
    const rowPositionStyle = useAnimatedStyle(() => {
        return {
            height: LIST_ITEM_HEIGHT,
            width: '100%',
            position: 'absolute',
            top: top.value,
            transform: [
                {
                    scale: withSpring(isDragging.value ? 0.8 : 1, {
                        damping: 15,  // Controls the bounciness
                        stiffness: 200, // Controls the speed
                        mass: 1,        // Affects the oscillation
                        overshootClamping: true, // If true, no overshoot
                    }),
                },
            ],
        }
    }, [top.value, isDragging.value]);

    // Animate the popover's position
    const popoverPositionStyle = useAnimatedStyle(() => ({
        left: 4,
        position: 'absolute',
        top: top.value + LIST_ITEM_HEIGHT - scrollPosition.value + 100
    }), [top.value, scrollPosition.value]);

    return (
        <Animated.View style={rowPositionStyle}>
            <View
                key={item.id}
                style={styles.row}
            >

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
                {isItemTextfield(item) ?
                    <ListTextfield<T>
                        key={getTextfieldKey(item)}
                        item={item}
                        onChange={handleTextfieldChange}
                        onSubmit={handleTextfieldSave}
                    /> :
                    <GestureDetector gesture={contentGesture}>
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
                }

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
            <GestureDetector gesture={separatorGesture}>
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
            ))
            }
        </Animated.View>
    )
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
