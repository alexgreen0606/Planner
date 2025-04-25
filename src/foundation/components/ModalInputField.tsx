import React, { useEffect, useRef, useState } from 'react';
import { PlatformColor, StyleSheet, TextInput, View } from 'react-native';
import globalStyles from '../theme/globalStyles';
import CustomText from './text/CustomText';
import { TIME_MODAL_INPUT_HEIGHT } from '../calendarEvents/constants';
import { LIST_CONTENT_HEIGHT } from '../sortedLists/constants';

export interface ModalInputFieldProps {
    label: string;
    value: string;
    onChange: (newVal: string) => void;
    focusTrigger: boolean;
};

const ModalInputField = ({
    label,
    value,
    onChange,
    focusTrigger
}: ModalInputFieldProps) => {
    const inputRef = useRef<TextInput>(null);
    const [isFieldFocused, setIsFieldFocused] = useState(false);

    useEffect(() => {
        if (focusTrigger) {
            inputRef.current?.focus();
        } else {
            inputRef.current?.blur();
        }
    }, [focusTrigger]);
    return (
        <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: TIME_MODAL_INPUT_HEIGHT }}>
            <View style={globalStyles.spacedApart}>
                <TextInput
                    ref={inputRef}
                    value={value}
                    placeholder={label}
                    onChangeText={onChange}
                    selectionColor={PlatformColor('systemBlue')}
                    style={[styles.textInput]}
                    onFocus={() => setIsFieldFocused(true)}
                    onBlur={() => setIsFieldFocused(false)}
                />
            </View>
        </View>
    )
};

const styles = StyleSheet.create({
    textInput: {
        flex: 1,
        height: LIST_CONTENT_HEIGHT,
        fontSize: 16,
        color: PlatformColor('label'),
        backgroundColor: 'transparent',
    },
});

export default ModalInputField;
