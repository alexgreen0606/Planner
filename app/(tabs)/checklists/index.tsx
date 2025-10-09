import FolderPage from '@/components/PlannerPage';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import React from 'react';

// ✅ 

const RootFolderPage = () => (
    <FolderPage folderId={EStorageKey.ROOT_FOLDER_KEY} />
);

export default RootFolderPage;