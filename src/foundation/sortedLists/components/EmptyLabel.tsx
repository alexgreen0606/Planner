import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import globalStyles from '../../theme/globalStyles';
import GenericIcon, { GenericIconProps } from '../../ui/icons/GenericIcon';
import CustomText from '../../ui/text/CustomText';
import colors from '../../theme/colors';

interface EmptyLabelProps {
    label: string;
    onPress: () => void;
    iconConfig?: GenericIconProps;
    style?: ViewStyle;
    customFontSize?: number;
}

const EmptyLabel = ({
    label,
    onPress,
    iconConfig,
    style,
    customFontSize = 14
}: EmptyLabelProps) =>
    <TouchableOpacity style={{ ...styles.container, ...style }} onPress={onPress}>
        {iconConfig && (
            <GenericIcon
                {...iconConfig}
            />
        )}
        <CustomText
            type='label'
            style={{
                color: colors.grey,
                fontSize: customFontSize
            }}
        >
            {label}
        </CustomText>
    </TouchableOpacity>

const styles = StyleSheet.create({
    container: {
        ...globalStyles.verticallyCentered,
        padding: 4,
        gap: 4,
        justifyContent: 'center',
    },
});

export default EmptyLabel;
