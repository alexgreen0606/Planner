// import React, { useState } from 'react';
// import { View } from 'react-native';
// import SortableFolder from './SortableFolder';
// import { FolderItem } from '../types';
// import { FolderItemType } from '../enums';
// import LabelBanner from './LabelBanner';
// import { useFolderContext } from '../services/FolderProvider';
// import { createFolder, deleteFolder, getFolder, saveFolderItems, updateFolder } from '../storage/folderStorage';
// import { createList, deleteList, updateList } from '../storage/listStorage';

// interface FolderProps {
//     folderId: string;
//     onBackClick: (parentFolderId: string) => void;
//     onOpenItem: (id: string, type: FolderItemType) => void;
// }

// const FolderDisplay = ({ folderId, onBackClick, onOpenItem }: FolderProps) => {
//     const { itemInTransfer: currentTextfield, setItemInTransfer: setCurrentTextfield } = useFolderContext();
//     const [manualDeleteItem, setManualDeleteItem] = useState<FolderItem | undefined>(undefined)

//     const folder = getFolder(folderId);
//     if (!folder) return;

//     const handleCreateItem = async (item: FolderItem) => {
//         switch (item.type) {
//             case FolderItemType.FOLDER:
//                 createFolder(folderId, item);
//                 break;
//             case FolderItemType.LIST:
//                 createList(folderId, item);
//                 break;
//             default:
//                 throw Error('Item does not have a type.');
//         }
//     };

//     const handleUpdateItem = (item: FolderItem, newParentId?: string) => {
//         switch (item.type) {
//             case FolderItemType.FOLDER:
//                 updateFolder(item, newParentId);
//                 break;
//             case FolderItemType.LIST:
//                 updateList(item, newParentId);
//                 break;
//             default:
//                 throw Error('Item does not have a type.');
//         }
//     };

//     const handleDeleteItem = (item: FolderItem) => {
//         switch (item.type) {
//             case FolderItemType.FOLDER:
//                 deleteFolder(item.id);
//                 break;
//             case FolderItemType.LIST:
//                 deleteList(item.id);
//                 break;
//             default:
//                 throw Error('Item does not have a type.');
//         }
//     };

//     const handleParentFolderClick = () => {
//         if (currentTextfield) {
//             // Delete this item from the list
//             setManualDeleteItem(currentTextfield);

//             // Save the newly modified item
//             delete currentTextfield.status;
//             handleUpdateItem(currentTextfield, folder.parentFolderId);

//         } else if (folder.parentFolderId) {
//             onBackClick(folder.parentFolderId);
//         }
//     };

//     const parentFolder = getFolder(folder.parentFolderId)

//     return (
//         <View>
//             <LabelBanner
//                 label={folder.value}
//                 backButtonConfig={{
//                     display: !!parentFolder,
//                     label: parentFolder?.value,
//                     onClick: handleParentFolderClick
//                 }}
//                 type={FolderItemType.FOLDER}
//             />
//             <SortableFolder
//                 folderItems={folder.items}
//                 openItem={onOpenItem}
//                 createItem={handleCreateItem}
//                 updateItem={handleUpdateItem}
//                 deleteItem={handleDeleteItem}
//                 saveFolderItems={(newItems: FolderItem[]) => saveFolderItems(folderId, newItems)}
//                 manualDeleteItem={manualDeleteItem}
//             />
//         </View>
//     );
// };

// export default FolderDisplay;