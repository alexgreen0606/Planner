import { useAtom } from 'jotai';
import { MMKV, useMMKVObject } from 'react-native-mmkv';

import { transferingFolderItemAtom } from '@/atoms/transferingFolderItem';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';

const useFolderItem = (itemId: string, itemStorage: MMKV) => {
  const [transferingItem, setTransferingItem] = useAtom(transferingFolderItemAtom);

  const [folderItem, setFolderItem] = useMMKVObject<IFolderItem>(itemId, itemStorage);

  function handleEndItemTransfer() {
    setTransferingItem(null);
  }

  function handleUpdateItemIndex(from: number, to: number) {
    setFolderItem((prev) => {
      if (!prev) return prev;
      const newFolder = { ...prev };
      const [itemId] = newFolder.itemIds.splice(from, 1);
      newFolder.itemIds.splice(to, 0, itemId);
      return newFolder;
    });
  }

  return {
    folderItem,
    itemIds: folderItem?.itemIds ?? [],
    isTransferMode: Boolean(transferingItem),
    transferingItem,
    platformColor: folderItem?.platformColor,
    onEndTransfer: handleEndItemTransfer,
    onUpdateItemIndex: handleUpdateItemIndex,
    onSetFolderItem: setFolderItem
  };
};

export default useFolderItem;
