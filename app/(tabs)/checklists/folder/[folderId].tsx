import FolderContentsList from '@/components/lists/FolderContentsList';
import FolderItemToolbar from '@/components/toolbars/FolderItemToolbar';
import { PageProvider } from '@/providers/PageProvider';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

// ✅ 

type TFolderParams = {
  folderId: string;
};

const FolderPage = () => {
  const { folderId } = useLocalSearchParams<TFolderParams>();
  return (
    <PageProvider
      emptyPageLabelProps={{ label: 'Empty folder' }}
      toolbar={<FolderItemToolbar />}
    >
      <FolderContentsList folderId={folderId} />
    </PageProvider>
  )
};

export default FolderPage;