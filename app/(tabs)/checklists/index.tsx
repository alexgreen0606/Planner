import FolderContentsList from '@/components/lists/FolderContentsList';
import FolderItemToolbar from '@/components/toolbars/FolderItemToolbar';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { PageProvider } from '@/providers/PageProvider';
import React from 'react';

// ✅ 

const RootFolderPage = () => (
    <PageProvider
        emptyPageLabelProps={{ label: 'Empty folder' }}
        toolbar={<FolderItemToolbar />}
    >
        <FolderContentsList folderId={EStorageKey.ROOT_FOLDER_KEY} />
    </PageProvider>
);

export default RootFolderPage;