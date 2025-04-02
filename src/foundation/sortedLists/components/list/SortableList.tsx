import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, TouchableOpacity, View } from 'react-native';
import { useSortableList } from '../../services/SortableListProvider';
import uuid from 'react-native-uuid';
import Animated, { runOnUI, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import {
    ListItem,
    ModifyItemConfig,
    ListItemUpdateComponentProps,
    ListItemIconConfig,
} from '../../types';
import DraggableRow from './DraggableRow';
import EmptyLabel, { EmptyLabelProps } from '../EmptyLabel';
import ThinLine from '../../../components/ThinLine';
import { buildItemPositions, generateSortId } from '../../utils';
import { useKeyboard } from '../../services/KeyboardProvider';
import { ItemStatus, LIST_ITEM_HEIGHT, LIST_SPRING_CONFIG } from '../../constants';
import { Portal } from 'react-native-paper';

export interface DraggableListProps<
    T extends ListItem,
    P extends ListItemUpdateComponentProps<T> = never,
    M extends ListItemUpdateComponentProps<T> = never,
> {
    listId: string;
    items: T[];
    hideList?: boolean;
    fillSpace?: boolean;
    disableDrag?: boolean;
    onSaveTextfield: (updatedItem: T) => Promise<void> | void | Promise<string | void>;
    onDeleteItem: (item: T) => Promise<void> | void;
    onDragEnd?: (updatedItem: T) => Promise<void | string> | void;
    onContentClick: (item: T) => void;
    getLeftIconConfig?: (item: T) => ListItemIconConfig<T>;
    getRightIconConfig?: (item: T) => ListItemIconConfig<T>;
    getTextfieldKey: (item: T) => string;
    handleValueChange?: (text: string, item: T) => T;
    getRowTextPlatformColor?: (item: T) => string;
    getToolbar?: (item: T) => ModifyItemConfig<T, P>;
    getModal?: (item: T) => ModifyItemConfig<T, M>;
    initializeItem?: (item: ListItem) => T;
    emptyLabelConfig?: Omit<EmptyLabelProps, 'onPress'>;
    staticList?: boolean;
}

const SortableList = <
    T extends ListItem,
    P extends ListItemUpdateComponentProps<T>,
    M extends ListItemUpdateComponentProps<T>
>({
    listId,
    items,
    hideList,
    onSaveTextfield,
    initializeItem,
    emptyLabelConfig,
    fillSpace,
    staticList,
    getModal,
    getToolbar,
    ...rest
}: DraggableListProps<T, P, M>) => {

    const {
        currentTextfield,
        setCurrentTextfield,
        evaluateOffsetBounds,
    } = useSortableList();

    const {
        isKeyboardOpen,
        keyboardAbsoluteTop
    } = useKeyboard();

    const positions = useSharedValue<Record<string, number>>({});
    const pendingItem = useRef<T | null>(null);
    const modalConfig = useMemo(() => currentTextfield ? getModal?.(currentTextfield) : null, [currentTextfield, getModal]);
    const toolbarConfig = useMemo(() => currentTextfield ? getToolbar?.(currentTextfield) : null, [currentTextfield, getToolbar]);
    const Modal = useMemo(() => modalConfig?.component, [modalConfig]);
    const Toolbar = useMemo(() => toolbarConfig?.component, [toolbarConfig]);

    // ------------- Utility Function -------------

    /**
     * Handles click on empty space to create a new textfield
     */
    function handleEmptySpaceClick() {
        if (!currentTextfield) {
            saveTextfieldAndCreateNew(currentList[currentList.length - 1]?.sortId ?? -1);
        }
    }

    // ------------- List Building -------------

    /**
     * Builds the list out of the existing items and the textfield.
     * @returns Array of list items sorted by sortId
     */
    function buildFullList() {
        const fullList = items.filter(item => item.status !== ItemStatus.HIDDEN);
        if (currentTextfield?.listId === listId) {
            if (currentTextfield?.status === ItemStatus.NEW) {
                fullList.push(currentTextfield);
            } else {
                const textfieldIndex = fullList.findIndex(item => item.id === currentTextfield.id);
                if (textfieldIndex !== -1) {
                    fullList[textfieldIndex] = currentTextfield;
                }
            }
        }
        if (pendingItem.current) {
            if (!fullList.find(i => i.id === pendingItem.current?.id)) {
                fullList.push(pendingItem.current);
            } else {
                pendingItem.current = null;
            }
        }
        return fullList.sort((a, b) => a.sortId - b.sortId);
    }

    // Derive the current list out of the items and textfield
    const currentList = useMemo(() => {
        const newList = buildFullList();
        positions.value = buildItemPositions(newList);
        return newList;
    }, [currentTextfield?.id, currentTextfield?.sortId, items]);

    // ------------- List Management -------------

    /**
     * Saves the existing textfield to storage and generates a new one at the requested position.
     * @param parentSortId The sort ID of the item the new textfield must go below
     */
    async function saveTextfieldAndCreateNew(parentSortId?: number) {
        if (staticList) return;

        if (currentTextfield && currentTextfield.value.trim() !== '') {
            // Save the current textfield before creating a new one
            pendingItem.current = { ...currentTextfield };
            const newId = await onSaveTextfield(currentTextfield);
            if (newId) {
                pendingItem.current!.id = newId;
            }
        }

        if (!parentSortId) {
            setCurrentTextfield(undefined);
            return;
        }

        let newTextfield = {
            id: uuid.v4(),
            sortId: generateSortId(parentSortId, currentList),
            value: '',
            status: ItemStatus.NEW,
            listId: listId
        } as ListItem;

        newTextfield = initializeItem?.(newTextfield) ?? newTextfield as T;
        setCurrentTextfield(newTextfield, pendingItem.current);
    }

    // ------------- Scroll Container Height Evaluation -------------

    useEffect(() => {
        let contentHeight = 0;
        if (!hideList && fillSpace) {
            contentHeight = (currentList.length + 1) * LIST_ITEM_HEIGHT;
        }
        runOnUI(evaluateOffsetBounds)(contentHeight);
    }, [hideList, currentList.length, currentTextfield?.id])

    useAnimatedReaction(
        () => isKeyboardOpen.value,
        () => {
            let contentHeight = 0;
            if (!hideList && fillSpace) {
                contentHeight = (currentList.length + 1) * LIST_ITEM_HEIGHT;
            }
            evaluateOffsetBounds(contentHeight);
        }
    )

    // ------------- Animations -------------

    // Animate the opening and closing of the list
    const listContainerStyle = useAnimatedStyle(() => {
        return {
            height: withSpring(hideList ? 0 : currentList.length * LIST_ITEM_HEIGHT, LIST_SPRING_CONFIG),
            position: 'relative',
            overflow: 'hidden'
        }
    }, [currentList.length, hideList]);

    // Animate the toolbar above the textfield
    const toolbarStyle = useAnimatedStyle(() => ({
        left: 0,
        position: 'absolute',
        top: keyboardAbsoluteTop.value
    }), [keyboardAbsoluteTop.value]);

    return (
        <View style={{ flex: fillSpace ? 1 : 0 }}>
            <View>

                {/* Upper Item Creator */}
                <TouchableOpacity
                    activeOpacity={staticList ? 1 : 0}
                    onPress={() => saveTextfieldAndCreateNew(-1)}
                >
                    <ThinLine />
                </TouchableOpacity>

                {/* List */}
                <Animated.View style={listContainerStyle}>
                    {currentList.map((item) =>
                        <DraggableRow<T, P, M>
                            key={`${item.id}-row`}
                            item={item}
                            hideKeyboard={!!modalConfig?.props.hideKeyboard || !!toolbarConfig?.props.hideKeyboard}
                            positions={positions}
                            saveTextfieldAndCreateNew={saveTextfieldAndCreateNew}
                            listLength={currentList.length}
                            {...rest}
                            items={currentList}
                        />
                    )}
                </Animated.View>
            </View>

            {/* Empty Label or Click Area */}
            {currentList.length === 0 && emptyLabelConfig ? (
                <EmptyLabel
                    {...emptyLabelConfig}
                    onPress={handleEmptySpaceClick}
                />
            ) : (
                <Pressable style={{ flex: 1 }} onPress={handleEmptySpaceClick} />
            )}

            {/* Modal */}
            {Modal && modalConfig &&
                <Modal {...modalConfig.props} />
            }

            {/* Toolbar */}
            {Toolbar && toolbarConfig &&
                <Portal>
                    <Animated.View style={toolbarStyle}>
                        <Toolbar {...toolbarConfig.props} />
                    </Animated.View>
                </Portal>
            }
        </View>
    );
};

export default SortableList;