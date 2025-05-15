import { EFolderItemType } from '@/enums/EFolderItemType';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { PlatformColor, View } from 'react-native';
import FolderItemBanner from '../../../../../../src/feature/checklists/components/FolderItemBanner';
import { NULL } from '../../../../../../src/feature/checklists/constants';
import SortedFolder from '../../../../../../src/feature/folderContents';
import { ScrollContainerProvider } from '../../../../../../src/services/ScrollContainerProvider';
import { getFolderFromStorage } from '../../../../../../src/storage/checklistsStorage';

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

  const onOpenItem = (id: string, type: EFolderItemType) => {
    if (type === EFolderItemType.FOLDER) {
      router.push(`/lists/folder/${pageData.value}/${pageData.id}/${id}`);
    } else if (type === EFolderItemType.LIST) {
      router.push(`/lists/checklist/${pageData.value}/${id}`);
    }
  };

  return (
    <View
      className='flex-1'
      style={{ backgroundColor: PlatformColor('systemBackground') }}
    >
      <ScrollContainerProvider
        header={
          <FolderItemBanner
            itemId={folderId}
            backButtonConfig={{
              pathname: `/lists/folder/${prevFolderName}/${prevFolderId}/${folderId}`,
              hide: prevFolderName === NULL,
              label: prevFolderName
            }}
            itemType={EFolderItemType.FOLDER}
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