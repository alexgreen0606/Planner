import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSortableListContext } from '../services/SortableListProvider';
import GenericIcon from '../../components/icons/GenericIcon';
import globalStyles from '../../theme/globalStyles';
import ClickableLine from './ClickableLine';
import ListTextfield from './ListTextfield';
import CustomText from '../../components/text/CustomText';
import colors from '../../theme/colors';
import uuid from 'react-native-uuid';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    SharedValue,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import { RowControl, isItemEditing, ItemStatus, ListItem, ListItemUpdateComponentConfig, ListItemUpdateComponentProps, RowIconConfig, generateSortId } from '../utils';

// TODO: handle height of long texts
const ITEM_HEIGHT = 40;

interface DraggableListProps<T extends ListItem, P extends ListItemUpdateComponentProps<T>> {
    listId: string;
    items: T[];
    editItemControl: RowControl,
    renderLeftIcon: (item: T) => RowIconConfig;
    renderRightIcon?: (item: T) => RowIconConfig;
    extractTextfieldKey: (item: T) => string;
    onChangeTextfield: (text: string, item: T) => T;
    onGetRowTextColor?: (item: T) => string;
    onSubmitTextfield: (updatedItem: T) => Promise<void> | void;
    onGetItemPopovers?: (item: T) => ListItemUpdateComponentConfig<T, P>[];
    renderItemModal?: (item: T) => ListItemUpdateComponentConfig<T, P>;
    initializeNewItem?: (item: ListItem) => T;
}
interface RowProps<T extends ListItem, P extends ListItemUpdateComponentProps<T>> extends Omit<DraggableListProps<T, P>, 'initializeNewItem'> {
    item: T;
    positions: SharedValue<Record<string, number>>;
    createNewTextfield: (parentSortId: number) => void;
}

// Builds a map of item IDs to positions in the list
const buildItemPositions = <T extends ListItem>(items: T[]) => {
    'worklet';
    const itemsCopy = [...items];
    const newPositions: Record<string, number> = {};
    itemsCopy.sort((a, b) => a.sortId - b.sortId).forEach((item, i) => {
        newPositions[item.id] = i;
    });
    return newPositions;
};

// Fetches the sort ID of the item just above the given item
const getParentSortId = <T extends ListItem>(item: T, positions: SharedValue<Record<string, number>>, items: T[]): number => {
    'worklet';
    let itemIndex = positions.value[item.id];
    if (itemIndex === 0) return -1;
    for (const id in positions.value) {
        if (positions.value[id] === itemIndex - 1) {
            return items.find(item => item.id === id)?.sortId ?? -1;
        }
    }
    throw new Error('Error getting new item sort ID.')
}

const DraggableRow = <T extends ListItem, M extends ListItemUpdateComponentProps<T>>({
    positions,
    extractTextfieldKey,
    item: staticItem,
    items,
    renderLeftIcon,
    renderRightIcon,
    renderItemModal,
    onChangeTextfield,
    onSubmitTextfield,
    onGetRowTextColor,
    editItemControl,
    onGetItemPopovers,
    createNewTextfield,
    listId
}: RowProps<T, M>) => {
    const { scroll } = useSortableListContext();
    const { currentTextfieldItem, setCurrentTextfieldItem, setCurrentList } = useSortableListContext();
    const item = currentTextfieldItem?.id === staticItem.id ? currentTextfieldItem : staticItem;
    const isDragging = useSharedValue(false);
    const top = useSharedValue(positions.value[item.id] * ITEM_HEIGHT);
    const initialGestureTime = useSharedValue(-1);
    const scrollMode = useSharedValue(true);
    const didScroll = useSharedValue(false);
    const prevY = useSharedValue(0);
    const dragInitialPosition = useSharedValue(0);

    const listLength = currentTextfieldItem?.status === ItemStatus.NEW ? items.length + 1 : items.length;

    // Extract row configs
    const leftIconConfig = renderLeftIcon(item);
    const rightIconConfig = renderRightIcon?.(item);
    const modalConfig = renderItemModal?.(item);
    const popoverConfigs = onGetItemPopovers?.(item);
    const Modal = modalConfig?.component;
    const Popovers = popoverConfigs?.map(config => config.component);

    useAnimatedReaction(
        () => positions.value[item.id],
        (currentPosition, prevPosition) => {
            if (currentPosition !== prevPosition && !isDragging.value) {
                top.value = currentPosition * ITEM_HEIGHT;
            }
        },
        [isDragging]
    );

    const beginEditItem = async () => {
        'worklet';
        if (item.status === ItemStatus.DELETE || currentTextfieldItem?.id === item.id)
            return;
        else if (currentTextfieldItem)
            await onSubmitTextfield(currentTextfieldItem);
        runOnJS(setCurrentTextfieldItem)({ ...item, status: ItemStatus.EDIT });
        setCurrentList(listId);
    };

    const handleTextfieldChange = (text: string) => {
        setCurrentTextfieldItem((curr: T | undefined) => {
            if (!curr) return curr;
            return onChangeTextfield(text, curr);
        });
    };
    const resetGestureValues = () => {
        'worklet';
        scrollMode.value = true;
        didScroll.value = false;
        prevY.value = 0;
        initialGestureTime.value = -1;
        isDragging.value = false;
        dragInitialPosition.value = 0;
        top.value = positions.value[item.id] * ITEM_HEIGHT;
    };

    const itemGesture = Gesture.Pan()
        .onTouchesDown(() => {
            initialGestureTime.value = Date.now();
            scrollMode.value = true;
        }).onStart(() => {
            didScroll.value = true;
            // Initiate drag mode for long press
            const currentTime = Date.now();
            if (initialGestureTime.value && currentTime - initialGestureTime.value > 500 && positions) {
                scrollMode.value = false;
                isDragging.value = true;
                dragInitialPosition.value = positions.value[item.id] * ITEM_HEIGHT;
            }
        }).onUpdate((event) => {
            if (scrollMode.value) {
                // Scroll the page
                const newY = prevY.value - event.translationY;
                scroll(-newY);
                prevY.value = event.translationY;
            } else {
                // Drag the item - prevent going beyond list bounds
                top.value = Math.max(
                    0,
                    Math.min(
                        dragInitialPosition.value + event.translationY,
                        ITEM_HEIGHT * (listLength - 1)
                    )
                );
                const newPosition = Math.floor(top.value / ITEM_HEIGHT);
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
            const currentTime = Date.now();
            if (!didScroll.value && (initialGestureTime.value && currentTime - initialGestureTime.value <= 500)) {
                if (editItemControl === RowControl.CONTENT)
                    beginEditItem();
            } else {
                // Drop the dragged item
                const newParentSortId = getParentSortId(item, positions, items);
                console.log(newParentSortId, 'new p[arent')
                const newSortId = generateSortId(newParentSortId, items);
                console.log(newSortId, 'new sort')
                runOnJS(onSubmitTextfield)({ ...item, sortId: newSortId });
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
            // Scroll the page
            if (scrollMode.value) {
                const newY = prevY.value - event.translationY;
                runOnJS(scroll)(-newY);
                prevY.value = event.translationY;
            }
        }).onTouchesUp(async () => {
            // Click the line
            if (!didScroll.value) {
                if (currentTextfieldItem)
                    await runOnJS(onSubmitTextfield)(currentTextfieldItem);
                runOnJS(createNewTextfield)(item.sortId);

                // if (currentTextfieldItem) {
                //     onSubmitTextfield(currentTextfieldItem);

                //     runOnJS(createNewTextfield)(item.sortId);

                //     // if (currentTextfieldItem.value.trim() === '') {
                //     //     onSubmitTextfield(currentTextfieldItem);
                //     // } else if (item.id === currentTextfieldItem.id) {
                //     //     // The new textfield will be below the current one

                //     //     // TODO: add new textfield below this one
                //     //     // await saveTextfield(undefined, ShiftTextfieldDirection.BELOW);
                //     // } else if (item.sortId === getParentSortId(currentTextfieldItem, positions, items)) {
                //     //     // The new textfield will be above the current one

                //     //     // TODO: add the textfield above the current one

                //     // } else {
                //     //     // Save the textfield and create a new textfield under this item
                //     //     onSubmitTextfield(currentTextfieldItem);

                //     //     runOnJS(createNewTextfield)(item.sortId);
                //     //     // await saveTextfield(undefined, undefined, newParentSortId);
                //     // }
                // } else {
                //     // Create new textfield
                //     runOnJS(createNewTextfield)(item.sortId);
                //     // await addTextfield(newParentSortId);
                // }
                // // HERE
                // // runOnJS(onLineClick)(item);
            }
            resetGestureValues();
        });

    const rowStyle = useAnimatedStyle(() => {
        return {
            height: ITEM_HEIGHT,
            width: '100%',
            position: 'absolute',
            top: top.value,
        }
    }, [top]);

    return (
        <Animated.View style={rowStyle}>
            <View
                key={item.id}
                style={{
                    ...globalStyles.listRow,
                    height: 25,
                    width: '100%',
                }}
            >
                {/* Left Icon */}
                {leftIconConfig.icon && (
                    <TouchableOpacity onPress={() => leftIconConfig.onClick?.()}>
                        <GenericIcon
                            {...leftIconConfig.icon}
                            size={20}
                        />
                    </TouchableOpacity>
                )}

                {/* Content */}
                {isItemEditing(item) ?
                    <ListTextfield<T>
                        key={extractTextfieldKey(item)}
                        item={item}
                        onChange={handleTextfieldChange}
                        onSubmit={() => onSubmitTextfield(item)}
                    /> :
                    <GestureDetector gesture={itemGesture}>
                        <View style={globalStyles.listItem}>
                            <CustomText
                                type='standard'
                                style={{
                                    color: onGetRowTextColor ? onGetRowTextColor(item) :
                                        item.status === ItemStatus.DELETE ?
                                            colors.grey : colors.white,
                                    textDecorationLine: item.status === ItemStatus.DELETE ?
                                        'line-through' : undefined,
                                }}
                            >
                                {item.value}
                            </CustomText>
                        </View>
                    </GestureDetector>
                }

                {/* Right Icon */}
                {rightIconConfig && !rightIconConfig.hideIcon && item.status !== ItemStatus.DELETE && (rightIconConfig.icon || rightIconConfig.customIcon) && (
                    <TouchableOpacity onPress={() => {
                        beginEditItem();
                        rightIconConfig.onClick?.();
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
            {isItemEditing(item) && modalConfig && Modal && (
                <Modal
                    {...modalConfig.props}
                    item={item}
                    onSave={(newItem: T) => setCurrentTextfieldItem(modalConfig.onSave(newItem))}
                />
            )}

            {/* Row Popovers */}
            {isItemEditing(item) && popoverConfigs && Popovers && Popovers.map((Popover, i) => (
                <View key={`${item.value}-popover-${i}`} style={{
                    top: ITEM_HEIGHT,
                    left: 0,
                    position: 'absolute'
                }}>
                    <Popover
                        {...popoverConfigs[i].props}
                        onSave={(newItem: T) => setCurrentTextfieldItem(popoverConfigs[i].onSave(newItem))}
                    />
                </View>
            ))
            }
        </Animated.View>
    )
}

const SortableList = <T extends ListItem, M extends ListItemUpdateComponentProps<T>>(props: DraggableListProps<T, M>) => {
    const positions = useSharedValue(buildItemPositions<T>(props.items));
    const { currentTextfieldItem, setCurrentTextfieldItem, setCurrentList } = useSortableListContext();

    useAnimatedReaction(
        () => props.items.length,
        (currentLength, prevLength) => {
            if (currentLength !== prevLength) {
                const fullItemList = [...props.items];
                if (currentTextfieldItem?.status === ItemStatus.NEW) {
                    fullItemList.push(currentTextfieldItem);
                }
                positions.value = buildItemPositions<T>(fullItemList);

                // let newItem = props.items.find(item => item.status === ItemStatus.NEW);
                // if (newItem) runOnJS(setCurrentTextfieldItem)(newItem);
            }
        }
    )

    const createNewTextfield = (parentSortId: number) => {
        let newTextfield = {
            id: uuid.v4(),
            sortId: generateSortId(parentSortId, props.items),
            value: '',
            status: ItemStatus.NEW,
        } as T;
        if (props.initializeNewItem)
            newTextfield = props.initializeNewItem(newTextfield);
        setCurrentTextfieldItem(newTextfield);
        setCurrentList(props.listId);

        // TODO: find way to update list with new value, then trigger above function

        positions.value = buildItemPositions<T>([...props.items, newTextfield]);
    };

    return (
        <View>
            <ClickableLine onPress={() => createNewTextfield(-1)} />
            <View style={{
                height: props.items.length * ITEM_HEIGHT,
                position: 'relative',
            }}>
                {props.items.map((item) =>
                    <DraggableRow<T, M>
                        key={`${item.value}-row`}
                        item={item}
                        positions={positions}
                        createNewTextfield={createNewTextfield}
                        {...props}
                    />
                )}
                {currentTextfieldItem?.status === ItemStatus.NEW && (
                    <DraggableRow<T, M>
                        item={currentTextfieldItem}
                        positions={positions}
                        createNewTextfield={createNewTextfield}
                        {...props}
                    />
                )}
            </View>
        </View>
    )
};

export default SortableList;
