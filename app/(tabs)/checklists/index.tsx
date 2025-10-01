import FolderContentsList from '@/components/lists/FolderContentsList';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { ScrollPageProvider } from '@/providers/ScrollPageProvider';
import React from 'react';

// ✅ 

const RootFolderPage = () => (
    <ScrollPageProvider>
        <FolderContentsList folderId={EStorageKey.ROOT_FOLDER_KEY} />
    </ScrollPageProvider>
);

export default RootFolderPage;