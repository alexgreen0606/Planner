import { textfieldIdAtom } from '@/atoms/textfieldId';
import { LIST_CONTENT_HEIGHT, LIST_ICON_SPACING, LIST_ITEM_HEIGHT } from '@/lib/constants/listConstants';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useAtom } from 'jotai';
import debounce from 'lodash.debounce';
import React, { useEffect, useMemo, useRef } from 'react';
import { PlatformColor, TextInput, TextStyle, View } from 'react-native';
import ListToolbar, { ToolbarIcon } from './ListToolbar';

// ✅ 

type TListItemTextfieldProps<T extends TListItem> = {
    item: T;
    toolbarIconSet?: ToolbarIcon<T>[][];
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
    toolbarIconSet,
    onSetItemInStorage,
    onDeleteItem,
    onValueChange,
    onCreateChildTextfield,
    onSaveToExternalStorage
}: TListItemTextfieldProps<T>) => {

    const [, setTextfieldId] = useAtom(textfieldIdAtom);

    const itemValue = useRef(item.value);

    const handleExternalSaveDebounce = useMemo(
        () =>
            debounce((latestItem: T) => {
                onSaveToExternalStorage?.(latestItem);
            }, 1500),
        []
    );

    // Handle the blur event.
    useEffect(() => {
        return handleBlurTextfield;
    }, []);

    // Save to external storage.
    useEffect(() => {
        itemValue.current = item.value;
        handleExternalSaveDebounce(item);
    }, [item]);

    function handleFocusTextfield() {
        setTextfieldId(item.id);
    }

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

        onCreateChildTextfield();
    }

    function handleBlurTextfield() {
        if (itemValue.current.trim() === '') {
            handleExternalSaveDebounce.cancel();
            onDeleteItem(item);
            return;
        }

        handleExternalSaveDebounce.flush();
        setTextfieldId((prev) => prev === item.id ? null : prev);
    }

    return (
        <View>
            <TextInput
                value={item.value}
                autoFocus
                inputAccessoryViewID={item.id}
                submitBehavior='blurAndSubmit'
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
                onFocus={handleFocusTextfield}
            />
            {toolbarIconSet && <ListToolbar item={item} iconSets={toolbarIconSet} accessoryKey={item.id} />}
        </View>
    )
}

export default ListItemTextfield;
