import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import SortedFolder from './components/lists/SortedFolder';
import { SortableListProvider } from '../../foundation/sortedLists/services/SortableListProvider';
import { FolderItemType, NULL, ROOT_FOLDER_ID } from './utils';
import globalStyles from '../../foundation/theme/globalStyles';
import { getFolderFromStorage, getFolderItems, getListFromStorage } from './storage/folderStorage';
import FolderItemBanner from './components/banner/FolderItemBanner';
import SortedList from './components/lists/SortedList';

interface PageConfig {
  id: string;
  type: FolderItemType;
}

const Lists = () => {
  const [pageConfig, setPageConfig] = useState<PageConfig>({
    id: ROOT_FOLDER_ID,
    type: FolderItemType.FOLDER
  });

  const [parentClickTrigger, setParentClickTrigger] = useState(0);

  const pageData = useMemo(() => pageConfig.type === FolderItemType.FOLDER ?
    getFolderFromStorage(pageConfig.id) : getListFromStorage(pageConfig.id),
    [pageConfig.id]
  );
  const parentFolderData = useMemo(() => pageData.listId !== NULL ? getFolderFromStorage(pageData.listId) : undefined, [pageData.listId]);

  const onOpenParent = (listId: string) => {
    setParentClickTrigger(0);
    setPageConfig({ id: listId, type: FolderItemType.FOLDER });
  }

  const onOpenItem = (id: string, type: FolderItemType) => {
    setParentClickTrigger(0);
    setPageConfig({ id, type });
  }

  const clickParent = () => {
    setParentClickTrigger(curr => curr + 1);
  }

  return (
    <View key={pageConfig.id} style={globalStyles.blackFilledSpace}>

      {/* Banner */}
      <FolderItemBanner
        itemId={pageConfig.id}
        backButtonConfig={{
          display: !!parentFolderData,
          label: parentFolderData?.value,
          onClick: pageConfig.type === FolderItemType.LIST ?
            () => onOpenParent(parentFolderData!.id!) : clickParent
        }}
        itemType={pageConfig.type}
      />

      {/* List */}
      {pageConfig.type === FolderItemType.FOLDER ? (
        <SortableListProvider>
          <SortedFolder
            parentFolderData={parentFolderData}
            folderId={pageConfig.id}
            onBackClick={onOpenParent}
            onOpenItem={onOpenItem}
            parentClickTrigger={parentClickTrigger}

          />
        </SortableListProvider>
      ) : (
        <SortableListProvider>
          <SortedList listId={pageConfig.id} />
        </SortableListProvider>
      )}
    </View>
  );
};

export default Lists;