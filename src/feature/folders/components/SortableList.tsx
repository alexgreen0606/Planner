import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { ListItem } from '../../../foundation/sortedLists/types';
import { ShiftTextfieldDirection, ItemStatus } from '../../../foundation/sortedLists/enums';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import { FolderItemType } from '../enums';
import FolderItemBanner from './FolderItemBanner';
import { getFolder, getList, updateListItems } from '../storage/folderStorage';
import ClickableLine from '../../../foundation/ui/separators/ClickableLine';
import ListTextfield from '../../../foundation/sortedLists/components/ListTextfield';
import GenericIcon from '../../../foundation/ui/icons/GenericIcon';
import globalStyles from '../../../theme/globalStyles';

interface SortableListProps {
    listId: string;
    onBackClick: (parentFolderId: string) => void;
};

const SortableList = ({
    listId,
    onBackClick
}: SortableListProps) => {
    const { colors } = useTheme();
    const initialListData = useMemo(() => getList(listId), [listId]);
    const parentFolderData = useMemo(() => getFolder(initialListData.parentFolderId), [initialListData]);

    // Stores the current list and all handler functions to update it
    const SortedList = useSortedList<ListItem>(
        initialListData.items,
        (newItems: ListItem[]) => updateListItems(listId, newItems)
    );

    /**
     * Displays the item based on its state. If being edited, a textfield is displayed.
     * Otherwise, a draggable string is displayed.
     * @param item - the item being displayed
     * @param drag - a function to begin dragging the item
     */
    const renderItem = (item: ListItem, drag: any, isItemDeleting: boolean, isItemEditing: boolean) =>
        isItemEditing ?
            <ListTextfield
                key={`${item.id}-${item.sortId}`}
                item={item}
                onChange={(text) => SortedList.updateItem({ ...item, value: text })}
                onSubmit={() => SortedList.saveTextfield(ShiftTextfieldDirection.BELOW)}
            /> :
            <Text
                onLongPress={drag}
                onPress={() => SortedList.beginEditItem(item)}
                style={{
                    ...globalStyles.listItem,
                    color: isItemDeleting ? colors.outline : colors.secondary,
                    textDecorationLine: isItemDeleting ? 'line-through' : undefined
                }}
            >
                {item.value}
            </Text>

    /**
     * Displays a row in the list. An radio button is rendered on the left allowing for deleting items.
     * @param param0 - the item data and the drag function for sorting
     */
    const renderRow = ({ item, drag }: RenderItemParams<ListItem>) => {
        const isItemDeleting = item.status === ItemStatus.DELETE;
        const isItemEditing = [ItemStatus.EDIT, ItemStatus.NEW].includes(item.status);
        return (
            <View style={globalStyles.backdrop}>
                <View style={globalStyles.listRow}>
                    
                    {/* Toggle Delete Button */}
                    <TouchableOpacity
                        onPress={() => SortedList.toggleDeleteItem(item)}
                    >
                        <GenericIcon
                            type='FontAwesome'
                            name={isItemDeleting ? 'circle' : 'circle-thin'}
                            size={20}
                            color={colors.outline}
                        />
                    </TouchableOpacity>

                    {/* Row data */}
                    {renderItem(item, drag, isItemDeleting, isItemEditing)}
                </View>

                {/* Separator line */}
                <ClickableLine onPress={() => SortedList.moveTextfield(item.sortId)} />
            </View>
        )
    }

    return (
        <View>
            <FolderItemBanner
                itemId={initialListData.id}
                backButtonConfig={{
                    display: !!parentFolderData,
                    label: parentFolderData?.value,
                    onClick: () => onBackClick(initialListData.parentFolderId!)
                }}
                itemType={FolderItemType.LIST}
            />
            <ClickableLine onPress={() => SortedList.moveTextfield(-1)} />
            <DraggableFlatList
                data={SortedList.current}
                scrollEnabled={false}
                onDragEnd={SortedList.endDragItem}
                onDragBegin={SortedList.beginDragItem}
                keyExtractor={(item) => item.id}
                renderItem={renderRow}
            />
        </View>
    );
};

export default SortableList;