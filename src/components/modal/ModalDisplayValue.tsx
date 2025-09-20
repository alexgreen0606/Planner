import { MODAL_INPUT_HEIGHT } from '@/lib/constants/miscLayout';
import { Host, HStack, Spacer, Text } from '@expo/ui/swift-ui';
import React from 'react';
import { PlatformColor, View } from 'react-native';

// ✅ 

type TModalDisplayValueProps = {
    label: string;
    value: React.ReactNode;
};

const ModalDisplayValue = ({
    label,
    value,
}: TModalDisplayValueProps) => (
    <View
        className='flex-row w-full items-center'
        style={{ minHeight: MODAL_INPUT_HEIGHT }}
    >
        <Host style={{ flex: 1 }}>
            <HStack>
                <Text
                    design='rounded'
                    size={14}
                    color={PlatformColor('secondaryLabel') as unknown as string}
                >
                    {label}
                </Text>
                <Spacer />
            </HStack>
        </Host>
        {value}
    </View>
);

export default ModalDisplayValue;
