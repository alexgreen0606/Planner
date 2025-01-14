import React, { useRef } from 'react';
import { Animated, PanResponder, TouchableOpacity, View } from 'react-native';
import { ListItem } from '../types';
import { useDraggableListContext } from '../services/DraggableListProvider';
import GenericIcon, { GenericIconProps } from '../../ui/icons/GenericIcon';
import globalStyles from '../../theme/globalStyles';
import ClickableLine from '../../ui/separators/ClickableLine';
import { ItemStatus } from '../enums';
import ListTextfield from './ListTextfield';
import CustomText from '../../ui/text/CustomText';
import colors from '../../theme/colors';
import { runOnJS, useAnimatedGestureHandler, useAnimatedScrollHandler } from 'react-native-reanimated';
import { PanGesture } from 'react-native-gesture-handler/lib/typescript/handlers/gestures/panGesture';
import { Gesture, GestureDetector, PanGestureHandler, TapGestureHandler } from 'react-native-gesture-handler';

interface IconConfig {
    icon: GenericIconProps;
    onClick: () => void;
    customIcon?: React.ReactNode;
    hideIcon?: boolean;
}

interface DraggableListProps<T extends ListItem> {
    items: T[];
    beginDrag: () => void;
    endDrag: () => void;
    renderLeftIcon: (item: T) => IconConfig;
    renderRightIcon?: (item: T) => IconConfig;
    handleSeparatorClick: (item: T) => void;
    extractTextfieldKey: (item: T) => string;
    onChangeTextfield: (text: string, item: T) => void;
    onRowClick: (item: T) => void;
    onSubmitTextfield: () => void;
    renderItemModal?: (item: T) => React.ReactNode;
}

// TODO: handle height of long texts

// TODO: stop auto-sorting throughout app -> only do it here

const DraggableList = <T extends ListItem>({
    items,
    beginDrag,
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
    const { scroll, beginClickingItem, endClickingItem } = useDraggableListContext();

    const gestureTimeout = useRef<NodeJS.Timeout | null>(null);
    const isScrolling = useRef(true);
    const draggingItemRef = useRef<T | null>(null);

    const panGesture = Gesture.Pan().onStart(() => {
        
    }).onUpdate((event) => {
        
        runOnJS(scroll)(event.translationY);
    })

    // const scrollHandler = useAnimatedScrollHandler({
    //     onScroll: (event) => {
    //         if (gestureTimeout.current) {
    //             console.log('Mouse moved before drag began. Maintaining scroll.');
    //             clearTimeout(gestureTimeout.current);
    //             gestureTimeout.current = null;
    //         }

    //         // Scroll the container
    //         if (isScrolling.current) {
    //             scroll(event.contentOffset.y);
    //         } else {
    //             // TODO: drag the item
    //         }
    //     },
    //     onBeginDrag: (e) => {
    //         console.log('Cancelling the parent control.')
    //         beginClickingItem();
    //         isScrolling.current = true; // Start in scrolling mode
    //         if (gestureTimeout.current) clearTimeout(gestureTimeout.current);

    //         // Switch to dragging mode if no movement occurs within the timeout
    //         gestureTimeout.current = setTimeout(() => {
    //             console.log('Mouse didn’t move. Cancelling scroll and beginning drag.');
    //             isScrolling.current = false; // Transition to dragging
    //             gestureTimeout.current = null;
    //         }, 300);
    //     },
    //     onEndDrag: (e) => {
    //         // TODO: if the scrolling and dragging never occured (no movement), click the item

    //         //endClickingItem();
    //         if (gestureTimeout.current) clearTimeout(gestureTimeout.current);
    //         isScrolling.current = true;
    //     },
    // });

    // const panResponder = useRef(
    //     PanResponder.create({
    //         onStartShouldSetPanResponder: () => true,
    //         onMoveShouldSetPanResponder: (_, gestureState) => {
    //             return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
    //         },
    //         onPanResponderGrant: () => {
    //             console.log('Item clicked in list.');
    //             beginClickingItem();
    //             isScrolling.current = true; // Start in scrolling mode
    //             if (gestureTimeout.current) clearTimeout(gestureTimeout.current);

    //             // Switch to dragging mode if no movement occurs within the timeout
    //             gestureTimeout.current = setTimeout(() => {
    //                 console.log('Mouse didn’t move. Cancelling scroll and beginning drag.');
    //                 isScrolling.current = false; // Transition to dragging
    //                 gestureTimeout.current = null;
    //             }, 300);
    //         },
    //         onPanResponderMove: (_, gestureState) => { // movement occurs
    //             console.log('Moving within the list.')
    //             if (gestureTimeout.current) {
    //                 console.log('Mouse moved before drag began. Maintaining scroll.');
    //                 clearTimeout(gestureTimeout.current);
    //                 gestureTimeout.current = null;
    //             }

    //             // Scroll the container
    //             if (isScrolling.current) {
    //                 // scroll(gestureState.dy);
    //             } else {
    //                 // TODO: drag the item
    //             }
    //         },
    //         onPanResponderRelease: (_, gestureState) => {
    //             console.log('Pan release in child.')

    //             // TODO: if the scrolling and dragging never occured (no movement), click the item

    //             //endClickingItem();
    //             if (gestureTimeout.current) clearTimeout(gestureTimeout.current);
    //             isScrolling.current = true;
    //         },
    //         onPanResponderTerminate: (_, gestureState) => {
    //             console.log('Pan terminate.')
    //             // endClickingItem();
    //             if (gestureTimeout.current) clearTimeout(gestureTimeout.current);
    //             isScrolling.current = true;
    //         },
    //     })
    // ).current;

    const isItemEditing = (item: T) => [ItemStatus.NEW, ItemStatus.EDIT].includes(item.status);

    return (
        <View style={{
            height: items.length * 40,
            position: 'relative',
            width: '100%'
        }}>
            {items.sort((a, b) => a.sortId - b.sortId).map((item, i) =>
                <View key={`${item.value}-row-${extractTextfieldKey(item)}`} style={{ height: 40, width: '100%', position: 'absolute', top: i * 40 }}>
                    <View
                        key={item.id}
                        style={{
                            ...globalStyles.listRow,
                            height: 25,
                            width: '100%',
                        }}
                    >
                        {/* Left Icon */}
                        <TouchableOpacity onPress={() => renderLeftIcon(item).onClick()}>
                            <GenericIcon
                                {...renderLeftIcon(item).icon}
                                size={20}
                            />
                        </TouchableOpacity>

                        {/* Content */}
                        {isItemEditing(item) ?
                            <ListTextfield
                                key={extractTextfieldKey(item)}
                                item={item}
                                onChange={(text) => onChangeTextfield(text, item)}
                                onSubmit={onSubmitTextfield}
                            /> :
                            <GestureDetector gesture={panGesture}>
                                <Animated.View
                                    // onLongPress={drag}
                                    // onPress={() => onRowClick(item)}
                                    style={globalStyles.listItem}
                                // {...panResponder.panHandlers}
                                >
                                    <CustomText
                                        type='standard'
                                        style={{
                                            color: [ItemStatus.DELETE].includes(item.status) ? colors.grey : colors.white,
                                            textDecorationLine: item.status === ItemStatus.DELETE ? 'line-through' : undefined,
                                        }}
                                    >
                                        {item.value}
                                    </CustomText>
                                </Animated.View>
                            </GestureDetector>
                        }

                        {/* Right Icon */}
                        {renderRightIcon && !renderRightIcon(item).hideIcon && (
                            <TouchableOpacity onPress={() => renderRightIcon(item).onClick()}>
                                {renderRightIcon(item).customIcon || (
                                    <GenericIcon
                                        {...renderRightIcon(item).icon}
                                        size={18}
                                    />
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Separator Line */}
                    <ClickableLine onPress={() => handleSeparatorClick(item)} />

                    {/* Row Modal */}
                    {renderItemModal?.(item)}
                </View>
            )}
        </View>
    )
};

export default DraggableList;
