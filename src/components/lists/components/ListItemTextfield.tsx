import { textfieldIdAtom } from '@/atoms/textfieldId';
import { LIST_CONTENT_HEIGHT, LIST_ICON_SPACING } from '@/lib/constants/listConstants';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useAtom } from 'jotai';
import React, { useEffect } from 'react';
import { PlatformColor, TextInput, TextStyle, View } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import ListToolbar, { ToolbarIcon } from './ListToolbar';

//

type TListItemTextfieldProps<T extends TListItem> = {
    item: T;
    toolbarIconSet?: ToolbarIcon<T>[][];
    customStyle: TextStyle;
    storage: MMKV;
    onSetItemInStorage: (value: T | ((prevValue: T | undefined) => T | undefined) | undefined) => void;
    onCreateChildTextfield: () => void;
    onDeleteItem: (item: T) => void;
    onValueChange?: (newText: string, prev: T) => T;
    onSaveToExternalStorage?: (item: T) => void;
};

const ListItemTextfield = <T extends TListItem>({
    item,
    customStyle,
    toolbarIconSet,
    storage,
    onSetItemInStorage,
    onDeleteItem,
    onValueChange,
    onCreateChildTextfield,
    onSaveToExternalStorage
}: TListItemTextfieldProps<T>) => {

    const [, setTextfieldId] = useAtom(textfieldIdAtom);

    // Save the event to external storage every time the field closes.
    useEffect(() => {
        return () => {
            const currentItemString = storage.getString(item.id);
            if (!currentItemString) return;

            const currentItem = JSON.parse(currentItemString);

            if (currentItem.value.trim() === '') {
                onDeleteItem(currentItem);
                return;
            }

            onSaveToExternalStorage?.(currentItem);

            setTextfieldId((prev) => prev === item.id ? null : prev);
        };
    }, []);

    function handleFocusTextfield() {
        setTextfieldId(item.id);
    }

    function handleValueChange(newText: string) {
        onSetItemInStorage((prev) => {
            if (!prev) return prev;

            if (onValueChange) {
                return onValueChange(newText, prev);
            }

            return { ...prev, value: newText };
        });
    }

    function handleSubmitTextfield() {
        if (item.value.trim() === '') {
            onDeleteItem(item);
            return;
        }

        onCreateChildTextfield();
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
                        height: LIST_CONTENT_HEIGHT,
                        marginRight: LIST_ICON_SPACING / 2,
                        color: PlatformColor('label'),
                        fontFamily: 'Text',
                    },
                    customStyle
                ]}
                onChangeText={handleValueChange}
                onSubmitEditing={handleSubmitTextfield}
                onFocus={handleFocusTextfield}
            />
            {toolbarIconSet && <ListToolbar item={item} iconSets={toolbarIconSet} accessoryKey={item.id} />}
        </View>
    )
}

export default ListItemTextfield;
