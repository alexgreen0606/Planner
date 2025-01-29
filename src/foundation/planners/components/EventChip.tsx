import React from 'react';
import { StyleSheet, View } from 'react-native';
import GenericIcon, { GenericIconProps } from '../../components/icon/GenericIcon';
import globalStyles from '../../theme/globalStyles';
import CustomText from '../../components/text/CustomText';

interface EventChipProps {
    label: string;
    iconConfig: GenericIconProps;
    color: string;
}

const EventChip = ({ label, iconConfig, color }: EventChipProps) => {
    const styles = StyleSheet.create({
        text: { color },
        chip: {
            ...globalStyles.verticallyCentered,
            height: 20,
            gap: 4,
            justifyContent: 'center',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: color,
            paddingHorizontal: 6,
            alignItems: 'center',
            borderRadius: 16,
        },
    });

    return (
        <View style={styles.chip}>
            <GenericIcon
                {...iconConfig}
                color={color}
                size={12}
            />
            <CustomText
                type='soft'
                adjustsFontSizeToFit
                numberOfLines={1}
                style={styles.text}
            >
                {label}
            </CustomText>
        </View>
    )
};

export default EventChip;