import { EStorageId } from '@/lib/enums/EStorageId'

// ✅

export type TListItem = {
  id: string
  value: string
  listId: string
  storageId: EStorageId
}
