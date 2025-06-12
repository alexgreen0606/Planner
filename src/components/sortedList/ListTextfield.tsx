import { LIST_CONTENT_HEIGHT, LIST_ICON_SPACING } from '@/lib/constants/layout';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { useScrollContainer } from '@/providers/ScrollContainer';
import { IListItem } from '@/types/listItems/core/TListItem';
import React, { useEffect, useMemo, useRef } from 'react';
import { PlatformColor, StyleSheet, TextInput, TextStyle } from 'react-native';

interface ListTextfieldProps<T extends IListItem> {
    item: T;
    onChange: (newText: string) => void;
    onSubmit: (blurred: boolean) => void;
    hideKeyboard: boolean;
    customStyle: TextStyle;
}

const ListTextfield = <T extends IListItem>({
    item,
    onChange,
    onSubmit,
    hideKeyboard,
    customStyle
}: ListTextfieldProps<T>) => {
    const [textfieldItem] = useTextfieldItemAs<T>();
    const { blurPlaceholder } = useScrollContainer();

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
            style={[styles.textInput, customStyle]}
        />
    )
}

const styles = StyleSheet.create({
    textInput: {
        flex: 1,
        height: LIST_CONTENT_HEIGHT,
        marginRight: LIST_ICON_SPACING / 2,
        fontSize: 16,
        color: PlatformColor('label'),
        backgroundColor: 'transparent',
    },
});

export default ListTextfield;
