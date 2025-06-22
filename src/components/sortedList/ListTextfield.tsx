import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { LIST_CONTENT_HEIGHT, LIST_ICON_SPACING, LIST_ITEM_HEIGHT, TOOLBAR_HEIGHT } from '@/lib/constants/layout';
import { IListItem } from '@/lib/types/listItems/core/TListItem';
import { useScrollContainer } from '@/providers/ScrollContainer';
import React, { useEffect, useMemo, useRef } from 'react';
import { PlatformColor, TextInput, TextStyle } from 'react-native';

interface ListTextfieldProps<T extends IListItem> {
    item: T;
    onChange: (newText: string) => void;
    onSubmit: (blurred: boolean) => void;
    hideKeyboard: boolean;
    customStyle: TextStyle;
    hasToolbar: boolean;
}

const ListTextfield = <T extends IListItem>({
    item,
    onChange,
    onSubmit,
    hideKeyboard,
    customStyle,
    hasToolbar
}: ListTextfieldProps<T>) => {
    const { blurPlaceholder } = useScrollContainer();
    const [textfieldItem] = useTextfieldItemAs<T>();

    const inputRef = useRef<TextInput>(null);

    // Ensures textfield will only save once, whether blurred or entered
    const hasSaved = useRef(false);

    const editable = useMemo(() =>
        textfieldItem?.id === item.id && !hideKeyboard,
        [textfieldItem?.id, item.id, hideKeyboard]
    );

    // ------------- Utility Function -------------

    function handleSave(fromBlur: boolean) {
        if (hasSaved.current || hideKeyboard) return;
        hasSaved.current = true;

        onSubmit(fromBlur);
    }

    // ---------- Focus Handler ----------

    // Focus the textfield when clicked
    useEffect(() => {
        if (editable && !hideKeyboard) {
            setTimeout(() => {
                inputRef.current?.focus();
                hasSaved.current = false;

                blurPlaceholder();
            }, 50);
        }
    }, [hideKeyboard, editable]);

    return (
        <TextInput
            ref={inputRef}
            value={item.value}
            editable={editable}
            onChangeText={onChange}
            onSubmitEditing={() => handleSave(true)}
            onBlur={() => handleSave(false)}
            submitBehavior='submit'
            selectionColor={PlatformColor('systemBlue')}
            className='flex-1 bg-transparent text-[16px]'
            style={[
                {
                    height: editable ? (
                        (LIST_ITEM_HEIGHT * 2) + (hasToolbar ? TOOLBAR_HEIGHT * 2 : 0)
                    ) : LIST_CONTENT_HEIGHT,
                    marginRight: LIST_ICON_SPACING / 2,
                    color: PlatformColor('label')
                },
                customStyle
            ]}
        />
    )
}

export default ListTextfield;
