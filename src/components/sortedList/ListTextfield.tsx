import { LIST_CONTENT_HEIGHT, LIST_ICON_SPACING } from '@/constants/layout';
import { useTextfieldData } from '@/hooks/useTextfieldData';
import { IListItem } from '@/types/listItems/core/TListItem';
import { usePathname } from 'expo-router';
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

    const { currentTextfield, pendingItem, setCurrentTextfield } = useTextfieldData<T>();

    const inputRef = useRef<TextInput>(null);

    // Ensures textfield will only save once, whether blurred or entered
    const hasSaved = useRef(false);

    /**
     * Determine if the textfield can be edited.
     * During transition between two textfields, both will be editable. This allows the device keyboard
     * to remain open.
     * Once the new textfield is focused, the previous one will become un-editable.
     */
    const editable = useMemo(() =>
        [pendingItem?.id, currentTextfield?.id].includes(item.id) && !hideKeyboard,
        [pendingItem, currentTextfield?.id, item.id, hideKeyboard]
    );

    // ------------- Utility Function -------------

    function handleSave(fromBlur: boolean) {
        if (hasSaved.current || hideKeyboard) return;
        hasSaved.current = true;

        console.log('saving', item.value)

        onSubmit(fromBlur);
    }

    // ---------- Focus Handler ----------

    // Focus the textfield when clicked
    useEffect(() => {
        if (currentTextfield?.id === item.id && !hideKeyboard) {
            setTimeout(() => {
                inputRef.current?.focus();
                hasSaved.current = false;

                // Trigger the previous textfield to become static once this field focuses
                setTimeout(() => {
                    setCurrentTextfield(currentTextfield);
                }, 50);
            }, 50);
        }
    }, [currentTextfield?.id, hideKeyboard]);

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
