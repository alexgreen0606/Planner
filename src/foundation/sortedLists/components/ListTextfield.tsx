import React, { useEffect, useRef } from 'react';
import { PlatformColor, StyleSheet, TextInput, TextStyle } from 'react-native';
import { ListItem } from '../types';
import { useSortableListContext } from '../services/SortableListProvider';

interface ListTextfieldProps<T extends ListItem> {
    item: T;
    onChange: (newText: string) => void;
    onSubmit: () => void;
    toggleBlur: boolean;
    customStyle: TextStyle;
}

const ListTextfield = <T extends ListItem>({
    item,
    onChange,
    onSubmit,
    toggleBlur,
    customStyle,
}: ListTextfieldProps<T>) => {
    const inputRef = useRef<TextInput>(null);
    const isFocused = useRef(false);
    const { currentTextfield, previousTextfieldId, setPreviousTextfieldId } = useSortableListContext();

    // The previous textfield will remain editable until the new textfield is focused
    const editable = [previousTextfieldId, currentTextfield?.id].includes(item.id);

    // Focus this textfield when needed
    useEffect(() => {
        if (currentTextfield?.id === item.id && !isFocused.current) {
            setTimeout(() => {
                inputRef.current?.focus();
                isFocused.current = true;

                // Triggers the previous textfield to become static
                setPreviousTextfieldId(undefined);
            }, 50);
        }
    }, [currentTextfield?.id]);

    // Allows for manual focus and blur due to modal appearances
    useEffect(() => {
        if (toggleBlur) {
            inputRef.current?.blur();
        } else {
            inputRef.current?.focus();
        }
    }, [toggleBlur])

    const styles = StyleSheet.create({
        textInput: {
            backgroundColor: 'transparent',
            color: PlatformColor('label'),
            paddingVertical: 1,
            flex: 1,
            height: 25,
            fontSize: 16,
            paddingLeft: 16,
            ...customStyle
        },
    });

    return (
        <TextInput
            ref={inputRef}
            value={item.value}
            submitBehavior='submit'
            editable={editable}
            onChangeText={onChange}
            selectionColor={PlatformColor('systemTeal')}
            style={styles.textInput}
            onSubmitEditing={onSubmit}
        />
    )
}

export default ListTextfield;
