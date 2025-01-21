import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useSortableListContext } from '../../services/SortableListProvider';
import uuid from 'react-native-uuid';
import { useDerivedValue } from 'react-native-reanimated';
import {
    ItemStatus,
    ListItem,
    ListItemUpdateComponentConfig,
    ListItemUpdateComponentProps,
    RowIconConfig,
    generateSortId,
    LIST_ITEM_HEIGHT
} from '../../utils';
import ClickableLine from '../separator/ClickableLine';
import DraggableRow from './DraggableRow';
import EmptyLabel from '../emptyLabel/EmptyLabel';
import colors from '../../../theme/colors';

export interface DraggableListProps<
    T extends ListItem,
    P extends ListItemUpdateComponentProps<T> = never,
    M extends ListItemUpdateComponentProps<T> = never,
> {
    listId: string;
    items: T[];
    hideList?: boolean;
    loading: boolean;
    onSaveTextfield: (updatedItem: T) => Promise<void> | void;
    onDeleteItem: (item: T) => Promise<void> | void;
    onContentClick: (item: T) => void;
    getLeftIconConfig?: (item: T) => RowIconConfig<T>;
    getRightIconConfig?: (item: T) => RowIconConfig<T>;
    getTextfieldKey: (item: T) => string;
    handleValueChange?: (text: string, item: T) => T;
    getRowTextColor?: (item: T) => string;
    getPopovers?: (item: T) => ListItemUpdateComponentConfig<T, P>[];
    getModal?: (item: T) => ListItemUpdateComponentConfig<T, M>;
    initializeItem?: (item: ListItem) => T;
}

/**
 * Builds a map linking each item to its index in the list.
 */
function buildItemPositions<T extends ListItem>(currentList: T[]): Record<string, number> {
    'worklet';
    return [...currentList]
        .sort((a, b) => a.sortId - b.sortId)
        .reduce<Record<string, number>>((acc, item, index) => {
            acc[item.id] = index;
            return acc;
        }, {});
};

const SortableList = <
    T extends ListItem,
    P extends ListItemUpdateComponentProps<T>,
    M extends ListItemUpdateComponentProps<T>
>(props: DraggableListProps<T, P, M>) => {
    const { currentTextfield, setCurrentTextfield } = useSortableListContext();

    /**
     * Saves the existing textfield to storage and generates a new one at the requested position.
     * @param parentSortId - the sort ID of the item the new textfield must go below
     */
    async function saveTextfieldAndCreateNew(parentSortId: number) {
        if (currentTextfield && currentTextfield.value.trim() !== '') {
            const staticItem = { ...currentTextfield, status: ItemStatus.STATIC };
            setCurrentTextfield(undefined);
            await props.onSaveTextfield(staticItem);
        }
        let newTextfield = {
            id: uuid.v4(),
            sortId: generateSortId(parentSortId, currentList),
            value: '',
            status: ItemStatus.NEW,
            listId: props.listId
        } as ListItem;
        newTextfield = props.initializeItem?.(newTextfield) ?? newTextfield;
        setCurrentTextfield(newTextfield);
    };

    // Derive the current list out of the list and textfield
    const currentList = useMemo(() => {
        const fullList = [...props.items];
        if (
            currentTextfield?.status === ItemStatus.NEW
            && currentTextfield.listId === props.listId
        )
            fullList.push(currentTextfield);
        return fullList;
    }, [currentTextfield, props.items, props.loading]);

    // Derive positions out of the current list
    const positions = useDerivedValue(() => buildItemPositions<T>(currentList), [currentList]);

    return (
        <View>
            <ClickableLine onPress={() => saveTextfieldAndCreateNew(-1)} />
            {!props.hideList && (
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
                            {...props}
                            items={currentList}
                        />
                    )}
                </View>
            )}
            {currentList.length === 0 && (
                <EmptyLabel
                    label='Empty Placeholder'
                    iconConfig={{
                        type: 'celebrate',
                        color: colors.grey,
                        size: 16
                    }}
                />
            )}
        </View>
    )
};

export default SortableList;
