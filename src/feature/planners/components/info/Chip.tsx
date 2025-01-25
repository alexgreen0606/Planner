import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import GenericIcon, { GenericIconProps } from '../../../../foundation/components/icons/GenericIcon';
import globalStyles from '../../../../foundation/theme/globalStyles';

interface ChipProps {
    label: string;
    iconConfig: GenericIconProps;
    color: string;
}

const Chip = ({ label, iconConfig, color }: ChipProps) => {
    const styles = StyleSheet.create({
        text: {
            fontSize: 10,
            color: color,
            flexShrink: 1
        },
        chip: {
            ...globalStyles.verticallyCentered,
            width: 'auto',
            height: 20,
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
            />
            <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={styles.text}
            >
                {label}
            </Text>
        </View>
    )
};

export default Chip;