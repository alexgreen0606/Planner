import React, { useMemo } from 'react';
import { Pressable, TouchableOpacity, View } from 'react-native';
import { useSortableListContext } from '../../services/SortableListProvider';
import uuid from 'react-native-uuid';
import { useDerivedValue } from 'react-native-reanimated';
import {
    ItemStatus,
    ListItem,
    ModifyItemConfig,
    ListItemUpdateComponentProps,
    RowIconConfig,
    LIST_ITEM_HEIGHT,
} from '../../types';
import DraggableRow from './DraggableRow';
import EmptyLabel, { EmptyLabelProps } from '../EmptyLabel';
import ThinLine from '../../../components/ThinLine';
import { generateSortId } from '../../sortedListUtils';

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
    onSaveTextfield: (updatedItem: T) => Promise<void> | void;
    onDeleteItem: (item: T) => Promise<void> | void;
    onDragEnd: (updatedItem: T) => Promise<void> | void;
    onContentClick: (item: T) => void;
    getLeftIconConfig?: (item: T) => RowIconConfig<T>;
    getRightIconConfig?: (item: T) => RowIconConfig<T>;
    getTextfieldKey: (item: T) => string;
    handleValueChange?: (text: string, item: T) => T;
    getRowTextColor?: (item: T) => string;
    getPopovers?: (item: T) => ModifyItemConfig<T, P>[];
    getModal?: (item: T) => ModifyItemConfig<T, M>;
    initializeItem?: (item: ListItem) => T;
    emptyLabelConfig?: Omit<EmptyLabelProps, 'onPress'>;
    staticList?: boolean;
}

/**
 * Builds a map linking each item to its index in the list.
 */
function buildItemPositions<T extends ListItem>(currentList: T[]): Record<string, number> {
    'worklet';
    return [...currentList]
        .reduce<Record<string, number>>((acc, item, index) => {
            acc[item.id] = index;
            return acc;
        }, {});
};

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
    ...rest
}: DraggableListProps<T, P, M>) => {
    const { currentTextfield, setCurrentTextfield } = useSortableListContext();

    /**
     * Builds the list out of the existing items and the textfield.
     */
    function buildFullList() {
        const fullList = items.filter(item => item.status !== ItemStatus.HIDDEN);
        if (currentTextfield?.listId === listId) {
            if (currentTextfield?.status === ItemStatus.NEW)
                fullList.push(currentTextfield);
            else {
                const textfieldIndex = fullList.findIndex(item => item.id === currentTextfield.id);
                if (textfieldIndex !== -1)
                    fullList[textfieldIndex] = currentTextfield;
            }
        }
        console.info(listId, [...fullList].sort((a, b) => a.sortId - b.sortId));
        return fullList.sort((a, b) => a.sortId - b.sortId);
    };

    /**
     * Saves the existing textfield to storage and generates a new one at the requested position.
     * @param parentSortId - the sort ID of the item the new textfield must go below
     */
    async function saveTextfieldAndCreateNew(parentSortId: number) {
        if (staticList) return;
        if (currentTextfield && currentTextfield.value.trim() !== '') {

            // Save the current textfield before creating a new one.
            await onSaveTextfield(currentTextfield);
        }
        let newTextfield = {
            id: uuid.v4(),
            sortId: generateSortId(parentSortId, currentList),
            value: '',
            status: ItemStatus.NEW,
            listId: listId
        } as ListItem;
        newTextfield = initializeItem?.(newTextfield) ?? newTextfield;
        setCurrentTextfield(newTextfield);
    };

    function handleEmptySpaceClick () {
        if (!currentTextfield)
            saveTextfieldAndCreateNew(currentList[currentList.length - 1]?.sortId ?? -1);
    }

    // Derive the current list out of the list and textfield
    const currentList = useMemo(() =>
        buildFullList(),
        [currentTextfield?.id, currentTextfield?.sortId, items]
    );

    // Derive positions out of the current list
    const positions = useDerivedValue(() => buildItemPositions(currentList),
        [currentList]
    );

    return (
        <View style={{ flex: fillSpace ? 1 : 0 }}>
            {!hideList && (
                <View>
                    {/* Upper Item Creator */}
                    <TouchableOpacity activeOpacity={staticList ? 1 : 0} onPress={() => saveTextfieldAndCreateNew(-1)}>
                        <ThinLine />
                    </TouchableOpacity>

                    {/* List */}
                    <View style={{
                        height: currentList.length * LIST_ITEM_HEIGHT,
                        position: 'relative',
                    }}>
                        {currentList.map((item) =>
                            <DraggableRow<T, P, M>
                                key={`${item.id}-row`}
                                item={item}
                                positions={positions}
                                saveTextfieldAndCreateNew={saveTextfieldAndCreateNew}
                                listLength={currentList.length}
                                {...rest}
                                items={currentList}
                            />
                        )}
                    </View>
                </View>
            )}

            {/* Empty Label */}
            {currentList.length === 0 && emptyLabelConfig ? (
                <EmptyLabel
                    {...emptyLabelConfig}
                    onPress={handleEmptySpaceClick}
                />
            ) : (
                <Pressable style={{flex: 1}} onPress={handleEmptySpaceClick} />
            )}
        </View>
    )
};

export default SortableList;
