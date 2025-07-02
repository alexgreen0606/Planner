import ModalDisplayValue from '@/components/modal/ModalDisplayValue';
import CustomText from '@/components/text/CustomText';
import { LIST_CONTENT_HEIGHT } from '@/lib/constants/layout';
import React, { useEffect, useRef, useState } from 'react';
import { PlatformColor, TextInput, TouchableOpacity } from 'react-native';

export interface ModalTextfieldProps {
    placeholder: string;
    value: string;
    onChange: (newVal: string) => void;
    focusTrigger: boolean;
    autoCapitalizeWords: boolean;
};

const ModalTextfield = ({
    placeholder,
    value,
    onChange,
    focusTrigger,
    autoCapitalizeWords
}: ModalTextfieldProps) => {
    const inputRef = useRef<TextInput>(null);

    const [focused, setFocused] = useState(focusTrigger);

    // Manually focus the text input
    useEffect(() => {
        if (focusTrigger) {
            // setTimeout(() => {
            //     inputRef.current?.focus();
            // }, 50)
            setFocused(true);
        }
    }, [focusTrigger]);



    return (
        <ModalDisplayValue
            label='Title'
            value={
                focused ? (
                    <TextInput
                        autoFocus
                        ref={inputRef}
                        value={value}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder={placeholder}
                        onChangeText={onChange}
                        selectionColor={PlatformColor('systemBlue')}
                        className='text-[16px] bg-transparent'
                        textAlignVertical='center'
                        autoCapitalize={autoCapitalizeWords ? 'words' : undefined}
                        style={{
                            color: PlatformColor('label'),
                            height: LIST_CONTENT_HEIGHT,
                            fontFamily: 'Text',
                            textAlign: 'right'
                        }}
                    />
                ) : (
                    <TouchableOpacity onPress={() => setFocused(true)}>
                        <CustomText variant='standard'>
                            {value}
                        </CustomText>
                    </TouchableOpacity>
                )
            }
        />
    );
};

export default ModalTextfield;
