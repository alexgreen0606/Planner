import { EFolderItemType } from '@/enums/EFolderItemType';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { PlatformColor, View } from 'react-native';
import FolderItemBanner from '../../../../../../src/feature/checklists/components/FolderItemBanner';
import { NULL } from '../../../../../../src/feature/checklists/constants';
import SortedFolder from '../../../../../../src/feature/folderContents';
import { ScrollContainerProvider } from '../../../../../../src/services/ScrollContainer';
import { getFolderFromStorage } from '../../../../../../src/storage/checklistsStorage';

const Lists = () => {
  const router = useRouter();
  const { folderId, prevFolderName, prevFolderId } = useLocalSearchParams<{
    folderId: string,
    prevFolderName: string,
    prevFolderId: string
  }>();

  const folder = useMemo(() =>
    getFolderFromStorage(folderId),
    [folderId]
  );

  const onOpenItem = (id: string, type: EFolderItemType) => {
    if (type === EFolderItemType.FOLDER) {
      router.push(`/lists/folder/${folder.value}/${folder.id}/${id}`);
    } else if (type === EFolderItemType.LIST) {
      router.push(`/lists/checklist/${folder.value}/${folder.id}/${id}`);
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
              hide: prevFolderName === NULL,
              label: prevFolderName
            }}
            itemType={EFolderItemType.FOLDER}
          />
        }
      >
        <SortedFolder
          parentFolderData={prevFolderId !== NULL ? getFolderFromStorage(prevFolderId) : undefined}
          handleOpenItem={onOpenItem}
          parentClickTrigger={0} // you probably don't need parentClickTrigger anymore
        />
      </ScrollContainerProvider>
    </View>
  );
};

export default Lists;