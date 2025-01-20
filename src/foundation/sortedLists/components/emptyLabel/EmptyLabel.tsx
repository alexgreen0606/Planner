import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import GenericIcon, { GenericIconProps } from '../../../components/icons/GenericIcon';
import CustomText from '../../../components/text/CustomText';
import colors from '../../../theme/colors';
import globalStyles from '../../../theme/globalStyles';

interface EmptyLabelProps {
    label: string;
    iconConfig?: GenericIconProps;
    style?: ViewStyle;
    customFontSize?: number;
}

const EmptyLabel = ({
    label,
    iconConfig,
    style,
    customFontSize = 14
}: EmptyLabelProps) =>
    <View style={{ ...styles.container, ...style }}>
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
    </View>

const styles = StyleSheet.create({
    container: {
        ...globalStyles.verticallyCentered,
        padding: 4,
        gap: 4,
        justifyContent: 'center',
    },
});

export default EmptyLabel;
