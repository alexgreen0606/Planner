import React, { useEffect, useRef } from 'react';
import { PlatformColor, StyleSheet, TextInput } from 'react-native';
import { LIST_CONTENT_HEIGHT } from '../../../../foundation/sortedLists/constants';

export interface ModalTextfieldProps {
    label: string;
    value: string;
    onChange: (newVal: string) => void;
    focusTrigger: boolean;
};

const ModalTextfield = ({
    label,
    value,
    onChange,
    focusTrigger
}: ModalTextfieldProps) => {
    const inputRef = useRef<TextInput>(null);

    // Manually focus and blur the text input
    useEffect(() => {
        if (focusTrigger) {
            inputRef.current?.focus();
        } else {
            inputRef.current?.blur();
        }
    }, [focusTrigger]);

    return (
        <TextInput
            ref={inputRef}
            value={value}
            placeholder={label}
            onChangeText={onChange}
            selectionColor={PlatformColor('systemBlue')}
            style={styles.textInput}
        />
    );
};

const styles = StyleSheet.create({
    textInput: {
        height: LIST_CONTENT_HEIGHT,
        width: '100%',
        fontSize: 16,
        color: PlatformColor('label'),
        backgroundColor: 'transparent',
    },
});

export default ModalTextfield;
