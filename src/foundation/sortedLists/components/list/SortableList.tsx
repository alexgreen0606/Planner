import React, { useMemo, useRef } from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';
import { Portal } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import uuid from 'react-native-uuid';
import { ItemStatus, LIST_ITEM_HEIGHT, LIST_SPRING_CONFIG } from '../../constants';
import { useKeyboard } from '../../services/KeyboardProvider';
import { useScrollContainer } from '../../services/ScrollContainerProvider';
import { ListItem, ListItemIconConfig, ListItemUpdateComponentProps, ModifyItemConfig } from '../../types';
import { buildItemPositions, generateSortId } from '../../utils';
import EmptyLabel, { EmptyLabelProps } from '../EmptyLabel';
import DraggableRow from './DraggableRow';
import ThinLine from './ThinLine';

const ListContainer = Animated.createAnimatedComponent(View);
const ToolbarContainer = Animated.createAnimatedComponent(View);

export interface DraggableListProps<
    T extends ListItem,
    P extends ListItemUpdateComponentProps<T> = never,
    M extends ListItemUpdateComponentProps<T> = never,
> {
    listId: string;
    items: T[];
    onSaveTextfield: (updatedItem: T) => Promise<void> | void | Promise<string | void>;
    onDeleteItem: (item: T) => Promise<void> | void;
    onDragEnd?: (updatedItem: T) => Promise<void | string> | void;
    onContentClick: (item: T) => void;
    getTextfieldKey: (item: T) => string;
    handleValueChange?: (text: string, item: T) => T;
    getLeftIconConfig?: (item: T) => ListItemIconConfig<T>;
    getRightIconConfig?: (item: T) => ListItemIconConfig<T>;
    getRowTextPlatformColor?: (item: T) => string;
    getToolbar?: (item: T) => ModifyItemConfig<T, P>;
    getModal?: (item: T) => ModifyItemConfig<T, M>;
    emptyLabelConfig?: Omit<EmptyLabelProps, 'onPress'>;
    initializeItem?: (item: ListItem) => T;
    customIsItemDeleting?: (item: T) => boolean;
    hideKeyboard?: boolean;
    hideList?: boolean;
    fillSpace?: boolean;
    disableDrag?: boolean;
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
    hideKeyboard,
    ...rest
}: DraggableListProps<T, P, M>) => {

    const {
        currentTextfield,
        setCurrentTextfield,
        emptySpaceHeight
    } = useScrollContainer();

    const { keyboardAbsoluteTop } = useKeyboard();

    const positions = useSharedValue<Record<string, number>>({});
    const pendingItem = useRef<T | null>(null);
    const modalConfig = useMemo(() => currentTextfield ? getModal?.(currentTextfield) : null, [currentTextfield, getModal]);
    const toolbarConfig = useMemo(() => currentTextfield ? getToolbar?.(currentTextfield) : null, [currentTextfield, getToolbar]);
    const Modal = useMemo(() => modalConfig?.component, [modalConfig]);
    const Toolbar = useMemo(() => toolbarConfig?.component, [toolbarConfig]);

    // ------------- Empty Space Utilities -------------

    /**
     * Handles click on empty space to create a new textfield
     */
    function handleEmptySpaceClick() {
        if (!currentTextfield) {
            saveTextfieldAndCreateNew(currentList[currentList.length - 1]?.sortId ?? -1);
        }
    }

    const computeEmptySpaceHeight = (event: LayoutChangeEvent) => {
        const { height } = event.nativeEvent.layout;
        if (fillSpace) {
            emptySpaceHeight.value = height;
        }
    };

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

    // ------------- Animations -------------

    // Animate the opening and closing of the list
    const listContainerStyle = useAnimatedStyle(() => ({
        height: withSpring(hideList ? 0 : currentList.length * LIST_ITEM_HEIGHT, LIST_SPRING_CONFIG),
        position: 'relative',
        overflow: 'hidden'
    }));

    // Animate the toolbar above the textfield
    const toolbarStyle = useAnimatedStyle(() => ({
        left: 0,
        position: 'absolute',
        top: keyboardAbsoluteTop.value
    }));

    return (
        <View style={{ flex: fillSpace ? 1 : 0 }}>

            {/* Upper Item Creator */}
            {!hideList && currentList.length > 0 && (
                <Pressable
                    onPress={() => saveTextfieldAndCreateNew(-1)}
                >
                    <ThinLine />
                </Pressable>
            )}

            {/* List */}
            <ListContainer style={listContainerStyle}>
                {currentList.map((item) =>
                    <DraggableRow<T>
                        key={`${item.id}-row`}
                        item={item}
                        hideKeyboard={Boolean(hideKeyboard)}
                        positions={positions}
                        saveTextfieldAndCreateNew={saveTextfieldAndCreateNew}
                        listLength={currentList.length}
                        {...rest}
                        items={currentList}
                    />
                )}
            </ListContainer>

            {/* Empty Label or Click Area */}
            {currentList.length === 0 && emptyLabelConfig && !hideList ? (
                <EmptyLabel
                    {...emptyLabelConfig}
                    onPress={handleEmptySpaceClick}
                    onLayout={computeEmptySpaceHeight}
                />
            ) : !hideList && (
                <Pressable style={{ flex: 1 }} onPress={handleEmptySpaceClick} onLayout={computeEmptySpaceHeight} />
            )}

            {/* Modal */}
            {Modal && modalConfig &&
                <Modal {...modalConfig.props} />
            }

            {/* Toolbar */}
            {Toolbar && toolbarConfig &&
                <Portal>
                    <ToolbarContainer style={toolbarStyle}>
                        <Toolbar {...toolbarConfig.props} />
                    </ToolbarContainer>
                </Portal>
            }
        </View>
    );
};

export default SortableList;