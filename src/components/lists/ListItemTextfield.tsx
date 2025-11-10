import { useSetAtom } from 'jotai';
import debounce from 'lodash.debounce';
import React, { ReactNode, useEffect, useMemo, useRef } from 'react';
import { PlatformColor, TextInput, TextStyle } from 'react-native';

import { textfieldIdAtom } from '@/atoms/textfieldId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';

import { textStyles } from '../text/CustomText';

interface IListItemTextfieldProps<T extends TListItem> {
  item: T;
  toolbarIconSet?: ReactNode[][];
  customStyle: TextStyle;
  onFocusPlaceholderTextfield: () => void;
  onSetItemInStorage: (
    value: T | ((prevValue: T | undefined) => T | undefined) | undefined
  ) => void;
  onCreateChildTextfield: () => void;
  onDeleteItem: (item: T) => void;
  onValueChange?: (newValue: string) => void;
  onSaveToExternalStorage?: (item: T) => void;
};

const ListItemTextfield = <T extends TListItem>({
  item,
  customStyle,
  onFocusPlaceholderTextfield,
  onSetItemInStorage,
  onDeleteItem,
  onValueChange,
  onCreateChildTextfield,
  onSaveToExternalStorage
}: IListItemTextfieldProps<T>) => {
  const setTextfieldId = useSetAtom(textfieldIdAtom);
  const inputRef = useRef<TextInput>(null);

  const handleSaveToExternalStorageDebounce = useMemo(
    () =>
      debounce((latestItem: T) => {
        onSaveToExternalStorage?.(latestItem);
      }, 1000),
    []
  );

  // Handle the blur event.
  useEffect(() => {
    return handleBlurTextfield;
  }, []);

  // Schedule external storage save.
  const itemValue = useRef(item.value);
  useEffect(() => {
    itemValue.current = item.value;
    handleSaveToExternalStorageDebounce(item);
  }, [item]);

  function handleValueChange(value: string) {
    onSetItemInStorage((prev) => {
      if (!prev) return prev;
      return { ...prev, value };
    });
  }

  function handleSubmitTextfield() {
    if (item.value.trim() === '') {
      onDeleteItem(item);
      return;
    }

    onFocusPlaceholderTextfield();
    onCreateChildTextfield();
  }

  function handleBlurTextfield() {
    if (itemValue.current.trim() === '') {
      handleSaveToExternalStorageDebounce.cancel();
      onDeleteItem(item);
    } else {
      handleSaveToExternalStorageDebounce.flush();
    }

    setTextfieldId((prev) => (prev === item.id ? null : prev));
  }

  return (
    <TextInput
      value={item.value}
      onLayout={() => {
        inputRef.current?.focus();
      }}
      submitBehavior="submit"
      onBlur={handleBlurTextfield}
      onChangeText={onValueChange ?? handleValueChange}
      onSubmitEditing={handleSubmitTextfield}
      selectionColor={PlatformColor('systemBlue')}
      style={[textStyles['listRow'], customStyle]}
      className="w-full bg-transparent"
      ref={inputRef}
    />
  );
};

export default ListItemTextfield;
