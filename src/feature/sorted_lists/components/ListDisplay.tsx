import React from 'react';
import { View } from 'react-native';
import SortableList from './SortableList';
import LabelBanner from './LabelBanner';
import { FolderItemType } from '../enums';
import { getFolder } from '../storage/folderStorage';
import { getList, saveListItems } from '../storage/listStorage';
import { ListItem } from '../../../foundation/lists/types';

interface ListProps {
    listId: string;
    onBackClick: (parentFolderId: string) => void;
}

const ListDisplay = ({ listId, onBackClick }: ListProps) => {

    const list = getList(listId);

    if (!list) return;

    const parentFolder = getFolder(list.parentFolderId);

        return (
            <View>
                <LabelBanner
                    label={list.value}
                    backButtonConfig={{
                        display: !!parentFolder,
                        label: parentFolder?.value,
                        onClick: () => onBackClick(list.parentFolderId!)
                    }}
                    type={FolderItemType.LIST}
                />
                <SortableList
                    listItems={list.items}
                    saveItems={(newItems: ListItem[]) => saveListItems(listId, newItems)}
                />
            </View>
        );
};

export default ListDisplay;