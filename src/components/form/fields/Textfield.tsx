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

    // Manually focus and blur the text input
    useEffect(() => {
        console.log(focusTrigger, 'focus trigger')
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
            className='w-full text-lg bg-transparent'
            style={{
                height: LIST_CONTENT_HEIGHT,
                color: PlatformColor('label')
            }}
        />
    );
};

export default ModalTextfield;
