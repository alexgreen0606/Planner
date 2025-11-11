import { useAtom } from 'jotai';
import { MMKV, useMMKVObject } from 'react-native-mmkv';

import { textfieldIdAtom } from '@/atoms/textfieldId';
import { NULL } from '@/lib/constants/generic';
import { TListItem } from '@/lib/types/listItems/core/TListItem';

function useTextfieldItemAs<T extends TListItem>(storage: MMKV) {
  const [textfieldId, setTextfieldId] = useAtom(textfieldIdAtom);
  const [textfieldItem, setTextfieldItem] = useMMKVObject<T>(textfieldId ?? NULL, storage);

  function handleCloseTextfield() {
    setTextfieldId(null);
  }

  return {
    textfieldId,
    textfieldItem,
    onSetTextfieldId: setTextfieldId,
    onSetTextfieldItem: setTextfieldItem,
    onCloseTextfield: handleCloseTextfield
  };
}

export default useTextfieldItemAs;
