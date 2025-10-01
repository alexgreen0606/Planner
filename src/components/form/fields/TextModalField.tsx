import ModalDisplayValue from '@/components/Modal/ModalDisplayValue';
import CustomText from '@/components/text/CustomText';
import { LIST_CONTENT_HEIGHT } from '@/lib/constants/listConstants';
import { TFormFieldControl } from '@/lib/types/form/TFormField';
import React, { useEffect, useState } from 'react';
import { PlatformColor, TextInput, TouchableOpacity } from 'react-native';

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
    const [focused, setFocused] = useState(focusTrigger);

    // Manually focus the text input.
    useEffect(() => {
        if (focusTrigger) {
            setFocused(true);
        }
    }, [focusTrigger]);

    return (
        <ModalDisplayValue
            label={label}
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
                        className='text-[16px] bg-transparent flex-1 pl-4 text-right flex-wrap'
                        style={{
                            color: PlatformColor('label'),
                            height: LIST_CONTENT_HEIGHT,
                            fontFamily: 'Text'
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

export default TextModalField;
