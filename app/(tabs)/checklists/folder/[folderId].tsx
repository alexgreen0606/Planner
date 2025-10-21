import FolderPage from '@/components/FolderPage';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

// ✅ 

type TFolderParams = {
  folderId: string;
};

const ChildFolderPage = () => {
  const { folderId } = useLocalSearchParams<TFolderParams>();
  return (
    <FolderPage folderId={folderId} />
  )
};

export default ChildFolderPage;