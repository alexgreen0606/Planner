import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EStorageId } from '@/lib/enums/EStorageId';

import { IColoredListItem } from './core/IColoredListItem';

export interface IFolderItem extends IColoredListItem {
  type: EFolderItemType;
  itemIds: string[];
  storageId: EStorageId.FOLDER_ITEM;
}
