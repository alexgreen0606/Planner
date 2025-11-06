import { useLocalSearchParams } from 'expo-router'
import React from 'react'

import FolderPage from '@/components/FolderPage'

type TFolderPageParams = {
  folderId: string
}

const ChildFolderPage = () => {
  const { folderId } = useLocalSearchParams<TFolderPageParams>()
  return <FolderPage folderId={folderId} />
}

export default ChildFolderPage
