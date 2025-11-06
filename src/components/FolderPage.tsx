import { Host, Text } from '@expo/ui/swift-ui'
import { useRouter } from 'expo-router'
import { useSetAtom } from 'jotai'
import React from 'react'
import { PlatformColor } from 'react-native'
import { useMMKV } from 'react-native-mmkv'

import { textfieldIdAtom } from '@/atoms/textfieldId'
import DraggableListPage from '@/components/DraggableListPage'
import FolderItemButton from '@/components/icons/customButtons/FolderItemButton'
import FolderItemToolbar from '@/components/toolbars/FolderItemToolbar'
import useFolderItem from '@/hooks/useFolderItem'
import { EFolderItemType } from '@/lib/enums/EFolderItemType'
import { EStorageId } from '@/lib/enums/EStorageId'
import { IFolderItem } from '@/lib/types/listItems/IFolderItem'
import { getFolderItemFromStorageById, saveFolderItemToStorage } from '@/storage/checklistsStorage'
import {
  createNewFolderItemAndSaveToStorage,
  deleteFolderItemAndChildren,
  updateListItemIndex,
} from '@/utils/checklistUtils'

// ✅

type TFolderPageProps = {
  folderId: string
}

const FolderPage = ({ folderId }: TFolderPageProps) => {
  const folderItemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM })
  const router = useRouter()

  const setTextfieldId = useSetAtom(textfieldIdAtom)

  const {
    item: folder,
    itemIds,
    isTransferMode,
    transferingItem,
    onEndTransfer,
  } = useFolderItem(folderId, folderItemStorage)

  const getLeftIcon = (item: IFolderItem) => (
    <FolderItemButton
      item={item}
      disabled={
        getIsItemTransfering(item.id) || (isTransferMode && item.type === EFolderItemType.CHECKLIST)
      }
      onClick={() => {
        // TODO: focus placeholder
        setTextfieldId(item.id)
      }}
    />
  )

  // ==================
  // 1. Event Handlers
  // ==================

  function handleTransferToChild(destinationItem: IFolderItem) {
    if (!folder || !transferingItem) return

    // TODO: dont allow transfer into self

    const childFolder = getFolderItemFromStorageById(destinationItem.id)
    childFolder.itemIds.push(transferingItem.id)
    saveFolderItemToStorage(childFolder)

    saveFolderItemToStorage({
      ...folder,
      itemIds: folder.itemIds.filter((id) => id !== transferingItem.id),
    })
    saveFolderItemToStorage({ ...transferingItem, listId: destinationItem.id })
  }

  function handleItemClick(item: IFolderItem) {
    if (isTransferMode) {
      if (item.type === EFolderItemType.FOLDER && item.id !== transferingItem?.id) {
        handleTransferToChild(item)
      }
      onEndTransfer()
      return
    }

    setTextfieldId(null)

    if (item.type === EFolderItemType.FOLDER) {
      router.push(`checklists/folder/${item.id}`)
    } else if (item.type === EFolderItemType.CHECKLIST) {
      router.push(`checklists/checklist/${item.id}`)
    }
  }

  // ====================
  // 2. Helper Functions
  // ====================

  function getIsItemTransfering(itemId: string) {
    return transferingItem?.id === itemId
  }

  function getRowTextPlatformColor(item: IFolderItem) {
    if (getIsItemTransfering(item.id)) {
      return 'tertiaryLabel'
    }
    if (isTransferMode && item.type === EFolderItemType.CHECKLIST) {
      return 'tertiaryLabel'
    }
    return 'label'
  }

  return (
    <DraggableListPage
      emptyPageLabelProps={{ label: 'No contents' }}
      toolbar={<FolderItemToolbar />}
      listId={folderId}
      itemIds={itemIds}
      storage={folderItemStorage}
      storageId={EStorageId.FOLDER_ITEM}
      onGetRowTextPlatformColor={getRowTextPlatformColor}
      onGetRightIcon={(item) => (
        <Host style={{ minWidth: 40 }}>
          <Text
            design="rounded"
            weight="semibold"
            size={10}
            color={PlatformColor(getRowTextPlatformColor(item)) as unknown as string}
          >
            {String(item.itemIds.length)}
          </Text>
        </Host>
      )}
      addButtonColor={folder?.platformColor}
      rowHeight={46}
      onGetLeftIcon={getLeftIcon}
      onDeleteItem={deleteFolderItemAndChildren}
      onCreateItem={createNewFolderItemAndSaveToStorage}
      onContentClick={handleItemClick}
      onIndexChange={updateListItemIndex}
    />
  )
}

export default FolderPage
