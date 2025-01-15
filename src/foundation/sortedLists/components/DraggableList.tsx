import React from 'react';
import { Animated, TouchableOpacity, View } from 'react-native';
import { ListItem } from '../types';
import { useDraggableListContext } from '../services/DraggableListProvider';
import GenericIcon, { GenericIconProps } from '../../ui/icons/GenericIcon';
import globalStyles from '../../theme/globalStyles';
import ClickableLine from '../../ui/separators/ClickableLine';
import { ItemStatus } from '../enums';
import ListTextfield from './ListTextfield';
import CustomText from '../../ui/text/CustomText';
import colors from '../../theme/colors';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

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
    const initialGestureTime = useSharedValue(-1);
    const scrollMode = useSharedValue(true);

    const isItemEditing = (item: T) => [ItemStatus.NEW, ItemStatus.EDIT].includes(item.status);

    const panGesture = Gesture.Pan()
        .onTouchesDown(() => {
            runOnJS(beginClickingItem)();
            initialGestureTime.value = Date.now();
            scrollMode.value = true;
        }).onStart(() => {

            // Initiate drag mode for long press
            const currentTime = Date.now();
            if (initialGestureTime.value && currentTime - initialGestureTime.value > 300) {
                scrollMode.value = false;
                initialGestureTime.value = -1;
            }

        }).onUpdate((event) => {
            if (scrollMode.value) { // scroll the page
                runOnJS(scroll)(event.translationY);
            } else { // drag the item

            }
        }).onTouchesUp(() => {

            // TODO: Click item

            scrollMode.value = true;
            runOnJS(endClickingItem)();
        });

    return (
        <View style={{
            height: items.length * 40,
            position: 'relative',
            width: '100%'
        }}>
            {items.sort((a, b) => a.sortId - b.sortId).map((item, i) =>
                <View
                    key={`${item.value}-row-${extractTextfieldKey(item)}`}
                    style={{ height: 40, width: '100%', position: 'absolute', top: i * 40 }}
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
