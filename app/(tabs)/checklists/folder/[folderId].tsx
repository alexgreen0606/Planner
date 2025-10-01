import FolderContentsList from '@/components/lists/FolderContentsList';
import { NULL } from '@/lib/constants/generic';
import { ScrollPageProvider } from '@/providers/ScrollPageProvider';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

// ✅ 

type TFolderParams = {
  folderId: string;
};

const FolderPage = () => {
  const { folderId } = useLocalSearchParams<TFolderParams>();
  return (
    <ScrollPageProvider>
      <FolderContentsList folderId={folderId ?? NULL} />
    </ScrollPageProvider>
  )
};

export default FolderPage;