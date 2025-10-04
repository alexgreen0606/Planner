import FolderContentsList from '@/components/lists/FolderContentsList';
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
    <PageProvider emptyPageLabelProps={{label: 'Empty folder'}}>
      <FolderContentsList folderId={folderId} />
    </PageProvider>
  )
};

export default FolderPage;