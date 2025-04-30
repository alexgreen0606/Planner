import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FolderItemTypes } from '../../../../../src/feature/checklists/types';
import { NULL } from '../../../../../src/feature/checklists/constants';
import { getFolderFromStorage } from '../../../../../src/feature/checklists/storage';
import { ScrollContainerProvider } from '../../../../../src/foundation/sortedLists/services/ScrollContainerProvider';
import globalStyles from '../../../../../src/foundation/theme/globalStyles';
import FolderItemBanner from '../../../../../src/feature/checklists/components/FolderItemBanner';
import SortedFolder from '../../../../../src/feature/folderContents';

const Lists = () => {
  const router = useRouter();
  const { folderId, prevFolderName } = useLocalSearchParams<{ folderId: string, prevFolderName: string }>();

  const pageData = useMemo(() =>
    getFolderFromStorage(folderId),
    [folderId]
  );

  const parentFolderId = pageData?.listId !== NULL ? pageData.listId : null;

  const onOpenItem = (id: string, type: FolderItemTypes) => {
    if (type === FolderItemTypes.FOLDER) {
      router.push(`/lists/folder/${pageData.value}/${id}`);
    } else if (type === FolderItemTypes.LIST) {
      router.push(`/lists/checklist/${pageData.value}/${id}`);
    }
  };

  return (
      <ScrollContainerProvider
        header={
          <FolderItemBanner
            itemId={folderId}
            backButtonConfig={{
              display: prevFolderName !== NULL,
              label: prevFolderName
            }}
            itemType={FolderItemTypes.FOLDER}
          />
        }
      >
          <SortedFolder
            parentFolderData={parentFolderId ? getFolderFromStorage(parentFolderId) : undefined}
            folderId={folderId}
            onOpenItem={onOpenItem}
            parentClickTrigger={0} // you probably don't need parentClickTrigger anymore
          />
      </ScrollContainerProvider>
  );
};

export default Lists;