import CustomText from '@/components/text/CustomText';
import { MODAL_INPUT_HEIGHT } from '@/lib/constants/layout';
import React from 'react';
import { PlatformColor, View } from 'react-native';

export interface ModalDisplayValueProps {
    label: string;
    value: React.ReactNode;
};

const ModalDisplayValue = ({
    label,
    value,
}: ModalDisplayValueProps) =>
    <View
        className='flex-row justify-between w-full items-center'
        style={{ height: MODAL_INPUT_HEIGHT }}
    >
        <CustomText
            type='standard'
            style={{ color: PlatformColor('secondaryLabel') }}
        >
            {label}
        </CustomText>
        {value}
    </View>

export default ModalDisplayValue;
