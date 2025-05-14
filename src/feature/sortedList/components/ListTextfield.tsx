import { LIST_CONTENT_HEIGHT, LIST_ICON_SPACING } from '@/constants/size';
import { IListItem } from '@/types/listItems/core/TListItem';
import React, { useEffect, useMemo, useRef } from 'react';
import { PlatformColor, StyleSheet, TextInput, TextStyle } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useScrollContainer } from '../services/ScrollContainerProvider';

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

    const {
        currentTextfield,
        pendingItem,
        setCurrentTextfield
    } = useScrollContainer();

    const inputRef = useRef<TextInput>(null);
    const isFocused = useSharedValue(false);

    // Ensures textfield will only save once, whether blurred or entered
    const hasSaved = useRef(false);

    /**
     * Determine if the textfield can be edited.
     * During transition between two textfields, both will be editable. This allows the device keyboard
     * to be remain open.
     * Once the new textfield is focused, the previous one will become un-editable.
     */
    const editable = useMemo(() => {
        const isEditable = [pendingItem?.id, currentTextfield?.id].includes(item.id) && !hideKeyboard;
        if (!isEditable) isFocused.value = false;

        return isEditable;
    }, [pendingItem, currentTextfield?.id, item.id, hideKeyboard]);

    // ------------- Utility Function -------------

    function handleSave(fromBlur: boolean) {
        if (hasSaved.current) return;
        hasSaved.current = true;

        onSubmit(fromBlur);
    }

    // ---------- Focus Handler ----------

    // Focus the textfield when clicked and evaluate its position
    useEffect(() => {
        if (currentTextfield?.id === item.id && !isFocused.value) {
            setTimeout(() => {
                inputRef.current?.focus();
                isFocused.value = true;
                hasSaved.current = false;

                // Trigger the previous textfield to become static
                setCurrentTextfield(currentTextfield)
            }, 50);
        }
    }, [currentTextfield?.id]);

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
