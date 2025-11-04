import Icon from '@/components/icons/Icon';
import useBounceTrigger from '@/hooks/useBounceTrigger';
import { TFormFieldControl } from '@/lib/types/form/TFormField';
import { SFSymbol } from 'expo-symbols';
import React, { useEffect, useRef } from 'react';
import { PlatformColor, TextInput, View } from 'react-native';

// ✅ 

export type TTextModalFieldProps = {
    label: string;
    focusTrigger?: boolean;
    disabled?: boolean;
    iconName?: SFSymbol;
    iconColor?: string;
    autoCapitalizeWords?: boolean;
};

const TextModalField = ({
    value,
    label = '',
    autoCapitalizeWords,
    focusTrigger,
    disabled,
    iconName,
    iconColor = 'label',
    onChange
}: TTextModalFieldProps & TFormFieldControl<string>) => {
    const bounceTrigger = useBounceTrigger([iconName, iconColor]);

    const inputRef = useRef<TextInput>(null);

    // Manually focus the text input.
    useEffect(() => {
        if (focusTrigger) {
            inputRef.current?.focus();
        }
    }, [focusTrigger]);

    return (
        <View className='flex-row flex-1 items-center justify-center'>
            {iconName && (
                <Icon
                    name={iconName}
                    color={iconColor}
                    animationSpec={bounceTrigger ? {
                        effect: { type: 'bounce' },
                        repeating: false
                    } : undefined}
                />
            )}
            <TextInput
                ref={inputRef}
                value={value}
                placeholder={label}
                editable={!disabled}
                onChangeText={onChange}
                clearButtonMode='while-editing'
                autoCapitalize={autoCapitalizeWords ? 'words' : undefined}
                selectionColor={PlatformColor('systemBlue')}
                textAlign='center'
                className='text-[16px] px-4 flex-1 h-full'
                style={{
                    color: PlatformColor('label'),
                    fontFamily: 'Text'
                }}
            />
        </View>
    );
};

export default TextModalField;