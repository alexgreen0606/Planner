import FolderItemBanner from '@/components/banner/FolderItemBanner';
import SortedFolder from '@/components/lists/Folder';
import { NULL } from '@/lib/constants/generic';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { PageProvider } from '@/providers/PageProvider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';

// ✅ 

type TFolderParams = {
  folderId: string;
  prevFolderName: string;
  prevFolderId: string;
};

const FolderScreen = () => {
  const { folderId, prevFolderName } = useLocalSearchParams<TFolderParams>();
  const storage = useMMKV({ id: EStorageId.FOLDER_ITEM });
  const router = useRouter();

  const [folder] = useMMKVObject<IFolderItem>(folderId, storage);

  const [parentClickTrigger, setParentClickTrigger] = useState(0);

  function handleOpenItem(id: string, type: EFolderItemType) {
    if (!folder) return;

    if (type === EFolderItemType.FOLDER) {
      router.push(`/lists/folder/${folder.value}/${folder.id}/${id}`);
    } else if (type === EFolderItemType.CHECKLIST) {
      router.push(`/lists/checklist/${folder.value}/${folder.id}/${id}`);
    }
  }

  return (
    <PageProvider floatingHeader={
      <FolderItemBanner
        itemId={folderId}
        backButtonConfig={{
          hide: prevFolderName === NULL,
          label: prevFolderName,
          onClick: () => setParentClickTrigger(curr => curr + 1)
        }}
      />
    }>
      <SortedFolder
        onOpenItem={handleOpenItem}
        parentClickTrigger={parentClickTrigger}
      />
    </PageProvider>
  );
};

export default FolderScreen;