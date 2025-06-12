import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import { ScrollContainerProvider } from '../../../../../../src/providers/ScrollContainer';
import { getFolderFromStorage } from '../../../../../../src/storage/checklistsStorage';
import FolderItemBanner from '@/components/checklist/FolderItemBanner';
import SortedFolder from '@/components/folder';
import { NULL } from '@/lib/constants/generic';

const Lists = () => {
  const router = useRouter();
  const [parentClickTrigger, setParentClickTrigger] = useState(0);
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
              label: prevFolderName,
              onClick: () => setParentClickTrigger(curr => curr + 1)
            }}
            itemType={EFolderItemType.FOLDER}
          />
        }
      >
        <SortedFolder
          parentFolderData={prevFolderId !== NULL ? getFolderFromStorage(prevFolderId) : undefined}
          handleOpenItem={onOpenItem}
          parentClickTrigger={parentClickTrigger}
        />
      </ScrollContainerProvider>
    </View>
  );
};

export default Lists;