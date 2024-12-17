import React from 'react';
import { View } from 'react-native';
import SortableFolder from './SortableFolder';
import { FolderItem } from '../types';
import { FolderItemType } from '../enums';
import LabelBanner from './LabelBanner';
import { useFolderContext } from '../services/FolderProvider';
import { createFolder, deleteFolder, getFolder, saveFolderItems, updateFolder } from '../storage/folderStorage';
import { createList, deleteList, updateList } from '../storage/listStorage';

interface FolderProps {
    folderId: string;
    onBackClick: (parentFolderId: string) => void;
    onOpenItem: (id: string, type: FolderItemType, triggerRerender?: boolean) => void;
}

const FolderDisplay = ({ folderId, onBackClick, onOpenItem }: FolderProps) => {
    const { currentItem } = useFolderContext();

    const folder = getFolder(folderId);

    const handleCreateItem = async (item: FolderItem) => {
        switch (item.type) {
            case FolderItemType.FOLDER:
                createFolder(folderId, item);
                break;
            case FolderItemType.LIST:
                console.log('creating list...')
                createList(folderId, item);
                break;
            default:
                throw Error('Item does not have a type.');
        }
    };

    const handleUpdateItem = (item: FolderItem, newParentId?: string) => {
        switch (item.type) {
            case FolderItemType.FOLDER:
                updateFolder(item, newParentId);
                break;
            case FolderItemType.LIST:
                updateList(item, newParentId);
                break;
            default:
                throw Error('Item does not have a type.');
        }
        if (newParentId) {
            onOpenItem(folderId, FolderItemType.FOLDER, true);
        }
    };

    const handleDeleteItem = (item: FolderItem) => {
        switch (item.type) {
            case FolderItemType.FOLDER:
                deleteFolder(item.id);
                break;
            case FolderItemType.LIST:
                deleteList(item.id);
                break;
            default:
                throw Error('Item does not have a type.');
        }
    };

    const handleParentFolderClick = async () => {
        if (folder) {
            if (currentItem) {
                handleUpdateItem(currentItem, folder.parentFolderId);
                onOpenItem(folderId, FolderItemType.FOLDER, true);
            } else {
                onBackClick(folder.parentFolderId!);
            }
        }
    };

    if (!folder) return;

    const parentFolder = getFolder(folder.parentFolderId)

    return (
        <View>
            <LabelBanner
                label={folder.value}
                backButtonConfig={{
                    display: !!parentFolder,
                    label: parentFolder?.value,
                    onClick: handleParentFolderClick
                }}
                type={FolderItemType.FOLDER}
            />
            <SortableFolder
                listItems={folder.items}
                openItem={onOpenItem}
                createItem={handleCreateItem}
                updateItem={handleUpdateItem}
                deleteItem={handleDeleteItem}
                saveFolderItems={(newItems: FolderItem[]) => saveFolderItems(folderId, newItems)}
            />
        </View>
    );
};

export default FolderDisplay;