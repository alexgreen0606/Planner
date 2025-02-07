import React from 'react';
import { StyleSheet, View } from 'react-native';
import GenericIcon, { GenericIconProps } from '../../ui/icon/GenericIcon';
import globalStyles from '../../theme/globalStyles';
import CustomText from '../../ui/text/CustomText';

export interface EventChipProps {
    label: string;
    iconConfig: GenericIconProps;
    color: string;
};

const EventChip = ({
    label,
    iconConfig,
    color
}: EventChipProps) =>
    <View style={{ ...styles.chip, borderColor: color }}>
        <GenericIcon
            {...iconConfig}
            color={color}
            size={12}
        />
        <CustomText
            type='soft'
            adjustsFontSizeToFit
            numberOfLines={1}
            style={{ color }}
        >
            {label}
        </CustomText>
    </View>

const styles = StyleSheet.create({
    chip: {
        ...globalStyles.verticallyCentered,
        height: 20,
        gap: 4,
        maxWidth: '100%',
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 10,
        alignItems: 'center',
        borderRadius: 16,
    },
});

export default EventChip;