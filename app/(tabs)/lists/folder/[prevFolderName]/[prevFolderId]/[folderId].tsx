import FolderItemBanner from '@/components/banners/FolderItemBanner';
import SortedFolder from '@/components/lists/Folder';
import { NULL } from '@/lib/constants/generic';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IFolder } from '@/lib/types/checklists/IFolder';
import { ScrollContainerProvider } from '@/providers/ScrollContainer';
import { getFolderFromStorage } from '@/storage/checklistsStorage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { PlatformColor, View } from 'react-native';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';

type FolderParams = {
  folderId: string,
  prevFolderName: string,
  prevFolderId: string
};

const FolderScreen = () => {
  const { folderId, prevFolderName, prevFolderId } = useLocalSearchParams<FolderParams>();
  const router = useRouter();

  const [parentClickTrigger, setParentClickTrigger] = useState(0);

  const storage = useMMKV({ id: EStorageId.CHECKLISTS });
  const [folder] = useMMKVObject<IFolder>(folderId, storage);

  function onOpenItem(id: string, type: EFolderItemType) {
    if (!folder) return;
    if (type === EFolderItemType.FOLDER) {
      router.push(`/lists/folder/${folder.value}/${folder.id}/${id}`);
    } else if (type === EFolderItemType.LIST) {
      router.push(`/lists/checklist/${folder.value}/${folder.id}/${id}`);
    }
  }

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
          parentFolderData={prevFolderId !== NULL ? getFolderFromStorage(prevFolderId)! : undefined}
          handleOpenItem={onOpenItem}
          parentClickTrigger={parentClickTrigger}
        />
      </ScrollContainerProvider>
    </View>
  );
};

export default FolderScreen;