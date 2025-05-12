import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import FolderItemBanner from '../../../../../../src/feature/checklists/components/FolderItemBanner';
import { NULL } from '../../../../../../src/feature/checklists/constants';
import { getFolderFromStorage } from '../../../../../../src/feature/checklists/storage';
import { FolderItemTypes } from '../../../../../../src/feature/checklists/types';
import SortedFolder from '../../../../../../src/feature/folderContents';
import { ScrollContainerProvider } from '../../../../../../src/foundation/sortedLists/services/ScrollContainerProvider';
import globalStyles from '@/theme/globalStyles';
import { View } from 'react-native';

const Lists = () => {
  const router = useRouter();
  const { folderId, prevFolderName, prevFolderId } = useLocalSearchParams<{
    folderId: string,
    prevFolderName: string,
    prevFolderId: string
  }>();

  const pageData = useMemo(() =>
    getFolderFromStorage(folderId),
    [folderId]
  );

  const onOpenItem = (id: string, type: FolderItemTypes) => {
    if (type === FolderItemTypes.FOLDER) {
      router.push(`/lists/folder/${pageData.value}/${pageData.id}/${id}`);
    } else if (type === FolderItemTypes.LIST) {
      router.push(`/lists/checklist/${pageData.value}/${id}`);
    }
  };

  return (
    <View style={globalStyles.blackFilledSpace}>
      <ScrollContainerProvider
        header={
          <FolderItemBanner
            itemId={folderId}
            backButtonConfig={{
              pathname: `/lists/folder/${prevFolderName}/${prevFolderId}/${folderId}`,
              hide: prevFolderName === NULL,
              label: prevFolderName
            }}
            itemType={FolderItemTypes.FOLDER}
          />
        }
      >
        <SortedFolder
          parentFolderData={prevFolderId !== NULL ? getFolderFromStorage(prevFolderId) : undefined}
          folderId={folderId}
          handleOpenItem={onOpenItem}
          parentClickTrigger={0} // you probably don't need parentClickTrigger anymore
        />
      </ScrollContainerProvider>
    </View>
  );
};

export default Lists;