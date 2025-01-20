import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import FolderItemBanner from './FolderItemBanner';
import { getFolderFromStorage, getListFromStorage } from '../storage/folderStorage';
import ListTextfield from '../../../foundation/sortedLists/components/textfield/ListTextfield';
import GenericIcon from '../../../foundation/components/icons/GenericIcon';
import globalStyles from '../../../foundation/theme/globalStyles';
import colors from '../../../foundation/theme/colors';
import { ItemStatus, ListItem, ShiftTextfieldDirection } from '../../../foundation/sortedLists/utils';
import { FOLDER_STORAGE_ID, FolderItemType, List } from '../utils';
import ClickableLine from '../../../foundation/sortedLists/components/separator/ClickableLine';
import EmptyLabel from '../../../foundation/sortedLists/components/emptyLabel/EmptyLabel';

interface SortableListProps {
    listId: string;
    onBackClick: (parentFolderId: string) => void;
};

const SortedList = ({
    listId,
    onBackClick
}: SortableListProps) => {
    const initialListData = useMemo(() => getListFromStorage(listId), [listId]);
    const parentFolderData = useMemo(() => getFolderFromStorage(initialListData.parentFolderId), [initialListData]);

    // Stores the current list and all handler functions to update it
    const SortedItems = useSortedList<ListItem, List>(
        listId,
        FOLDER_STORAGE_ID,
        (storageObject: List) => storageObject.items,
        (newItems: ListItem[], currentList: List) => ({...currentList, items: newItems})
    );

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
                        onPress={() => SortedItems.toggleDeleteItem(item)}
                    >
                        <GenericIcon
                            type='FontAwesome'
                            name={isItemDeleting ? 'circle' : 'circle-thin'}
                            size={20}
                            color={isItemDeleting ? colors.blue : colors.grey}
                        />
                    </TouchableOpacity>

                    {/* Row data */}
                    {isItemEditing ? (
                        <ListTextfield
                            key={`${item.id}-${item.sortId}`}
                            item={item}
                            onChange={(text) => SortedItems.persistItemToStorage({ ...item, value: text })}
                            onSubmit={() => SortedItems.saveTextfield(ShiftTextfieldDirection.BELOW)}
                        />
                    ) : (
                        <Text
                            onLongPress={drag}
                            onPress={() => SortedItems.beginEditItem(item)}
                            style={{
                                ...globalStyles.listItem,
                                color: isItemDeleting ? colors.grey : colors.white,
                                textDecorationLine: isItemDeleting ? 'line-through' : undefined
                            }}
                        >
                            {item.value}
                        </Text>
                    )}
                </View>

                {/* Separator line */}
                <ClickableLine onPress={() => SortedItems.createOrMoveTextfield(item.sortId)} />
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
            <ClickableLine onPress={() => SortedItems.createOrMoveTextfield(-1)} />
            <DraggableFlatList
                data={SortedItems.items.sort((a,b) => a.sortId - b.sortId)}
                scrollEnabled={false}
                onDragEnd={SortedItems.endDragItem}
                onDragBegin={SortedItems.beginDragItem}
                keyExtractor={(item) => item.id}
                renderItem={renderRow}
            />
            {!SortedItems.items.length && (
                <EmptyLabel
                    label={"It's a ghost town in here."}
                    iconConfig={{
                        type: 'ghost',
                        size: 26,
                        color: colors.grey,
                    }}
                    customFontSize={14}
                    onPress={() => SortedItems.createOrMoveTextfield(-1)}
                    style={{ height: '90%', flexDirection: 'column' }}
                />
            )}
        </View>
    );
};

export default SortedList;