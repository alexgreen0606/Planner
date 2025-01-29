import React from 'react';
import { StyleSheet, View } from 'react-native';
import GenericIcon, { GenericIconProps } from '../icons/GenericIcon';
import globalStyles from '../../theme/globalStyles';
import CustomText from '../text/CustomText';

interface ChipProps {
    label: string;
    iconConfig: GenericIconProps;
    color: string;
}

const Chip = ({ label, iconConfig, color }: ChipProps) => {
    const styles = StyleSheet.create({
        text: {
            color: color,
        },
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

export default Chip;