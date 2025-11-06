import React from 'react'

import FolderPage from '@/components/FolderPage'
import { EStorageKey } from '@/lib/enums/EStorageKey'

// ✅

const RootFolderPage = () => <FolderPage folderId={EStorageKey.ROOT_FOLDER_KEY} />

export default RootFolderPage
