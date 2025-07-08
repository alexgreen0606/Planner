import ModalDisplayValue from '@/components/modal/ModalDisplayValue';
import CustomText from '@/components/text/CustomText';
import { LIST_CONTENT_HEIGHT } from '@/lib/constants/layout';
import React, { useEffect, useState } from 'react';
import { PlatformColor, TextInput, TouchableOpacity } from 'react-native';

type ModalTextfieldProps = {
    value: string;
    autoCapitalizeWords: boolean;
    focusTrigger: boolean;
    onChange: (newVal: string) => void;
};

const ModalTextfield = ({
    value,
    autoCapitalizeWords,
    focusTrigger,
    onChange
}: ModalTextfieldProps) => {
    const [focused, setFocused] = useState(focusTrigger);

    // Manually focus the text input.
    useEffect(() => {
        if (focusTrigger) {
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
                        value={value}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onChangeText={onChange}
                        autoCapitalize={autoCapitalizeWords ? 'words' : undefined}
                        selectionColor={PlatformColor('systemBlue')}
                        returnKeyType='next'
                        textAlignVertical='center'
                        className='text-[16px] bg-transparent flex-1 pl-4'
                        style={{
                            color: PlatformColor('label'),
                            height: LIST_CONTENT_HEIGHT,
                            fontFamily: 'Text',
                            textAlign: 'right',
                            flexWrap: 'wrap'
                        }}
                    />
                ) : (
                    <TouchableOpacity
                        onPress={() => setFocused(true)}
                        className='flex-1 pl-4 py-1 items-end'
                    >
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
