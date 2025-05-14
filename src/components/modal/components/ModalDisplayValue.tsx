import React from 'react';
import { PlatformColor, StyleSheet, View } from 'react-native';
import CustomText from '@/components/text/CustomText';
import globalStyles from '@/theme/globalStyles';
import { MODAL_INPUT_HEIGHT } from '@/constants/size';

export interface ModalDisplayValueProps {
    label: string;
    value: React.ReactNode;
    hide: boolean;
};

const ModalDisplayValue = ({
    label,
    value,
    hide = false
}: ModalDisplayValueProps) =>
    <View style={[globalStyles.spacedApart, styles.container]}>
        <CustomText
            type='standard'
            style={{ color: PlatformColor('secondaryLabel') }}
        >
            {label}
        </CustomText>
        {!hide && value}
    </View>

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        height: MODAL_INPUT_HEIGHT
    },

});

export default ModalDisplayValue;
