import React, { useMemo, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { Portal } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import uuid from 'react-native-uuid';
import DraggableRow from './components/DraggableRow';
import EmptyLabel, { EmptyLabelProps } from './components/EmptyLabel';
import { useKeyboard } from './services/KeyboardProvider';
import { useScrollContainer } from './services/ScrollContainerProvider';
import { buildItemPositions, generateSortId } from './utils';
import { EItemStatus } from '@/enums/EItemStatus';
import { ListItemUpdateComponentProps, ListItemIconConfig, ModifyItemConfig } from './lib/listRowConfig';
import { IListItem } from '@/types/listItems/core/TListItem';
import { LIST_ITEM_HEIGHT } from '@/constants/size';

const ToolbarContainer = Animated.createAnimatedComponent(View);

export interface DraggableListProps<
    T extends IListItem,
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
    initializeItem?: (item: IListItem) => T;
    customIsItemDeleting?: (item: T) => boolean;
    hideKeyboard?: boolean;
    isLoading?: boolean;
    fillSpace?: boolean;
    disableDrag?: boolean;
    staticList?: boolean;
}

const SortableList = <
    T extends IListItem,
    P extends ListItemUpdateComponentProps<T>,
    M extends ListItemUpdateComponentProps<T>
>({
    listId,
    items,
    isLoading,
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
        setCurrentTextfield
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
            saveTextfieldAndCreateNew(-1, true);
        }
    }

    // ------------- List Building -------------

    /**
     * Builds the list out of the existing items and the textfield.
     * @returns Array of list items sorted by sortId
     */
    function buildFullList() {
        const fullList = items.filter(item => item.status !== EItemStatus.HIDDEN);
        if (currentTextfield?.listId === listId) {
            if (currentTextfield?.status === EItemStatus.NEW) {
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
     * @param referenceSortId The sort ID of an item to place the new textfield near
     * @param isChildId Signifies if the reference ID should be below the new textfield, else above.
     */
    async function saveTextfieldAndCreateNew(referenceSortId?: number, isChildId: boolean = false) {
        if (staticList) return;

        if (currentTextfield && currentTextfield.value.trim() !== '') {
            // Save the current textfield before creating a new one
            pendingItem.current = { ...currentTextfield };
            const newId = await onSaveTextfield(currentTextfield);
            if (newId) {
                pendingItem.current!.id = newId;
            }
        }

        if (!referenceSortId) {
            setCurrentTextfield(undefined);
            return;
        }

        let newTextfield: IListItem = {
            id: uuid.v4(),
            sortId: generateSortId(referenceSortId, currentList, isChildId),
            status: EItemStatus.NEW,
            listId: listId,
            value: '',
        };

        newTextfield = initializeItem?.(newTextfield) ?? newTextfield as T;
        setCurrentTextfield(newTextfield, pendingItem.current);
    }

    // ------------- Animations -------------

    // Animate the toolbar above the textfield
    const toolbarStyle = useAnimatedStyle(() => ({
        left: 0,
        position: 'absolute',
        top: keyboardAbsoluteTop.value
    }));

    return (
        <View style={{ flex: fillSpace ? 1 : 0 }}>

            {/* TODO: Loading SVG */}

            {/* List */}
            <View style={{ height: currentList.length * LIST_ITEM_HEIGHT, width: '100%' }}>
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
            </View>

            {/* Empty Label or Click Area */}
            {emptyLabelConfig && currentList.length === 0 && !isLoading ? (
                <EmptyLabel
                    {...emptyLabelConfig}
                    onPress={handleEmptySpaceClick}
                />
            ) : !isLoading && (
                <Pressable
                    style={{ flex: 1 }}
                    onPress={handleEmptySpaceClick}
                />
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