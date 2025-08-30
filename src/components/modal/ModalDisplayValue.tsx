import CustomText from '@/components/text/CustomText';
import { MODAL_INPUT_HEIGHT } from '@/lib/constants/miscLayout';
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
}: TModalDisplayValueProps) =>
    <View
        className='flex-row justify-between w-full items-center'
        style={{ minHeight: MODAL_INPUT_HEIGHT }}
    >
        <CustomText
            variant='inputLabel'
            customStyle={{ color: PlatformColor('secondaryLabel') }}
        >
            {label}
        </CustomText>
        {value}
    </View>;

export default ModalDisplayValue;
