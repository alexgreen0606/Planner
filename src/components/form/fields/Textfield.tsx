import { LIST_CONTENT_HEIGHT } from '@/constants/layout';
import React, { useEffect, useRef } from 'react';
import { PlatformColor, TextInput } from 'react-native';

export interface ModalTextfieldProps {
    placeholder: string;
    value: string;
    onChange: (newVal: string) => void;
    focusTrigger: boolean;
};

const ModalTextfield = ({
    placeholder,
    value,
    onChange,
    focusTrigger
}: ModalTextfieldProps) => {
    const inputRef = useRef<TextInput>(null);

    // Manually focus the text input
    useEffect(() => {
        if (focusTrigger) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50)
        }
    }, [focusTrigger]);

    return (
        <TextInput
            ref={inputRef}
            value={value}
            placeholder={placeholder}
            onChangeText={onChange}
            selectionColor={PlatformColor('systemBlue')}
            className='w-full text-[16px] bg-transparent'
            textAlignVertical='center'
            style={{
                color: PlatformColor('label'),
                height: LIST_CONTENT_HEIGHT
            }}
        />
    );
};

export default ModalTextfield;
