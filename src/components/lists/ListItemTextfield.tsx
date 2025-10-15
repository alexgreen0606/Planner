import { textfieldIdAtom } from '@/atoms/textfieldId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useAtom } from 'jotai';
import debounce from 'lodash.debounce';
import React, { ReactNode, useEffect, useMemo, useRef } from 'react';
import { PlatformColor, TextInput, TextStyle } from 'react-native';
import { textStyles } from '../text/CustomText';

// ✅ 

type TListItemTextfieldProps<T extends TListItem> = {
    item: T;
    toolbarIconSet?: ReactNode[][];
    customStyle: TextStyle;
    onFocusPlaceholderTextfield: () => void;
    onSetItemInStorage: (value: T | ((prevValue: T | undefined) => T | undefined) | undefined) => void;
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
}: TListItemTextfieldProps<T>) => {
    const [, setTextfieldId] = useAtom(textfieldIdAtom);

    const itemValue = useRef(item.value);
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

    // Save to external storage.
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

        setTextfieldId((prev) => prev === item.id ? null : prev);
    }

    return (
        <TextInput
            ref={inputRef}
            value={item.value}
            onLayout={() => {
                inputRef.current?.focus();
            }}
            onBlur={handleBlurTextfield}
            onChangeText={onValueChange ?? handleValueChange}
            onSubmitEditing={handleSubmitTextfield}
            selectionColor={PlatformColor('systemBlue')}
            style={[
                textStyles['listRow'],
                customStyle
            ]}
            submitBehavior='submit'
            className='w-full bg-transparent'
            multiline
        />
    )
}

export default ListItemTextfield;
