import FolderContentsList from '@/components/lists/FolderContentsList';
import { NULL } from '@/lib/constants/generic';
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
    <PageProvider>
      <FolderContentsList folderId={folderId ?? NULL} />
    </PageProvider>
  )
};

export default FolderPage;