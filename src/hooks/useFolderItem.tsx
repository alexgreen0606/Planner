import { useAtom } from 'jotai';
import { MMKV, useMMKVObject } from 'react-native-mmkv';

import { transferingFolderItemAtom } from '@/atoms/transferingFolderItem';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';

const useFolderItem = (itemId: string, itemStorage: MMKV) => {
  const [transferingItem, setTransferingItem] = useAtom(transferingFolderItemAtom);

  const [folderItem] = useMMKVObject<IFolderItem>(itemId, itemStorage);

  function handleEndItemTransfer() {
    setTransferingItem(null);
  }

  return {
    folderItem,
    itemIds: folderItem?.itemIds ?? [],
    isTransferMode: Boolean(transferingItem),
    transferingItem,
    platformColor: folderItem?.platformColor,
    onEndTransfer: handleEndItemTransfer,
  };
};

export default useFolderItem;
