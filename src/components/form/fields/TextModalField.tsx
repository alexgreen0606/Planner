import { TFormFieldControl } from '@/lib/types/form/TFormField';
import React, { useEffect, useRef } from 'react';
import { PlatformColor, TextInput } from 'react-native';

// ✅ 

export type TTextModalFieldProps = {
    label: string;
    focusTrigger?: boolean;
    autoCapitalizeWords?: boolean;
};

const TextModalField = ({
    value,
    label = '',
    autoCapitalizeWords,
    focusTrigger,
    onChange
}: TTextModalFieldProps & TFormFieldControl<string>) => {
    const inputRef = useRef<TextInput>(null);

    // Manually focus the text input.
    useEffect(() => {
        if (focusTrigger) {
            inputRef.current?.focus();
        }
    }, [focusTrigger]);

    return (
        <TextInput
            ref={inputRef}
            value={value}
            placeholder={label}
            onChangeText={onChange}
            clearButtonMode='while-editing'
            autoCapitalize={autoCapitalizeWords ? 'words' : undefined}
            selectionColor={PlatformColor('systemBlue')}
            textAlign='center'
            className='text-[16px] bg-transparent px-4 w-full h-full'
            style={{
                color: PlatformColor('label'),
                fontFamily: 'Text',
            }}
        />
    );
};

export default TextModalField;