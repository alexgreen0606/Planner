import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { FolderItemTypes } from '../../feature/checklists/types';
import { NULL, ROOT_FOLDER_KEY } from '../../feature/checklists/constants';
import { getFolderFromStorage, getListFromStorage } from '../../feature/checklists/storage/folderStorage';
import globalStyles from '../../foundation/theme/globalStyles';
import { SortableListProvider } from '../../foundation/sortedLists/services/SortableListProvider';
import FolderItemBanner from './banner/FolderItemBanner';
import SortedFolder from '../../feature/folder';
import ChecklistList from '../../feature/checklists';

type PageConfig = {
  id: string;
  type: FolderItemTypes;
}

const Lists = () => {
  const [pageConfig, setPageConfig] = useState<PageConfig>({
    id: ROOT_FOLDER_KEY,
    type: FolderItemTypes.FOLDER
  });

  const [parentClickTrigger, setParentClickTrigger] = useState(0);

  const pageData = useMemo(() => pageConfig.type === FolderItemTypes.FOLDER ?
    getFolderFromStorage(pageConfig.id) : getListFromStorage(pageConfig.id),
    [pageConfig.id]
  );
  const parentFolderData = useMemo(() => pageData.listId !== NULL ? getFolderFromStorage(pageData.listId) : undefined, [pageData.listId]);

  const onOpenParent = (listId: string) => {
    setParentClickTrigger(0);
    setPageConfig({ id: listId, type: FolderItemTypes.FOLDER });
  }

  const onOpenItem = (id: string, type: FolderItemTypes) => {
    setParentClickTrigger(0);
    setPageConfig({ id, type });
  }

  const clickParent = () => {
    setParentClickTrigger(curr => curr + 1);
  }

  return (
    <View key={pageConfig.id} style={globalStyles.blackFilledSpace}>
      <SortableListProvider
      header={
        <FolderItemBanner
            itemId={pageConfig.id}
            backButtonConfig={{
              display: !!parentFolderData,
              label: parentFolderData?.value,
              onClick: pageConfig.type === FolderItemTypes.FOLDER ? clickParent : () => onOpenParent(parentFolderData!.id!)
            }}
            itemType={pageConfig.type}
          />
      }
      >

      {pageConfig.type === FolderItemTypes.FOLDER ? (
          <SortedFolder
            parentFolderData={parentFolderData}
            folderId={pageConfig.id}
            onBackClick={onOpenParent}
            onOpenItem={onOpenItem}
            parentClickTrigger={parentClickTrigger}

          />
      ) : (
          <ChecklistList listId={pageConfig.id} />
      )}
      </SortableListProvider>
    </View>
  );
};

export default Lists;