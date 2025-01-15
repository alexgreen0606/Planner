import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { ListItem } from '../types';
import { useSortableListContext } from '../services/SortableListProvider';
import GenericIcon, { GenericIconProps } from '../../ui/icons/GenericIcon';
import globalStyles from '../../theme/globalStyles';
import ClickableLine from '../../ui/separators/ClickableLine';
import { ItemStatus } from '../enums';
import ListTextfield from './ListTextfield';
import CustomText from '../../ui/text/CustomText';
import colors from '../../theme/colors';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    SharedValue,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

// TODO: handle height of long texts

// TODO: stop auto-sorting throughout app -> only do it here

const ITEM_HEIGHT = 40;

interface IconConfig {
    icon: GenericIconProps;
    onClick: () => void;
    customIcon?: React.ReactNode;
    hideIcon?: boolean;
}

interface DraggableListProps<T extends ListItem> {
    items: T[];
    endDrag: (item: T, newParentSortId: number) => void;
    renderLeftIcon: (item: T) => IconConfig;
    renderRightIcon?: (item: T) => IconConfig;
    handleSeparatorClick: (item: T) => void;
    extractTextfieldKey: (item: T) => string;
    onChangeTextfield: (text: string, item: T) => void;
    onRowClick: (item: T) => void;
    onSubmitTextfield: () => void;
    renderItemModal?: (item: T) => React.ReactNode;
}

interface RowProps<T extends ListItem> {
    item: T,
    positions: SharedValue<Record<string, number>>;
    textfieldKey: string;
    listLength: number;
    onClick: () => void;
    onLineClick: () => void;
    leftIcon: IconConfig;
    rightIcon?: IconConfig;
    renderItemModal?: (item: T) => React.ReactNode;
    onChangeTextfield: (text: string, item: T) => void;
    onSubmitTextfield: () => void;
    endDrag: (item: T, newParentSortId: number) => void;
    list: T[];
}

const buildItemPositions = <T extends ListItem>(items: T[]) => {
    const newPositions: Record<string, number> = {};
    [...items].sort((a, b) => a.sortId - b.sortId).forEach((item, i) => {
        newPositions[item.id] = i;
    });
    return newPositions;
};

const clamp = (minVal: number, value: number, maxValue: number) => {
    'worklet';
    return Math.max(minVal, Math.min(value, maxValue));
};

const swapValues = (obj: Record<string, number>, from: number, to: number) => {
    'worklet';
    const newObject = { ...obj };
    for (const id in obj) {
        if (obj[id] === from) {
            newObject[id] = to;
        }
        if (obj[id] === to) {
            newObject[id] = from;
        }
    }
    return newObject;
};

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

const DraggableRow = <T extends ListItem>({
    positions,
    textfieldKey,
    listLength,
    onClick,
    onLineClick,
    item,
    list,
    leftIcon,
    rightIcon,
    renderItemModal,
    onChangeTextfield,
    onSubmitTextfield,
    endDrag
}: RowProps<T>) => {
    const { scroll } = useSortableListContext();
    const isDragging = useSharedValue(false);
    const top = useSharedValue(positions.value[item.id] * ITEM_HEIGHT);
    const initialGestureTime = useSharedValue(-1);
    const scrollMode = useSharedValue(true);
    const didScroll = useSharedValue(false);
    const prevY = useSharedValue(0);
    const dragInitialPosition = useSharedValue(0);

    useDerivedValue(() => {
        if (!isDragging.value)
            top.value = withSpring(positions.value[item.id] * ITEM_HEIGHT);
    }, [positions]);

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

    const isItemEditing = (item: T) => [ItemStatus.NEW, ItemStatus.EDIT].includes(item.status);

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
                // Drag the item
                top.value = clamp(
                    0,
                    dragInitialPosition.value + event.translationY,
                    ITEM_HEIGHT * (listLength - 1)
                );
                const newPosition = Math.floor(top.value / ITEM_HEIGHT);
                if (newPosition !== positions.value[item.id]) {
                    positions.value = swapValues(
                        positions.value,
                        positions.value[item.id],
                        newPosition
                    );
                }
            }
        }).onTouchesUp(() => {
            const currentTime = Date.now();
            if (!didScroll.value && (initialGestureTime.value && currentTime - initialGestureTime.value <= 500)) {
                // Click the item
                runOnJS(onClick)();
            } else {
                // Drop the dragged item
                const newParentSortId = getParentSortId(item, positions, list);
                runOnJS(endDrag)(item, newParentSortId);
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
        }).onTouchesUp(() => {
            // Click the line
            if (!didScroll.value) {
                runOnJS(onLineClick)();
            }
            runOnJS(resetGestureValues)();
        });

    const rowStyle = useAnimatedStyle(() => {
        return {
            height: ITEM_HEIGHT,
            width: '100%',
            position: 'absolute',
            top: top.value,
        }
    }, [positions, top]);

    return (
        <Animated.View
            style={rowStyle}
        >
            <View
                key={item.id}
                style={{
                    ...globalStyles.listRow,
                    height: 25,
                    width: '100%',
                }}
            >
                {/* Left Icon */}
                <TouchableOpacity onPress={() => leftIcon.onClick()}>
                    <GenericIcon
                        {...leftIcon.icon}
                        size={20}
                    />
                </TouchableOpacity>

                {/* Content */}
                {isItemEditing(item) ?
                    <ListTextfield
                        key={textfieldKey}
                        item={item}
                        onChange={(text) => onChangeTextfield(text, item)}
                        onSubmit={onSubmitTextfield}
                    /> :
                    <GestureDetector gesture={itemGesture}>
                        <View style={globalStyles.listItem}>
                            <CustomText
                                type='standard'
                                style={{
                                    color: [ItemStatus.DELETE].includes(item.status) ?
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
                {rightIcon && !rightIcon.hideIcon && item.status !== ItemStatus.DELETE && (
                    <TouchableOpacity onPress={() => rightIcon.onClick()}>
                        {rightIcon.customIcon || (
                            <GenericIcon
                                {...rightIcon.icon}
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
            {isItemEditing(item) && renderItemModal?.(item)}
        </Animated.View>
    )
}

const SortableList = <T extends ListItem>({
    items,
    endDrag,
    renderLeftIcon,
    renderRightIcon,
    handleSeparatorClick,
    extractTextfieldKey,
    onChangeTextfield,
    onRowClick,
    onSubmitTextfield,
    renderItemModal
}: DraggableListProps<T>) => {
    const positions = useSharedValue<Record<string, number>>(buildItemPositions<T>(items));

    return (
        <View style={{
            height: items.length * ITEM_HEIGHT,
            position: 'relative',
            width: '100%'
        }}>
            {items.map((item, i) =>
                <DraggableRow<T>
                    key={`${item.value}-row-${extractTextfieldKey(item)}`}
                    item={item}
                    positions={positions}
                    textfieldKey={extractTextfieldKey(item)}
                    listLength={items.length}
                    onClick={() => onRowClick(item)}
                    onLineClick={() => handleSeparatorClick(item)}
                    leftIcon={renderLeftIcon(item)}
                    rightIcon={renderRightIcon ? renderRightIcon(item) : undefined}
                    renderItemModal={renderItemModal}
                    onChangeTextfield={onChangeTextfield}
                    onSubmitTextfield={onSubmitTextfield}
                    endDrag={endDrag}
                    list={items}
                />
            )}
        </View>
    )
};

export default SortableList;
