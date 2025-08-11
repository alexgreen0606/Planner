import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { LIST_CONTENT_HEIGHT, LIST_ICON_SPACING, LIST_ITEM_HEIGHT } from '@/lib/constants/listConstants';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import React, { useEffect, useMemo, useRef } from 'react';
import { PlatformColor, TextInput, TextStyle, View } from 'react-native';
import ListToolbar, { ToolbarIcon } from './ListToolbar';

// ✅ 

type ListTextfieldProps<T extends TListItem> = {
    item: T;
    toolbarIconSet?: ToolbarIcon<T>[][];
    hideKeyboard: boolean;
    customStyle: TextStyle;
    onChange: (newText: string) => void;
    onSubmit: (blurred: boolean) => void;
};

const ListTextfield = <T extends TListItem>({
    item,
    toolbarIconSet,
    hideKeyboard,
    customStyle,
    onChange,
    onSubmit
}: ListTextfieldProps<T>) => {
    const [textfieldItem] = useTextfieldItemAs<T>();

    const inputRef = useRef<TextInput>(null);

    // Ensures textfield will only save once, whether blurred or entered
    const hasSaved = useRef(false);

    const editable = useMemo(() =>
        textfieldItem?.id === item.id && !hideKeyboard,
        [textfieldItem?.id, item.id, hideKeyboard]
    );

    // Focus the textfield when clicked.
    useEffect(() => {
        if (editable && !hideKeyboard) {
            setTimeout(() => {
                inputRef.current?.focus();
                hasSaved.current = false;
            }, 50);
        }
    }, [hideKeyboard, editable]);

    function handleSave(fromBlur: boolean) {
        if (hasSaved.current || hideKeyboard) return;
        hasSaved.current = true;

        onSubmit(fromBlur);
    }

    return (
        <View>
            <TextInput
                ref={inputRef}
                value={item.value}
                editable={editable}
                inputAccessoryViewID={item.id}
                onChangeText={onChange}
                onSubmitEditing={() => handleSave(true)}
                onBlur={() => handleSave(false)}
                submitBehavior='submit'
                selectionColor={PlatformColor('systemBlue')}
                returnKeyType='done'
                className='flex-1 bg-transparent text-[16px] w-full absolute pr-2'
                style={[
                    {
                        height: editable ? (
                            LIST_ITEM_HEIGHT
                        ) : LIST_CONTENT_HEIGHT,
                        paddingBottom: editable ? (
                            LIST_CONTENT_HEIGHT / 2 + 2
                        ) : 0,
                        marginRight: LIST_ICON_SPACING / 2,
                        color: PlatformColor('label'),
                        fontFamily: 'Text',
                    },
                    customStyle
                ]}
            />
            {toolbarIconSet && <ListToolbar item={item} iconSets={toolbarIconSet} accessoryKey={item.id} />}
        </View>
    )
}

export default ListTextfield;
