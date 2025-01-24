import React, { useMemo } from 'react';
import { View } from 'react-native';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import FolderItemBanner from './FolderItemBanner';
import { getFolderFromStorage, getListFromStorage } from '../storage/folderStorage';
import colors from '../../../foundation/theme/colors';
import { isItemDeleting, isItemTextfield, ItemStatus, ListItem } from '../../../foundation/sortedLists/utils';
import { FOLDER_STORAGE_ID, FolderItemType, List } from '../utils';
import SortableList from '../../../foundation/sortedLists/components/list/SortableList';

interface SortableListProps {
    listId: string;
    onBackClick: (listId: string) => void;
};

const SortedList = ({
    listId,
    onBackClick
}: SortableListProps) => {
    const initialListData = useMemo(() => getListFromStorage(listId), [listId]);
    const parentFolderData = useMemo(() => getFolderFromStorage(initialListData.listId), [initialListData]);

    // Stores the current list and all handler functions to update it
    const SortedItems = useSortedList<ListItem, List>(
        listId,
        FOLDER_STORAGE_ID,
        (storageObject: List) => storageObject.items,
        (newItems: ListItem[], currentObject: List) => ({ ...currentObject, items: newItems }),
    );

    return (
        <View>
            <FolderItemBanner
                itemId={initialListData.id}
                backButtonConfig={{
                    display: !!parentFolderData,
                    label: parentFolderData?.value,
                    onClick: () => onBackClick(initialListData.listId!)
                }}
                itemType={FolderItemType.LIST}
            />
            <SortableList<ListItem, never, never>
                listId={listId}
                items={SortedItems.items}
                onDragEnd={SortedItems.persistItemToStorage}
                onSaveTextfield={(updatedItem: ListItem) => {
                    const item = {...updatedItem, status: isItemTextfield(updatedItem) ? ItemStatus.STATIC : updatedItem.status }
                    SortedItems.persistItemToStorage(item);
                }}
                onContentClick={SortedItems.convertItemToTextfield}
                onDeleteItem={SortedItems.deleteItemFromStorage}
                getTextfieldKey={item => `${item.id}-${item.sortId}`}
                getLeftIconConfig={item => ({
                    icon: {
                        type: isItemDeleting(item) ? 'circle-filled' : 'circle',
                        color: isItemDeleting(item) ? colors.blue : colors.grey
                    },
                    onClick: SortedItems.toggleDeleteItem
                })}
            />
            {/* {!SortedItems.items.length && (
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
            )} */}
        </View>
    );
};

export default SortedList;