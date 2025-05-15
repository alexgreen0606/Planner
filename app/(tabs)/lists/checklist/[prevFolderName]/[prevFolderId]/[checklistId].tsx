import FolderItemBanner from '@/feature/checklists/components/FolderItemBanner';
import { LISTS_STORAGE_ID } from '@/feature/checklists/constants';
import SortableList from '@/feature/sortedList';
import { generateCheckboxIconConfig } from '@/feature/sortedList/commonProps';
import { EItemStatus } from '@/enums/EItemStatus';
import useSortedList from '@/feature/sortedList/hooks/useSortedList';
import { useDeleteScheduler } from '@/services/DeleteScheduler';
import { ScrollContainerProvider } from '@/services/ScrollContainerProvider';
import { isItemTextfield } from '@/feature/sortedList/utils';
import globalStyles from '@/theme/globalStyles';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { IListItem } from '@/types/listItems/core/TListItem';
import { IChecklist } from '@/types/checklists/IChecklist';
import { EFolderItemType } from '@/enums/EFolderItemType';

const ChecklistScreen = () => {
    const { checklistId, prevFolderName, prevFolderId } = useLocalSearchParams<{
        checklistId: string,
        prevFolderName: string,
        prevFolderId: string
    }>();

    const { isItemDeleting } = useDeleteScheduler();

    function getItemsFromStorageObject(storageObject: IChecklist) {
        return storageObject.items;
    }

    function setItemsInStorageObject(newItems: IListItem[], currentObject: IChecklist) {
        return { ...currentObject, items: newItems };
    }

    const SortedItems = useSortedList<IListItem, IChecklist>({
        storageId: LISTS_STORAGE_ID,
        storageKey: checklistId,
        getItemsFromStorageObject,
        setItemsInStorageObject
    });

    return (
        <View style={globalStyles.blackFilledSpace}>
            <ScrollContainerProvider
                header={
                    <FolderItemBanner
                        itemId={checklistId}
                        backButtonConfig={{
                            pathname: `/lists/folder/${prevFolderName}/${prevFolderId}`,
                            label: prevFolderName
                        }}
                        itemType={EFolderItemType.LIST}
                    />
                }
            >
                <SortableList<IListItem, never, never>
                    listId={checklistId}
                    items={SortedItems.items}
                    onDragEnd={SortedItems.persistItemToStorage}
                    onContentClick={SortedItems.toggleItemEdit}
                    onDeleteItem={SortedItems.deleteSingleItemFromStorage}
                    getTextfieldKey={item => `${item.id}-${item.sortId}`}
                    getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedItems.toggleItemDelete, isItemDeleting(item))}
                    onSaveTextfield={(updatedItem) => {
                        const item = { ...updatedItem, status: isItemTextfield(updatedItem) ? EItemStatus.STATIC : updatedItem.status }
                        SortedItems.persistItemToStorage(item);
                    }}
                    emptyLabelConfig={{
                        label: "It's a ghost town in here.",
                        className: 'h-[500px]'
                    }}
                />
            </ScrollContainerProvider>
        </View>
    );
};

export default ChecklistScreen;