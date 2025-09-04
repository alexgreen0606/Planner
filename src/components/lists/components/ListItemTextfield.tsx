import { textfieldIdAtom } from '@/atoms/textfieldId';
import { LIST_CONTENT_HEIGHT, LIST_ICON_SPACING, LIST_ITEM_HEIGHT } from '@/lib/constants/listConstants';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useScrollContainerContext } from '@/providers/ScrollContainer';
import { useAtom } from 'jotai';
import debounce from 'lodash.debounce';
import React, { ReactNode, useEffect, useMemo, useRef } from 'react';
import { PlatformColor, TextInput, TextStyle, View } from 'react-native';

// ✅ 

type TListItemTextfieldProps<T extends TListItem> = {
    item: T;
    toolbarIconSet?: ReactNode[][];
    customStyle: TextStyle;
    onSetItemInStorage: (value: T | ((prevValue: T | undefined) => T | undefined) | undefined) => void;
    onCreateChildTextfield: () => void;
    onDeleteItem: (item: T) => void;
    onValueChange?: (newValue: string) => void;
    onSaveToExternalStorage?: (item: T) => void;
};

const ListItemTextfield = <T extends TListItem>({
    item,
    customStyle,
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
            }, 1500),
        []
    );

    const { onFocusPlaceholder } = useScrollContainerContext();

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

        onFocusPlaceholder();

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
        <View>
            <TextInput
                ref={inputRef}
                value={item.value}
                onLayout={() => {
                    inputRef.current?.focus();
                }}
                submitBehavior='submit'
                selectionColor={PlatformColor('systemBlue')}
                returnKeyType='done'
                className='flex-1 bg-transparent text-[16px] w-full absolute pr-2'
                style={[
                    {
                        height: LIST_ITEM_HEIGHT,
                        paddingBottom: LIST_CONTENT_HEIGHT / 2 + 2,
                        marginRight: LIST_ICON_SPACING / 2,
                        color: PlatformColor('label'),
                        fontFamily: 'Text',
                    },
                    customStyle
                ]}
                onChangeText={onValueChange ?? handleValueChange}
                onSubmitEditing={handleSubmitTextfield}
            />
        </View>
    )
}

export default ListItemTextfield;
